import { json, fail, readJson, currentUser, uid, normalizeCategory, toBase } from './_lib.js';

/* كل الميزانيات + المصروف الفعلي للشهر الحالي */
export const onRequestGet = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);

  const month = new URL(ctx.request.url).searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const { results: budgets } = await ctx.env.DB.prepare('SELECT * FROM budgets WHERE user_id = ?').bind(user.id).all();
  const { results: txs } = await ctx.env.DB.prepare(
    "SELECT category, amount, currency FROM transactions WHERE user_id = ? AND kind='out' AND substr(occurred_on,1,7) = ?",
  ).bind(user.id, month).all();

  const spent = {};
  for (const t of txs || []) {
    spent[t.category] = (spent[t.category] || 0) + toBase(t.amount, t.currency, user.base_currency, user.sp_rate);
  }

  const list = (budgets || []).map((b) => {
    const limit = toBase(b.limit_amount, b.currency, user.base_currency, user.sp_rate);
    const used = spent[b.category] || 0;
    return {
      ...b,
      limit_base: limit,
      spent_base: used,
      pct: limit > 0 ? Math.round((used / limit) * 100) : 0,
    };
  });

  return json({ month, base: user.base_currency, budgets: list });
};

/* إنشاء أو تعديل ميزانية صنف واحد */
export const onRequestPost = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);

  const b = await readJson(ctx.request);
  const category = normalizeCategory(b.category);
  const limit = Math.abs(Number(b.limit_amount));
  if (!Number.isFinite(limit) || limit <= 0) return fail('حد الميزانية غير صالح', 422);
  const currency = b.currency === 'SP' ? 'SP' : 'USD';

  const existing = await ctx.env.DB.prepare('SELECT id FROM budgets WHERE user_id = ? AND category = ?')
    .bind(user.id, category).first();

  if (existing) {
    await ctx.env.DB.prepare('UPDATE budgets SET limit_amount = ?, currency = ? WHERE id = ?')
      .bind(limit, currency, existing.id).run();
    return json({ ok: true, id: existing.id });
  }
  const id = uid();
  await ctx.env.DB.prepare('INSERT INTO budgets (id,user_id,category,limit_amount,currency) VALUES (?,?,?,?,?)')
    .bind(id, user.id, category, limit, currency).run();
  return json({ ok: true, id }, 201);
};
