import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';
import api from '../services/api.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const CHART_COLORS = ['#6d5ef2', '#14b8a6', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e'];

export default function Analytics() {
  const { t } = useLang();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients')
      .then(res => setPatients(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="skeleton" style={{ height: 50, width: 340, marginBottom: 26 }} />
        <div className="grid-stats" style={{ marginBottom: 30 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
        </div>
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const totalGames = patients.reduce((s, p) => s + (p.games_completed || 0), 0);
  const avgAccuracy = patients.length
    ? patients.reduce((s, p) => s + (p.avg_accuracy || 0), 0) / patients.length
    : 0;
  const activePatients = patients.filter(p => p.last_activity).length;
  const topPerformer = [...patients].sort((a, b) => (b.avg_accuracy || 0) - (a.avg_accuracy || 0))[0];

  const engagementData = patients.map(p => ({
    name: p.name?.split(' ')[0] || 'Patient',
    games: p.games_completed || 0,
  }));

  const accuracyData = patients.map(p => ({
    name: p.name?.split(' ')[0] || 'Patient',
    accuracy: Math.round(p.avg_accuracy || 0),
  }));

  const buckets = [
    { name: t('Excellent (80%+)'), min: 80, max: 101, color: '#22c55e' },
    { name: t('Good (60–79%)'), min: 60, max: 80, color: '#14b8a6' },
    { name: t('Needs focus (<60%)'), min: -1, max: 60, color: '#f59e0b' },
  ].map(b => ({
    name: b.name,
    value: patients.filter(p => (p.avg_accuracy || 0) >= b.min && (p.avg_accuracy || 0) < b.max).length,
    color: b.color,
  })).filter(b => b.value > 0);

  const needsAttention = patients
    .filter(p => (p.avg_accuracy || 0) < 60 || !p.last_activity)
    .sort((a, b) => (a.avg_accuracy || 0) - (b.avg_accuracy || 0));

  const statTiles = [
    { icon: '👥', label: t('Patients'), value: patients.length, tint: 'tint-purple' },
    { icon: '🎮', label: t('Total Sessions'), value: totalGames, tint: 'tint-teal' },
    { icon: '📊', label: t('Cohort Accuracy'), value: `${Math.round(avgAccuracy)}%`, tint: 'tint-amber' },
    { icon: '🟢', label: t('Active (7d)'), value: activePatients, tint: 'tint-green' },
  ];

  return (
    <div className="container page-pad analytics-page">
      <div className="fade-up" style={{ marginBottom: 26 }}>
        <h1 className="page-title">📊 {t('Analytics')}</h1>
        <p className="page-subtitle">{t("A bird's-eye view of how your whole group is doing.")}</p>
      </div>

      {patients.length === 0 ? (
        <div className="empty-state fade-up-1">
          <div className="empty-icon">📉</div>
          <h3>{t('No data to analyse yet')}</h3>
          <p>{t('Add patients and let them play a few games — insights will appear here.')}</p>
          <Link to="/caretaker/dashboard"><button style={{ marginTop: 16 }}>{t('Go to dashboard')}</button></Link>
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
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">🎮 {t('Engagement — sessions per patient')}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={engagementData} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--c-muted)' }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                  <Tooltip />
                  <Bar dataKey="games" name={t('Sessions')} radius={[8, 8, 0, 0]}>
                    {engagementData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">🎯 {t('Accuracy — performance bands')}</div>
              {buckets.length === 0 ? (
                <p className="text-muted">{t('No accuracy data yet.')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={buckets} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={62} outerRadius={100} paddingAngle={4} strokeWidth={0}>
                      {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
              <div className="card-title">📈 {t('Average accuracy per patient')}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={accuracyData} margin={{ top: 5, right: 10, left: -18, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--c-muted)' }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--c-muted)' }} />
                  <Tooltip />
                  <Bar dataKey="accuracy" name={t('Avg accuracy %')} radius={[8, 8, 0, 0]} fill="#6d5ef2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid-2 fade-up-3" style={{ marginTop: 22 }}>
            {topPerformer && (
              <div className="card" style={{ marginBottom: 0, background: 'var(--c-green-soft)', border: '1px solid #bbf7d0' }}>
                <div className="card-title">🌟 {t('Star of the week')}</div>
                <p className="text-body">
                  <strong>{topPerformer.name}</strong> {t('leads the group with')}{' '}
                  <strong>{Math.round(topPerformer.avg_accuracy || 0)}% {t('average accuracy')}</strong> {t('across')}{' '}
                  {topPerformer.games_completed || 0} {t('sessions.')}
                  <br />{t('Wonderful consistency!')}
                </p>
                <Link to={`/caretaker/patient/${topPerformer.patient_id}`}>
                  <button className="small" style={{ marginTop: 12 }}>{t("View {name}'s details →", { name: topPerformer.name?.split(' ')[0] })}</button>
                </Link>
              </div>
            )}
            <div className="card" style={{ marginBottom: 0, background: 'var(--c-accent-soft)', border: '1px solid #fde68a' }}>
              <div className="card-title">🔔 {t('May need attention')}</div>
              {needsAttention.length === 0 ? (
                <p className="text-body">{t('Everyone is doing great — no one needs special attention right now. 🎉')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {needsAttention.slice(0, 4).map(p => (
                    <div key={p.patient_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span className={`badge ${!p.last_activity ? 'badge-amber' : 'badge-red'}`}>
                        {!p.last_activity ? t('Inactive') : `${Math.round(p.avg_accuracy || 0)}% ${t('acc')}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
