export const getDifficulty = (level) => {
  const configs = {
    1: { seqLen: 2 }, 2: { seqLen: 2 }, 3: { seqLen: 3 }, 4: { seqLen: 3 },
    5: { seqLen: 4 }, 6: { seqLen: 4 }, 7: { seqLen: 5 }, 8: { seqLen: 5 },
    9: { seqLen: 6 }, 10: { seqLen: 6 }
  };
  return configs[level] || configs[1];
};

// Four big friendly keys: note name, frequency, emoji-ish label and color.
export const KEYS = [
  { key: 'do', label: 'Do', freq: 261.63, color: '#fecaca', active: '#ef4444' },
  { key: 're', label: 'Re', freq: 293.66, color: '#bfdbfe', active: '#3b82f6' },
  { key: 'mi', label: 'Mi', freq: 329.63, color: '#bbf7d0', active: '#22c55e' },
  { key: 'sol', label: 'Sol', freq: 392.0, color: '#fde68a', active: '#f59e0b' },
];
