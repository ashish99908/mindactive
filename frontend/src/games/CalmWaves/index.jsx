import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty, TOTAL_WAVES } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const CalmWaves = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);           // one breathing cycle per level
  const [phase, setPhase] = useState('rest');      // rest | in | hold | out | done
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);       // waves completed
  const [wrong, setWrong] = useState(0);           // always 0 — there are no mistakes here
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const startRef = useRef(Date.now());
  const savedRef = useRef(false);

  useEffect(() => {
    if (gameOver) return;
    const { inMs, holdMs, outMs } = getDifficulty(level);
    setPhase('rest');
    const t1 = setTimeout(() => setPhase('in'), 150);
    const t2 = setTimeout(() => setPhase('hold'), 150 + inMs);
    const t3 = setTimeout(() => setPhase('out'), 150 + inMs + holdMs);
    const t4 = setTimeout(() => setPhase('done'), 150 + inMs + holdMs + outMs);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [level, gameOver]);

  const completeWave = () => {
    setCorrect(prev => prev + 1);
    setAttempts(prev => prev + 1);
    setScore(prev => prev + 10);
    if (level < TOTAL_WAVES) setLevel(prev => prev + 1);
    else setGameOver(true);
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
      reactionTime: 0,
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
    return (
      <div className="card" style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ fontSize: '3rem' }}>🌊</div>
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>You feel calmer now</h3>
        <p style={{ fontSize: '2.4rem', fontWeight: 800, margin: '8px 0' }}>🌊 {correct} waves</p>
        <p style={{ color: 'var(--c-muted)', marginBottom: 8 }}>Well done. Take your calm with you into the day.</p>
        <p style={{ fontWeight: 600, marginBottom: 18 }}>
          {saveStatus == null ? '💾 Saving results…' :
           saveStatus === 'saved' ? '✅ Results saved — check your dashboard!' :
           saveStatus === 'queued' ? '📴 Saved offline — will sync automatically when back online.' :
           `⚠️ Save failed${saveError ? ` — ${saveError}` : ''}`}
        </p>
        <button onClick={() => window.location.reload()}>🌊 Breathe again</button>
      </div>
    );
  }

  const { inMs, holdMs, outMs } = getDifficulty(level);
  const scale = phase === 'in' || phase === 'hold' ? 1 : 0.55;
  const transition =
    phase === 'in' ? `transform ${inMs}ms ease-in-out` :
    phase === 'out' ? `transform ${outMs}ms ease-in-out` : 'none';

  const instruction =
    phase === 'in' ? 'Breathe in… slowly' :
    phase === 'hold' ? 'Hold… gently' :
    phase === 'out' ? 'Breathe out… let go' :
    phase === 'done' ? 'Wave complete!' : 'Get ready…';

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🌊</span>
        <h3>Calm Waves – Wave {level} of {TOTAL_WAVES}</h3>
        <p>Follow the wave with your breath. There are no wrong moves here.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '18px 0' }}>
        <div style={{
          width: 170, height: 170, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #7dd3fc 0%, #0ea5e9 70%)',
          transform: `scale(${scale})`, transition,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(14,165,233,0.35)',
          marginBottom: 18
        }}>
          <span style={{ fontSize: '3rem' }}>{phase === 'done' ? '🌊' : '🫧'}</span>
        </div>
        <p style={{ fontSize: '1.3rem', fontWeight: 700, minHeight: 32 }}>{instruction}</p>

        {phase === 'done' && (
          <button onClick={completeWave} style={{ marginTop: 8 }}>✓ I followed the wave</button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '6px 0 10px' }}>
        {Array.from({ length: TOTAL_WAVES }, (_, i) => (
          <span key={i} style={{ fontSize: '1.4rem', opacity: i < correct ? 1 : 0.25 }}>{i < correct ? '🌊' : '○'}</span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <p>⭐ Score: {score}</p>
        <p>🌊 {correct}</p>
      </div>
      <AudioPlayer text={phase === 'done' ? 'Beautiful. One more calm wave when you are ready.' : 'Breathe in slowly with the wave, hold gently, and breathe out.'} />
    </div>
  );
};

export default CalmWaves;
