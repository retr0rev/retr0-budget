import { json, fail, readJson, currentUser, audit, normalizeCategory } from './_lib.js';

export const onRequestGet = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);
  const { results } = await ctx.env.DB.prepare('SELECT category, limit_amount, currency FROM budgets WHERE user_id = ?')
    .bind(user.id).all();
  return json({ user, budgets: results || [] });
};

export const onRequestPatch = async (ctx) => {
  const user = await currentUser(ctx);
  if (!user) return fail('غير مصرح', 401);
  const body = await readJson(ctx.request);

  const name = body.name !== undefined ? String(body.name).trim().slice(0, 40) : user.name;
  const base = body.base_currency === 'SP' ? 'SP' : body.base_currency === 'USD' ? 'USD' : user.base_currency;
  const rate = body.sp_rate !== undefined ? Math.max(1, Number(body.sp_rate) || user.sp_rate) : user.sp_rate;
  const lang = body.lang === 'en' ? 'en' : body.lang === 'ar' ? 'ar' : user.lang;

  await ctx.env.DB.prepare('UPDATE users SET name=?, base_currency=?, sp_rate=?, lang=? WHERE id=?')
    .bind(name, base, rate, lang, user.id).run();
  await audit(ctx, user.id, 'settings.update', `${base} @ ${rate}`);

  return json({ user: { ...user, name, base_currency: base, sp_rate: rate, lang } });
};
