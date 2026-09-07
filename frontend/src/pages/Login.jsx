import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const suggested = location.state?.role || 'patient';
  React.useEffect(() => setRole(suggested), [suggested]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login(email, password, role);
      if (data.token) navigate(role === 'patient' ? '/patient/dashboard' : '/caretaker/dashboard');
      else { setError(data.error || t('Login failed')); setBusy(false); }
    } catch (err) {
      setError(err.response?.data?.error || t('Something went wrong. Please try again.'));
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card fade-up" style={{ marginBottom: 0, padding: '24px 20px', maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 6, lineHeight: 1 }}>🧠</div>
          <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 4 }}>{t('Welcome back')}</h2>
          <p className="text-muted" style={{ fontSize: '.92rem', margin: 0 }}>{t('Log in to continue your brain journey.')}</p>
        </div>

        {/* Role switcher - touch friendly */}
        <div className="role-switch" style={{ marginBottom: 20, padding: '4px' }}>
          <button
            type="button"
            className={'role-pill' + (role === 'patient' ? ' active' : '')}
            onClick={() => setRole('patient')}
            style={{ flex: 1, minHeight: 44 }}
          >{t('🧓 Patient')}</button>
          <button
            type="button"
            className={'role-pill' + (role === 'caretaker' ? ' active' : '')}
            onClick={() => setRole('caretaker')}
            style={{ flex: 1, minHeight: 44 }}
          >{t('👩‍⚕️ Caretaker')}</button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 4 }}>
          <div style={{ marginBottom: 4 }}>
            <label style={{ marginBottom: 6 }}>{t('Email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={{ marginBottom: 6 }}>{t('Password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 12, padding: '12px 14px', fontSize: '.9rem' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '14px 20px',
              fontSize: '1rem',
              minHeight: 48,
              borderRadius: 12
            }}
          >
            {busy ? t('Logging in…') : t('Log in →')}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <p className="text-body" style={{ margin: '0 0 8px', fontSize: '.92rem' }}>
            {t("Don't have an account?")} {' '}
            <Link to="/register" style={{ color: 'var(--c-primary-strong)', fontWeight: 600, fontSize: '.92rem' }}>
              {t('Register here')}
            </Link>
          </p>
          <p style={{ margin: 0 }}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); alert(t('Password reset link sent (demo)')); }}
              style={{ fontSize: '.88rem', color: 'var(--c-muted)', display: 'inline-block' }}
            >
              {t('Forgot password Wang?')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
