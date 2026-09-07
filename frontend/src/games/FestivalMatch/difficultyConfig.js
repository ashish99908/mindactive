export const getDifficulty = (level) => {
  const configs = {
    1: { optionCount: 2 }, 2: { optionCount: 3 }, 3: { optionCount: 3 },
    4: { optionCount: 3 }, 5: { optionCount: 4 }, 6: { optionCount: 4 },
    7: { optionCount: 4 }, 8: { optionCount: 5 }, 9: { optionCount: 5 },
    10: { optionCount: 6 }
  };
  return configs[level] || configs[1];
};
