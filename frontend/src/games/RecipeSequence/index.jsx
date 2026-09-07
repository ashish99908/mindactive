import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty, RECIPES } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const RecipeSequence = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [recipe, setRecipe] = useState(null);
  const [steps, setSteps] = useState([]);          // ordered steps for this level
  const [phase, setPhase] = useState('study');     // study | recall
  const [inputIdx, setInputIdx] = useState(0);
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
    const { stepCount } = getDifficulty(level);
    const r = RECIPES[(level - 1) % RECIPES.length];
    const seq = r.steps.slice(0, stepCount);
    setRecipe(r);
    setSteps(seq);
    setInputIdx(0);
    setPhase('study');
    setFeedback('');
    const timer = setTimeout(() => {
      studyAtRef.current = Date.now();
      setPhase('recall');
    }, 2500 + stepCount * 700);
    return () => clearTimeout(timer);
  }, [level]);

  const handleTap = (idx) => {
    if (phase !== 'recall' || tapState) return;
    reactionsRef.current.push(Date.now() - studyAtRef.current);
    const isOk = idx === inputIdx;
    setAttempts(prev => prev + 1);
    if (isOk) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setTapState('ok');
      setFeedback('✅ Right step!');
    } else {
      setWrong(prev => prev + 1);
      setTapState('bad');
      setFeedback('❌ Not that one — start the recipe again.');
    }
    setTimeout(() => {
      setTapState(null);
      if (!isOk) { setInputIdx(0); return; }
      const next = inputIdx + 1;
      if (next >= steps.length) {
        setFeedback('🎉 Recipe finished perfectly!');
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Master chef!</h3>
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

  const shuffled = phase === 'recall'
    ? steps.map((s, i) => ({ ...s, i })).sort(() => Math.random() - 0.5)
    : null;

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🍲</span>
        <h3>Recipe Sequence – Level {level}</h3>
        <p>{recipe?.name}: {phase === 'study' ? 'read the steps in order…' : 'tap the steps in the same order!'}</p>
      </div>

      {phase === 'study' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0', alignItems: 'stretch' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '12px', padding: '10px 14px' }}>
              <span style={{ fontSize: '1.8rem' }}>{s.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{i + 1}. {s.text}</span>
            </div>
          ))}
          <p style={{ color: '#4a5568' }}>⏳ Memorizing the steps…</p>
        </div>
      ) : (
        <>
          <p style={{ margin: '6px 0' }}>Step {inputIdx + 1} of {steps.length} · {feedback || 'Which step comes next?'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, margin: '12px 0' }}>
            {shuffled.map(s => {
              const isPicked = tapState === 'ok' || tapState === 'bad';
              return (
                <button key={s.i} onClick={() => handleTap(s.i)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', fontWeight: 700,
                  padding: '12px', borderRadius: '12px', border: '2px solid #cbd5e0', background: '#edf2f7', cursor: 'pointer'
                }}>
                  <span style={{ fontSize: '1.7rem' }}>{s.emoji}</span>
                  <span style={{ textAlign: 'left' }}>{s.text}</span>
                </button>
              );
            })}
          </div>
          <button className="secondary small" onClick={() => { setInputIdx(0); setFeedback('↺ Recipe restarted — tap from step 1.'); }}>↺ Start over</button>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text={phase === 'study' ? `Remember the steps of the ${recipe?.name} recipe in order.` : 'Tap the recipe steps in the same order.'} />
    </div>
  );
};

export default RecipeSequence;
