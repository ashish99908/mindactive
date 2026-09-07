import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import api from '../services/api.js';
import { Link } from 'react-router-dom';

const CaretakerDashboard = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', age: '', gender: '',
    preferredLanguage: '', emergencyContact: '', notes: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [reportError, setReportError] = useState('');

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // Live updates: poll so fresh patient activity shows up without a manual reload.
    const pollId = setInterval(fetchPatients, 15000);
    return () => clearInterval(pollId);
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleReportChange = (e) => {
    const file = e.target.files?.[0];
    setReportError('');
    if (!file) { setReportFile(null); return; }
    const okTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!okTypes.includes(file.type)) { setReportFile(null); setReportError(t('Only PDF, PNG or JPG files are allowed')); return; }
    if (file.size > 5 * 1024 * 1024) { setReportFile(null); setReportError(t('File too large — maximum size is 5 MB')); return; }
    setReportFile(file);
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    try {
      const res = await api.post('/patients', formData);
      // Optional medical report upload (PDF/image) right after creation
      let reportNote = '';
      if (reportFile && res.data?.patientId) {
        try {
          const fd = new FormData();
          fd.append('report', reportFile);
          await api.post(`/patients/${res.data.patientId}/report`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          reportNote = ' ' + t('Medical report uploaded.');
        } catch (upErr) {
          reportNote = t(' (Report upload failed: {err} — you can attach it later from the patient page.)', { err: upErr.response?.data?.error || 'network error' });
        }
      }
      setFormSuccess(`${t('Patient added successfully!')}${reportNote}`);
      setFormData({ name: '', email: '', password: '', age: '', gender: '', preferredLanguage: '', emergencyContact: '', notes: '' });
      setReportFile(null);
      setShowAddForm(false);
      fetchPatients();
    } catch (err) {
      setFormError(err.response?.data?.error || t('Failed to add patient'));
    }
  };

  // Stats
  const totalPatients = patients.length;
  const totalGames = patients.reduce((sum, p) => sum + (p.games_completed || 0), 0);
  const avgAccuracy = patients.reduce((sum, p) => sum + (p.avg_accuracy || 0), 0) / (patients.length || 1);
  const activePatients = patients.filter(p => p.last_activity).length;

  const metrics = [
    { icon: '👥', label: t('Total Patients'), value: totalPatients, tint: 'tint-purple' },
    { icon: '🎮', label: t('Games Completed'), value: totalGames, tint: 'tint-teal' },
    { icon: '📊', label: t('Avg Accuracy'), value: `${Math.round(avgAccuracy)}%`, tint: 'tint-amber' },
    { icon: '🟢', label: t('Active Patients'), value: activePatients, tint: 'tint-green' },
  ];

  return (
    <div className="container page-pad caretaker-dashboard">
      {/* Hero */}
      <div className="dash-hero fade-up">
        <div>
          <h1 className="page-title" style={{ color: '#fff' }}>{t('Welcome back,')} {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.08rem', marginTop: 6 }}>
            {t("Here's what's happening with your patients today.")}
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setFormSuccess(''); setFormError(''); }}
          className={showAddForm ? 'secondary' : ''}
          style={{ background: showAddForm ? undefined : 'rgba(255,255,255,0.18)', color: '#fff', boxShadow: showAddForm ? undefined : 'none', border: showAddForm ? undefined : '1px solid rgba(255,255,255,0.4)' }}
        >
          {showAddForm ? t('✖ Close') : t('+ Add Patient')}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid-stats fade-up-1" style={{ margin: '26px 0 34px' }}>
        {metrics.map((m) => (
          <div key={m.label} className="stat-tile">
            <div className={`stat-icon ${m.tint}`}>{m.icon}</div>
            <div>
              <div className="stat-label">{m.label}</div>
              <div className="stat-value">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Patient Form */}
      {showAddForm && (
        <div className="card fade-up caretaker-add-patient" style={{ border: '1.5px solid var(--c-primary-soft)' }}>
          <div className="card-title">➕ {t('Add New Patient')}</div>
          <form onSubmit={handleAddPatient}>
            <div className="form-grid">
              <div>
                <label>{t('Full Name')} *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Jane Doe" required />
              </div>
              <div>
                <label>{t('Email')} *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="patient@example.com" required />
              </div>
              <div>
                <label>{t('Password')} *</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Temporary password" required />
              </div>
              <div>
                <label>{t('Age')}</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="e.g., 72" />
              </div>
              <div>
                <label>{t('Gender')}</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">{t('Select')}</option>
                  <option value="Male">{t('Male')}</option>
                  <option value="Female">{t('Female')}</option>
                  <option value="Other">{t('Other')}</option>
                </select>
              </div>
              <div>
                <label>{t('Preferred Language')}</label>
                <input type="text" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleInputChange} placeholder="e.g., Hindi, English" />
              </div>
              <div>
                <label>{t('Emergency Contact')}</label>
                <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} placeholder="Phone or email" />
              </div>
            </div>

            <div>
              <label>{t('Medical report (optional — PDF, JPG or PNG, max 5 MB)')}</label>
              <label className="file-drop">
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" style={{ display: 'none' }} onChange={handleReportChange} />
                <span>{reportFile ? `📄 ${reportFile.name} (${Math.max(1, Math.round(reportFile.size / 1024))} KB) ${t('— click to change')}` : t('📎 Attach medical report (PDF or image)')}</span>
              </label>
              {reportError && <div className="alert alert-error">{reportError}</div>}
            </div>

            <label>{t('Notes (optional)')}</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" placeholder={t('Anything important about this patient…')} />
            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
            <button type="submit" style={{ width: '100%' }}>{t('Create Patient ✓')}</button>
          </form>
        </div>
      )}

      {/* Patients section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>{t('Your patients')}</h2>
        <span className="badge badge-gray">{patients.length} {patients.length === 1 ? t('patient') : t('patients')}</span>
      </div>

      {loading ? (
        <div className="grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 190 }} />)}
        </div>
      ) : patients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h3>{t('No patients yet')}</h3>
          <p>{t('Click “Add Patient” above to create your first patient profile.')}</p>
        </div>
      ) : (
        <div className="grid">
          {patients.map(patient => (
            <div key={patient.patient_id} className="card hoverable caretaker-patient-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div className="avatar-gradient" style={{ width: 58, height: 58, fontSize: '1.5rem' }}>
                  {patient.name?.charAt(0) || 'P'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{patient.name}</div>
                  <div style={{ fontSize: '.85rem', color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patient.email}</div>
                  {patient.age && <div style={{ fontSize: '.82rem', color: 'var(--c-muted)' }}>🎂 {patient.age} {t('yrs')}{patient.preferred_language ? ` · 🗣️ ${patient.preferred_language}` : ''}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge badge-green">{patient.games_completed || 0} {t('games')}</span>
                <span className="badge badge-blue">{Math.round(patient.avg_accuracy || 0)}% {t('acc')}</span>
                {patient.last_activity
                  ? <span className="badge badge-gray">{t('Last:')} {new Date(patient.last_activity).toLocaleDateString()}</span>
                  : <span className="badge badge-amber">{t('No activity yet')}</span>}
              </div>
              <Link to={`/caretaker/patient/${patient.patient_id}`} style={{ marginTop: 'auto' }}>
                <button className="secondary" style={{ width: '100%' }}>{t('View details →')}</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaretakerDashboard;
