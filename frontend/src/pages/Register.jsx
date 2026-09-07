import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'patient', age: '', gender: '', preferredLanguage: '', emergencyContact: '', notes: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError(t('Passwords do not match')); return; }
    setError('');
    setBusy(true);
    try {
      const data = await register(form);
      if (data.token) navigate(form.role === 'patient' ? '/patient/dashboard' : '/caretaker/dashboard');
      else { setError(data.error || t('Registration failed')); setBusy(false); }
    } catch (err) {
      setError(err.response?.data?.error || t('Something went wrong. Please try again.'));
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
        <div className="card fade-up" style={{ marginBottom: 0, width: '100%', padding: '24px 20px', margin: '0 4px', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2.6rem', marginBottom: 4, lineHeight: 1 }}>🌟</div>
          <h2 className="page-title" style={{ fontSize: '1.4rem', marginBottom: 4 }}>{t('Create your account')}</h2>
          <p className="text-muted" style={{ fontSize: '.9rem', margin: 0 }}>{t('Join SmritiLoom — free, friendly and fun.')}</p>
        </div>

        <div className="role-switch" style={{ marginBottom: 18, padding: '4px' }}>
          <button
            type="button"
            className={'role-pill' + (form.role === 'patient' ? ' active' : '')}
            onClick={() => setForm({ ...form, role: 'patient' })}
            style={{ flex: 1, minHeight: 44 }}
          >{t("🧓 I'm a Patient")}</button>
          <button
            type="button"
            className={'role-pill' + (form.role === 'caretaker' ? ' active' : '')}
            onClick={() => setForm({ ...form, role: 'caretaker' })}
            style={{ flex: 1, minHeight: 44 }}
          >{t("👩‍⚕️ I'm a Caretaker")}</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label style={{ marginBottom: 6 }}>{t('Full Name')}</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                required
                style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                autoComplete="name"
              />
            </div>
            <div>
              <label style={{ marginBottom: 6 }}>{t('Email')}</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                autoComplete="email"
              />
            </div>
            <div>
              <label style={{ marginBottom: 6 }}>{t('Password')}</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={t('At least 6 characters')}
                required
                minLength={6}
                style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label style={{ marginBottom: 6 }}>{t('Confirm Password')}</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder={t('Repeat password')}
                required
                style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                autoComplete="new-password"
              />
            </div>
          </div>

          {form.role === 'patient' ? (
            <>
              <div className="form-divider" style={{ margin: '14px 0 12px' }}>
                <span style={{ flex: 1, textAlign: 'left' }}>{t('Patient details')}</span>
                <span style={{ fontSize: '.78rem', color: 'var(--c-muted)', flexShrink: 0 }}>{t('helps us personalise games')}</span>
              </div>
              <div className="form-grid">
                <div>
                  <label style={{ marginBottom: 6 }}>{t('Age')}</label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="e.g., 72"
                    min="0"
                    max="120"
                    style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                  />
                </div>
                <div>
                  <label style={{ marginBottom: 6 }}>{t('Gender')}</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48, paddingRight: '40px' }}
                  >
                    <option value="">{t('Select')}</option>
                    <option value="Male">{t('Male')}</option>
                    <option value="Female">{t('Female')}</option>
                    <option value="Other">{t('Other')}</option>
                  </select>
                </div>
                <div>
                  <label style={{ marginBottom: 6 }}>{t('Preferred Language')}</label>
                  <input
                    name="preferredLanguage"
                    value={form.preferredLanguage}
                    onChange={handleChange}
                    placeholder="e.g., Hindi, English"
                    style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                  />
                </div>
                <div>
                  <label style={{ marginBottom: 6 }}>{t('Emergency Contact')}</label>
                  <input
                    name="emergencyContact"
                    value={form.emergencyContact}
                    onChange={handleChange}
                    placeholder={t('Phone or email')}
                    style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={{ marginBottom: 6 }}>{t('Notes (optional)')}</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('Anything the caretaker should know…')}
                    style={{ padding: '14px 16px', fontSize: '16px', resize: 'vertical', minHeight: 80 }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-divider" style={{ margin: '14px 0 12px' }}>
                <span style={{ flex: 1, textAlign: 'left' }}>{t('Caretaker details')}</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={{ marginBottom: 6 }}>{t('Phone')}</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  style={{ padding: '14px 16px', fontSize: '16px', minHeight: 48 }}
                  autoComplete="tel"
                />
              </div>
            </>
          )}

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
            {busy ? t('Creating account…') : t('Create account 🎉')}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p className="text-body" style={{ margin: 0, fontSize: '.9rem' }}>
            {t('Already have an account?')} {' '}
            <Link to="/login" style={{ color: 'var(--c-primary-strong)', fontWeight: 600, fontSize: '.9rem' }}>
              {t('Login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
