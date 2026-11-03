// إنشاء/تحديث حساب المدير — يقرأ البيانات من البيئة ولا يخزّن كلمة المرور في أي ملف
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const pass = process.env.ADMIN_PASS || '';
const name = (process.env.ADMIN_NAME || 'Admin').trim();
const base = process.env.ADMIN_BASE === 'SP' ? 'SP' : 'USD';
const rate = Number(process.env.ADMIN_RATE || 13500);

if (!email || !pass) {
  console.error('ADMIN_EMAIL and ADMIN_PASS are required');
  process.exit(1);
}

const b64u = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const salt = crypto.randomBytes(16);
let bits = crypto.pbkdf2Sync(pass, salt, 100000, 32, 'sha256');
bits = crypto.pbkdf2Sync(bits, salt, 100000, 32, 'sha256');
const hash = `pbkdf2$2x100000$${b64u(salt)}$${b64u(bits)}`;
const id = 'p' + crypto.randomBytes(10).toString('hex');

const esc = (s) => String(s).replace(/'/g, "''");
const sql = `-- seeded admin
DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email = '${esc(email)}');
DELETE FROM budgets WHERE user_id IN (SELECT id FROM users WHERE email = '${esc(email)}');
DELETE FROM users WHERE email = '${esc(email)}';
INSERT INTO users (id,email,name,pass,role,status,lang,base_currency,sp_rate,approved_at)
VALUES ('${id}','${esc(email)}','${esc(name)}','${hash}','admin','active','ar','${base}',${rate},datetime('now'));
INSERT INTO audit (id,actor_id,action,detail) VALUES ('${'a' + crypto.randomBytes(8).toString('hex')}','${id}','seed.admin','${esc(email)}');
`;

const dir = path.join(process.cwd(), 'logs');
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, 'seed-admin.sql');
fs.writeFileSync(out, sql);
console.log('admin id:', id);
console.log('sql:', out);
