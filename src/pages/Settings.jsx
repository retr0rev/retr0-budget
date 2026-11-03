import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../lib/i18n.jsx';

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [base, setBase] = useState(user?.base_currency || 'USD');
  const [rate, setRate] = useState(user?.sp_rate || 13500);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setMsg(''); setErr(''); setBusy(true);
    try {
      const d = await api.patch('/api/me', { name, base_currency: base, sp_rate: Number(rate), lang });
      setUser(d.user);
      setMsg(t('set.saved'));
      setTimeout(() => setMsg(''), 2200);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('set.title')}</h1>
          <p>{t('set.sub')}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--en)' }}>{user?.email}</div>
          </div>
          <span className={`role ${user?.role === 'admin' ? 'admin' : ''}`}>{t(`role.${user?.role}`)}</span>
        </div>
      </div>

      <form onSubmit={save}>
        {msg && <div className="alert ok">{msg}</div>}
        {err && <div className="alert err">{err}</div>}

        <label className="field">
          <span>{t('set.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <div className="field">
          <span>{t('set.base')}</span>
          <div className="cur" style={{ width: '100%', justifyContent: 'space-between' }}>
            <button type="button" className={base === 'USD' ? 'on' : ''} onClick={() => setBase('USD')}>USD $</button>
            <button type="button" className={base === 'SP' ? 'on' : ''} onClick={() => setBase('SP')}>SP</button>
          </div>
        </div>

        <label className="field">
          <span>{t('set.rate')}</span>
          <input
            className="num-input" type="number" min="1" step="1" dir="ltr"
            value={rate} onChange={(e) => setRate(e.target.value)}
          />
          <div className="hint">{t('set.rateHint')}</div>
        </label>

        <div className="field">
          <span>{t('set.lang')}</span>
          <div className="seg">
            <button type="button" className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>العربية</button>
            <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          </div>
        </div>

        <button className="btn" disabled={busy}>{busy ? '…' : t('set.save')}</button>
      </form>

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn ghost" onClick={() => { logout(); navigate('/login'); }}>{t('set.logout')}</button>
      </div>
    </>
  );
}
