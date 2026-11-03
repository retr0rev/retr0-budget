import { json, fail, readJson, uid, hashPassword, makeSession, sessionCookie, audit } from '../_lib.js';

export const onRequestPost = async (ctx) => {
  const { name, email, password, lang, base_currency } = await readJson(ctx.request);
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim().slice(0, 40);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(cleanEmail)) return fail('البريد الإلكتروني غير صالح', 422);
  if (String(password || '').length < 8) return fail('كلمة المرور يجب أن تكون ٨ خانات على الأقل', 422);
  if (cleanName.length < 2) return fail('الاسم مطلوب', 422);

  const exists = await ctx.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(cleanEmail).first();
  if (exists) return fail('هذا البريد مسجّل مسبقاً', 409);

  const count = await ctx.env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
  const isFirst = (count?.n || 0) === 0;
  const role = isFirst ? 'admin' : 'member';            // أول حساب = مدير النظام
  const status = isFirst ? 'active' : 'pending';        // البقية بانتظار موافقة المدير

  const id = uid();
  const pass = await hashPassword(String(password));
  const baseCurrency = base_currency === 'SP' ? 'SP' : 'USD';
  await ctx.env.DB.prepare(
    'INSERT INTO users (id,email,name,pass,role,status,lang,base_currency,approved_at) VALUES (?,?,?,?,?,?,?,?,?)',
  ).bind(
    id, cleanEmail, cleanName, pass, role, status, lang === 'en' ? 'en' : 'ar',
    baseCurrency, isFirst ? new Date().toISOString() : null,
  ).run();

  await audit(ctx, id, isFirst ? 'register.admin' : 'register.pending', cleanEmail);

  if (!isFirst) {
    return json({ pending: true, message: 'تم إنشاء الحساب — بانتظار موافقة المدير' }, 201);
  }

  const token = await makeSession(id, ctx.env);
  return json(
    { user: { id, email: cleanEmail, name: cleanName, role, status, base_currency: baseCurrency, sp_rate: 13500, lang: lang || 'ar' } },
    200,
    { 'set-cookie': sessionCookie(token) },
  );
};
