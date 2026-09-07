import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const BazaarBuddy = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const generateQuestion = (lvl) => {
    const config = getDifficulty(lvl);
    const items = [];
    const itemNames = ['Apple','Rice','Banana','Milk','Bread','Eggs','Sugar','Oil'];
    const prices = [10,20,30,40,50,60,70,80];
    const numItems = config.itemCount;
    let total = 0;
    for (let i=0; i<numItems; i++) {
      const name = itemNames[Math.floor(Math.random()*itemNames.length)];
      const price = prices[Math.floor(Math.random()*prices.length)] + Math.floor(Math.random()*10);
      const qty = Math.floor(Math.random()*3)+1;
      const itemTotal = Math.round(price * qty);
      items.push({ name, price: Math.round(price), qty, itemTotal });
      total += itemTotal;
    }
    const types = ['total','change','afford'];
    const type = types[Math.floor(Math.random()*types.length)];
    let questionText, correctAnswer;
    if (type === 'total') {
      questionText = `What is the total cost?`;
      correctAnswer = total;
    } else if (type === 'change') {
      const given = total + Math.floor(Math.random()*50) + 10;
      questionText = `If you pay ₹${given}, how much change?`;
      correctAnswer = given - total;
    } else {
      const budget = total + Math.floor(Math.random()*30) - 10;
      questionText = `Can you afford this with ₹${budget}? (yes/no)`;
      correctAnswer = budget >= total ? 'yes' : 'no';
    }
    return { items, questionText, correctAnswer, type };
  };

  useEffect(() => {
    setQuestion(generateQuestion(level));
    shownAtRef.current = Date.now();
  }, [level]);

  const handleSubmit = () => {
    if (!question) return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    setAttempts(prev => prev + 1);
    const userAnswer = question.type === 'afford' ? answer.toLowerCase() : parseFloat(answer);
    const isCorrect = userAnswer === question.correctAnswer;
    if (isCorrect) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('✅ Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback(`❌ Incorrect. Correct: ${question.correctAnswer}`); }
    setTimeout(() => {
      if (level < 10) { setLevel(prev=>prev+1); setAnswer(''); setFeedback(''); }
      else setGameOver(true);
    }, 2000);
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

  if (!question) return <div>Loading...</div>;

  const itemEmojis = { Apple: '🍎', Rice: '🍚', Banana: '🍌', Milk: '🥛', Bread: '🍞', Eggs: '🥚', Sugar: '🍬', Oil: '🫒' };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', padding: '16px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }}>🛒</span>
        <h3 style={{ margin: '4px 0' }}>Bazaar Buddy – Level {level}</h3>
      </div>

      <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>📋 Shopping List</p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {question.items.map((item, idx) => (
            <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{itemEmojis[item.name] || '🛍️'} {item.qty}× {item.name}</span>
              <span>₹{item.itemTotal}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ margin: '16px 0' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>❓ {question.questionText}</p>
        {question.type !== 'afford' ? (
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter amount"
            style={{ fontSize: '1.2rem', padding: '14px', width: '100%', borderRadius: '8px', border: '1px solid #cbd5e0' }}
          />
        ) : (
          <select
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ fontSize: '1.2rem', padding: '14px', width: '100%', borderRadius: '8px', border: '1px solid #cbd5e0' }}
          >
            <option value="">Select...</option>
            <option value="yes">✅ Yes</option>
            <option value="no">❌ No</option>
          </select>
        )}
        <button onClick={handleSubmit} style={{ marginTop: '12px', width: '100%', padding: '14px' }}>Submit Answer</button>
      </div>

      {feedback && <p style={{ fontSize: '1.2rem', textAlign: 'center' }}>{feedback}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct} correct  ❌ {wrong} wrong</p>
      </div>

      <AudioPlayer text="Listen to the shopping task." />
    </div>
  );
};

export default BazaarBuddy;