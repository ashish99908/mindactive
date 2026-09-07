import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty, CARD_EMOJIS } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const buildDeck = (pairCount) => {
  const chosen = [...CARD_EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const deck = [...chosen, ...chosen]
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
  return deck;
};

const MemoryMatch = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [deck, setDeck] = useState([]);
  const [first, setFirst] = useState(null);        // index of first flipped card
  const [busy, setBusy] = useState(false);         // true while mismatch is showing
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);       // pairs matched
  const [wrong, setWrong] = useState(0);           // mismatched flips
  const [attempts, setAttempts] = useState(0);     // total flip-pairs
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const flipAtRef = useRef(Date.now());
  const startRef = useRef(Date.now());
  const reactionsRef = useRef([]);
  const savedRef = useRef(false);

  useEffect(() => {
    setDeck(buildDeck(getDifficulty(level).pairCount));
    setFirst(null);
    setBusy(false);
    setFeedback('');
    flipAtRef.current = Date.now();
  }, [level]);

  const handleFlip = (idx) => {
    if (busy || gameOver) return;
    const card = deck[idx];
    if (card.flipped || card.matched) return;

    const next = deck.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    setDeck(next);

    if (first == null) {
      setFirst(idx);
      return;
    }

    // Second card of the pair.
    setAttempts(prev => prev + 1);
    reactionsRef.current.push(Date.now() - flipAtRef.current);
    const a = next[first];
    const b = next[idx];

    if (a.emoji === b.emoji) {
      reactionsRef.current.pop(); // only time the resolving flip
      const matched = next.map((c, i) => (i === first || i === idx ? { ...c, matched: true } : c));
      setDeck(matched);
      setFirst(null);
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 20);
      setFeedback('✅ A pair!');
      const allDone = matched.every(c => c.matched);
      if (allDone) {
        setFeedback('🎉 Board cleared!');
        setTimeout(() => {
          if (level < 10) setLevel(prev => prev + 1);
          else setGameOver(true);
        }, 1100);
      }
      flipAtRef.current = Date.now();
    } else {
      setWrong(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 2));
      setFeedback('❌ Not a pair — remember them!');
      setBusy(true);
      setFirst(null);
      setTimeout(() => {
        setDeck(prev => prev.map(c => (c.matched ? c : { ...c, flipped: false })));
        setBusy(false);
        flipAtRef.current = Date.now();
      }, 900);
    }
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>What a memory!</h3>
        <p style={{ fontSize: '2.4rem', fontWeight: 800, margin: '8px 0' }}>🏆 {score}</p>
        <p style={{ color: 'var(--c-muted)', marginBottom: 8 }}>✅ {correct} pairs · ❌ {wrong} misses · 🎯 {accuracy}%</p>
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

  const pairCount = getDifficulty(level).pairCount;
  const cols = pairCount <= 3 ? 3 : pairCount <= 4 ? 4 : pairCount <= 6 ? 4 : 4;

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🃏</span>
        <h3>Memory Match – Level {level}</h3>
        <p>Flip two cards. Find all {pairCount} pairs!</p>
      </div>

      <p style={{ margin: '4px 0', minHeight: 24 }}>{feedback}</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, maxWidth: 400, margin: '10px auto' }}>
        {deck.map((c, i) => (
          <button key={c.id} onClick={() => handleFlip(i)} style={{
            fontSize: '2.2rem', padding: '16px 0', borderRadius: '12px', cursor: 'pointer',
            border: `2px solid ${c.matched ? '#22c55e' : '#cbd5e0'}`,
            background: c.matched ? '#bbf7d0' : c.flipped ? '#e0e7ff' : 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
            color: c.flipped || c.matched ? '#111' : 'transparent',
            boxShadow: '0 4px 6px rgba(0,0,0,0.06)'
          }}>
            {c.flipped || c.matched ? c.emoji : '🂠'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text="Tap two cards to flip them. Find every matching pair." />
    </div>
  );
};

export default MemoryMatch;
