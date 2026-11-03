import React, { useState } from 'react';
import Sheet from './Sheet.jsx';
import { api } from '../lib/api.js';
import { useI18n, CATEGORIES } from '../lib/i18n.jsx';
import { today } from '../lib/money.js';

export default function TxForm({ onClose, onSaved, defaultKind = 'out' }) {
  const { t } = useI18n();
  const [kind, setKind] = useState(defaultKind);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await api.post('/api/transactions', {
        kind, amount: Number(amount), currency, category, note, date,
      });
      onSaved?.();
      onClose();
    } catch (e2) {
      setErr(e2.message || t('common.error'));
    } finally { setBusy(false); }
  };

  return (
    <Sheet title={t('tx.add')} onClose={onClose}>
      <form onSubmit={save}>
        {err && <div className="alert err">{err}</div>}

        <div className="seg" style={{ marginBottom: 14 }}>
          <button type="button" className={kind === 'out' ? 'on' : ''} onClick={() => setKind('out')}>{t('tx.kindOut')}</button>
          <button type="button" className={kind === 'in' ? 'on' : ''} onClick={() => setKind('in')}>{t('tx.kindIn')}</button>
        </div>

        <label className="field">
          <span>{t('tx.amount')}</span>
          <input
            className="num-input" type="number" inputMode="decimal" step="0.01" min="0" dir="ltr" required
            value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus
          />
        </label>

        <div className="row2">
          <div className="field">
            <span>{t('tx.currency')}</span>
            <div className="cur" style={{ width: '100%', justifyContent: 'space-between' }}>
              <button type="button" className={currency === 'USD' ? 'on' : ''} onClick={() => setCurrency('USD')}>USD $</button>
              <button type="button" className={currency === 'SP' ? 'on' : ''} onClick={() => setCurrency('SP')}>SP</button>
            </div>
          </div>
          <label className="field">
            <span>{t('tx.date')}</span>
            <input type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {kind === 'out' && (
          <label className="field">
            <span>{t('tx.category')}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}`)}</option>)}
            </select>
          </label>
        )}

        <label className="field">
          <span>{t('tx.note')}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('tx.note')} />
        </label>

        <button className="btn" disabled={busy}>{busy ? '…' : t('tx.save')}</button>
      </form>
    </Sheet>
  );
}
