import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../App.jsx';
import { useI18n } from '../lib/i18n.jsx';
import Sheet from '../components/Sheet.jsx';

const StatusPill = ({ status, t }) => (
  <span
    className={`role ${status === 'active' ? 'admin' : ''}`}
    style={
      status === 'pending'
        ? { background: 'var(--accent-soft)', color: '#1B5638', borderColor: '#CFE0D6' }
        : status === 'blocked'
        ? { background: 'var(--danger-soft)', color: '#7E3020', borderColor: '#E7CFC7' }
        : undefined
    }
  >
    {t(`admin.status.${status}`)}
  </span>
);

export default function Admin() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get('/api/admin/users'));
      setErr('');
    } catch (e) { setErr(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = async (id, body) => {
    setBusyId(id);
    setErr('');
    try {
      await api.patch(`/api/admin/users/${id}`, body);
      await load();
      return true;
    } catch (e) { setErr(e.message); return false; } finally { setBusyId(null); }
  };

  const remove = async (id) => {
    if (!confirm(t('admin.confirmRemove'))) return;
    setBusyId(id);
    try { await api.del(`/api/admin/users/${id}`); await load(); }
    catch (e) { setErr(e.message); } finally { setBusyId(null); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const ok = await patch(editing.id, {
      name: editing.name,
      email: editing.email,
      role: editing.role,
      status: editing.status,
      base_currency: editing.base_currency,
      sp_rate: Number(editing.sp_rate),
    });
    if (ok) setEditing(null);
  };

  const pending = (data?.users || []).filter((u) => u.status === 'pending');
  const rest = (data?.users || []).filter((u) => u.status !== 'pending');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{t('admin.title')}</h1>
          <p>{t('admin.sub')}</p>
        </div>
      </div>

      {err && <div className="alert err">{err}</div>}
      {!data && <div className="loading"><div><div className="spin" />{t('common.loading')}</div></div>}

      {data && (
        <>
          <div className="sectitle">
            <h2>{t('admin.pending')} · {pending.length}</h2>
          </div>

          {pending.length === 0 ? (
            <div className="empty" style={{ padding: '18px 16px' }}>{t('admin.noPending')}</div>
          ) : (
            <div className="table">
              {pending.map((u) => (
                <div className="trow" key={u.id}>
                  <div className="who">
                    <div className="n">{u.name}</div>
                    <small>{u.email}</small>
                    <small>{u.created_at?.slice(0, 16)}</small>
                  </div>
                  <div className="right">
                    <button
                      className="btn sm"
                      disabled={busyId === u.id}
                      onClick={() => patch(u.id, { status: 'active' })}
                    >
                      ✓ {t('admin.accept')}
                    </button>
                    <button
                      className="btn ghost sm"
                      disabled={busyId === u.id}
                      onClick={() => patch(u.id, { status: 'blocked' })}
                    >
                      {t('admin.deny')}
                    </button>
                    <button
                      className="del"
                      disabled={busyId === u.id}
                      onClick={() => remove(u.id)}
                      aria-label={t('admin.remove')}
                      title={t('admin.remove')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sectitle">
            <h2>{t('admin.allUsers')} · {rest.length}</h2>
          </div>

          <div className="table">
            {rest.map((u) => {
              const self = u.id === user.id;
              return (
                <div className="trow" key={u.id}>
                  <div className="who">
                    <div className="n">
                      {u.name}
                      {self && <span style={{ color: 'var(--muted)', fontSize: 11 }}> ({t('admin.you')})</span>}
                    </div>
                    <small>{u.email} · {u.tx_count} tx · {u.budget_count} budgets</small>
                  </div>
                  <div className="right">
                    <StatusPill status={u.status} t={t} />
                    <span className={`role ${u.role === 'admin' ? 'admin' : ''}`}>{t(`role.${u.role}`)}</span>
                    {!self && (
                      <>
                        <button className="btn ghost sm" disabled={busyId === u.id} onClick={() => setEditing({ ...u })}>
                          {t('admin.edit')}
                        </button>
                        <button
                          className="btn ghost sm"
                          disabled={busyId === u.id}
                          onClick={() => patch(u.id, { status: u.status === 'blocked' ? 'active' : 'blocked' })}
                        >
                          {u.status === 'blocked' ? t('admin.unblock') : t('admin.block')}
                        </button>
                        <button className="del" disabled={busyId === u.id} onClick={() => remove(u.id)} aria-label={t('admin.remove')}>
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {rest.length === 0 && <div className="trow" style={{ gridTemplateColumns: '1fr', color: 'var(--muted)', fontSize: 12 }}>—</div>}
          </div>

          <div className="sectitle"><h2>{t('admin.audit')}</h2></div>
          <div className="table">
            {(data.audit || []).map((a) => (
              <div className="trow" key={a.id} style={{ gridTemplateColumns: '1fr' }}>
                <div className="who">
                  <div className="n" style={{ fontSize: 12.5 }}>{a.action}</div>
                  <small>{a.detail} · {a.created_at}</small>
                </div>
              </div>
            ))}
            {(data.audit || []).length === 0 && (
              <div className="trow" style={{ gridTemplateColumns: '1fr', color: 'var(--muted)', fontSize: 12 }}>—</div>
            )}
          </div>
        </>
      )}

      {editing && (
        <Sheet title={t('admin.editUser')} onClose={() => setEditing(null)}>
          <form onSubmit={saveEdit}>
            <label className="field">
              <span>{t('auth.name')}</span>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>{t('auth.email')}</span>
              <input type="email" dir="ltr" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} required />
            </label>

            <div className="row2">
              <label className="field">
                <span>{t('set.role')}</span>
                <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  <option value="member">{t('role.member')}</option>
                  <option value="admin">{t('role.admin')}</option>
                </select>
              </label>
              <label className="field">
                <span>{t('admin.status.active')}</span>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="pending">{t('admin.status.pending')}</option>
                  <option value="active">{t('admin.status.active')}</option>
                  <option value="blocked">{t('admin.status.blocked')}</option>
                </select>
              </label>
            </div>

            <div className="row2">
              <label className="field">
                <span>{t('set.base')}</span>
                <select value={editing.base_currency} onChange={(e) => setEditing({ ...editing, base_currency: e.target.value })}>
                  <option value="USD">USD $</option>
                  <option value="SP">SP</option>
                </select>
              </label>
              <label className="field">
                <span>{t('set.rate')}</span>
                <input
                  className="num-input" type="number" min="1" dir="ltr"
                  value={editing.sp_rate}
                  onChange={(e) => setEditing({ ...editing, sp_rate: e.target.value })}
                />
              </label>
            </div>

            <button className="btn">{t('admin.save')}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
