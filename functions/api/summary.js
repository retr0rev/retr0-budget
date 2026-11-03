import { json, fail, currentUser, toBase } from './_lib.js';

export const onRequestGet = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);

  const month = new URL(ctx.request.url).searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const base = user.base_currency;
  const rate = user.sp_rate;

  const { results: txs } = await ctx.env.DB.prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY occurred_on DESC, created_at DESC',
  ).bind(user.id).all();
  const { results: budgets } = await ctx.env.DB.prepare('SELECT * FROM budgets WHERE user_id = ?').bind(user.id).all();

  let balance = 0, monthIn = 0, monthOut = 0;
  const spentByCat = {};

  for (const t of txs || []) {
    const v = toBase(t.amount, t.currency, base, rate);
    balance += t.kind === 'in' ? v : -v;
    if (t.occurred_on.slice(0, 7) === month) {
      if (t.kind === 'in') monthIn += v;
      else { monthOut += v; spentByCat[t.category] = (spentByCat[t.category] || 0) + v; }
    }
  }

  const budgetList = (budgets || []).map((b) => {
    const limit = toBase(b.limit_amount, b.currency, base, rate);
    const spent = spentByCat[b.category] || 0;
    return { ...b, limit_base: limit, spent_base: spent, pct: limit > 0 ? Math.round((spent / limit) * 100) : 0 };
  });

  return json({
    month, base, rate,
    balance, monthIn, monthOut, monthNet: monthIn - monthOut,
    budgets: budgetList,
    recent: (txs || []).slice(0, 6),
    counts: { transactions: (txs || []).length, budgets: (budgets || []).length },
  });
};
