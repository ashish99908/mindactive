import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Profile() {
  const { user } = useAuth();

  const isPatient = user?.role === 'patient';
  const roleBadge = isPatient
    ? { cls: 'badge-purple', label: '🧓 Patient' }
    : { cls: 'badge-teal', label: '👩‍⚕️ Caretaker' };

  const rows = [
    { icon: '👤', label: 'Name', value: user?.name || '—' },
    { icon: '📧', label: 'Email', value: user?.email || '—' },
    { icon: '🛡️', label: 'Role', value: <span className={`badge ${roleBadge.cls}`}>{roleBadge.label}</span> },
    isPatient && user?.patientId
      ? { icon: '🆔', label: 'Patient ID', value: `#${user.patientId}` }
      : { icon: '🆔', label: 'User ID', value: `#${user?.id ?? '—'}` },
  ];

  return (
    <div className="container page-pad" style={{ maxWidth: 720 }}>
      <div className="fade-up" style={{ marginBottom: 26 }}>
        <h1 className="page-title">👤 My Profile</h1>
        <p className="page-subtitle">Your account details at a glance.</p>
      </div>

      <div className="card fade-up-1" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'var(--grad-brand)', padding: '38px 26px 56px', textAlign: 'center' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', margin: '0 auto',
            background: 'rgba(255,255,255,0.25)', border: '4px solid rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.6rem', fontWeight: 800, color: '#fff',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
        <div style={{ padding: '0 26px 26px', marginTop: -48 }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: 4 }}>{user?.name}</h2>
          <p style={{ textAlign: 'center', marginBottom: 22 }}>
            <span className={`badge ${roleBadge.cls}`}>{roleBadge.label}</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rows.map((r) => (
              <div key={r.label} className="profile-row">
                <span className="profile-row-icon">{r.icon}</span>
                <span className="profile-row-label">{r.label}</span>
                <span className="profile-row-value">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card fade-up-2" style={{ background: 'var(--c-primary-softer)', border: '1px solid var(--c-primary-soft)' }}>
        <div className="card-title">💡 Did you know?</div>
        <p className="text-body">
          Regular brain training — even 10 minutes a day — is associated with better memory,
          attention and mood. Keep showing up, {user?.name?.split(' ')[0]}!
        </p>
      </div>
    </div>
  );
}
