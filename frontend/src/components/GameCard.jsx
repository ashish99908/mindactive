import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext.jsx';

const gameMeta = {
  'Bazaar Buddy': { icon: '🛒', tint: 'tint-teal', grad: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)' },
  'Spot the Change': { icon: '🔍', tint: 'tint-amber', grad: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' },
  'Word Garden': { icon: '🌻', tint: 'tint-pink', grad: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
  'Find My Way Home': { icon: '🗺️', tint: 'tint-blue', grad: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' },
  'Recipe Helper': { icon: '🍳', tint: 'tint-amber', grad: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  'Story & Remember': { icon: '📖', tint: 'tint-purple', grad: 'linear-gradient(135deg, #6d5ef2 0%, #9f5ef2 100%)' },
  'Route Planner': { icon: '🧭', tint: 'tint-blue', grad: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' },
  'Haat Budget': { icon: '🧺', tint: 'tint-amber', grad: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' },
  'Voice Wall': { icon: '🗣️', tint: 'tint-teal', grad: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)' },
  'Festival Match': { icon: '🎊', tint: 'tint-pink', grad: 'linear-gradient(135deg, #db2777 0%, #e11d48 100%)' },
  'Recipe Sequence': { icon: '🍲', tint: 'tint-amber', grad: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)' },
  'Landmark Jigsaw': { icon: '🧩', tint: 'tint-purple', grad: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' },
  'Soundboard': { icon: '🔊', tint: 'tint-teal', grad: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' },
  'Memory Match': { icon: '🃏', tint: 'tint-blue', grad: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' },
  'Sriti-Smriti Recall': { icon: '🧠', tint: 'tint-purple', grad: 'linear-gradient(135deg, #6d28d9 0%, #c026d3 100%)' },
  'Melody Tap': { icon: '🎹', tint: 'tint-pink', grad: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' },
  'Calm Waves': { icon: '🌊', tint: 'tint-blue', grad: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)' },
};

const GameCard = ({ game }) => {
  const { t } = useLang();
  const meta = gameMeta[game.name] || { icon: '🧩', tint: 'tint-purple', grad: 'linear-gradient(135deg, #6d5ef2 0%, #9f5ef2 100%)' };
  return (
    <div className="card hoverable game-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div className="game-card-banner" style={{
        background: meta.grad,
        padding: '30px 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
      }}>
        <div className="game-card-icon" style={{
          width: 84, height: 84, borderRadius: '50%',
          background: 'rgba(255,255,255,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.6rem',
          backdropFilter: 'blur(4px)',
        }}>{meta.icon}</div>
        <h3 className="game-card-title" style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, textAlign: 'center' }}>{game.name}</h3>
      </div>
      <div className="game-card-body" style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ fontSize: '.95rem', color: 'var(--c-body)', flex: 1 }}>{game.description}</p>
        <div style={{ margin: '14px 0 16px' }}>
          <span className={`badge ${game.cognitive_area ? 'badge-purple' : 'badge-gray'}`}>
            🧠 {game.cognitive_area || t('Cognitive training')}
          </span>
        </div>
        <Link to={`/patient/game/${game.id}`} style={{ marginTop: 'auto' }}>
          <button style={{ width: '100%' }}>▶ {t('Play now')}</button>
        </Link>
      </div>
    </div>
  );
};

export default GameCard;
