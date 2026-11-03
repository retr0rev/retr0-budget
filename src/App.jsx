import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { I18nProvider, useI18n } from './lib/i18n.jsx';
import { api } from './lib/api.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Budgets from './pages/Budgets.jsx';
import Settings from './pages/Settings.jsx';
import Admin from './pages/Admin.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout', {}); } catch {}
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, setUser, refresh, logout, ready }}>
      {children}
    </AuthCtx.Provider>
  );
}

function LangToggle() {
  const { lang, toggle } = useI18n();
  return (
    <button className="iconbtn ghost" onClick={toggle} aria-label="Language" title="AR / EN">
      {lang === 'ar' ? 'EN' : 'AR'}
    </button>
  );
}

function Shell({ children }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const items = [
    { to: '/', label: t('nav.home') },
    { to: '/budgets', label: t('nav.budgets') },
    { to: '/transactions', label: t('nav.tx') },
    { to: '/settings', label: t('nav.settings') },
  ];
  if (user?.role === 'admin') items.push({ to: '/admin', label: t('nav.admin') });

  const initials = (user?.name || '?').trim().slice(0, 2).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><b>retr0</b> <span style={{ color: 'var(--muted)' }}>budget</span></div>
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}>
            <span>{i.label}</span>
          </NavLink>
        ))}
        <div className="spacer" />
        <button className="btn ghost sm" onClick={() => { logout(); navigate('/login'); }}>{t('set.logout')}</button>
      </aside>

      <div className="maincol">
        <header className="topbar">
          <div className="wordmark"><b>retr0</b><span>budget</span></div>
          <div className="topact">
            <LangToggle />
            <button className="iconbtn avatar" onClick={() => navigate('/settings')} title={user?.name || ''}>
              {initials}
            </button>
          </div>
        </header>

        <div className="page">{children}</div>

        <nav className="bottomnav">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}>
              <span className="dot" />
              {i.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  if (!ready) return <div className="loading"><div><div className="spin" />{t('common.loading')}</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="loading"><div><div className="spin" />loading</div></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
            <Route path="/budgets" element={<Protected><Budgets /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/admin" element={<Protected><AdminOnly><Admin /></AdminOnly></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
