import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty, SCENES } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const LandmarkJigsaw = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [scene, setScene] = useState(null);        // scene name
  const [tiles, setTiles] = useState([]);          // full tile list
  const [missingIdx, setMissingIdx] = useState(-1);
  const [phase, setPhase] = useState('study');     // study | pick
  const [options, setOptions] = useState([]);      // answer tile + distractors
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
    const { sceneSize, optionCount } = getDifficulty(level);
    const sc = SCENES[(level - 1) % SCENES.length];
    const chosen = sc.tiles.slice(0, sceneSize);
    const missing = Math.floor(Math.random() * chosen.length);

    // Distractors come from tiles NOT in the scene.
    const others = sc.tiles.filter(t => !chosen.includes(t));
    const distractors = [...others].sort(() => Math.random() - 0.5)
      .slice(0, Math.min(optionCount - 1, others.length));
    // Pad with tiles from other scenes if needed.
    let pool = SCENES.flatMap(s => s.tiles).filter(t => !chosen.includes(t) && !distractors.includes(t));
    while (distractors.length < optionCount - 1 && pool.length) {
      const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (!distractors.includes(pick)) distractors.push(pick);
    }

    setScene(sc.name);
    setTiles(chosen);
    setMissingIdx(missing);
    setOptions([chosen[missing], ...distractors].sort(() => Math.random() - 0.5));
    setPhase('study');
    setLocked(false);
    setPicked(null);
    setFeedback('');
    const timer = setTimeout(() => {
      shownAtRef.current = Date.now();
      setPhase('pick');
    }, 2000 + sceneSize * 500);
    return () => clearTimeout(timer);
  }, [level]);

  const answer = tiles[missingIdx];

  const handlePick = (tile) => {
    if (phase !== 'pick' || locked) return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    setAttempts(prev => prev + 1);
    setPicked(tile);
    setLocked(true);
    if (tile === answer) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback('✅ Perfect fit!');
    } else {
      setWrong(prev => prev + 1);
      setFeedback(`❌ The missing piece was ${answer}`);
    }
    setTimeout(() => {
      if (level < 10) setLevel(prev => prev + 1);
      else setGameOver(true);
    }, 1700);
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Every picture complete!</h3>
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

  const cols = tiles.length <= 4 ? 2 : tiles.length <= 6 ? 3 : 3;

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #6d5ef2 0%, #9f5ef2 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🧩</span>
        <h3>Landmark Jigsaw – Level {level}</h3>
        <p>{phase === 'study' ? `Remember the ${scene?.toLowerCase()} picture…` : 'Which piece is missing?'}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, maxWidth: 320, margin: '14px auto' }}>
        {tiles.map((t, i) => (
          <div key={i} style={{
            fontSize: '2.6rem', background: phase === 'pick' && i === missingIdx ? '#fff' : '#eef2ff',
            border: '2px solid #c7d2fe', borderRadius: '12px', padding: '14px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 76,
            outline: phase === 'pick' && i === missingIdx ? '3px dashed #6d5ef2' : 'none'
          }}>
            {phase === 'pick' && i === missingIdx ? '❓' : t}
          </div>
        ))}
      </div>

      {phase === 'pick' && (
        <>
          <p style={{ margin: '4px 0' }}>{feedback || 'Pick the missing piece:'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {options.map((t, i) => (
              <button key={i} onClick={() => handlePick(t)} style={{
                fontSize: '2.4rem', padding: '12px 18px', borderRadius: '12px',
                border: `2px solid ${picked === t ? (t === answer ? '#22c55e' : '#ef4444') : '#cbd5e0'}`,
                background: picked === t ? (t === answer ? '#bbf7d0' : '#fecaca') : '#edf2f7',
                cursor: locked ? 'default' : 'pointer'
              }}>{t}</button>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text={phase === 'study' ? `Study this ${scene?.toLowerCase()} picture carefully.` : 'Which piece is missing from the picture?'} />
    </div>
  );
};

export default LandmarkJigsaw;
