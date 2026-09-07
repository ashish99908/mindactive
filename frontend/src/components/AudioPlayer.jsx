import React, { useState, useRef } from 'react';

const AudioPlayer = ({ text, lang = 'en' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  const speak = () => {
    if (!window.speechSynthesis) { alert('Text-to-speech not supported.'); return; }
    if (utteranceRef.current) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => { if (window.speechSynthesis) { window.speechSynthesis.pause(); setIsPaused(true); } };
  const resume = () => { if (window.speechSynthesis) { window.speechSynthesis.resume(); setIsPaused(false); } };
  const stop = () => { if (window.speechSynthesis) { window.speechSynthesis.cancel(); setIsPlaying(false); setIsPaused(false); } };

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '10px 0' }}>
      <button className={isPlaying && !isPaused ? 'secondary' : ''} onClick={speak} disabled={isPlaying && !isPaused} style={{ padding: '10px 20px', fontSize: '.98rem' }}>
        ▶ Play
      </button>
      <button className="secondary" onClick={pause} disabled={!isPlaying || isPaused} style={{ padding: '10px 20px', fontSize: '.98rem' }}>
        ⏸ Pause
      </button>
      <button className="secondary" onClick={resume} disabled={!isPaused} style={{ padding: '10px 20px', fontSize: '.98rem' }}>
        ⏵ Resume
      </button>
      <button className="danger" onClick={stop} style={{ padding: '10px 20px', fontSize: '.98rem' }}>
        ⏹ Stop
      </button>
    </div>
  );
};

export default AudioPlayer;
