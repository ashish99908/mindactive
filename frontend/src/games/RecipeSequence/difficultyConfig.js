export const getDifficulty = (level) => {
  const configs = {
    1: { stepCount: 2 }, 2: { stepCount: 2 }, 3: { stepCount: 3 }, 4: { stepCount: 3 },
    5: { stepCount: 3 }, 6: { stepCount: 4 }, 7: { stepCount: 4 }, 8: { stepCount: 4 },
    9: { stepCount: 5 }, 10: { stepCount: 5 }
  };
  return configs[level] || configs[1];
};

// Each recipe is an ordered list of steps. Levels cycle through recipes,
// taking the first `stepCount` steps so difficulty grows smoothly.
export const RECIPES = [
  { name: 'Tea', steps: [
    { emoji: '♨️', text: 'Boil the water' }, { emoji: '🍃', text: 'Add tea leaves' },
    { emoji: '🥛', text: 'Add milk and sugar' }, { emoji: '🥄', text: 'Stir well' },
    { emoji: '☕', text: 'Strain and serve' }] },
  { name: 'Salad', steps: [
    { emoji: '🧺', text: 'Wash the vegetables' }, { emoji: '🔪', text: 'Chop them small' },
    { emoji: '🥕', text: 'Mix in a big bowl' }, { emoji: '🍋', text: 'Squeeze lemon on top' },
    { emoji: '🥗', text: 'Toss and serve' }] },
  { name: 'Rice', steps: [
    { emoji: '🍚', text: 'Take rice in a pot' }, { emoji: '💧', text: 'Wash with water' },
    { emoji: '🍲', text: 'Cook in the cooker' }, { emoji: '⏲️', text: 'Wait for the whistles' },
    { emoji: '🥄', text: 'Fluff and serve' }] },
  { name: 'Dal', steps: [
    { emoji: '🫘', text: 'Boil the dal' }, { emoji: '🟡', text: 'Add turmeric and salt' },
    { emoji: '🧄', text: 'Temper with garlic' }, { emoji: '🥘', text: 'Mix it all together' },
    { emoji: '🍛', text: 'Serve hot' }] },
  { name: 'Noodles', steps: [
    { emoji: '♨️', text: 'Boil water' }, { emoji: '🍜', text: 'Add the noodles' },
    { emoji: '🧂', text: 'Add the masala' }, { emoji: '⏲️', text: 'Cook for two minutes' },
    { emoji: '🍽️', text: 'Serve warm' }] },
];
