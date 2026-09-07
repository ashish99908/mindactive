import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api.js';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';

const CHART_COLORS = ['#6d5ef2', '#14b8a6', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e'];

export default function Progress() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Token-resolved endpoint: always returns THIS patient's real saved sessions.
    api.get('/game-results')
      .then(res => setResults(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="skeleton" style={{ height: 50, width: 300, marginBottom: 26 }} />
        <div className="grid-stats" style={{ marginBottom: 30 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const totalGames = results.length;
  const avgAccuracy = totalGames ? results.reduce((s, r) => s + (r.accuracy || 0), 0) / totalGames : 0;
  const bestScore = totalGames ? Math.max(...results.map(r => r.score || 0)) : 0;
  const totalScore = results.reduce((s, r) => s + (r.score || 0), 0);

  const scoreOverTime = [...results]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(r => ({
      date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.score || 0,
      accuracy: r.accuracy || 0,
    }));

  const perGame = {};
  results.forEach(r => {
    if (!perGame[r.game_name]) perGame[r.game_name] = { game: r.game_name, accs: [], scores: [] };
    perGame[r.game_name].accs.push(r.accuracy || 0);
    perGame[r.game_name].scores.push(r.score || 0);
  });
  const accuracyPerGame = Object.values(perGame).map(g => ({
    game: g.game,
    avgAccuracy: Math.round(g.accs.reduce((a, b) => a + b, 0) / g.accs.length),
  }));

  const statTiles = [
    { icon: '🎮', label: 'Sessions', value: totalGames, tint: 'tint-purple' },
    { icon: '🎯', label: 'Avg Accuracy', value: `${Math.round(avgAccuracy)}%`, tint: 'tint-teal' },
    { icon: '🏆', label: 'Best Score', value: bestScore, tint: 'tint-amber' },
    { icon: '⭐', label: 'Total Score', value: totalScore, tint: 'tint-pink' },
  ];

  return (
    <div className="container page-pad">
      <div className="fade-up" style={{ marginBottom: 26 }}>
        <h1 className="page-title">📈 My Progress</h1>
        <p className="page-subtitle">See how your brain is getting stronger, session by session.</p>
      </div>

      {totalGames === 0 ? (
        <div className="empty-state fade-up-1">
          <div className="empty-icon">🌱</div>
          <h3>No results yet</h3>
          <p>Play your first game to start growing your progress tree!</p>
          <Link to="/patient/games"><button style={{ marginTop: 18 }}>🎮 Browse games</button></Link>
        </div>
      ) : (
        <>
          <div className="grid-stats fade-up-1" style={{ marginBottom: 30 }}>
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

          <div className="grid-2 fade-up-2">
            {scoreOverTime.length > 1 && (
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-title">📉 Score & accuracy over time</div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={scoreOverTime} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 4 }} name="Score" />
                    <Line type="monotone" dataKey="accuracy" stroke={CHART_COLORS[1]} strokeWidth={3} dot={{ r: 4 }} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {accuracyPerGame.length > 0 && (
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-title">🎯 Accuracy by game</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={accuracyPerGame} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                    <XAxis dataKey="game" tick={{ fontSize: 11, fill: 'var(--c-muted)' }} interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                    <Tooltip />
                    <Bar dataKey="avgAccuracy" name="Avg accuracy %" radius={[8, 8, 0, 0]}>
                      {accuracyPerGame.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card fade-up-3" style={{ marginTop: 22 }}>
            <div className="card-title">🗒️ Recent sessions</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Game</th><th>Level</th><th>Score</th><th>Accuracy</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 15).map((r, i) => (
                    <tr key={i}>
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
          </div>
        </>
      )}
    </div>
  );
}
