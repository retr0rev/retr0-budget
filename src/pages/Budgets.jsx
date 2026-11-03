import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useI18n, CATEGORIES } from '../lib/i18n.jsx';
import { money } from '../lib/money.js';
import Sheet from '../components/Sheet.jsx';

export default function Budgets() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // {category, limit, currency}

  const load = useCallback(async () => {
    try {
      setData(await api.get('/api/budgets'));
      setErr('');
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/budgets', {
        category: editing.category,
        limit_amount: Number(editing.limit),
        currency: editing.currency,
      });
      setEditing(null);
      load();
    } catch (e2) { setErr(e2.message); }
  };

  const remove = async (id) => {
    if (!confirm(t('bud.remove') + '?')) return;
    try { await api.del(`/api/budgets/${id}`); load(); } catch (e) { setErr(e.message); }
  };

  const existing = new Set((data?.budgets || []).map((b) => b.category));
  const available = CATEGORIES.filter((c) => !existing.has(c));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('bud.title')}</h1>
          <p>{t('bud.sub')}</p>
        </div>
        <button
          className="btn sm"
          onClick={() => setEditing({ category: available[0] || 'other', limit: '', currency: user.base_currency })}
        >
          + {t('bud.add')}
        </button>
      </div>

      {err && <div className="alert err">{err}</div>}
      {!data && <div className="loading"><div><div className="spin" />{t('common.loading')}</div></div>}

      {data && data.budgets.length === 0 && (
        <div className="empty"><b>{t('bud.empty')}</b>{t('bud.emptyHint')}</div>
      )}

      {data && data.budgets.map((b) => {
        const left = b.limit_base - b.spent_base;
        return (
          <div className="card" key={b.id} style={{ marginBottom: 10 }}>
            <div className="bar" style={{ marginBottom: 8 }}>
              <div className="row">
                <span className="n" style={{ fontWeight: 600 }}>{t(`cat.${b.category}`)}</span>
                <b>{money(b.spent_base, data.base)} / {money(b.limit_base, data.base)}</b>
              </div>
              <div className="track">
                <i className={b.pct >= 90 ? 'warn' : 'ok'} style={{ width: `${Math.min(100, b.pct)}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: left < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                {left < 0 ? `+${money(Math.abs(left), data.base)}` : money(left, data.base)} {t('bud.left')} · {b.pct}%
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn ghost sm" onClick={() => setEditing({ category: b.category, limit: b.limit_amount, currency: b.currency, id: b.id })}>
                  {t('bud.edit')}
                </button>
                <button className="btn ghost sm" onClick={() => remove(b.id)}>✕</button>
              </div>
            </div>
          </div>
        );
      })}

      {editing && (
        <Sheet title={t('bud.add')} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <label className="field">
              <span>{t('tx.category')}</span>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} disabled={existing.has(c) && c !== editing.category}>
                    {t(`cat.${c}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{t('bud.limit')}</span>
              <input
                className="num-input" type="number" min="0" step="0.01" dir="ltr" required autoFocus
                value={editing.limit}
                onChange={(e) => setEditing({ ...editing, limit: e.target.value })}
                placeholder="0.00"
              />
            </label>

            <div className="field">
              <span>{t('tx.currency')}</span>
              <div className="cur" style={{ width: '100%', justifyContent: 'space-between' }}>
                <button type="button" className={editing.currency === 'USD' ? 'on' : ''} onClick={() => setEditing({ ...editing, currency: 'USD' })}>USD $</button>
                <button type="button" className={editing.currency === 'SP' ? 'on' : ''} onClick={() => setEditing({ ...editing, currency: 'SP' })}>SP</button>
              </div>
            </div>

            <button className="btn">{t('bud.save')}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
