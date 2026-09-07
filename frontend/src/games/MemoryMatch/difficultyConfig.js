// pairCount = number of matching pairs on the board this level.
export const getDifficulty = (level) => {
  const configs = {
    1: { pairCount: 2 }, 2: { pairCount: 3 }, 3: { pairCount: 3 },
    4: { pairCount: 4 }, 5: { pairCount: 4 }, 6: { pairCount: 5 },
    7: { pairCount: 5 }, 8: { pairCount: 6 }, 9: { pairCount: 6 },
    10: { pairCount: 8 }
  };
  return configs[level] || configs[1];
};

export const CARD_EMOJIS = ['🍎', '🌻', '🦋', '🐟', '🌸', '🦜', '🍵', '🪴', '🥭', '🔔'];
