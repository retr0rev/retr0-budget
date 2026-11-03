// مشترك بين كل دوال الـ API
export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

export const fail = (msg, status = 400) => json({ error: msg }, status);

export async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

export const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 20);

export function b64u(bytes) {
  let s = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256,
  );
  return `pbkdf2$150000$${b64u(salt)}$${b64u(bits)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'pbkdf2') return false;
    const salt = unb64u(saltB64);
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: Number(iterStr), hash: 'SHA-256' }, key, 256,
      ),
    );
    const expected = unb64u(hashB64);
    if (bits.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
    return diff === 0;
  } catch { return false; }
}

/* -------- جلسات موقعة بـ HMAC -------- */
const secretOf = (env) => env.SESSION_SECRET || 'dev-only-change-me-in-production';

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export async function makeSession(userId, env) {
  const exp = Date.now() + 30 * 24 * 3600 * 1000;
  const payload = `${userId}.${exp}`;
  const sig = b64u(await hmac(payload, secretOf(env)));
  return `${payload}.${sig}`;
}

export async function readSession(req, env) {
  const raw = getCookie(req, 'rb_session');
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  if (Number(expStr) < Date.now()) return null;
  const expected = b64u(await hmac(`${userId}.${expStr}`, secretOf(env)));
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0 ? userId : null;
}

export function getCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function sessionCookie(value) {
  const maxAge = value ? 30 * 24 * 3600 : 0;
  return `rb_session=${encodeURIComponent(value || '')}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function currentUser(ctx) {
  const userId = await readSession(ctx.request, ctx.env);
  if (!userId) return null;
  const user = await ctx.env.DB.prepare(
    "SELECT id,email,name,role,status,base_currency,sp_rate,created_at FROM users WHERE id = ? AND status = 'active'",
  ).bind(userId).first();
  return user || null;
}

export async function audit(ctx, actorId, action, detail) {
  try {
    await ctx.env.DB.prepare('INSERT INTO audit (id,actor_id,action,detail) VALUES (?,?,?,?)')
      .bind(uid(), actorId, action, detail || '').run();
  } catch {}
}

/* -------- تحويل العملات -------- */
export const toBase = (amount, currency, base, rate) => {
  const a = Number(amount) || 0;
  if (currency === base) return a;
  if (currency === 'USD' && base === 'SP') return a * (Number(rate) || 1);
  if (currency === 'SP' && base === 'USD') return a / (Number(rate) || 1);
  return a;
};

export const CATEGORIES = ['housing', 'food', 'transport', 'bills', 'health', 'education', 'leisure', 'other'];

export function normalizeCategory(c) {
  return CATEGORIES.includes(c) ? c : 'other';
}
