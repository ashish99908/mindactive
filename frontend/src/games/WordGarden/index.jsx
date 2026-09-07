import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const WordGarden = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [letter, setLetter] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const wordList = ['apple','banana','cat','dog','elephant','fish','grape','hat','ice','jacket','kite','lion','mango','nest','orange','parrot','queen','rabbit','sun','tree','umbrella','violin','water','xylophone','yoga','zebra','ant','bear','crow','deer'];
  const generateChallenge = (lvl) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randLetter = letters[Math.floor(Math.random()*26)];
    setLetter(randLetter);
    const possible = wordList.filter(w => w.startsWith(randLetter.toLowerCase()));
    if (possible.length === 0) { // fallback
      const fallback = wordList[Math.floor(Math.random()*wordList.length)];
      setTargetWord(fallback);
      return fallback;
    }
    const word = possible[Math.floor(Math.random()*possible.length)];
    setTargetWord(word);
    return word;
  };

  useEffect(() => {
    generateChallenge(level);
    shownAtRef.current = Date.now();
  }, [level]);

  const handleAnswer = (ans) => {
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    setAttempts(prev=>prev+1);
    const isCorrect = (ans === 'yes' && targetWord.startsWith(letter.toLowerCase())) ||
                      (ans === 'no' && !targetWord.startsWith(letter.toLowerCase()));
    if (isCorrect) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('✅ Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback(`❌ Wrong. The word is "${targetWord}".`); }
    setTimeout(() => {
      if (level < 10) setLevel(prev=>prev+1);
      else setGameOver(true);
    }, 1500);
  };

  // Auto-save when the game ends; exiting mid-game records partial progress too.
  const savedRef = React.useRef(false);
  const startRef = React.useRef(Date.now());
  const reactionsRef = React.useRef([]);        // per-question reaction times (ms)
  const shownAtRef = React.useRef(Date.now());  // when the current challenge was shown
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
    <div className="card" style={{maxWidth:'500px', margin:'0 auto', textAlign:'center'}}>
      <div style={{background:'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', padding:'16px', borderRadius:'12px', marginBottom:'16px'}}>
        <span style={{fontSize:'2.5rem'}}>🌻</span>
        <h3>Word Garden – Level {level}</h3>
      </div>

      <div style={{fontSize:'3rem', margin:'16px 0'}}>🔤</div>
      <p style={{fontSize:'1.5rem'}}>Letter: <strong style={{fontSize:'2rem', background:'#ffd700', padding:'4px 16px', borderRadius:'8px'}}>{letter}</strong></p>

      <div style={{background:'#f0f7f0', padding:'16px', borderRadius:'12px', margin:'16px 0'}}>
        <p style={{fontSize:'1.3rem'}}>Does the word <strong>"{targetWord}"</strong> start with <strong>{letter}</strong>?</p>
      </div>

      <div style={{display:'flex', gap:'16px', justifyContent:'center'}}>
        <button onClick={()=>handleAnswer('yes')} style={{padding:'16px 32px', fontSize:'1.2rem', background:'#48bb78', color:'white'}}>✅ Yes</button>
        <button onClick={()=>handleAnswer('no')} style={{padding:'16px 32px', fontSize:'1.2rem', background:'#fc8181', color:'white'}}>❌ No</button>
      </div>

      {feedback && <p style={{fontSize:'1.2rem', marginTop:'16px'}}>{feedback}</p>}
      <div style={{display:'flex', justifyContent:'space-between', marginTop:'16px'}}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text={`Does ${targetWord} start with ${letter}?`} />
    </div>
  );
};

export default WordGarden;