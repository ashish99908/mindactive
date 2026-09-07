import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
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
      else { setError(data.error || 'Login failed'); setBusy(false); }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card fade-up" style={{ marginBottom: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 6 }}>🧠</div>
          <h2 className="page-title" style={{ fontSize: '1.7rem' }}>Welcome back</h2>
          <p className="text-muted">Log in to continue your brain journey.</p>
        </div>

        {/* Role switcher */}
        <div className="role-switch" style={{ marginBottom: 22 }}>
          <button
            type="button"
            className={'role-pill' + (role === 'patient' ? ' active' : '')}
            onClick={() => setRole('patient')}
          >🧓 Patient</button>
          <button
            type="button"
            className={'role-pill' + (role === 'caretaker' ? ' active' : '')}
            onClick={() => setRole('caretaker')}
          >👩‍⚕️ Caretaker</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
            {busy ? 'Logging in…' : 'Log in →'}
          </button>
        </form>

        <p style={{ marginTop: 18, textAlign: 'center' }} className="text-body">
          Don't have an account? <Link to="/register" style={{ color: 'var(--c-primary-strong)', fontWeight: 600 }}>Register here</Link>
        </p>
        <p style={{ marginTop: 8, textAlign: 'center' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('Password reset link sent (demo)'); }} style={{ fontSize: '.9rem', color: 'var(--c-muted)' }}>Forgot password?</a>
        </p>
      </div>
    </div>
  );
}
