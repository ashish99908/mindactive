import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

// Some stored analyses have a raw JSON string in overallPerformance (an old
// fallback for truncated AI responses). Repair those so every card renders.
const normalizeAnalysis = (a) => {
  if (!a) return a;
  const raw = a.overallPerformance;
  if (typeof raw !== 'string' || !raw.trim().startsWith('{')) return a;
  try {
    const parsed = JSON.parse(raw.trim());
    if (parsed && typeof parsed === 'object') {
      return { ...a, ...parsed, overallPerformance: parsed.overallPerformance || '' };
    }
  } catch { /* truncated or prose-wrapped — leave as-is */ }
  return a;
};

export default function AIAnalysis() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/patients')
      .then(res => {
        setPatients(res.data || []);
        if (res.data?.length) setSelected(String(res.data[0].patient_id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runAnalysis = async () => {
    if (!selected) return;
    setError('');
    setAnalysis(null);
    setAnalyzing(true);
    try {
      const res = await api.post(`/ai/analyze/${selected}`);
      setAnalysis(normalizeAnalysis(res.data));
    } catch (err) {
      setError(err.response?.data?.error || 'AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="skeleton" style={{ height: 50, width: 380, marginBottom: 26 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  return (
    <div className="container page-pad" style={{ maxWidth: 860 }}>
      <div className="fade-up" style={{ marginBottom: 26 }}>
        <h1 className="page-title">🤖 AI Analysis</h1>
        <p className="page-subtitle">Let AI turn game results into friendly, actionable insights.</p>
      </div>

      <div className="card fade-up-1">
        <div className="card-title">🧪 Run an analysis</div>
        {patients.length === 0 ? (
          <div className="empty-state" style={{ padding: 36 }}>
            <div className="empty-icon">👤</div>
            <h3>No patients yet</h3>
            <p>Add a patient first — AI needs game results to analyse.</p>
            <Link to="/caretaker/dashboard"><button style={{ marginTop: 14 }}>Go to dashboard</button></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ marginBottom: 0 }}>Choose patient</label>
              <select value={selected} onChange={e => { setSelected(e.target.value); setAnalysis(null); setError(''); }} style={{ marginBottom: 0 }}>
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.name} — {p.games_completed || 0} sessions
                  </option>
                ))}
              </select>
            </div>
            <button onClick={runAnalysis} disabled={analyzing || !selected} style={{ alignSelf: 'flex-end' }}>
              {analyzing ? '🧠 Thinking…' : '✨ Analyze'}
            </button>
          </div>
        )}
        {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}
      </div>

      {analyzing && (
        <div className="loading-wrap fade-up">
          <div className="spinner" />
          Our AI is reviewing the game results… this takes a few seconds.
        </div>
      )}

      {analysis && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overall */}
          <div className="card" style={{ background: 'var(--grad-brand)', color: '#fff', border: 'none' }}>
            <div className="card-title" style={{ color: '#fff' }}>🧠 Overall performance</div>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
              {analysis.overallPerformance || 'No summary returned.'}
            </p>
            {analysis.progress && (
              <p style={{ marginTop: 10, opacity: 0.92 }}>
                <strong>Progress:</strong> {analysis.progress}
              </p>
            )}
          </div>

          <div className="grid-2">
            <div className="card" style={{ marginBottom: 0, background: 'var(--c-green-soft)', border: '1px solid #bbf7d0' }}>
              <div className="card-title">💪 Strengths</div>
              {analysis.strengths?.length ? (
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              ) : <p className="text-body">No specific strengths flagged.</p>}
            </div>

            <div className="card" style={{ marginBottom: 0, background: 'var(--c-accent-soft)', border: '1px solid #fde68a' }}>
              <div className="card-title">🔍 Areas to monitor</div>
              {analysis.areasToMonitor?.length ? (
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analysis.areasToMonitor.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              ) : <p className="text-body">Nothing to monitor right now.</p>}
            </div>
          </div>

          <div className="grid-2">
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">🎮 Suggested games</div>
              {analysis.suggestedGames?.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {analysis.suggestedGames.map((g, i) => (
                    <span key={i} className="badge badge-purple" style={{ fontSize: '.9rem', padding: '7px 14px' }}>🎲 {g}</span>
                  ))}
                </div>
              ) : <p className="text-body">No suggestions returned.</p>}
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">⚙️ Recommended level</div>
              {analysis.recommendedLevel != null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="stat-icon tint-purple" style={{ width: 58, height: 58, fontSize: '1.6rem', fontWeight: 800 }}>
                    {analysis.recommendedLevel}
                  </div>
                  <p className="text-body">A comfortable challenge level for the next sessions.</p>
                </div>
              ) : <p className="text-body">No level recommendation returned.</p>}
            </div>
          </div>

          {analysis.recentChanges && (
            <div className="card" style={{ background: 'var(--c-blue-soft)', border: '1px solid #bfdbfe' }}>
              <div className="card-title">🕐 Recent changes</div>
              <p className="text-body">{analysis.recentChanges}</p>
            </div>
          )}
        </div>
      )}

      {!analysis && !analyzing && patients.length > 0 && (
        <div className="empty-state fade-up-2">
          <div className="empty-icon">✨</div>
          <h3>Ready when you are</h3>
          <p>Pick a patient above and hit “Analyze” to generate insights.</p>
        </div>
      )}
    </div>
  );
}
