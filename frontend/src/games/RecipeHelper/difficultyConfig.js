export const getDifficulty = (level) => {
  const configs = {
    1: { stepCount: 3 }, 2: { stepCount: 3 }, 3: { stepCount: 4 }, 4: { stepCount: 4 },
    5: { stepCount: 5 }, 6: { stepCount: 5 }, 7: { stepCount: 6 }, 8: { stepCount: 6 },
    9: { stepCount: 7 }, 10: { stepCount: 7 }
  };
  return configs[level] || configs[1];
};