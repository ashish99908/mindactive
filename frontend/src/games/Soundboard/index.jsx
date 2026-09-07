import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty } from './difficultyConfig.js';
import { LANGUAGES, BANKS, lines } from './wordBanks.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const Soundboard = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [phase, setPhase] = useState('listen');   // listen | pick
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

  // Browser voices load asynchronously; track them to know whether we can
  // actually speak the chosen language on this device.
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    if (!window.speechSynthesis) return undefined;
    const load = () => setVoices(window.speechSynthesis.getVoices() || []);
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  const voiceOk = voices.some(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(langInfo.tts.slice(0, 2)));

  const heardAtRef = useRef(Date.now());
  const startRef = useRef(Date.now());
  const reactionsRef = useRef([]);
  const savedRef = useRef(false);

  useEffect(() => {
    const n = getDifficulty(level).optionCount;
    const bank = BANKS[lang] || BANKS.en;
    const pool = [...bank].sort(() => Math.random() - 0.5).slice(0, n);
    setTarget(pool[0]);
    setOptions(pool.sort(() => Math.random() - 0.5));
    setPhase('listen');
    setLocked(false);
    setPicked(null);
    setFeedback('');
  }, [level, lang]);

  const startPick = () => {
    heardAtRef.current = Date.now();
    setPhase('pick');
  };

  const handlePick = (opt) => {
    if (phase !== 'pick' || locked) return;
    reactionsRef.current.push(Date.now() - heardAtRef.current);
    setAttempts(prev => prev + 1);
    setPicked(opt.word);
    setLocked(true);
    if (opt.word === target.word) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback(lines[lang].yes(target.word));
    } else {
      setWrong(prev => prev + 1);
      setFeedback(lines[lang].no(opt.word, target.word));
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
      hintsUsed: 0, audioUsed: true
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Sharp listening!</h3>
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
      <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🔊</span>
        <h3>Soundboard – Level {level}</h3>
        <p>{phase === 'listen' ? 'Tap play, listen carefully, and remember what you hear.' : 'What did you just hear?'}</p>
      </div>

      {phase === 'listen' ? (
        <div style={{ margin: '22px 0' }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            {LANGUAGES.map(l => (
              <button key={l.code} className={`role-pill${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)} style={{ fontSize: '.98rem' }}>
                {l.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '4rem', marginBottom: 10 }}>👂</div>
          <p style={{ fontSize: '1.15rem', marginBottom: 6 }}>{lines[lang].listen}</p>
          {voiceOk ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AudioPlayer text={target?.word || ''} lang={langInfo.tts} />
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '.98rem', color: 'var(--c-muted)', marginBottom: 8 }}>{lines[lang].noVoice}</p>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, background: '#e0f2fe', border: '3px dashed #0ea5e9', borderRadius: '14px', padding: '14px', display: 'inline-block' }}>
                {target?.word}
              </div>
            </div>
          )}
          <div>
            <button style={{ marginTop: 12 }} onClick={startPick}>✅ I heard it — let&apos;s pick!</button>
          </div>
        </div>
      ) : (
        <>
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
          {feedback && <p style={{ fontSize: '1.1rem' }}>{feedback}</p>}
          <button className="secondary small" onClick={() => setPhase('listen')}>🔊 Hear it again</button>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <AudioPlayer text={phase === 'listen' ? lines[lang].listen : lines[lang].pick} lang={langInfo.tts} />
      </div>
    </div>
  );
};

export default Soundboard;
