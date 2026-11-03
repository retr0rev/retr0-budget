import { json, fail, readJson, verifyPassword, makeSession, sessionCookie, audit } from '../_lib.js';

export const onRequestPost = async (ctx) => {
  const { email, password } = await readJson(ctx.request);
  const cleanEmail = String(email || '').trim().toLowerCase();

  const user = await ctx.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(cleanEmail).first();
  if (!user) return fail('البريد أو كلمة المرور غير صحيحة', 401);

  const ok = await verifyPassword(String(password || ''), user.pass);
  if (!ok) return fail('البريد أو كلمة المرور غير صحيحة', 401);

  if (user.status === 'pending') return fail('حسابك بانتظار موافقة المدير', 403);
  if (user.status === 'blocked') return fail('حسابك موقوف، يرجى التواصل مع المدير', 403);

  await audit(ctx, user.id, 'login', cleanEmail);
  const token = await makeSession(user.id, ctx.env);
  return json(
    {
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role, status: user.status,
        base_currency: user.base_currency, sp_rate: user.sp_rate, lang: user.lang,
      },
    },
    200,
    { 'set-cookie': sessionCookie(token) },
  );
};
