export const getDifficulty = (level) => {
  const configs = {
    1: { seqLen: 2 }, 2: { seqLen: 2 }, 3: { seqLen: 3 }, 4: { seqLen: 3 },
    5: { seqLen: 4 }, 6: { seqLen: 4 }, 7: { seqLen: 5 }, 8: { seqLen: 5 },
    9: { seqLen: 6 }, 10: { seqLen: 6 }
  };
  return configs[level] || configs[1];
};
