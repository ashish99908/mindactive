import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import GameCard from '../components/GameCard.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Games() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    api.get('/games')
      .then(res => setGames(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container page-pad games-page">
      <div className="fade-up" style={{ marginBottom: 26 }}>
        <h1 className="page-title">🎮 {t('Game Library')}</h1>
        <p className="page-subtitle">{t('Seventeen fun ways to exercise different parts of your brain.')}</p>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 17 }, (_, i) => <div key={i} className="skeleton" style={{ height: 340 }} />)}
        </div>
      ) : games.length === 0 ? (
        <div className="empty-state fade-up-1">
          <div className="empty-icon">🧩</div>
          <h3>{t('No games available yet')}</h3>
          <p>{t('Please check back soon — new games are on the way!')}</p>
        </div>
      ) : (
        <div className="grid fade-up-1">
          {games.map(g => <GameCard key={g.id} game={g} />)}
        </div>
      )}
    </div>
  );
}
