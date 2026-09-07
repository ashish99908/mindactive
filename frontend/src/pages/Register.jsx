import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'patient', age: '', gender: '', preferredLanguage: '', emergencyContact: '', notes: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError('');
    setBusy(true);
    try {
      const data = await register(form);
      if (data.token) navigate(form.role === 'patient' ? '/patient/dashboard' : '/caretaker/dashboard');
      else { setError(data.error || 'Registration failed'); setBusy(false); }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card fade-up" style={{ marginBottom: 0, maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 6 }}>🌟</div>
          <h2 className="page-title" style={{ fontSize: '1.7rem' }}>Create your account</h2>
          <p className="text-muted">Join SmritiLoom — free, friendly and fun.</p>
        </div>

        <div className="role-switch" style={{ marginBottom: 22 }}>
          <button type="button" className={'role-pill' + (form.role === 'patient' ? ' active' : '')} onClick={() => setForm({ ...form, role: 'patient' })}>🧓 I'm a Patient</button>
          <button type="button" className={'role-pill' + (form.role === 'caretaker' ? ' active' : '')} onClick={() => setForm({ ...form, role: 'caretaker' })}>👩‍⚕️ I'm a Caretaker</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Jane Doe" required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required />
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repeat password" required />
            </div>
          </div>

          {form.role === 'patient' ? (
            <>
              <div className="form-divider">Patient details <span>helps us personalise games</span></div>
              <div className="form-grid">
                <div>
                  <label>Age</label>
                  <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="e.g., 72" min="0" />
                </div>
                <div>
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label>Preferred Language</label>
                  <input name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange} placeholder="e.g., Hindi, English" />
                </div>
                <div>
                  <label>Emergency Contact</label>
                  <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Phone or email" />
                </div>
              </div>
              <label>Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Anything the caretaker should know…" />
            </>
          ) : (
            <>
              <div className="form-divider">Caretaker details</div>
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            </>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          <button type="submit" disabled={busy} style={{ width: '100%', marginTop: 8 }}>
            {busy ? 'Creating account…' : 'Create account 🎉'}
          </button>
        </form>

        <p style={{ marginTop: 18, textAlign: 'center' }} className="text-body">
          Already have an account? <Link to="/login" style={{ color: 'var(--c-primary-strong)', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
