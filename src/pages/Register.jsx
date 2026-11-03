import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../lib/i18n.jsx';

export default function Register() {
  const { t, lang, toggle } = useI18n();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [base, setBase] = useState('USD');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const data = await api.post('/api/auth/register', { ...form, lang, base_currency: base });
      if (data.pending) { setPending(true); return; }
      setUser(data.user);
      navigate('/', { replace: true });
    } catch (e2) {
      setErr(e2.message || t('common.error'));
    } finally { setBusy(false); }
  };

  if (pending) {
    return (
      <div className="auth" style={{ position: 'relative', justifyContent: 'center' }}>
        <div className="brand"><b>retr0</b><span>budget</span></div>
        <div className="alert ok" style={{ marginTop: 28 }}>
          <b>{t('reg.pendingTitle')}</b>
          <div style={{ marginTop: 6, lineHeight: 1.6 }}>{t('reg.pendingBody')}</div>
        </div>
        <Link to="/login" className="btn" style={{ textAlign: 'center' }}>{t('auth.login')}</Link>
      </div>
    );
  }

  return (
    <div className="auth" style={{ position: 'relative' }}>
      <div className="langsw">
        <button className="iconbtn ghost" onClick={toggle}>{lang === 'ar' ? 'EN' : 'ع'}</button>
      </div>

      <div className="brand"><b>retr0</b><span>budget</span></div>
      <p className="tag">{t('auth.createSub')}</p>

      <form onSubmit={submit}>
        {err && <div className="alert err">{err}</div>}
        <label className="field">
          <span>{t('auth.name')}</span>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="محمد" />
        </label>
        <label className="field">
          <span>{t('auth.email')}</span>
          <input type="email" dir="ltr" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@studio.com" />
        </label>
        <label className="field">
          <span>{t('auth.password')}</span>
          <input type="password" dir="ltr" required minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          <div className="hint">8+</div>
        </label>

        <div className="field">
          <span>{t('auth.baseCurrency')}</span>
          <div className="cur">
            <button type="button" className={base === 'USD' ? 'on' : ''} onClick={() => setBase('USD')}>USD $</button>
            <button type="button" className={base === 'SP' ? 'on' : ''} onClick={() => setBase('SP')}>SP</button>
          </div>
        </div>

        <button className="btn" disabled={busy}>{busy ? '…' : t('auth.signup')}</button>
      </form>

      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}>
        {t('auth.loginCta')}{' '}
        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('auth.haveAcc')}</Link>
      </p>
    </div>
  );
}
