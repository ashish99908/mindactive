import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const ITEMS = [
  { emoji: '🍅', name: 'Tomato' }, { emoji: '🥔', name: 'Potato' }, { emoji: '🧅', name: 'Onion' },
  { emoji: '🥕', name: 'Carrot' }, { emoji: '🍎', name: 'Apple' }, { emoji: '🍌', name: 'Banana' },
  { emoji: '🥬', name: 'Greens' }, { emoji: '🥛', name: 'Milk' }, { emoji: '🐟', name: 'Fish' },
  { emoji: '🥚', name: 'Eggs' }, { emoji: '🌶️', name: 'Chilli' }, { emoji: '🍚', name: 'Rice' },
];

const HaatBudget = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [basket, setBasket] = useState([]);       // [{emoji,name,price}]
  const [options, setOptions] = useState([]);     // shuffled totals
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const shownAtRef = useRef(Date.now());
  const startRef = useRef(Date.now());
  const reactionsRef = useRef([]);
  const savedRef = useRef(false);

  useEffect(() => {
    const { itemCount, maxPrice } = getDifficulty(level);
    const pool = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, itemCount);
    const priced = pool.map(it => ({ ...it, price: 5 * (Math.floor(Math.random() * (maxPrice / 5 - 1)) + 1) }));
    const total = priced.reduce((s, it) => s + it.price, 0);

    const opts = new Set([total]);
    while (opts.size < 3) {
      const delta = [5, 10, 15, 20][Math.floor(Math.random() * 4)] * (Math.random() < 0.5 ? -1 : 1);
      const cand = total + delta;
      if (cand > 0) opts.add(cand);
    }
    setBasket(priced);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setLocked(false);
    setPicked(null);
    setFeedback('');
    shownAtRef.current = Date.now();
  }, [level]);

  const handlePick = (val) => {
    if (locked) return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    const total = basket.reduce((s, it) => s + it.price, 0);
    setAttempts(prev => prev + 1);
    setPicked(val);
    setLocked(true);
    if (val === total) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback('✅ Correct total!');
    } else {
      setWrong(prev => prev + 1);
      setFeedback(`❌ The total was ₹${total}.`);
    }
    setTimeout(() => {
      if (level < 10) setLevel(prev => prev + 1);
      else setGameOver(true);
    }, 1600);
  };

  const liveRef = useRef({});
  liveRef.current = { level, score, correct, wrong, attempts, gameOver };

  const persist = (live) => {
    saveGameResult({
      patientId: user.patientId, gameId,
      level: live.level, score: live.score,
      accuracy: live.correct / (live.correct + live.wrong) * 100 || 0,
      correctAnswers: live.correct, wrongAnswers: live.wrong, attempts: live.attempts,
      completionTime: (Date.now() - startRef.current) / 1000,
      reactionTime: reactionsRef.current.length
        ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length)
        : 0,
      hintsUsed: 0, audioUsed: false
    }).then((res) => { setSaveStatus(res.status); setSaveError(res.error || null); })
      .catch(() => { setSaveStatus('failed'); setSaveError('Network error'); });
  };

  useEffect(() => {
    if (gameOver && !savedRef.current) { savedRef.current = true; persist({ level, score, correct, wrong, attempts }); }
    return () => {
      const live = liveRef.current;
      if (!savedRef.current && !live.gameOver && live.attempts > 0) persist(live);
    };
  }, [gameOver]);

  if (gameOver) {
    const accuracy = Math.round(correct / (correct + wrong) * 100) || 0;
    return (
      <div className="card" style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Shopping well done!</h3>
        <p style={{ fontSize: '2.4rem', fontWeight: 800, margin: '8px 0' }}>🏆 {score}</p>
        <p style={{ color: 'var(--c-muted)', marginBottom: 8 }}>✅ {correct} correct · ❌ {wrong} wrong · 🎯 {accuracy}%</p>
        <p style={{ fontWeight: 600, marginBottom: 18 }}>
          {saveStatus == null ? '💾 Saving results…' :
           saveStatus === 'saved' ? '✅ Results saved — check your dashboard!' :
           saveStatus === 'queued' ? '📴 Saved offline — will sync automatically when back online.' :
           `⚠️ Save failed${saveError ? ` — ${saveError}` : ''}`}
        </p>
        <button onClick={() => window.location.reload()}>🔄 Play again</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🧺</span>
        <h3>Haat Budget – Level {level}</h3>
        <p>Add up your market basket. What does it all cost?</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '14px 0', flexWrap: 'wrap' }}>
        {basket.map((it, i) => (
          <div key={i} style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: '12px', border: '2px solid #fcd34d' }}>
            <div style={{ fontSize: '2.2rem' }}>{it.emoji}</div>
            <div style={{ fontWeight: 700 }}>{it.name}</div>
            <div>₹{it.price}</div>
          </div>
        ))}
      </div>

      <p style={{ fontWeight: 700, margin: '10px 0' }}>💰 Which is the correct total?</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        {options.map(v => (
          <button key={v} onClick={() => handlePick(v)} style={{
            fontSize: '1.4rem', fontWeight: 800, padding: '14px 26px', borderRadius: '12px',
            border: '2px solid #cbd5e0', background: picked === v ? (v === basket.reduce((s, i) => s + i.price, 0) ? '#bbf7d0' : '#fecaca') : '#edf2f7',
            cursor: locked ? 'default' : 'pointer'
          }}>₹{v}</button>
        ))}
      </div>

      {feedback && <p style={{ fontSize: '1.15rem', marginTop: 12 }}>{feedback}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text="Add the prices of all the items. Which is the correct total?" />
    </div>
  );
};

export default HaatBudget;
