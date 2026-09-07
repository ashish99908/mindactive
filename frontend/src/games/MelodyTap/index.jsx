import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { saveGameResult } from '../../services/gameResultService.js';
import { getDifficulty, KEYS } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const NOTE_MS = 520;  // how long each note sounds
const GAP_MS = 160;   // silence between notes

const MelodyTap = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [melody, setMelody] = useState([]);        // array of key names
  const [phase, setPhase] = useState('study');     // study | recall
  const [activeKey, setActiveKey] = useState(null);// key lit during playback/tap
  const [inputIdx, setInputIdx] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const audioCtxRef = useRef(null);
  const timersRef = useRef([]);
  const studyAtRef = useRef(Date.now());
  const startRef = useRef(Date.now());
  const reactionsRef = useRef([]);
  const savedRef = useRef(false);

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const playTone = (freq, ms) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000 + 0.05);
    } catch { /* audio unavailable — lights still show the melody */ }
  };

  const playMelody = (seq) => {
    clearTimers();
    setPhase('study');
    setActiveKey(null);
    seq.forEach((k, i) => {
      const note = KEYS.find(x => x.key === k);
      timersRef.current.push(setTimeout(() => {
        setActiveKey(k);
        playTone(note.freq, NOTE_MS);
      }, i * (NOTE_MS + GAP_MS)));
      timersRef.current.push(setTimeout(() => setActiveKey(null), i * (NOTE_MS + GAP_MS) + NOTE_MS));
    });
    timersRef.current.push(setTimeout(() => {
      setPhase('recall');
      studyAtRef.current = Date.now();
    }, seq.length * (NOTE_MS + GAP_MS) + 400));
  };

  useEffect(() => {
    const len = getDifficulty(level).seqLen;
    const seq = Array.from({ length: len }, () => KEYS[Math.floor(Math.random() * KEYS.length)].key);
    setMelody(seq);
    setInputIdx(0);
    setFeedback('');
    // Small delay so the AudioContext gets a gesture chance on early levels.
    const t = setTimeout(() => playMelody(seq), 600);
    timersRef.current.push(t);
    return () => clearTimers();
  }, [level]);

  useEffect(() => () => clearTimers(), []);

  const handleTap = (keyName) => {
    if (phase !== 'recall') return;
    const note = KEYS.find(x => x.key === keyName);
    setActiveKey(keyName);
    playTone(note.freq, 300);
    setTimeout(() => setActiveKey(null), 280);

    const isOk = melody[inputIdx] === keyName;
    setAttempts(prev => prev + 1);
    reactionsRef.current.push(Date.now() - studyAtRef.current);
    if (isOk) {
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback('🎵 Lovely!');
      const next = inputIdx + 1;
      if (next >= melody.length) {
        setFeedback('🎶 Perfect melody!');
        setTimeout(() => {
          if (level < 10) setLevel(prev => prev + 1);
          else setGameOver(true);
        }, 1100);
      } else {
        setInputIdx(next);
      }
    } else {
      setWrong(prev => prev + 1);
      setFeedback('❌ Different note — listen once more.');
      setTimeout(() => { setInputIdx(0); playMelody(melody); }, 900);
    }
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
        <h3 style={{ fontSize: '1.6rem', margin: '4px 0' }}>Beautiful music!</h3>
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
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', color: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '2.5rem' }}>🎹</span>
        <h3>Melody Tap – Level {level}</h3>
        <p>{phase === 'study' ? 'Listen and watch the keys…' : 'Now tap the melody back!'}</p>
      </div>

      <p style={{ margin: '4px 0', minHeight: 26 }}>
        {phase === 'recall' ? `Note ${inputIdx + 1} of ${melody.length} · ${feedback || 'Which key comes next?'}` : (feedback || '♪ ♫ ♪')}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, maxWidth: 320, margin: '12px auto' }}>
        {KEYS.map(k => (
          <button key={k.key} onClick={() => handleTap(k.key)} disabled={phase === 'study'} style={{
            fontSize: '1.5rem', fontWeight: 800, padding: '22px 0', borderRadius: '14px',
            background: activeKey === k.key ? k.active : k.color,
            color: activeKey === k.key ? '#fff' : '#1e293b',
            border: '2px solid #cbd5e0', cursor: phase === 'study' ? 'wait' : 'pointer',
            transform: activeKey === k.key ? 'scale(1.05)' : 'none', transition: 'all .12s'
          }}>
            🎹 {k.label}
          </button>
        ))}
      </div>

      {phase === 'recall' && (
        <button className="secondary small" onClick={() => playMelody(melody)}>🔊 Hear the melody again</button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
        <p>⭐ Score: {score}</p>
        <p>✅ {correct}  ❌ {wrong}</p>
      </div>
      <AudioPlayer text={phase === 'study' ? 'Listen to the melody and watch the keys.' : 'Tap the same melody on the colored keys.'} />
    </div>
  );
};

export default MelodyTap;
