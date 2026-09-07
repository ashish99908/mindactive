import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';

const features = [
  { icon: '🧠', title: 'Cognitive Games', text: 'Seventeen scientifically designed games that challenge memory, attention, language and problem-solving.', tint: 'tint-purple' },
  { icon: '👩‍⚕️', title: 'Caregiver Monitoring', text: 'Track progress in real time, view rich analytics and get AI-powered insights on every session.', tint: 'tint-teal' },
  { icon: '🔊', title: 'Audio Support', text: 'Text-to-speech instructions and gentle feedback keep every player confident and included.', tint: 'tint-amber' },
];

const games = [
  { icon: '🛒', name: 'Bazaar Buddy' },
  { icon: '🔍', name: 'Spot the Change' },
  { icon: '🌻', name: 'Word Garden' },
  { icon: '🗺️', name: 'Find My Way Home' },
  { icon: '🍳', name: 'Recipe Helper' },
  { icon: '📖', name: 'Story & Remember' },
];

const roadmapGames = [
  { icon: '🧭', name: 'Route Planner' },
  { icon: '🧺', name: 'Haat Budget' },
  { icon: '🗣️', name: 'Voice Wall' },
  { icon: '🎊', name: 'Festival Match' },
  { icon: '🍲', name: 'Recipe Sequence' },
  { icon: '🧩', name: 'Landmark Jigsaw' },
  { icon: '🔊', name: 'Soundboard' },
  { icon: '🃏', name: 'Memory Match' },
  { icon: '🧠', name: 'Sriti-Smriti Recall' },
  { icon: '🎹', name: 'Melody Tap' },
  { icon: '🌊', name: 'Calm Waves' },
];

export default function Landing() {
  const { t } = useLang();
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ paddingTop: 0 }}>
          <div className="hero-content fade-up">
            <span className="badge badge-purple" style={{ marginBottom: 14, display: 'inline-block' }}>{t('✨ Brain training, made joyful')}</span>
            <h1 className="hero-title">
              {t('Keep the mind')} <span className="hero-gradient">{t('active')}</span>{t('. Every day.')}
            </h1>
            <p className="hero-sub">
              {t('Engaging cognitive games and thoughtful caregiver monitoring, designed with and for elderly players.')}
            </p>
            <div className="hero-cta">
              <Link to="/login" state={{ role: 'patient' }}>
                <button style={{ width: '100%', padding: '14px 24px', fontSize: '1rem', borderRadius: '12px' }}>
                  {t('🧓 Patient Login')}
                </button>
              </Link>
              <Link to="/login" state={{ role: 'caretaker' }}>
                <button className="secondary" style={{ width: '100%', padding: '14px 24px', fontSize: '1rem', borderRadius: '12px' }}>
                  {t('👩‍⚕️ Caretaker Login')}
                </button>
              </Link>
            </div>
            <div className="hero-games" role="list" aria-label="Available games">
              {games.map((g) => (
                <span key={g.name} className="hero-game-chip" title={g.name} role="listitem">
                  {g.icon} {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="hero-blob hero-blob-1" aria-hidden="true" />
        <div className="hero-blob hero-blob-2" aria-hidden="true" />
      </section>

      {/* Features */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: 28 }} className="fade-up-1">
          <h2 className="section-title">{t('Why families love SmritiLoom')}</h2>
          <p className="text-body">{t('Everything you need to keep brains busy and hearts calm.')}</p>
        </div>
        <div className="grid-2 fade-up-2">
          {features.map((f) => (
            <div key={f.title} className="card hoverable" style={{ marginBottom: 0, padding: '18px' }}>
              <div className={`stat-icon ${f.tint}`} style={{ width: '100%', height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 12, background: 'var(--c-primary-soft)' }}>
                <span style={{ background: 'var(--c-primary-soft)', width: '100%', height: '100%', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.icon}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 6, fontWeight: 700 }}>{t(f.title)}</h3>
              <p className="text-body" style={{ fontSize: '.92rem', lineHeight: 1.5 }}>{t(f.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New mini-games */}
      <section className="container" style={{ marginTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }} className="fade-up-1">
          <h2 className="section-title">{t('🧩 11 new mini-games — all playable')}</h2>
          <p className="text-body" style={{ fontSize: '.95rem' }}>{t('A growing library targeting memory, attention, language and daily-life skills.')}</p>
        </div>
        <div className="roadmap-grid fade-up-2">
          {roadmapGames.map((g) => (
            <span key={g.name} className="roadmap-chip">{g.icon} {g.name}</span>
          ))}
        </div>
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 14, fontSize: '.88rem' }}>
          {t('All 17 games are playable in the app today — log in and pick any game to begin.')}
        </p>
      </section>

      {/* How it works */}
      <section className="container" style={{ marginTop: 24, paddingBottom: 20 }}>
        <div className="card fade-up-3" style={{ background: 'var(--grad-brand)', color: '#fff', textAlign: 'center', padding: '32px 24px', border: 'none', borderRadius: 'var(--r-xl)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 8, fontWeight: 700 }}>{t('Ready to begin the journey?')}</h2>
          <p style={{ opacity: 0.9, marginBottom: 20, fontSize: '1rem', lineHeight: 1.5 }}>{t('Create a free account and start the first game in under a minute.')}</p>
          <Link to="/register">
            <button className="secondary" style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: '12px' }}>
              {t('Create free account →')}
            </button>
          </Link>
        </div>
      </section>

      <footer className="landing-footer" style={{ padding: '24px 20px', fontSize: '.85rem' }}>
        <span style={{ opacity: 0.8 }}>{t('🧠 SmritiLoom — cognitive wellness for every generation')}</span>
      </footer>
    </div>
  );
}
