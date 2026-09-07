import React from 'react';
import { Link } from 'react-router-dom';

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
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ paddingTop: 0 }}>
          <div className="hero-content fade-up">
            <span className="badge badge-purple" style={{ marginBottom: 18 }}>✨ Brain training, made joyful</span>
            <h1 className="hero-title">Keep the mind <span className="hero-gradient">active</span>. Every day.</h1>
            <p className="hero-sub">
              Engaging cognitive games and thoughtful caregiver monitoring,
              designed with and for elderly players.
            </p>
            <div className="hero-cta">
              <Link to="/login" state={{ role: 'patient' }}><button style={{ padding: '15px 34px', fontSize: '1.1rem' }}>🧓 Patient Login</button></Link>
              <Link to="/login" state={{ role: 'caretaker' }}><button className="secondary" style={{ padding: '15px 34px', fontSize: '1.1rem' }}>👩‍⚕️ Caretaker Login</button></Link>
            </div>
            <div className="hero-games">
              {games.map((g) => (
                <span key={g.name} className="hero-game-chip" title={g.name}>{g.icon} {g.name}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
      </section>

      {/* Features */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="fade-up-1">
          <h2 className="section-title" style={{ fontSize: '1.9rem' }}>Why families love SmritiLoom</h2>
          <p className="text-body">Everything you need to keep brains busy and hearts calm.</p>
        </div>
        <div className="grid-2 fade-up-2">
          {features.map((f) => (
            <div key={f.title} className="card hoverable" style={{ marginBottom: 0 }}>
              <div className={`stat-icon ${f.tint}`} style={{ width: 58, height: 58, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 14 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: 8 }}>{f.title}</h3>
              <p className="text-body">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New mini-games */}
      <section className="container" style={{ marginTop: 30 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }} className="fade-up-1">
          <h2 className="section-title" style={{ fontSize: '1.9rem' }}>🧩 11 new mini-games — all playable</h2>
          <p className="text-body">A growing library targeting memory, attention, language and daily-life skills.</p>
        </div>
        <div className="roadmap-grid fade-up-2">
          {roadmapGames.map((g) => (
            <span key={g.name} className="roadmap-chip">{g.icon} {g.name}</span>
          ))}
        </div>
        <p className="text-muted" style={{ textAlign: 'center', marginTop: 16, fontSize: '.95rem' }}>
          All 17 games are playable in the app today — log in and pick any game to begin.
        </p>
      </section>

      {/* How it works */}
      <section className="container" style={{ marginTop: 30 }}>
        <div className="card fade-up-3" style={{ background: 'var(--grad-brand)', color: '#fff', textAlign: 'center', padding: '48px 30px', border: 'none' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', marginBottom: 10 }}>Ready to begin the journey?</h2>
          <p style={{ opacity: 0.9, marginBottom: 26, fontSize: '1.08rem' }}>Create a free account and start the first game in under a minute.</p>
          <Link to="/register"><button className="secondary" style={{ padding: '14px 36px', fontSize: '1.08rem' }}>Create free account →</button></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>🧠 SmritiLoom — cognitive wellness for every generation</span>
      </footer>
    </div>
  );
}
