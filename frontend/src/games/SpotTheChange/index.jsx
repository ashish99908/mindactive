import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const SpotTheChange = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [objects, setObjects] = useState([]);
  const [original, setOriginal] = useState([]);
  const [phase, setPhase] = useState('study');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const emojis = ['🍎','🍌','🍇','🍊','🍓','🍉','🍒','🍑','🥝','🍍','🥭','🍋','🍈','🍏','🍐','🥑','🌽','🥕','🥦','🧅','🍄','🥜','🍫','🧁'];
  const generateScene = (lvl) => {
    const count = getDifficulty(lvl).objectCount;
    const arr = [];
    for (let i=0; i<count; i++) arr.push(emojis[Math.floor(Math.random()*emojis.length)]);
    return arr;
  };
  const applyChange = (orig) => {
    const changed = [...orig];
    const idx = Math.floor(Math.random() * changed.length);
    const type = Math.floor(Math.random()*4);
    if (type===0) { changed.splice(idx,1); }
    else if (type===1) { let newEm; do { newEm = emojis[Math.floor(Math.random()*emojis.length)]; } while (newEm === changed[idx] || (changed.includes(newEm) && changed.length>1)); changed[idx] = newEm; }
    else if (type===2 && changed.length>1) { const idx2 = (idx+1)%changed.length; [changed[idx], changed[idx2]] = [changed[idx2], changed[idx]]; }
    else { let newEm; do { newEm = emojis[Math.floor(Math.random()*emojis.length)]; } while (changed.includes(newEm)); changed.push(newEm); }
    return changed;
  };

  useEffect(() => {
    const orig = generateScene(level);
    setOriginal(orig);
    setObjects(orig);
    setPhase('study');
    setFeedback('');
    const timer = setTimeout(() => {
      const changed = applyChange(orig);
      setObjects(changed);
      shownAtRef.current = Date.now();
      setPhase('changed');
    }, 3000 - level*100);
    return () => clearTimeout(timer);
  }, [level]);

  const handleSelect = (idx) => {
    if (phase !== 'changed') return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    const isChanged = original[idx] !== objects[idx] || original.length !== objects.length;
    if (isChanged) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('✅ Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback('❌ Wrong!'); }
    setAttempts(prev=>prev+1);
    setTimeout(() => {
      if (level < 10) setLevel(prev=>prev+1);
      else setGameOver(true);
    }, 1500);
  };

  // Auto-save when the game ends; exiting mid-game records partial progress too.
  const savedRef = React.useRef(false);
  const startRef = React.useRef(Date.now());
  const reactionsRef = React.useRef([]);        // per-scene reaction times (ms)
  const shownAtRef = React.useRef(Date.now());  // when the changed scene appeared
  const liveRef = React.useRef({});
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

  React.useEffect(() => {
    if (gameOver && !savedRef.current) { savedRef.current = true; persist({ level, score, correct, wrong, attempts }); }
    return () => {
      const live = liveRef.current;
      if (!savedRef.current && !live.gameOver && (live.correct + live.wrong) > 0) persist(live);
    };
  }, [gameOver]);

  if (gameOver) {
    const accuracy = Math.round(correct / (correct + wrong) * 100) || 0;
    return (
      <div className="card" style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Game Over!</h3>
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

  if (phase === 'study') return (
    <div className="card" style={{maxWidth:'500px', margin:'0 auto', textAlign:'center'}}>
      <div style={{background:'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', padding:'16px', borderRadius:'12px', marginBottom:'16px'}}>
        <span style={{fontSize:'2.5rem'}}>🔍</span>
        <h3>Spot the Change – Level {level}</h3>
        <p>Study these objects carefully...</p>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:'12px', justifyContent:'center', margin:'16px 0'}}>
        {original.map((obj,i) => <span key={i} style={{fontSize:'3rem', background:'#edf2f7', padding:'16px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.04)'}}>{obj}</span>)}
      </div>
      <p style={{color:'#4a5568'}}>⏳ Memorizing...</p>
      <AudioPlayer text="Study these objects carefully" />
    </div>
  );

  return (
    <div className="card" style={{maxWidth:'500px', margin:'0 auto', textAlign:'center'}}>
      <div style={{background:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding:'16px', borderRadius:'12px', marginBottom:'16px'}}>
        <span style={{fontSize:'2.5rem'}}>🔍</span>
        <h3>Spot the Change – Level {level}</h3>
        <p>What changed? Tap the different object.</p>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:'12px', justifyContent:'center', margin:'16px 0'}}>
        {objects.map((obj,i) => (
          <button key={i} onClick={()=>handleSelect(i)} style={{
            fontSize:'3rem',
            padding:'16px',
            background:'#edf2f7',
            border:'2px solid #cbd5e0',
            borderRadius:'12px',
            cursor:'pointer',
            transition:'all 0.2s',
            boxShadow:'0 4px 6px rgba(0,0,0,0.04)'
          }}>
            {obj}
          </button>
        ))}
      </div>
      {feedback && <p style={{fontSize:'1.2rem'}}>{feedback}</p>}
      <div style={{display:'flex', justifyContent:'space-between', marginTop:'16px'}}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text="Which object changed?" />
    </div>
  );
};

export default SpotTheChange;