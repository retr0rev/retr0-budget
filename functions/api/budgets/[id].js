import { json, fail, currentUser } from '../_lib.js';

export const onRequestDelete = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);
  const row = await ctx.env.DB.prepare('SELECT user_id FROM budgets WHERE id = ?').bind(ctx.params.id).first();
  if (!row) return fail('غير موجود', 404);
  if (row.user_id !== user.id) return fail('غير مصرح', 403);
  await ctx.env.DB.prepare('DELETE FROM budgets WHERE id = ?').bind(ctx.params.id).run();
  return json({ ok: true });
};
