// مقايضة كود OAuth بـ access token (يُحفظ خارج git)
import fs from 'node:fs';
import path from 'node:path';

const code = process.env.OAUTH_CODE;
if (!code) { console.error('OAUTH_CODE required'); process.exit(1); }

const pkce = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tools', 'oauth-pkce.json'), 'utf8'));

const body = new URLSearchParams({
  grant_type: 'authorization_code',
  client_id: pkce.client_id,
  code,
  redirect_uri: pkce.redirect,
  code_verifier: pkce.verifier,
});

const res = await fetch('https://dash.cloudflare.com/oauth2/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
  body,
});
const text = await res.text();
let data;
try { data = JSON.parse(text); } catch { data = { raw: text }; }

if (!res.ok || !data.access_token) {
  console.error('exchange failed', res.status, JSON.stringify(data).slice(0, 300));
  process.exit(2);
}

const dir = path.join(process.cwd(), 'logs');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'oauth-token.json'), JSON.stringify(data, null, 2));
console.log('ok status:', res.status);
console.log('token_type:', data.token_type, 'expires_in:', data.expires_in, 'scope:', data.scope);
console.log('access_token saved (masked):', String(data.access_token).slice(0, 6) + '…' + String(data.access_token).slice(-4));
