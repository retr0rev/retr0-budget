import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { money, convert, fmtAmount, fmtDate, fmtMonth } from '../lib/money.js';
import TxForm from '../components/TxForm.jsx';

export default function Dashboard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get('/api/summary');
      setData(d);
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (err) return <div className="alert err">{err}</div>;
  if (!data) return <div className="loading"><div><div className="spin" />{t('common.loading')}</div></div>;

  const base = data.base;
  const alt = base === 'USD' ? convert(data.balance, 'USD', 'SP', data.rate) : convert(data.balance, 'SP', 'USD', data.rate);
  const altCur = base === 'USD' ? 'SP' : 'USD';
  const topBudgets = (data.budgets || []).slice(0, 3);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('dash.hello')}، {user?.name?.split(' ')[0]}</h1>
          <p>{fmtMonth(data.month, lang)}</p>
        </div>
        <button className="btn sm" onClick={() => setAdding(true)}>+ {t('dash.addTx')}</button>
      </div>

      <div className="card">
        <div className="balance">
          <div className="lbl">{t('dash.total')}</div>
          <div className="amt">
            {base === 'USD' ? (
              <><small>$</small>{fmtAmount(data.balance, 'USD')}</>
            ) : (
              <>{fmtAmount(data.balance, 'SP')}<small>SP</small></>
            )}
          </div>
          <div className="alt">≈ {money(alt, altCur)}</div>
        </div>

        <div className="stats">
          <div><div className="k">{t('dash.income')}</div><div className="v g">{money(data.monthIn, base)}</div></div>
          <div><div className="k">{t('dash.expense')}</div><div className="v r">{money(data.monthOut, base)}</div></div>
          <div><div className="k">{t('dash.remaining')}</div><div className="v">{money(data.monthNet, base)}</div></div>
        </div>
      </div>

      <div className="sectitle">
        <h2>{t('dash.budgets')}</h2>
        <Link to="/budgets">{t('dash.viewAll')}</Link>
      </div>

      {topBudgets.length === 0 ? (
        <div className="empty"><b>{t('bud.empty')}</b>{t('bud.emptyHint')}</div>
      ) : (
        <div className="card">
          {topBudgets.map((b) => (
            <div className="bar" key={b.id}>
              <div className="row">
                <span className="n">{t(`cat.${b.category}`)}</span>
                <b dir="ltr">{money(b.spent_base, base)} / {money(b.limit_base, base)}</b>
              </div>
              <div className="track">
                <i className={b.pct > 100 ? 'warn' : b.pct > 80 ? 'warn' : 'ok'} style={{ width: `${Math.min(100, b.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sectitle">
        <h2>{t('dash.recent')}</h2>
        <Link to="/transactions">{t('dash.viewAll')}</Link>
      </div>

      {data.recent.length === 0 ? (
        <div className="empty"><b>{t('dash.empty')}</b>{t('dash.emptyHint')}</div>
      ) : (
        <div className="card">
          {data.recent.slice(0, 4).map((tx) => (
            <div className="tx" key={tx.id}>
              <div className="ic">{(tx.note || t(`cat.${tx.category}`)).slice(0, 2)}</div>
              <div className="t">
                <div className="n">{tx.note || t(`cat.${tx.category}`)}</div>
                <small>{fmtDate(tx.occurred_on)}</small>
              </div>
              <div className={`a ${tx.kind === 'in' ? 'in' : 'out'}`}>
                {tx.kind === 'in' ? '+' : '−'}{money(tx.amount, tx.currency)}
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <TxForm onClose={() => setAdding(false)} onSaved={load} />
      )}
    </>
  );
}
