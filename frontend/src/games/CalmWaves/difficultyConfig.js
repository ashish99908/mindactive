// Each "level" is one guided breathing cycle. Later cycles breathe a little slower.
export const getDifficulty = (level) => {
  const configs = {
    1: { inMs: 4000, holdMs: 2000, outMs: 6000 },
    2: { inMs: 4000, holdMs: 3000, outMs: 6000 },
    3: { inMs: 5000, holdMs: 3000, outMs: 6000 },
    4: { inMs: 5000, holdMs: 3000, outMs: 7000 },
    5: { inMs: 5000, holdMs: 4000, outMs: 7000 },
  };
  return configs[level] || configs[5];
};

export const TOTAL_WAVES = 5;
