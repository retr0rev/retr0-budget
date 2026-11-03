// توليد رابط OAuth (PKCE) لـ Cloudflare — نستلم الكود يدويًا لأن الـ callback على localhost
import fs from 'node:fs';
import crypto from 'node:crypto';

const CLIENT_ID = '54d11594-84e4-41aa-b438-e81b8fa78ee7';
const REDIRECT = 'http://localhost:8976/oauth/callback';
const SCOPES = [
  'account:read', 'user:read', 'workers:write', 'workers_kv:write', 'workers_routes:write',
  'workers_scripts:write', 'workers_tail:read', 'd1:write', 'pages:write', 'zone:read',
  'offline_access',
].join(' ');

const b64u = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const verifier = b64u(crypto.randomBytes(48));
const challenge = b64u(crypto.createHash('sha256').update(verifier).digest());
const state = b64u(crypto.randomBytes(16));

const url = new URL('https://dash.cloudflare.com/oauth2/auth');
url.searchParams.set('response_type', 'code');
url.searchParams.set('client_id', CLIENT_ID);
url.searchParams.set('redirect_uri', REDIRECT);
url.searchParams.set('scope', SCOPES);
url.searchParams.set('state', state);
url.searchParams.set('code_challenge', challenge);
url.searchParams.set('code_challenge_method', 'S256');

fs.writeFileSync(new URL('./oauth-pkce.json', import.meta.url), JSON.stringify({ verifier, state, redirect: REDIRECT, client_id: CLIENT_ID }, null, 2));
console.log(url.toString());
