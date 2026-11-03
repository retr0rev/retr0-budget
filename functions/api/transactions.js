import { json, fail, readJson, currentUser, uid, normalizeCategory } from './_lib.js';

export const onRequestGet = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);

  const url = new URL(ctx.request.url);
  const month = url.searchParams.get('month');
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 100));

  let sql = 'SELECT * FROM transactions WHERE user_id = ?';
  const args = [user.id];
  if (month) { sql += " AND substr(occurred_on,1,7) = ?"; args.push(month); }
  sql += ' ORDER BY occurred_on DESC, created_at DESC LIMIT ?';
  args.push(limit);

  const { results } = await ctx.env.DB.prepare(sql).bind(...args).all();
  return json({ transactions: results || [] });
};

export const onRequestPost = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);

  const b = await readJson(ctx.request);
  const amount = Math.abs(Number(b.amount));
  if (!Number.isFinite(amount) || amount <= 0) return fail('المبلغ غير صالح', 422);
  const kind = b.kind === 'in' ? 'in' : 'out';
  const currency = b.currency === 'SP' ? 'SP' : 'USD';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : new Date().toISOString().slice(0, 10);
  const note = String(b.note || '').slice(0, 120);
  const category = normalizeCategory(b.category);

  const id = uid();
  await ctx.env.DB.prepare(
    'INSERT INTO transactions (id,user_id,kind,amount,currency,category,note,occurred_on) VALUES (?,?,?,?,?,?,?,?)',
  ).bind(id, user.id, kind, amount, currency, category, note, date).run();

  const row = await ctx.env.DB.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
  return json({ transaction: row }, 201);
};
