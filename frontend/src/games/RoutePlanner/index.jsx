import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const DIRS = [
  { key: 'left', icon: '⬅️', label: 'Left' },
  { key: 'up', icon: '⬆️', label: 'Straight' },
  { key: 'down', icon: '⬇️', label: 'Back' },
  { key: 'right', icon: '➡️', label: 'Right' },
];

const RoutePlanner = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [route, setRoute] = useState([]);          // array of dir keys
  const [phase, setPhase] = useState('study');     // study | recall
  const [inputIdx, setInputIdx] = useState(0);     // next tap position
  const [tapState, setTapState] = useState(null);  // 'ok' | 'bad' | null
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const studyAtRef = useRef(Date.now());
  const startRef = useRef(Date.now());
  const reactionsRef = useRef([]);
  const savedRef = useRef(false);

  useEffect(() => {
    const len = getDifficulty(level).seqLen;
    const seq = Array.from({ length: len }, () => DIRS[Math.floor(Math.random() * DIRS.length)].key);
    setRoute(seq);
    setInputIdx(0);
    setPhase('study');
    setFeedback('');
    const timer = setTimeout(() => {
      studyAtRef.current = Date.now();
      setPhase('recall');
    }, 2500 + len * 600);
    return () => clearTimeout(timer);
  }, [level]);

  const handleTap = (key) => {
    if (phase !== 'recall' || tapState) return;
    reactionsRef.current.push(Date.now() - studyAtRef.current);
    const isOk = route[inputIdx] === key;
    setAttempts(prev => prev + 1);
    if (isOk) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setTapState('ok');
      setFeedback('✅ Good!');
    } else {
      setWrong(prev => prev + 1);
      setTapState('bad');
      setFeedback('❌ Look again — try this step once more.');
    }
    setTimeout(() => {
      setTapState(null);
      if (!isOk) { setInputIdx(0); return; } // restart the same route after a mistake
      const next = inputIdx + 1;
      if (next >= route.length) {
        setFeedback('🎉 You followed the whole route!');
        setTimeout(() => {
          if (level < 10) setLevel(prev => prev + 1);
          else setGameOver(true);
        }, 1100);
      } else {
        setInputIdx(next);
      }
    }, 550);
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Great navigating!</h3>
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
      <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🧭</span>
        <h3>Route Planner – Level {level}</h3>
        <p>{phase === 'study' ? 'Memorize the route from home 🏠…' : 'Now tap the route in the same order!'}</p>
      </div>

      {phase === 'study' ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '18px 0', flexWrap: 'wrap' }}>
          {route.map((k, i) => {
            const d = DIRS.find(x => x.key === k);
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.6rem', background: '#eef2ff', padding: '12px 16px', borderRadius: '12px', border: '2px solid #c7d2fe' }}>{d.icon}</div>
                <small style={{ color: '#4a5568' }}>{i + 1}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <p style={{ margin: '6px 0' }}>Step {inputIdx + 1} of {route.length} · {feedback || 'Which way next?'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, margin: '12px 0' }}>
            {DIRS.map(d => (
              <button key={d.key} onClick={() => handleTap(d.key)} style={{ fontSize: '2.2rem', padding: '14px', borderRadius: '12px', border: '2px solid #cbd5e0', background: '#edf2f7', cursor: 'pointer' }}>
                {d.icon}
                <div style={{ fontSize: '.95rem', fontWeight: 600 }}>{d.label}</div>
              </button>
            ))}
          </div>
          <button className="secondary small" onClick={() => { setInputIdx(0); setFeedback('↺ Route restarted — tap from the beginning.'); }}>↺ Start over</button>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text={phase === 'study' ? 'Memorize the route. Remember each turn.' : 'Tap the directions in the same order as the route.'} />
    </div>
  );
};

export default RoutePlanner;
