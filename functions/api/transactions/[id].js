import { json, fail, currentUser } from '../_lib.js';

export const onRequestDelete = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);
  const id = ctx.params.id;

  const row = await ctx.env.DB.prepare('SELECT user_id FROM transactions WHERE id = ?').bind(id).first();
  if (!row) return fail('غير موجود', 404);
  if (row.user_id !== user.id && user.role !== 'admin') return fail('غير مصرح', 403);

  await ctx.env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
  return json({ ok: true });
};
