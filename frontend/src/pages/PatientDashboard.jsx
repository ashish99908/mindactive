import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api.js';
import GameCard from '../components/GameCard.jsx';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState({ completed: 0, level: 0, accuracy: 0, bestScore: 0 });
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const computeStats = (results) => {
    const n = results.length;
    if (n === 0) return { completed: 0, level: 0, accuracy: 0, bestScore: 0 };
    return {
      completed: n,
      level: Math.max(...results.map(r => r.level || 0)),
      accuracy: Math.round(results.reduce((s, r) => s + (r.accuracy || 0), 0) / n),
      bestScore: Math.max(...results.map(r => r.score || 0)),
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setStatsError(false);
    try {
      const g = await api.get('/games');
      setGames(g.data);
    } catch (e) { console.error(e); }
    try {
      // '/game-results' resolves the patient from the auth token server-side,
      // so stats are always the real saved sessions for this user.
      const r = await api.get('/game-results');
      setStats(computeStats(r.data || []));
    } catch (e) {
      console.error(e);
      setStatsError(true);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="skeleton" style={{ height: 56, width: 420, maxWidth: '90%', marginBottom: 30 }} />
        <div className="grid-stats" style={{ marginBottom: 40 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
        <div className="grid">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 320 }} />)}</div>
      </div>
    );
  }

  const statTiles = [
    { icon: '🎮', label: 'Games Completed', value: stats.completed, tint: 'tint-purple' },
    { icon: '⚡', label: 'Current Level', value: stats.level, tint: 'tint-amber' },
    { icon: '🎯', label: 'Avg Accuracy', value: `${stats.accuracy}%`, tint: 'tint-teal' },
    { icon: '🏆', label: 'Best Score', value: stats.bestScore, tint: 'tint-pink' },
  ];

  return (
    <div className="container page-pad">
      {/* Hero greeting */}
      <div className="dash-hero fade-up">
        <div>
          <h1 className="page-title" style={{ color: '#fff' }}>{greeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.12rem', marginTop: 6 }}>
            Ready for today's brain activity?
          </p>
        </div>
        <div className="dash-hero-emoji" aria-hidden="true">🧠✨</div>
      </div>

      {statsError && (
        <div className="alert alert-error fade-up-1" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span>⚠️ Couldn't load your stats. Is the backend running? Start it with <strong>cd backend &amp;&amp; npm start</strong>, then retry.</span>
          <button className="small secondary" onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid-stats fade-up-1" style={{ margin: '26px 0 40px' }}>
        {statTiles.map((s) => (
          <div key={s.label} className="stat-tile">
            <div className={`stat-icon ${s.tint}`}>{s.icon}</div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue playing */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        <div>
          <h2 className="section-title">Continue playing</h2>
          <p className="text-muted">Pick up where you left off, or try something new.</p>
        </div>
      </div>
      <div className="grid fade-up-2">
        {games.map(g => <GameCard key={g.id} game={g} />)}
      </div>
    </div>
  );
}
