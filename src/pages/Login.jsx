import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../lib/i18n.jsx';

export default function Login() {
  const { t, lang, toggle } = useI18n();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const data = await api.post('/api/auth/login', form);
      setUser(data.user);
      navigate('/', { replace: true });
    } catch (e2) {
      setErr(e2.message || t('common.error'));
    } finally { setBusy(false); }
  };

  return (
    <div className="auth" style={{ position: 'relative' }}>
      <div className="langsw">
        <button className="iconbtn ghost" onClick={toggle}>{lang === 'ar' ? 'EN' : 'ع'}</button>
      </div>

      <div className="brand"><b>retr0</b><span>budget</span></div>
      <p className="tag">{t('app.tagline')}</p>

      <form onSubmit={submit}>
        {err && <div className="alert err">{err}</div>}
        <label className="field">
          <span>{t('auth.email')}</span>
          <input
            type="email" dir="ltr" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@studio.com"
          />
        </label>
        <label className="field">
          <span>{t('auth.password')}</span>
          <input
            type="password" dir="ltr" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </label>
        <button className="btn" disabled={busy}>{busy ? '…' : t('auth.login')}</button>
      </form>

      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16, textAlign: 'center' }}>
        {t('auth.signupCta')}{' '}
        <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>{t('auth.signup')}</Link>
      </p>
    </div>
  );
}
