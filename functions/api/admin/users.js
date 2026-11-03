import { json, fail, currentUser } from '../_lib.js';

export const onRequestGet = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);
  if (user.role !== 'admin') return fail('للمدير فقط', 403);

  const { results } = await ctx.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.status, u.base_currency, u.sp_rate,
            u.created_at, u.approved_at,
            (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) AS tx_count,
            (SELECT COUNT(*) FROM budgets b WHERE b.user_id = u.id) AS budget_count
       FROM users u
      ORDER BY CASE u.status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, u.created_at ASC`,
  ).all();

  const { results: auditRows } = await ctx.env.DB.prepare(
    'SELECT * FROM audit ORDER BY created_at DESC LIMIT 20',
  ).all();

  return json({ users: results || [], audit: auditRows || [] });
};
