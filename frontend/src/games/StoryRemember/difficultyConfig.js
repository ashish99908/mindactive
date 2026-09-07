export const getDifficulty = (level) => {
  const configs = {
    1: { questionCount: 2 }, 2: { questionCount: 2 }, 3: { questionCount: 3 }, 4: { questionCount: 3 },
    5: { questionCount: 4 }, 6: { questionCount: 4 }, 7: { questionCount: 5 }, 8: { questionCount: 5 },
    9: { questionCount: 6 }, 10: { questionCount: 6 }
  };
  return configs[level] || configs[1];
};