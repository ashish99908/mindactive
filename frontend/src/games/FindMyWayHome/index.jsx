import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const FindMyWayHome = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState([]);
  const [route, setRoute] = useState([]);
  const [userPath, setUserPath] = useState([]);
  const [phase, setPhase] = useState('study');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const generate = (lvl) => {
    const config = getDifficulty(lvl);
    const size = config.gridSize;
    const steps = config.routeLength;
    const grid = Array.from({length: size}, (_,r) => Array.from({length: size}, (_,c) => ({r,c,label:''})));
    let path = [{r:0,c:0}];
    let cur = {r:0,c:0};
    for (let i=0; i<steps; i++) {
      const moves = [];
      if (cur.r < size-1) moves.push({r:cur.r+1, c:cur.c});
      if (cur.c < size-1) moves.push({r:cur.r, c:cur.c+1});
      if (cur.r > 0) moves.push({r:cur.r-1, c:cur.c});
      if (cur.c > 0) moves.push({r:cur.r, c:cur.c-1});
      if (moves.length===0) break;
      const next = moves[Math.floor(Math.random()*moves.length)];
      path.push(next);
      cur = next;
    }
    path.forEach((p,idx) => {
      if (idx===0) grid[p.r][p.c].label = '🏁';
      else if (idx===path.length-1) grid[p.r][p.c].label = '🏠';
      else grid[p.r][p.c].label = `${idx}`;
    });
    return { grid, route: path };
  };

  useEffect(() => {
    const { grid, route } = generate(level);
    setGrid(grid);
    setRoute(route);
    setUserPath([]);
    setPhase('study');
    setFeedback('');
    const timer = setTimeout(() => { shownAtRef.current = Date.now(); setPhase('recall'); }, 3000 - level*150);
    return () => clearTimeout(timer);
  }, [level]);

  const handleCellClick = (r,c) => {
    if (phase !== 'recall') return;
    const nextStep = userPath.length;
    if (nextStep >= route.length) return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    shownAtRef.current = Date.now();
    const expected = route[nextStep];
    if (expected.r === r && expected.c === c) {
      setUserPath(prev => [...prev, {r,c}]);
      setCorrect(prev=>prev+1);
      setScore(prev=>prev+5);
      if (nextStep+1 === route.length) {
        setFeedback('🏠 You reached home!');
        setTimeout(() => {
          if (level < 10) setLevel(prev=>prev+1);
          else setGameOver(true);
        }, 1500);
      }
    } else {
      setWrong(prev=>prev+1);
      setFeedback('❌ Wrong step!');
      setAttempts(prev=>prev+1);
    }
  };

  // Auto-save when the game ends; exiting mid-game records partial progress too.
  const savedRef = React.useRef(false);
  const startRef = React.useRef(Date.now());
  const reactionsRef = React.useRef([]);        // per-click reaction times (ms)
  const shownAtRef = React.useRef(Date.now());  // when the current recall step was shown
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

  const cellSize = 60;

  return (
    <div className="card" style={{maxWidth:'600px', margin:'0 auto', textAlign:'center'}}>
      <div style={{background:'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', padding:'16px', borderRadius:'12px', marginBottom:'16px'}}>
        <span style={{fontSize:'2.5rem'}}>🗺️</span>
        <h3>Find My Way Home – Level {level}</h3>
      </div>

      {phase === 'study' && (
        <div>
          <p>Study the route from 🏁 Start to 🏠 Home.</p>
          <div style={{display:'grid', gridTemplateColumns: `repeat(${grid.length}, ${cellSize}px)`, gap:'6px', justifyContent:'center', margin:'16px auto'}}>
            {grid.map((row,r) => row.map((cell,c) => {
              const isRoute = cell.label !== '';
              return (
                <div key={`${r}-${c}`} style={{
                  width: cellSize,
                  height: cellSize,
                  background: isRoute ? '#fbbf24' : '#e8f0e8',
                  border: '1px solid #c0d0c0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>
                  {cell.label}
                </div>
              );
            }))}
          </div>
          <AudioPlayer text="Remember the route." />
        </div>
      )}

      {phase === 'recall' && (
        <div>
          <p>Click the cells in order to reach Home.</p>
          <div style={{display:'grid', gridTemplateColumns: `repeat(${grid.length}, ${cellSize}px)`, gap:'6px', justifyContent:'center', margin:'16px auto'}}>
            {grid.map((row,r) => row.map((cell,c) => {
              const visited = userPath.some(p => p.r===r && p.c===c);
              const isCorrect = visited && (userPath[userPath.length-1]?.r === r && userPath[userPath.length-1]?.c === c);
              return (
                <button key={`${r}-${c}`} onClick={()=>handleCellClick(r,c)} style={{
                  width: cellSize,
                  height: cellSize,
                  background: visited ? '#6bcf7f' : '#edf2f7',
                  border: '1px solid #c0d0c0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  cursor: visited ? 'default' : 'pointer'
                }} disabled={visited}>
                  {cell.label}
                </button>
              );
            }))}
          </div>
          {feedback && <p style={{fontSize:'1.2rem'}}>{feedback}</p>}
        </div>
      )}

      <div style={{display:'flex', justifyContent:'space-between', marginTop:'16px'}}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
    </div>
  );
};

export default FindMyWayHome;