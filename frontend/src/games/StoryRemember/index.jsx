import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const StoryRemember = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [story, setStory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [phase, setPhase] = useState('story');

  const templates = [
    { text: 'Rina went to the market on Monday morning. She bought apples and oranges. She spent ₹200.', questions: [{q:'Where did Rina go?', options:['Market','School','Park','Home'], answer:0},{q:'What day did she go?', options:['Tuesday','Wednesday','Monday','Friday'], answer:2},{q:'How much did she spend?', options:['100','200','300','400'], answer:1}] },
    { text: 'Raju lives in a village near the river. He has a dog named Moti. Every morning, Raju takes Moti for a walk along the river.', questions: [{q:'Where does Raju live?', options:['City','Village','Town','Mountain'], answer:1},{q:'What is the dog\'s name?', options:['Tiger','Moti','Bruno','Max'], answer:1},{q:'When does Raju walk the dog?', options:['Evening','Afternoon','Morning','Night'], answer:2}] }
  ];

  const generate = (lvl) => {
    const config = getDifficulty(lvl);
    const template = templates[Math.floor(Math.random()*templates.length)];
    setStory(template.text);
    const num = Math.min(config.questionCount, template.questions.length);
    setQuestions(template.questions.slice(0,num));
    setCurrentQ(0);
    setFeedback('');
    setPhase('story');
  };

  useEffect(() => { generate(level); }, [level]);

  const handleAnswer = (optionIdx) => {
    const q = questions[currentQ];
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    const isCorrect = optionIdx === q.answer;
    if (isCorrect) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('✅ Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback(`❌ Wrong. Correct: ${q.options[q.answer]}`); }
    setAttempts(prev=>prev+1);
    setTimeout(() => {
      if (currentQ+1 < questions.length) { setCurrentQ(prev=>prev+1); setFeedback(''); shownAtRef.current = Date.now(); }
      else {
        setPhase('complete');
        if (level < 10) { setTimeout(() => setLevel(prev=>prev+1), 2000); }
        else setGameOver(true);
      }
    }, 1500);
  };

  // Auto-save when the game ends; exiting mid-game records partial progress too.
  const savedRef = React.useRef(false);
  const startRef = React.useRef(Date.now());
  const reactionsRef = React.useRef([]);        // per-question reaction times (ms)
  const shownAtRef = React.useRef(Date.now());  // when the current question was shown
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

  if (phase === 'story') {
    return (
      <div className="card" style={{maxWidth:'600px', margin:'0 auto'}}>
        <div style={{background:'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', padding:'16px', borderRadius:'12px', marginBottom:'16px', textAlign:'center'}}>
          <span style={{fontSize:'2.5rem'}}>📖</span>
          <h3>Story & Remember – Level {level}</h3>
          <p>Read or listen to the story.</p>
        </div>

        <div style={{
          background: '#fdf6e3',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #f0d8b0',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)',
          fontSize: '1.2rem',
          lineHeight: '1.8',
          margin: '16px 0'
        }}>
          📖 {story}
        </div>

        <AudioPlayer text={story} />
        <button onClick={()=>{ shownAtRef.current = Date.now(); setPhase('quiz'); }} style={{marginTop:'16px', width:'100%', padding:'16px', fontSize:'1.2rem'}}>I'm ready for questions →</button>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = questions[currentQ];
    if (!q) return <div>No questions</div>;
    return (
      <div className="card" style={{maxWidth:'600px', margin:'0 auto'}}>
        <div style={{background:'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', padding:'16px', borderRadius:'12px', marginBottom:'16px', textAlign:'center'}}>
          <span style={{fontSize:'2.5rem'}}>📝</span>
          <h3>Question {currentQ+1} of {questions.length}</h3>
        </div>

        <p style={{fontSize:'1.3rem', marginBottom:'16px'}}>{q.q}</p>

        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          {q.options.map((opt, idx) => (
            <button key={idx} onClick={()=>handleAnswer(idx)} style={{
              padding: '14px',
              fontSize: '1.1rem',
              background: '#edf2f7',
              border: '2px solid #cbd5e0',
              borderRadius: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              {idx+1}. {opt}
            </button>
          ))}
        </div>

        {feedback && <p style={{fontSize:'1.2rem', textAlign:'center', marginTop:'16px'}}>{feedback}</p>}
        <div style={{display:'flex', justifyContent:'space-between', marginTop:'16px'}}>
          <p>⭐ Score: {score}</p>
          <p>✅ {correct}  ❌ {wrong}</p>
        </div>
      </div>
    );
  }

  return <div className="card"><p>Story completed! Proceeding...</p></div>;
};

export default StoryRemember;