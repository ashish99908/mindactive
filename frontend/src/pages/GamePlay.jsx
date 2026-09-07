import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import BazaarBuddy from '../games/BazaarBuddy/BazaarBuddy.jsx';
import SpotTheChange from '../games/SpotTheChange/index.jsx';
import WordGarden from '../games/WordGarden/index.jsx';
import FindMyWayHome from '../games/FindMyWayHome/index.jsx';
import RecipeHelper from '../games/RecipeHelper/index.jsx';
import StoryRemember from '../games/StoryRemember/index.jsx';
import RoutePlanner from '../games/RoutePlanner/index.jsx';
import HaatBudget from '../games/HaatBudget/index.jsx';
import VoiceWall from '../games/VoiceWall/index.jsx';
import FestivalMatch from '../games/FestivalMatch/index.jsx';
import RecipeSequence from '../games/RecipeSequence/index.jsx';
import LandmarkJigsaw from '../games/LandmarkJigsaw/index.jsx';
import Soundboard from '../games/Soundboard/index.jsx';
import MemoryMatch from '../games/MemoryMatch/index.jsx';
import SritiSmritiRecall from '../games/SritiSmritiRecall/index.jsx';
import MelodyTap from '../games/MelodyTap/index.jsx';
import CalmWaves from '../games/CalmWaves/index.jsx';

// Map by NAME, not id — game ids in the DB depend on insertion order and are not stable.
const componentsByName = {
  'Bazaar Buddy': BazaarBuddy,
  'Spot the Change': SpotTheChange,
  'Word Garden': WordGarden,
  'Find My Way Home': FindMyWayHome,
  'Recipe Helper': RecipeHelper,
  'Story & Remember': StoryRemember,
  'Route Planner': RoutePlanner,
  'Haat Budget': HaatBudget,
  'Voice Wall': VoiceWall,
  'Festival Match': FestivalMatch,
  'Recipe Sequence': RecipeSequence,
  'Landmark Jigsaw': LandmarkJigsaw,
  'Soundboard': Soundboard,
  'Memory Match': MemoryMatch,
  'Sriti-Smriti Recall': SritiSmritiRecall,
  'Melody Tap': MelodyTap,
  'Calm Waves': CalmWaves,
};

const gameMeta = {
  'Bazaar Buddy': { icon: '🛒', tint: 'tint-teal' },
  'Spot the Change': { icon: '🔍', tint: 'tint-amber' },
  'Word Garden': { icon: '🌻', tint: 'tint-pink' },
  'Find My Way Home': { icon: '🗺️', tint: 'tint-blue' },
  'Recipe Helper': { icon: '🍳', tint: 'tint-amber' },
  'Story & Remember': { icon: '📖', tint: 'tint-purple' },
  'Route Planner': { icon: '🧭', tint: 'tint-blue' },
  'Haat Budget': { icon: '🧺', tint: 'tint-amber' },
  'Voice Wall': { icon: '🗣️', tint: 'tint-teal' },
  'Festival Match': { icon: '🎊', tint: 'tint-pink' },
  'Recipe Sequence': { icon: '🍲', tint: 'tint-amber' },
  'Landmark Jigsaw': { icon: '🧩', tint: 'tint-purple' },
  'Soundboard': { icon: '🔊', tint: 'tint-teal' },
  'Memory Match': { icon: '🃏', tint: 'tint-blue' },
  'Sriti-Smriti Recall': { icon: '🧠', tint: 'tint-purple' },
  'Melody Tap': { icon: '🎹', tint: 'tint-pink' },
  'Calm Waves': { icon: '🌊', tint: 'tint-blue' },
};

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/games/${gameId}`)
      .then(res => { setGame(res.data); setLoading(false); })
      .catch(() => navigate('/patient/games'));
  }, [gameId, navigate]);

  if (loading) {
    return (
      <div className="container page-pad">
        <div className="loading-wrap">
          <div className="spinner" />
          {t('Loading game…')}
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container page-pad">
        <div className="empty-state">
          <div className="empty-icon">🤔</div>
          <h3>{t('Game not found')}</h3>
          <p>{t('This game may have been removed.')}</p>
        </div>
      </div>
    );
  }

  const Comp = componentsByName[game.name];
  const meta = gameMeta[game.name] || { icon: '🧩', tint: 'tint-purple' };

  if (!Comp) {
    return (
      <div className="container page-pad">
        <div className="empty-state">
          <div className="empty-icon">🚧</div>
          <h3>{t('Coming soon')}</h3>
          <p>“{game.name}” {t('is being polished and will be playable soon.')}</p>
          <button className="secondary" style={{ marginTop: 16 }} onClick={() => navigate('/patient/games')}>{t('← Back to games')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-pad gameplay-page">
      <div className="gameplay-header fade-up">
        <button className="ghost small" onClick={() => navigate('/patient/games')}>{t('← Exit game')}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={`stat-icon ${meta.tint} gameplay-icon`} style={{ width: 52, height: 52, fontSize: '1.6rem' }}>{meta.icon}</div>
          <div>
            <h1 className="page-title gameplay-title" style={{ fontSize: '1.6rem' }}>{game.name}</h1>
            {game.cognitive_area && <span className="badge badge-purple">🧠 {game.cognitive_area}</span>}
          </div>
        </div>
      </div>
      <div className="card fade-up-1 gameplay-surface" style={{ padding: 22 }}>
        <Comp gameId={game.id} />
      </div>
    </div>
  );
}
