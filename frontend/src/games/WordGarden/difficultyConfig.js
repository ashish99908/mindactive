export const getDifficulty = (level) => {
  const configs = {
    1: { wordCount: 3 }, 2: { wordCount: 3 }, 3: { wordCount: 4 }, 4: { wordCount: 4 },
    5: { wordCount: 5 }, 6: { wordCount: 5 }, 7: { wordCount: 6 }, 8: { wordCount: 6 },
    9: { wordCount: 7 }, 10: { wordCount: 8 }
  };
  return configs[level] || configs[1];
};