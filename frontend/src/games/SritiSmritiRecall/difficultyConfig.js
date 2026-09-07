export const getDifficulty = (level) => {
  const configs = {
    1: { listSize: 2, optionCount: 3 }, 2: { listSize: 2, optionCount: 4 },
    3: { listSize: 3, optionCount: 3 }, 4: { listSize: 3, optionCount: 4 },
    5: { listSize: 3, optionCount: 4 }, 6: { listSize: 4, optionCount: 4 },
    7: { listSize: 4, optionCount: 5 }, 8: { listSize: 5, optionCount: 4 },
    9: { listSize: 5, optionCount: 5 }, 10: { listSize: 6, optionCount: 6 }
  };
  return configs[level] || configs[1];
};

export const RECALL_ITEMS = [
  { word: 'Rose', emoji: '🌹' }, { word: 'Cup', emoji: '🍵' }, { word: 'Moon', emoji: '🌙' },
  { word: 'Keys', emoji: '🔑' }, { word: 'Goat', emoji: '🐐' }, { word: 'Lamp', emoji: '🪔' },
  { word: 'Fish', emoji: '🐟' }, { word: 'Book', emoji: '📕' }, { word: 'Mango', emoji: '🥭' },
  { word: 'Umbrella', emoji: '☂️' }, { word: 'Clock', emoji: '🕰️' }, { word: 'Fan', emoji: '🌀' },
  { word: 'Slippers', emoji: '🩴' }, { word: 'Banana', emoji: '🍌' }, { word: 'Glasses', emoji: '👓' },
  { word: 'Bucket', emoji: '🪣' }, { word: 'Pillow', emoji: '🛏️' }, { word: 'Crow', emoji: '🐦' },
  { word: 'Bicycle', emoji: '🚲' }, { word: 'Basket', emoji: '🧺' },
];
