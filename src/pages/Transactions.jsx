import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { useI18n } from '../lib/i18n.jsx';
import { money, fmtDate } from '../lib/money.js';
import TxForm from '../components/TxForm.jsx';

export default function Transactions() {
  const { t } = useI18n();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.get('/api/transactions?limit=100');
      setRows(d.transactions || []);
      setErr('');
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!confirm(t('tx.delete') + '?')) return;
    try {
      await api.del(`/api/transactions/${id}`);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (e) { setErr(e.message); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('tx.title')}</h1>
          <p>{t('tx.sub')}</p>
        </div>
        <button className="btn sm" onClick={() => setAdding(true)}>+ {t('tx.add')}</button>
      </div>

      {err && <div className="alert err">{err}</div>}

      {!rows && <div className="loading"><div><div className="spin" />{t('common.loading')}</div></div>}

      {rows && rows.length === 0 && (
        <div className="empty"><b>{t('tx.empty')}</b>{t('dash.emptyHint')}</div>
      )}

      {rows && rows.length > 0 && (
        <div className="card">
          {rows.map((tx) => (
            <div className="tx" key={tx.id}>
              <div className="ic">{(tx.note || t(`cat.${tx.category}`)).slice(0, 2)}</div>
              <div className="t">
                <div className="n">{tx.note || t(`cat.${tx.category}`)}</div>
                <small>{fmtDate(tx.occurred_on)} · {t(`cat.${tx.category}`)}</small>
              </div>
              <div className={`a ${tx.kind === 'in' ? 'in' : 'out'}`}>
                {tx.kind === 'in' ? '+' : '−'}{money(tx.amount, tx.currency)}
              </div>
              <button className="del" onClick={() => remove(tx.id)} aria-label={t('tx.delete')}>✕</button>
            </div>
          ))}
        </div>
      )}

      {adding && <TxForm onClose={() => setAdding(false)} onSaved={load} />}
    </>
  );
}
