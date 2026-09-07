export const getDifficulty = (level) => {
  const configs = {
    1: { itemCount: 2 }, 2: { itemCount: 3 }, 3: { itemCount: 3 }, 4: { itemCount: 4 },
    5: { itemCount: 4 }, 6: { itemCount: 5 }, 7: { itemCount: 5 }, 8: { itemCount: 6 },
    9: { itemCount: 6 }, 10: { itemCount: 7 }
  };
  return configs[level] || configs[1];
};