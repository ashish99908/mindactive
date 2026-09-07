import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

const CHART_COLORS = ['#6d5ef2', '#14b8a6', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e'];

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();

  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);

  const fetchReport = () => {
    setReportLoading(true);
    api.get(`/patients/${id}/report/meta`)
      .then(res => setReport(res.data))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  };

  const viewReport = async () => {
    try {
      const res = await api.get(`/patients/${id}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert(t('Could not open report:') + ' ' + (err.response?.data?.error || err.message));
    }
  };

  const uploadReport = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert(t('File too large — maximum size is 5 MB')); return; }
    const fd = new FormData();
    fd.append('report', file);
    try {
      await api.post(`/patients/${id}/report`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchReport();
    } catch (err) {
      alert(t('Upload failed:') + ' ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => { fetchReport(); }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, resultsRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/game-results/${id}`)
        ]);
        setPatient(patientRes.data);
        setResults(resultsRes.data || []);
      } catch (err) {
        console.error(err);
        setError(t('Failed to load patient data'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Live updates: poll for new game results so newly finished sessions appear automatically.
    const pollId = setInterval(async () => {
      try {
        const resultsRes = await api.get(`/game-results/${id}`);
        setResults(resultsRes.data || []);
      } catch { /* keep last known good data on transient errors */ }
    }, 8000);
    return () => clearInterval(pollId);
  }, [id]);

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="skeleton" style={{ height: 170, marginBottom: 24 }} />
        <div className="grid-stats" style={{ marginBottom: 24 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="container page-pad">
        <div className="empty-state"><div className="empty-icon">⚠️</div><h3>{t('Something went wrong')}</h3><p>{error}</p></div>
      </div>
    );
  }
  if (!patient) {
    return (
      <div className="container page-pad">
        <div className="empty-state"><div className="empty-icon">🤷</div><h3>{t('Patient not found')}</h3></div>
      </div>
    );
  }

  // Compute stats
  const totalGames = results.length;
  const avgAccuracy = totalGames > 0 ? results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalGames : 0;
  const bestScore = totalGames > 0 ? Math.max(...results.map(r => r.score || 0)) : 0;
  const latestLevel = totalGames > 0 ? results[0]?.level || 0 : 0;

  // Score over time
  const scoreOverTime = [...results]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(r => ({
      date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.score || 0,
      accuracy: r.accuracy || 0,
    }));

  // Accuracy per game
  const gameAccuracy = {};
  results.forEach(r => {
    if (!gameAccuracy[r.game_name]) gameAccuracy[r.game_name] = { game: r.game_name, accuracy: [] };
    gameAccuracy[r.game_name].accuracy.push(r.accuracy || 0);
  });
  const accuracyPerGame = Object.keys(gameAccuracy).map(name => ({
    game: name,
    avgAccuracy: gameAccuracy[name].accuracy.reduce((a, b) => a + b, 0) / gameAccuracy[name].accuracy.length,
  }));

  // Level progression
  const levelPerGame = {};
  results.forEach(r => {
    if (!levelPerGame[r.game_name]) levelPerGame[r.game_name] = { game: r.game_name, levels: [] };
    levelPerGame[r.game_name].levels.push(r.level);
  });
  const avgLevelPerGame = Object.keys(levelPerGame).map(name => ({
    game: name,
    avgLevel: levelPerGame[name].levels.reduce((a, b) => a + b, 0) / levelPerGame[name].levels.length,
  }));

  const statTiles = [
    { icon: '🎮', label: t('Games Played'), value: totalGames, tint: 'tint-purple' },
    { icon: '📊', label: t('Avg Accuracy'), value: `${Math.round(avgAccuracy)}%`, tint: 'tint-teal' },
    { icon: '🏆', label: t('Best Score'), value: bestScore, tint: 'tint-amber' },
    { icon: '📈', label: t('Latest Level'), value: latestLevel, tint: 'tint-pink' },
  ];

  return (
    <div className="container page-pad patient-detail-page">
      <button className="ghost small fade-up" onClick={() => navigate(-1)} style={{ marginBottom: 14 }}>
        {t('← Back')}
      </button>

      {/* Profile banner */}
      <div className="card fade-up patient-summary-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="patient-summary-hero" style={{ background: 'var(--grad-brand)', padding: '34px 28px 58px', position: 'relative' }}>
          <div className="avatar-gradient patient-summary-avatar" style={{
            width: 92, height: 92, fontSize: '2.4rem',
            border: '4px solid rgba(255,255,255,0.7)',
            marginLeft: 28, transform: 'translateY(38px)',
            background: '#fff', color: 'var(--c-primary-strong)',
            boxShadow: 'var(--shadow-md)',
          }}>
            {patient.name?.charAt(0) || 'P'}
          </div>
        </div>
        <div className="patient-summary-content" style={{ padding: '14px 28px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <h2 className="patient-summary-name" style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)' }}>{patient.name}</h2>
              <p className="text-muted" style={{ marginBottom: 12 }}>📧 {patient.email}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {patient.age && <span className="badge badge-purple">🎂 {patient.age} {t('years')}</span>}
                {patient.gender && <span className="badge badge-blue">⚥ {patient.gender}</span>}
                {patient.preferred_language && <span className="badge badge-amber">🗣️ {patient.preferred_language}</span>}
                {patient.emergency_contact && <span className="badge badge-red">📞 {patient.emergency_contact}</span>}
              </div>
            </div>
          </div>
          {patient.notes && (
            <div style={{ marginTop: 16, background: 'var(--c-primary-softer)', borderRadius: 'var(--r-sm)', padding: '12px 16px', fontSize: '.95rem', color: 'var(--c-body)' }}>
              📝 {patient.notes}
            </div>
          )}
        </div>
      </div>

      {/* Medical report */}
      <div className="card fade-up-1" style={{ marginBottom: 24 }}>
        <div className="card-title">📋 {t('Medical report')}</div>
        {reportLoading ? (
          <div className="skeleton" style={{ height: 60 }} />
        ) : report ? (
          <div className="patient-report-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700 }}>📄 {report.file_name}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--c-muted)' }}>
                {Math.max(1, Math.round((report.size || 0) / 1024))} KB · {t('uploaded')} {new Date(report.created_at).toLocaleDateString()}
              </div>
            </div>
            <button className="secondary small" onClick={viewReport}>👁 {t('View report')}</button>
          </div>
        ) : (
          <div className="patient-report-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="text-muted">{t('No medical report uploaded yet.')}</span>
            <label className="file-drop" style={{ padding: '10px 16px', marginBottom: 0 }}>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" style={{ display: 'none' }} onChange={(e) => uploadReport(e.target.files?.[0])} />
              <span>📎 {t('Upload report (PDF/JPG/PNG, max 5 MB)')}</span>
            </label>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-stats fade-up-1" style={{ margin: '24px 0 30px' }}>
        {statTiles.map(s => (
          <div key={s.label} className="stat-tile">
            <div className={`stat-icon ${s.tint}`}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2 fade-up-2">
        {scoreOverTime.length > 1 && (
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-title">📉 {t('Score & accuracy over time')}</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scoreOverTime} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 4 }} name={t('Score')} />
                <Line type="monotone" dataKey="accuracy" stroke={CHART_COLORS[1]} strokeWidth={3} dot={{ r: 4 }} name={t('Accuracy %')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {accuracyPerGame.length > 0 && (
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-title">🎯 {t('Accuracy by game')}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={accuracyPerGame} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                <XAxis dataKey="game" tick={{ fontSize: 11, fill: 'var(--c-muted)' }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                <Tooltip />
                <Bar dataKey="avgAccuracy" name={t('Avg accuracy %')} radius={[8, 8, 0, 0]}>
                  {accuracyPerGame.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {avgLevelPerGame.length > 0 && (
          <div className="card" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
            <div className="card-title">🪜 {t('Average level per game')}</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={avgLevelPerGame} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                <XAxis dataKey="game" tick={{ fontSize: 11, fill: 'var(--c-muted)' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                <Tooltip />
                <Bar dataKey="avgLevel" name={t('Avg level')} radius={[8, 8, 0, 0]}>
                  {avgLevelPerGame.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Results table */}
      <div className="card fade-up-3" style={{ marginTop: 22 }}>
        <div className="card-title">🗒️ {t('Recent game results')}</div>
        {results.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">🌱</div>
            <h3>{t('No game results yet')}</h3>
            <p>{t('Results will appear here after {name} plays some games.', { name: patient.name?.split(' ')[0] })}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('Game')}</th><th>{t('Level')}</th><th>{t('Score')}</th><th>{t('Accuracy')}</th><th>{t('Date')}</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 20).map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{r.game_name}</td>
                    <td><span className="badge badge-blue">Lv {r.level}</span></td>
                    <td>{r.score}</td>
                    <td>
                      <span className={`badge ${(r.accuracy || 0) >= 70 ? 'badge-green' : (r.accuracy || 0) >= 40 ? 'badge-amber' : 'badge-red'}`}>
                        {Math.round(r.accuracy || 0)}%
                      </span>
                    </td>
                    <td className="text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetail;
