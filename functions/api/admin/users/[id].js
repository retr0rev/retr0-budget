import { json, fail, readJson, currentUser, audit } from '../../_lib.js';

const STATUSES = ['pending', 'active', 'blocked'];

/* قبول / رفض / تعطيل / تعديل حساب */
export const onRequestPatch = async (ctx) => {
  const admin = await currentUser(ctx);
  if (!admin) return fail('غير مصرح', 401);
  if (admin.role !== 'admin') return fail('للمدير فقط', 403);

  const targetId = ctx.params.id;
  const target = await ctx.env.DB.prepare(
    'SELECT id, email, name, role, status, base_currency, sp_rate FROM users WHERE id = ?',
  ).bind(targetId).first();
  if (!target) return fail('المستخدم غير موجود', 404);

  const body = await readJson(ctx.request);
  const self = targetId === admin.id;

  // المدير لا يغيّر حالته أو صلاحيته بنفسه (يمنع قفل النظام)
  if (self && (body.status !== undefined || body.role !== undefined)) {
    return fail('لا يمكنك تغيير حالة حسابك أو صلاحيتك', 422);
  }

  const status = STATUSES.includes(body.status) ? body.status : target.status;
  const role = body.role === 'admin' || body.role === 'member' ? body.role : target.role;

  let name = target.name;
  let email = target.email;
  let base = target.base_currency;
  let rate = target.sp_rate;

  if (body.name !== undefined) {
    name = String(body.name).trim().slice(0, 40);
    if (name.length < 2) return fail('الاسم قصير جداً', 422);
  }
  if (body.email !== undefined) {
    const e = String(body.email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e)) return fail('البريد غير صالح', 422);
    const clash = await ctx.env.DB.prepare('SELECT id FROM users WHERE email = ? AND id <> ?').bind(e, targetId).first();
    if (clash) return fail('البريد مستخدم بحساب آخر', 409);
    email = e;
  }
  if (body.base_currency === 'USD' || body.base_currency === 'SP') base = body.base_currency;
  if (body.sp_rate !== undefined) rate = Math.max(1, Number(body.sp_rate) || target.sp_rate);

  const approving = status === 'active' && target.status !== 'active';

  await ctx.env.DB.prepare(
    `UPDATE users SET status = ?, role = ?, name = ?, email = ?, base_currency = ?,
        sp_rate = ?, approved_at = CASE WHEN ? = 1 THEN datetime('now') ELSE approved_at END
      WHERE id = ?`,
  ).bind(status, role, name, email, base, rate, approving ? 1 : 0, targetId).run();

  await audit(
    ctx, admin.id,
    status === 'active' ? 'user.approve' : status === 'blocked' ? 'user.block' : 'user.edit',
    `${email} · ${role}/${status}`,
  );

  return json({ ok: true, user: { ...target, status, role, name, email, base_currency: base, sp_rate: rate } });
};

/* حذف الحساب مع كل بياناته */
export const onRequestDelete = async (ctx) => {
  const admin = await currentUser(ctx);
  if (!admin) return fail('غير مصرح', 401);
  if (admin.role !== 'admin') return fail('للمدير فقط', 403);

  const targetId = ctx.params.id;
  if (targetId === admin.id) return fail('لا يمكنك حذف حسابك', 422);

  const target = await ctx.env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(targetId).first();
  if (!target) return fail('المستخدم غير موجود', 404);

  await ctx.env.DB.batch([
    ctx.env.DB.prepare('DELETE FROM transactions WHERE user_id = ?').bind(targetId),
    ctx.env.DB.prepare('DELETE FROM budgets WHERE user_id = ?').bind(targetId),
    ctx.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId),
  ]);
  await audit(ctx, admin.id, 'user.delete', target.email);

  return json({ ok: true });
};
