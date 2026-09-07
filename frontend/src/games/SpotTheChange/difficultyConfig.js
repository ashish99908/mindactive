export const getDifficulty = (level) => {
  const configs = {
    1: { objectCount: 3 }, 2: { objectCount: 4 }, 3: { objectCount: 4 }, 4: { objectCount: 5 },
    5: { objectCount: 6 }, 6: { objectCount: 6 }, 7: { objectCount: 7 }, 8: { objectCount: 8 },
    9: { objectCount: 9 }, 10: { objectCount: 10 }
  };
  return configs[level] || configs[1];
};