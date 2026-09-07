export const getDifficulty = (level) => {
  const configs = {
    1: { sceneSize: 4, optionCount: 2 }, 2: { sceneSize: 4, optionCount: 3 },
    3: { sceneSize: 6, optionCount: 3 }, 4: { sceneSize: 6, optionCount: 3 },
    5: { sceneSize: 6, optionCount: 4 }, 6: { sceneSize: 9, optionCount: 3 },
    7: { sceneSize: 9, optionCount: 4 }, 8: { sceneSize: 9, optionCount: 4 },
    9: { sceneSize: 9, optionCount: 5 }, 10: { sceneSize: 9, optionCount: 6 }
  };
  return configs[level] || configs[1];
};

// Small emoji "pictures" used to build landmark scenes.
export const SCENES = [
  { name: 'Taj Mahal', tiles: ['🕌', '🕊️', '⛲', '🌳', '🌸', '☁️', '🌿', '🦚', '☀️'] },
  { name: 'Beach', tiles: ['🏖️', '🌊', '🐚', '☀️', '⛱️', '🦀', '⛵', '🌴', '🩴'] },
  { name: 'Village market', tiles: ['🧺', '🍎', '🥕', '💰', '🛍️', '🌶️', '🍚', '🥔', '🍌'] },
  { name: 'River bank', tiles: ['🛶', '🌊', '🐟', '🌾', '🦆', '🌿', '🪨', '☀️', '🐸'] },
  { name: 'Garden', tiles: ['🌻', '🦋', '🐝', '🌷', '🌳', '🪴', '🐞', '🌈', '💧'] },
  { name: 'Tea garden', tiles: ['🍃', '⛰️', '🧺', '🌫️', '🌿', '☕', '🌱', '🌦️', '🍵'] },
];
