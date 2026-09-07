import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty, RECALL_ITEMS } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const SritiSmritiRecall = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [listItems, setListItems] = useState([]);  // studied list
  const [target, setTarget] = useState(null);      // item asked about
  const [options, setOptions] = useState([]);      // target + distractors
  const [phase, setPhase] = useState('study');     // study | pick
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
    const { listSize, optionCount } = getDifficulty(level);
    const pool = [...RECALL_ITEMS].sort(() => Math.random() - 0.5);
    const list = pool.slice(0, listSize);
    const rest = pool.slice(listSize);
    const distractors = rest.sort(() => Math.random() - 0.5).slice(0, optionCount - 1);
    const asked = list[Math.floor(Math.random() * list.length)];

    setListItems(list);
    setTarget(asked);
    setOptions([asked, ...distractors].sort(() => Math.random() - 0.5));
    setPhase('study');
    setLocked(false);
    setPicked(null);
    setFeedback('');
    const timer = setTimeout(() => {
      shownAtRef.current = Date.now();
      setPhase('pick');
    }, 1500 + listSize * 900);
    return () => clearTimeout(timer);
  }, [level]);

  const handlePick = (opt) => {
    if (phase !== 'pick' || locked) return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    setAttempts(prev => prev + 1);
    setPicked(opt.word);
    setLocked(true);
    const inList = listItems.some(it => it.word === opt.word);
    const askedIsTarget = opt.word === target.word;
    if (askedIsTarget) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback(`✅ Yes — ${opt.word} was on your list!`);
    } else if (inList) {
      // Picked an item that was on the list but not the one asked about.
      setWrong(prev => prev + 1);
      setFeedback(`❌ ${opt.word} was on the list, but I asked about ${target.word}.`);
    } else {
      setWrong(prev => prev + 1);
      setFeedback(`❌ ${opt.word} was not on the list. ${target.word} was!`);
    }
    setTimeout(() => {
      if (level < 10) setLevel(prev => prev + 1);
      else setGameOver(true);
    }, 1800);
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Wonderful remembering!</h3>
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
      <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🧠</span>
        <h3>Sriti-Smriti Recall – Level {level}</h3>
        <p>{phase === 'study' ? 'Remember everything on the list…' : 'Which one was on your list?'}</p>
      </div>

      {phase === 'study' ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '18px 0', flexWrap: 'wrap' }}>
          {listItems.map((it, i) => (
            <div key={i} style={{ background: '#f5f3ff', border: '2px solid #ddd6fe', borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ fontSize: '2.2rem' }}>{it.emoji}</div>
              <div style={{ fontWeight: 700 }}>{it.word}</div>
            </div>
          ))}
          <p style={{ color: '#4a5568', width: '100%' }}>⏳ Memorizing…</p>
        </div>
      ) : (
        <>
          <p style={{ margin: '4px 0' }}>{feedback || 'Tap the item you saw on the list:'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', margin: '10px 0' }}>
            {options.map(opt => (
              <button key={opt.word} onClick={() => handlePick(opt)} style={{
                padding: '12px 16px', borderRadius: '12px', cursor: locked ? 'default' : 'pointer',
                border: `2px solid ${picked === opt.word ? (opt.word === target.word ? '#22c55e' : '#ef4444') : '#cbd5e0'}`,
                background: picked === opt.word ? (opt.word === target.word ? '#bbf7d0' : '#fecaca') : '#edf2f7'
              }}>
                <span style={{ fontSize: '2rem' }}>{opt.emoji}</span>
                <div style={{ fontWeight: 700 }}>{opt.word}</div>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text={phase === 'study' ? 'Remember every item on this list.' : 'Which of these was on your list?'} />
    </div>
  );
};

export default SritiSmritiRecall;
