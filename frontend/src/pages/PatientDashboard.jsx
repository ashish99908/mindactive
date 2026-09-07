import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import api from '../services/api.js';
import GameCard from '../components/GameCard.jsx';


export default function PatientDashboard() {
  const { user } = useAuth();
  const { t } = useLang();
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
        <div className="skeleton" style={{ height: 48, width: '60%', maxWidth: 320, marginBottom: 24, borderRadius: 12 }} />
        <div className="grid-stats" style={{ marginBottom: 28 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
        </div>
        <div className="grid">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 14 }} />)}</div>
      </div>
    );
  }

  const statTiles = [
    { icon: '🎮', label: t('Games Completed'), value: stats.completed, tint: 'tint-purple' },
    { icon: '⚡', label: t('Current Level'), value: stats.level, tint: 'tint-amber' },
    { icon: '🎯', label: t('Avg Accuracy'), value: `${stats.accuracy}%`, tint: 'tint-teal' },
    { icon: '🏆', label: t('Best Score'), value: stats.bestScore, tint: 'tint-pink' },
  ];

  return (
    <div className="container page-pad">
      {/* Hero greeting */}
      <div className="dash-hero fade-up" style={{ padding: '22px 20px' }}>
        <div>
          <h1 className="page-title" style={{ color: '#fff', fontSize: '1.35rem', marginBottom: 4 }}>
            {(new Date().getHours() < 12 ? t('Good morning') : new Date().getHours() < 17 ? t('Good afternoon') : t('Good evening'))}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', margin: 0, lineHeight: 1.4 }}>
            {t("Ready for today's brain activity?")}
          </p>
        </div>
        <div className="dash-hero-emoji" aria-hidden="true" style={{ fontSize: '2.2rem' }}>🧠✨</div>
      </div>

      {statsError && (
        <div className="alert alert-error fade-up-1" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.88rem' }}>⚠️ {t("Couldn't load your stats. Is the backend running?")}</span>
          <button className="small secondary" onClick={fetchData} style={{ padding: '8px 14px', minHeight: 36 }}>
            {t('Retry')}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid-stats fade-up-1" style={{ margin: '20px 0 24px' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 2 }}>{t('Continue playing')}</h2>
          <p className="text-muted" style={{ fontSize: '.88rem', margin: 0 }}>{t('Pick up where you left off, or try something new.')}</p>
        </div>
      </div>
      <div className="grid fade-up-2">
        {games.map(g => <GameCard key={g.id} game={g} />)}
      </div>
    </div>
  );
}
