import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const RecipeHelper = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [steps, setSteps] = useState([]);
  const [shuffled, setShuffled] = useState([]);
  const [userOrder, setUserOrder] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const recipes = [
    { name:'Vegetable Soup', steps:['Wash vegetables','Chop vegetables','Boil water','Add vegetables','Simmer for 15 minutes','Add salt and pepper','Serve hot'] },
    { name:'Omelette', steps:['Crack eggs into bowl','Whisk eggs','Heat pan with oil','Pour eggs into pan','Cook until set','Fold and serve'] },
    { name:'Pasta', steps:['Boil water','Add pasta','Cook for 10 minutes','Drain pasta','Add sauce','Mix and serve'] }
  ];

  const stepIcons = {
    'Wash vegetables': '🚿',
    'Chop vegetables': '🔪',
    'Boil water': '💧🔥',
    'Add vegetables': '🥕',
    'Simmer for 15 minutes': '⏲️',
    'Add salt and pepper': '🧂',
    'Serve hot': '🍲',
    'Crack eggs into bowl': '🥚',
    'Whisk eggs': '🥄',
    'Heat pan with oil': '🔥',
    'Pour eggs into pan': '🍳',
    'Cook until set': '⏳',
    'Fold and serve': '🥞',
    'Add pasta': '🍝',
    'Cook for 10 minutes': '⏰',
    'Drain pasta': '💧',
    'Add sauce': '🥫',
    'Mix and serve': '🍝'
  };

  const generate = (lvl) => {
    const config = getDifficulty(lvl);
    const recipe = recipes[Math.floor(Math.random()*recipes.length)];
    const num = Math.min(config.stepCount, recipe.steps.length);
    const selected = recipe.steps.slice(0,num);
    setSteps(selected);
    setShuffled([...selected].sort(()=>Math.random()-0.5));
    setUserOrder([]);
    setFeedback('');
  };

  useEffect(() => { generate(level); shownAtRef.current = Date.now(); }, [level]);

  const handleStepClick = (step, idx) => {
    if (userOrder.includes(idx)) return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    shownAtRef.current = Date.now();
    const nextExpected = userOrder.length;
    const expected = steps[nextExpected];
    if (step === expected) {
      setUserOrder(prev => [...prev, idx]);
      setCorrect(prev=>prev+1);
      setScore(prev=>prev+10);
      if (userOrder.length+1 === steps.length) {
        setFeedback('✅ Perfect order!');
        setTimeout(() => {
          if (level < 10) setLevel(prev=>prev+1);
          else setGameOver(true);
        }, 1500);
      }
    } else {
      setWrong(prev=>prev+1);
      setFeedback(`❌ Wrong. The correct next step is "${expected}"`);
      setAttempts(prev=>prev+1);
    }
  };

  // Auto-save when the game ends; exiting mid-game records partial progress too.
  const savedRef = React.useRef(false);
  const startRef = React.useRef(Date.now());
  const reactionsRef = React.useRef([]);        // per-step reaction times (ms)
  const shownAtRef = React.useRef(Date.now());  // when the current step choice was shown
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

  return (
    <div className="card" style={{maxWidth:'600px', margin:'0 auto'}}>
      <div style={{background:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', padding:'16px', borderRadius:'12px', marginBottom:'16px', textAlign:'center'}}>
        <span style={{fontSize:'2.5rem'}}>🍳</span>
        <h3>Recipe Helper – Level {level}</h3>
        <p>Arrange the steps in correct order.</p>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
        {shuffled.map((step, idx) => {
          const isUsed = userOrder.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleStepClick(step, idx)}
              disabled={isUsed}
              style={{
                padding: '14px 18px',
                background: isUsed ? '#c6f6d5' : '#edf2f7',
                border: '2px solid #cbd5e0',
                borderRadius: '12px',
                textAlign: 'left',
                fontSize: '1.1rem',
                cursor: isUsed ? 'default' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: isUsed ? 'none' : '0 4px 6px rgba(0,0,0,0.04)'
              }}
            >
              <span style={{marginRight:'12px'}}>{stepIcons[step] || '🍽️'}</span>
              {step}
              {isUsed && <span style={{float:'right'}}>✅</span>}
            </button>
          );
        })}
      </div>

      <div style={{marginTop:'16px'}}>
        <p><strong>Your order:</strong> {userOrder.map(i => shuffled[i]).join(' → ') || '(none yet)'}</p>
      </div>

      {feedback && <p style={{fontSize:'1.2rem', textAlign:'center', marginTop:'12px'}}>{feedback}</p>}

      <div style={{display:'flex', justifyContent:'space-between', marginTop:'16px'}}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>

      <AudioPlayer text="Arrange the steps in order." />
    </div>
  );
};

export default RecipeHelper;