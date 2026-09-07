const db = require('../database/db');
const games = [
  { name: 'Bazaar Buddy', description: 'Shopping calculation and decision making', cognitive_area: 'Calculation, Attention, Executive Function' },
  { name: 'Spot the Change', description: 'Visual attention and memory', cognitive_area: 'Visual Attention, Memory' },
  { name: 'Word Garden', description: 'Language and verbal fluency', cognitive_area: 'Language, Verbal Fluency' },
  { name: 'Find My Way Home', description: 'Spatial memory and navigation', cognitive_area: 'Spatial Memory, Navigation' },
  { name: 'Recipe Helper', description: 'Sequencing and planning', cognitive_area: 'Sequencing, Executive Function' },
  { name: 'Story & Remember', description: 'Short-term memory and comprehension', cognitive_area: 'Memory, Comprehension' },
  { name: 'Route Planner', description: 'Memorize and repeat a route of directions', cognitive_area: 'Spatial Memory, Executive Function' },
  { name: 'Haat Budget', description: 'Add up market shopping totals and pick the right price', cognitive_area: 'Calculation, Attention' },
  { name: 'Voice Wall', description: 'Match spoken and written words to pictures', cognitive_area: 'Language, Comprehension' },
  { name: 'Festival Match', description: 'Match festivals with their symbols', cognitive_area: 'Memory, Language' },
  { name: 'Recipe Sequence', description: 'Remember and repeat the steps of a recipe', cognitive_area: 'Sequencing, Working Memory' },
  { name: 'Landmark Jigsaw', description: 'Find the missing piece of a beautiful scene', cognitive_area: 'Visual Memory, Attention' },
  { name: 'Soundboard', description: 'Listen carefully and find the word you heard', cognitive_area: 'Auditory Memory, Attention' },
  { name: 'Memory Match', description: 'Flip cards and find the matching pairs', cognitive_area: 'Working Memory, Visual Attention' },
  { name: 'Sriti-Smriti Recall', description: 'Study a small list of things and recall them', cognitive_area: 'Short-term Memory, Recall' },
  { name: 'Melody Tap', description: 'Listen to a short melody and tap it back', cognitive_area: 'Auditory Memory, Sequencing' },
  { name: 'Calm Waves', description: 'Follow a gentle guided breathing exercise to relax', cognitive_area: 'Relaxation, Mindfulness' }
];
games.forEach(g => db.run(`INSERT OR IGNORE INTO games (name, description, cognitive_area) VALUES (?,?,?)`, [g.name, g.description, g.cognitive_area]));
console.log('Seed completed.');