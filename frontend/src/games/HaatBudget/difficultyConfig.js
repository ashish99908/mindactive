export const getDifficulty = (level) => {
  const configs = {
    1: { itemCount: 2, maxPrice: 30 }, 2: { itemCount: 2, maxPrice: 50 },
    3: { itemCount: 2, maxPrice: 90 }, 4: { itemCount: 3, maxPrice: 60 },
    5: { itemCount: 3, maxPrice: 100 }, 6: { itemCount: 3, maxPrice: 150 },
    7: { itemCount: 3, maxPrice: 200 }, 8: { itemCount: 4, maxPrice: 150 },
    9: { itemCount: 4, maxPrice: 250 }, 10: { itemCount: 4, maxPrice: 500 }
  };
  return configs[level] || configs[1];
};
