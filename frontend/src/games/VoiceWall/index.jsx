import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import { LANGUAGES, BANKS, lines } from './wordBanks.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const VoiceWall = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState(null);     // {word, emoji}
  const [options, setOptions] = useState([]);     // shuffled WORDS
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
  const [lang, setLang] = useState('en');

  const langInfo = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const shownAtRef = useRef(Date.now());
  const startRef = useRef(Date.now());
  const reactionsRef = useRef([]);
  const savedRef = useRef(false);

  useEffect(() => {
    const n = getDifficulty(level).optionCount;
    const bank = BANKS[lang] || BANKS.en;
    const pool = [...bank].sort(() => Math.random() - 0.5).slice(0, n);
    setTarget(pool[0]);
    setOptions(pool.sort(() => Math.random() - 0.5));
    setLocked(false);
    setPicked(null);
    setFeedback('');
    shownAtRef.current = Date.now();
  }, [level, lang]);

  const handlePick = (opt) => {
    if (locked) return;
    reactionsRef.current.push(Date.now() - shownAtRef.current);
    setAttempts(prev => prev + 1);
    setPicked(opt.word);
    setLocked(true);
    if (opt.word === target.word) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback(lines[lang].yes(target.word));
    } else {
      setWrong(prev => prev + 1);
      setFeedback(lines[lang].no(target.word));
    }
    setTimeout(() => {
      if (level < 10) setLevel(prev => prev + 1);
      else setGameOver(true);
    }, 1600);
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Words matched beautifully!</h3>
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
      <div style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🗣️</span>
        <h3>Voice Wall – Level {level}</h3>
        <p>Find the picture for the word on the wall.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        {LANGUAGES.map(l => (
          <button key={l.code} className={`role-pill${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)} style={{ fontSize: '.98rem' }}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#f0fdfa', border: '3px dashed #14b8a6', borderRadius: '14px', padding: '14px', margin: '10px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>{target?.word}</div>
      </div>
      <AudioPlayer text={target ? lines[lang].ask(target.word) : ''} lang={langInfo.tts} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 12, margin: '14px 0' }}>
        {options.map(opt => (
          <button key={opt.word} onClick={() => handlePick(opt)} style={{
            fontSize: '2.6rem', padding: '14px', borderRadius: '12px',
            border: `2px solid ${picked === opt.word ? (opt.word === target.word ? '#22c55e' : '#ef4444') : '#cbd5e0'}`,
            background: picked === opt.word ? (opt.word === target.word ? '#bbf7d0' : '#fecaca') : '#edf2f7',
            cursor: locked ? 'default' : 'pointer'
          }}>{opt.emoji}</button>
        ))}
      </div>

      {feedback && <p style={{ fontSize: '1.15rem' }}>{feedback}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
    </div>
  );
};

export default VoiceWall;
