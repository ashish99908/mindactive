const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

// Helper to write a file with UTF-8 without BOM
function writeFile(filePath, content) {
  const fullPath = path.join(projectRoot, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Write as UTF-8 without BOM
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${filePath}`);
}

// ----------------------------------------------------------
//  BACKEND
// ----------------------------------------------------------

writeFile('backend/package.json', `{
  "name": "cognitive-gaming-backend",
  "version": "1.0.0",
  "description": "Backend for AI-based cognitive gaming",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node utils/seed.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "sqlite3": "^5.1.6",
    "groq-sdk": "^0.3.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}`);

writeFile('backend/.env.example', `PORT=5000
JWT_SECRET=your_jwt_secret_change_this
GROQ_API_KEY=your_groq_api_key`);

writeFile('backend/server.js', `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database/db');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const gameRoutes = require('./routes/games');
const gameResultRoutes = require('./routes/gameResults');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/game-results', gameResultRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`);

writeFile('backend/database/db.js', `const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'cognitive_gaming.db');

function initDatabase() {
  const db = new sqlite3.Database(dbPath);
  const schema = \`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('patient', 'caretaker')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      age INTEGER,
      gender TEXT,
      preferred_language TEXT,
      emergency_contact TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS caretakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS patient_caretakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      caretaker_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (caretaker_id) REFERENCES caretakers(id) ON DELETE CASCADE,
      UNIQUE(patient_id, caretaker_id)
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      cognitive_area TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      score INTEGER,
      accuracy REAL,
      correct_answers INTEGER,
      wrong_answers INTEGER,
      attempts INTEGER,
      completion_time INTEGER,
      average_reaction_time REAL,
      hints_used INTEGER,
      audio_used BOOLEAN,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      analysis TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
  \`;
  db.exec(schema, (err) => {
    if (err) console.error('DB init error:', err.message);
    else console.log('Database tables verified.');
  });
  return db;
}

const db = initDatabase();
module.exports = db;`);

writeFile('backend/middleware/auth.js', `const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};`);

writeFile('backend/controllers/authController.js', `const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  const { name, email, password, role, age, gender, preferredLanguage, emergencyContact, notes, phone } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['patient','caretaker'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(\`INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)\`, [name,email,passwordHash,role], function(err) {
      if (err) { db.run('ROLLBACK'); return res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Email exists' : err.message }); }
      const userId = this.lastID;
      if (role === 'patient') {
        db.run(\`INSERT INTO patients (user_id, age, gender, preferred_language, emergency_contact, notes) VALUES (?,?,?,?,?,?)\`, [userId, age, gender, preferredLanguage, emergencyContact, notes], function(err2) {
          if (err2) { db.run('ROLLBACK'); return res.status(500).json({ error: err2.message }); }
          const patientId = this.lastID;
          db.run('COMMIT');
          const token = jwt.sign({ userId, role, patientId }, process.env.JWT_SECRET, { expiresIn: '7d' });
          res.status(201).json({ token, user: { id: userId, name, email, role, patientId } });
        });
      } else {
        db.run(\`INSERT INTO caretakers (user_id, phone) VALUES (?,?)\`, [userId, phone], function(err2) {
          if (err2) { db.run('ROLLBACK'); return res.status(500).json({ error: err2.message }); }
          db.run('COMMIT');
          const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
          res.status(201).json({ token, user: { id: userId, name, email, role } });
        });
      }
    });
  });
};

exports.login = (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Missing credentials' });
  db.get(\`SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND role = ?\`, [email, role], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    let patientId = null;
    if (role === 'patient') {
      db.get(\`SELECT id FROM patients WHERE user_id = ?\`, [user.id], (err2, p) => { if (p) patientId = p.id; });
    }
    const token = jwt.sign({ userId: user.id, role, patientId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role, patientId } });
  });
};`);

writeFile('backend/controllers/patientController.js', `const db = require('../database/db');

exports.getAllPatients = (req, res) => {
  const caretakerId = req.user.userId;
  db.get(\`SELECT id FROM caretakers WHERE user_id = ?\`, [caretakerId], (err, caretaker) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!caretaker) return res.status(404).json({ error: 'Caretaker not found' });
    db.all(\`
      SELECT p.id AS patient_id, u.id AS user_id, u.name, u.email, p.age, p.gender, 
      p.preferred_language, p.emergency_contact, p.notes, p.created_at,
      (SELECT AVG(accuracy) FROM game_results WHERE patient_id = p.id) AS avg_accuracy,
      (SELECT COUNT(*) FROM game_results WHERE patient_id = p.id) AS games_completed,
      (SELECT MAX(created_at) FROM game_results WHERE patient_id = p.id) AS last_activity
      FROM patient_caretakers pc
      JOIN patients p ON pc.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE pc.caretaker_id = ?
    \`, [caretaker.id], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(rows);
    });
  });
};

exports.getPatientById = (req, res) => {
  const patientId = req.params.id;
  db.get(\`SELECT u.id AS user_id, u.name, u.email, p.* FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?\`, [patientId], (err, patient) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  });
};

exports.updatePatient = (req, res) => {
  const patientId = req.params.id;
  const { age, gender, preferredLanguage, emergencyContact, notes } = req.body;
  db.run(\`UPDATE patients SET age=?, gender=?, preferred_language=?, emergency_contact=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?\`, [age, gender, preferredLanguage, emergencyContact, notes, patientId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Updated' });
  });
};`);

writeFile('backend/controllers/gameResultController.js', `const db = require('../database/db');

exports.saveResult = (req, res) => {
  const { patientId, gameId, level, score, accuracy, correctAnswers, wrongAnswers, attempts, completionTime, reactionTime, hintsUsed, audioUsed } = req.body;
  if (!patientId || !gameId || level === undefined) return res.status(400).json({ error: 'Missing fields' });
  db.run(\`
    INSERT INTO game_results 
    (patient_id, game_id, level, score, accuracy, correct_answers, wrong_answers, attempts, completion_time, average_reaction_time, hints_used, audio_used)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  \`, [patientId, gameId, level, score||0, accuracy||0, correctAnswers||0, wrongAnswers||0, attempts||0, completionTime||0, reactionTime||0, hintsUsed||0, audioUsed?1:0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
};

exports.getResults = (req, res) => {
  const patientId = req.params.patientId;
  db.all(\`SELECT gr.*, g.name as game_name FROM game_results gr JOIN games g ON gr.game_id = g.id WHERE gr.patient_id = ? ORDER BY gr.created_at DESC\`, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};`);

writeFile('backend/controllers/analyticsController.js', `const db = require('../database/db');

exports.getAnalytics = (req, res) => {
  const patientId = req.params.patientId;
  db.all(\`SELECT gr.*, g.name as game_name FROM game_results gr JOIN games g ON gr.game_id = g.id WHERE gr.patient_id = ? ORDER BY gr.created_at ASC\`, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};`);

writeFile('backend/controllers/aiController.js', `const db = require('../database/db');
const groqService = require('../services/groqService');

exports.analyzePatient = async (req, res) => {
  const patientId = req.params.patientId;
  db.get(\`SELECT u.name FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?\`, [patientId], async (err, patient) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    db.all(\`SELECT gr.*, g.name as game_name FROM game_results gr JOIN games g ON gr.game_id = g.id WHERE gr.patient_id = ? ORDER BY gr.created_at ASC\`, [patientId], async (err2, results) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (results.length === 0) return res.status(400).json({ error: 'No game results found' });
      const patientData = { patientName: patient.name, gameResults: results };
      try {
        const analysis = await groqService.analyzePerformance(patientData);
        db.run(\`INSERT INTO ai_analyses (patient_id, analysis) VALUES (?,?)\`, [patientId, JSON.stringify(analysis)]);
        res.json(analysis);
      } catch (error) {
        console.error('AI error:', error);
        res.status(500).json({ error: 'AI analysis failed' });
      }
    });
  });
};`);

writeFile('backend/services/groqService.js', `const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.analyzePerformance = async (patientData) => {
  const prompt = \`
You are a cognitive performance analyst. Analyze the following game performance data for a patient. Provide insights in JSON format with keys: overallPerformance, strengths (list), areasToMonitor (list), progress, recommendedLevel (number), suggestedGames (list), recentChanges.
Important: Do not diagnose any medical condition. Only comment on game performance.

Patient Name: \${patientData.patientName}

Game Results:
\${JSON.stringify(patientData.gameResults, null, 2)}

Provide response as valid JSON only.
  \`;
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-8b-8192',
    temperature: 0.5,
    max_tokens: 500,
  });
  const response = chatCompletion.choices[0]?.message?.content || '';
  try { return JSON.parse(response); } catch { return { overallPerformance: response, strengths: [], areasToMonitor: [], progress: '', recommendedLevel: 5, suggestedGames: [], recentChanges: '' }; }
};`);

writeFile('backend/utils/seed.js', `const db = require('../database/db');
const games = [
  { name: 'Bazaar Buddy', description: 'Shopping calculation and decision making', cognitive_area: 'Calculation, Attention, Executive Function' },
  { name: 'Spot the Change', description: 'Visual attention and memory', cognitive_area: 'Visual Attention, Memory' },
  { name: 'Word Garden', description: 'Language and verbal fluency', cognitive_area: 'Language, Verbal Fluency' },
  { name: 'Find My Way Home', description: 'Spatial memory and navigation', cognitive_area: 'Spatial Memory, Navigation' },
  { name: 'Recipe Helper', description: 'Sequencing and planning', cognitive_area: 'Sequencing, Executive Function' },
  { name: 'Story & Remember', description: 'Short-term memory and comprehension', cognitive_area: 'Memory, Comprehension' }
];
games.forEach(g => db.run(\`INSERT OR IGNORE INTO games (name, description, cognitive_area) VALUES (?,?,?)\`, [g.name, g.description, g.cognitive_area]));
console.log('Seed completed.');`);

writeFile('backend/routes/auth.js', `const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
router.post('/register', authController.register);
router.post('/login', authController.login);
module.exports = router;`);

writeFile('backend/routes/patients.js', `const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth');
router.get('/', auth, patientController.getAllPatients);
router.get('/:id', auth, patientController.getPatientById);
router.put('/:id', auth, patientController.updatePatient);
module.exports = router;`);

writeFile('backend/routes/games.js', `const express = require('express');
const router = express.Router();
const db = require('../database/db');
router.get('/', (req, res) => {
  db.all(\`SELECT * FROM games ORDER BY id\`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
router.get('/:id', (req, res) => {
  db.get(\`SELECT * FROM games WHERE id = ?\`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Game not found' });
    res.json(row);
  });
});
module.exports = router;`);

writeFile('backend/routes/gameResults.js', `const express = require('express');
const router = express.Router();
const controller = require('../controllers/gameResultController');
const auth = require('../middleware/auth');
router.post('/', auth, controller.saveResult);
router.get('/:patientId', auth, controller.getResults);
module.exports = router;`);

writeFile('backend/routes/analytics.js', `const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
router.get('/:patientId', auth, controller.getAnalytics);
module.exports = router;`);

writeFile('backend/routes/ai.js', `const express = require('express');
const router = express.Router();
const controller = require('../controllers/aiController');
const auth = require('../middleware/auth');
router.post('/analyze/:patientId', auth, controller.analyzePatient);
module.exports = router;`);

// ----------------------------------------------------------
//  FRONTEND – all JSX files use .jsx extension
// ----------------------------------------------------------

writeFile('frontend/package.json', `{
  "name": "cognitive-gaming-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "recharts": "^2.9.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}`);

writeFile('frontend/vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})`);

writeFile('frontend/index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SmritiLoom - Cognitive Gaming</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);

writeFile('frontend/src/main.jsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

writeFile('frontend/src/index.css', `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 18px; background-color: #f5f7fa; color: #1a202c; line-height: 1.6; }
a { text-decoration: none; color: inherit; }
button { font-size: 1.1rem; padding: 12px 24px; border: none; border-radius: 8px; background-color: #3182ce; color: white; cursor: pointer; transition: background 0.2s; }
button:hover { background-color: #2b6cb0; }
button.secondary { background-color: #edf2f7; color: #1a202c; }
button.secondary:hover { background-color: #e2e8f0; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 20px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
input, select, textarea { font-size: 1.1rem; padding: 14px; border-radius: 8px; border: 1px solid #cbd5e0; width: 100%; margin-bottom: 12px; }
label { font-weight: 600; margin-bottom: 4px; display: block; }
.text-muted { color: #4a5568; }
@media (max-width: 768px) { body { font-size: 16px; } .container { padding: 12px; } .grid { grid-template-columns: 1fr; } }`);

writeFile('frontend/src/App.jsx', `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import Games from './pages/Games.jsx';
import GamePlay from './pages/GamePlay.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';
import CaretakerDashboard from './pages/CaretakerDashboard.jsx';
import Patients from './pages/Patients.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import Analytics from './pages/Analytics.jsx';
import AIAnalysis from './pages/AIAnalysis.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/games" element={<Games />} />
            <Route path="/patient/game/:gameId" element={<GamePlay />} />
            <Route path="/patient/progress" element={<Progress />} />
            <Route path="/patient/profile" element={<Profile />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['caretaker']} />}>
            <Route path="/caretaker/dashboard" element={<CaretakerDashboard />} />
            <Route path="/caretaker/patients" element={<Patients />} />
            <Route path="/caretaker/patient/:id" element={<PatientDetail />} />
            <Route path="/caretaker/analytics" element={<Analytics />} />
            <Route path="/caretaker/ai-analysis" element={<AIAnalysis />} />
            <Route path="/caretaker/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;`);

writeFile('frontend/src/hooks/useAuth.jsx', `import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as clearToken } from '../services/auth.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = getCurrentUser();
      if (userData) setUser(userData);
      else localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    const data = await apiLogin(email, password, role);
    if (data.token) { localStorage.setItem('token', data.token); setUser(data.user); }
    return data;
  };

  const register = async (userData) => {
    const data = await apiRegister(userData);
    if (data.token) { localStorage.setItem('token', data.token); setUser(data.user); }
    return data;
  };

  const logout = () => { clearToken(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);`);

writeFile('frontend/src/services/auth.js', `import api from './api.js';

export const login = async (email, password, role) => {
  const res = await api.post('/auth/login', { email, password, role });
  return res.data;
};

export const register = async (userData) => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};

export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.userId, role: payload.role, patientId: payload.patientId };
  } catch { return null; }
};

export const logout = () => localStorage.removeItem('token');`);

writeFile('frontend/src/services/api.js', `import axios from 'axios';
import { getCurrentUser } from './auth.js';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;`);

writeFile('frontend/src/components/ProtectedRoute.jsx', `import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return <Outlet />;
};

export default ProtectedRoute;`);

writeFile('frontend/src/components/Navbar.jsx', `import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  if (!user) {
    return (
      <nav style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>SmritiLoom</Link>
        <div><Link to="/login" style={{ marginRight: 16 }}>Login</Link><Link to="/register">Register</Link></div>
      </nav>
    );
  }
  const isPatient = user.role === 'patient';
  const base = isPatient ? '/patient' : '/caretaker';
  return (
    <nav style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>SmritiLoom</Link>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {isPatient ? (
          <>
            <Link to={\`\${base}/dashboard\`}>Dashboard</Link>
            <Link to={\`\${base}/games\`}>Games</Link>
            <Link to={\`\${base}/progress\`}>Progress</Link>
            <Link to={\`\${base}/profile\`}>Profile</Link>
          </>
        ) : (
          <>
            <Link to={\`\${base}/dashboard\`}>Dashboard</Link>
            <Link to={\`\${base}/patients\`}>Patients</Link>
            <Link to={\`\${base}/analytics\`}>Analytics</Link>
            <Link to={\`\${base}/ai-analysis\`}>AI Analysis</Link>
            <Link to={\`\${base}/profile\`}>Profile</Link>
          </>
        )}
        <button onClick={handleLogout} style={{ background: 'transparent', color: '#e53e3e', padding: '4px 8px' }}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;`);

writeFile('frontend/src/components/AudioPlayer.jsx', `import React, { useState, useRef } from 'react';

const AudioPlayer = ({ text, lang = 'en' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  const speak = () => {
    if (!window.speechSynthesis) { alert('Text-to-speech not supported.'); return; }
    if (utteranceRef.current) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.onstart = () => { setIsPlaying(true); setIsPaused(false); };
    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => { if (window.speechSynthesis) { window.speechSynthesis.pause(); setIsPaused(true); } };
  const resume = () => { if (window.speechSynthesis) { window.speechSynthesis.resume(); setIsPaused(false); } };
  const stop = () => { if (window.speechSynthesis) { window.speechSynthesis.cancel(); setIsPlaying(false); setIsPaused(false); } };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '8px 0' }}>
      <button onClick={speak} disabled={isPlaying && !isPaused}>▶ Play</button>
      <button onClick={pause} disabled={!isPlaying || isPaused}>⏸ Pause</button>
      <button onClick={resume} disabled={!isPaused}>▶ Resume</button>
      <button onClick={stop}>⏹ Stop</button>
    </div>
  );
};

export default AudioPlayer;`);

writeFile('frontend/src/components/GameCard.jsx', `import React from 'react';
import { Link } from 'react-router-dom';

const GameCard = ({ game }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🧩</div>
      <h3>{game.name}</h3>
      <p style={{ fontSize: '0.9rem', color: '#4a5568' }}>{game.description}</p>
      <p style={{ fontSize: '0.8rem', color: '#718096' }}>🧠 {game.cognitive_area}</p>
      <Link to={\`/patient/game/\${game.id}\`}>
        <button style={{ marginTop: '12px', width: '100%' }}>Start Game</button>
      </Link>
    </div>
  );
};

export default GameCard;`);

// ----------------------------------------------------------
//  PAGES (all .jsx)
// ----------------------------------------------------------

const pages = {
  'frontend/src/pages/Landing.jsx': `import React from 'react';
import { Link } from 'react-router-dom';
export default function Landing() {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '40px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Keep the Mind Active. Every Day.</h1>
      <p style={{ fontSize: '1.3rem', maxWidth: '600px', margin: '0 auto 32px' }}>Engaging cognitive games and caregiver monitoring for elderly well-being.</p>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/login" state={{ role: 'patient' }}><button style={{ minWidth: '180px' }}>Patient Login</button></Link>
        <Link to="/login" state={{ role: 'caretaker' }}><button className="secondary" style={{ minWidth: '180px' }}>Caretaker Login</button></Link>
      </div>
      <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '30px', textAlign: 'left' }}>
        <div className="card"><h3>🧠 Cognitive Games</h3><p>Six scientifically designed games to challenge memory, attention, language, and more.</p></div>
        <div className="card"><h3>👩‍⚕️ Caregiver Monitoring</h3><p>Track progress, view analytics, and get AI-powered insights.</p></div>
        <div className="card"><h3>🔊 Audio Support</h3><p>Text-to-speech for instructions and feedback.</p></div>
      </div>
    </div>
  );
}`,

  'frontend/src/pages/Login.jsx': `import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const suggested = location.state?.role || 'patient';
  React.useEffect(() => setRole(suggested), [suggested]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(email, password, role);
      if (data.token) navigate(role === 'patient' ? '/patient/dashboard' : '/caretaker/dashboard');
      else setError(data.error || 'Login failed');
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', margin: '40px auto' }}>
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          <div><label>I am a</label><select value={role} onChange={e=>setRole(e.target.value)}><option value="patient">Patient</option><option value="caretaker">Caretaker</option></select></div>
          {error && <p style={{ color: '#e53e3e' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', marginTop: '12px' }}>Login</button>
        </form>
        <p style={{ marginTop: '16px' }}>Don't have an account? <Link to="/register">Register here</Link></p>
        <p style={{ marginTop: '8px', fontSize: '0.9rem' }}><Link to="#" onClick={() => alert('Password reset link sent (demo)')}>Forgot password?</Link></p>
      </div>
    </div>
  );
}`,

  'frontend/src/pages/Register.jsx': `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', role:'patient', age:'', gender:'', preferredLanguage:'', emergencyContact:'', notes:'', phone:'' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleChange = e => setForm({...form, [e.target.name]: e.target.value});
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError('');
    try {
      const data = await register(form);
      if (data.token) navigate(form.role === 'patient' ? '/patient/dashboard' : '/caretaker/dashboard');
      else setError(data.error || 'Registration failed');
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="container" style={{ maxWidth: '560px', margin: '40px auto' }}>
      <div className="card">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div><label>Full Name</label><input name="name" value={form.name} onChange={handleChange} required /></div>
          <div><label>Email</label><input type="email" name="email" value={form.email} onChange={handleChange} required /></div>
          <div><label>Password</label><input type="password" name="password" value={form.password} onChange={handleChange} required /></div>
          <div><label>Confirm Password</label><input type="password" name="confirm" value={form.confirm} onChange={handleChange} required /></div>
          <div><label>I am a</label><select name="role" value={form.role} onChange={handleChange}><option value="patient">Patient</option><option value="caretaker">Caretaker</option></select></div>
          {form.role === 'patient' && (
            <>
              <div><label>Age</label><input type="number" name="age" value={form.age} onChange={handleChange} /></div>
              <div><label>Gender</label><select name="gender" value={form.gender} onChange={handleChange}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
              <div><label>Preferred Language</label><input name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange} placeholder="e.g., Hindi, English" /></div>
              <div><label>Emergency Contact</label><input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Phone or email" /></div>
              <div><label>Notes (optional)</label><textarea name="notes" value={form.notes} onChange={handleChange} rows="3"></textarea></div>
            </>
          )}
          {form.role === 'caretaker' && <div><label>Phone</label><input name="phone" value={form.phone} onChange={handleChange} /></div>}
          {error && <p style={{ color: '#e53e3e' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', marginTop: '12px' }}>Register</button>
        </form>
        <p style={{ marginTop: '16px' }}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}`,

  'frontend/src/pages/PatientDashboard.jsx': `import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api.js';
import GameCard from '../components/GameCard.jsx';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState({ completed:0, level:0, accuracy:0, bestScore:0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const g = await api.get('/games');
        setGames(g.data);
        setStats({ completed:5, level:3, accuracy:82, bestScore:450 });
      } catch(e){ console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [user]);
  if (loading) return <div className="container">Loading...</div>;
  return (
    <div className="container">
      <h1>Good afternoon, {user?.name}!</h1>
      <p style={{ fontSize:'1.2rem', marginBottom:'24px' }}>Ready for today's brain activity?</p>
      <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', marginBottom:'40px' }}>
        <div className="card"><strong>Games Completed</strong><br /><span style={{ fontSize:'2rem' }}>{stats.completed}</span></div>
        <div className="card"><strong>Current Level</strong><br /><span style={{ fontSize:'2rem' }}>{stats.level}</span></div>
        <div className="card"><strong>Average Accuracy</strong><br /><span style={{ fontSize:'2rem' }}>{stats.accuracy}%</span></div>
        <div className="card"><strong>Best Score</strong><br /><span style={{ fontSize:'2rem' }}>{stats.bestScore}</span></div>
      </div>
      <h2>Continue Playing</h2>
      <div className="grid">{games.map(g => <GameCard key={g.id} game={g} />)}</div>
    </div>
  );
}`,

  'frontend/src/pages/Games.jsx': `import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import GameCard from '../components/GameCard.jsx';

export default function Games() {
  const [games, setGames] = useState([]);
  useEffect(() => { api.get('/games').then(res => setGames(res.data)).catch(console.error); }, []);
  return (
    <div className="container">
      <h2>All Games</h2>
      <div className="grid">{games.map(g => <GameCard key={g.id} game={g} />)}</div>
    </div>
  );
}`,

  'frontend/src/pages/GamePlay.jsx': `import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import BazaarBuddy from '../games/BazaarBuddy/BazaarBuddy.jsx';
import SpotTheChange from '../games/SpotTheChange/index.jsx';
import WordGarden from '../games/WordGarden/index.jsx';
import FindMyWayHome from '../games/FindMyWayHome/index.jsx';
import RecipeHelper from '../games/RecipeHelper/index.jsx';
import StoryRemember from '../games/StoryRemember/index.jsx';

const components = { 1: BazaarBuddy, 2: SpotTheChange, 3: WordGarden, 4: FindMyWayHome, 5: RecipeHelper, 6: StoryRemember };

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(\`/games/\${gameId}\`).then(res => { setGame(res.data); setLoading(false); }).catch(() => { navigate('/patient/games'); });
  }, [gameId, navigate]);
  if (loading) return <div className="container">Loading game...</div>;
  if (!game) return <div className="container">Game not found</div>;
  const Comp = components[game.id];
  if (!Comp) return <div className="container">Game not implemented</div>;
  return (
    <div className="container">
      <h2>{game.name}</h2>
      <Comp gameId={game.id} />
    </div>
  );
}`,

  'frontend/src/pages/Progress.jsx': `import React from 'react';
export default function Progress() { return <div className="container"><h2>Progress</h2><p>Coming soon: detailed progress charts.</p></div>; }`,

  'frontend/src/pages/Profile.jsx': `import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
export default function Profile() {
  const { user } = useAuth();
  return <div className="container"><h2>Profile</h2><p>Name: {user?.name}</p><p>Email: {user?.email}</p><p>Role: {user?.role}</p></div>;
}`,

  'frontend/src/pages/CaretakerDashboard.jsx': `import React from 'react';
export default function CaretakerDashboard() {
  return (
    <div className="container">
      <h2>Caretaker Dashboard</h2>
      <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))' }}>
        <div className="card"><h4>Total Patients</h4><span style={{fontSize:'2rem'}}>0</span></div>
        <div className="card"><h4>Games Completed</h4><span style={{fontSize:'2rem'}}>0</span></div>
        <div className="card"><h4>Average Accuracy</h4><span style={{fontSize:'2rem'}}>0%</span></div>
        <div className="card"><h4>Active Patients</h4><span style={{fontSize:'2rem'}}>0</span></div>
      </div>
    </div>
  );
}`,

  'frontend/src/pages/Patients.jsx': `import React from 'react';
export default function Patients() { return <div className="container"><h2>Patients</h2><p>Patient list will appear here.</p></div>; }`,

  'frontend/src/pages/PatientDetail.jsx': `import React from 'react';
export default function PatientDetail() { return <div className="container"><h2>Patient Detail</h2><p>Details and performance charts.</p></div>; }`,

  'frontend/src/pages/Analytics.jsx': `import React from 'react';
export default function Analytics() { return <div className="container"><h2>Analytics</h2><p>Charts will be displayed here.</p></div>; }`,

  'frontend/src/pages/AIAnalysis.jsx': `import React from 'react';
export default function AIAnalysis() { return <div className="container"><h2>AI Analysis</h2><p>Select a patient and click Analyze.</p></div>; }`
};

for (const [path, content] of Object.entries(pages)) {
  writeFile(path, content);
}

// ----------------------------------------------------------
//  GAMES (all .jsx)
// ----------------------------------------------------------

// Bazaar Buddy
writeFile('frontend/src/games/BazaarBuddy/BazaarBuddy.jsx', `import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../services/api.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const BazaarBuddy = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);

  const generateQuestion = (lvl) => {
    const config = getDifficulty(lvl);
    const items = [];
    const itemNames = ['Apple','Rice','Banana','Milk','Bread','Eggs','Sugar','Oil'];
    const prices = [10,20,30,40,50,60,70,80];
    const numItems = config.itemCount;
    let total = 0;
    for (let i=0; i<numItems; i++) {
      const name = itemNames[Math.floor(Math.random()*itemNames.length)];
      const price = prices[Math.floor(Math.random()*prices.length)] + Math.floor(Math.random()*10);
      const qty = Math.floor(Math.random()*3)+1;
      const itemTotal = Math.round(price * qty);
      items.push({ name, price: Math.round(price), qty, itemTotal });
      total += itemTotal;
    }
    const types = ['total','change','afford'];
    const type = types[Math.floor(Math.random()*types.length)];
    let questionText, correctAnswer;
    if (type === 'total') {
      questionText = \`What is the total cost?\`;
      correctAnswer = total;
    } else if (type === 'change') {
      const given = total + Math.floor(Math.random()*50) + 10;
      questionText = \`If you pay ₹\${given}, how much change?\`;
      correctAnswer = given - total;
    } else {
      const budget = total + Math.floor(Math.random()*30) - 10;
      questionText = \`Can you afford this with ₹\${budget}? (yes/no)\`;
      correctAnswer = budget >= total ? 'yes' : 'no';
    }
    return { items, questionText, correctAnswer, type };
  };

  useEffect(() => {
    setQuestion(generateQuestion(level));
    setStartTime(Date.now());
  }, [level]);

  const handleSubmit = () => {
    if (!question) return;
    setAttempts(prev => prev + 1);
    const userAnswer = question.type === 'afford' ? answer.toLowerCase() : parseFloat(answer);
    const isCorrect = userAnswer === question.correctAnswer;
    if (isCorrect) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback(\`Incorrect. Correct: \${question.correctAnswer}\`); }
    setTimeout(() => {
      if (level < 10) { setLevel(prev=>prev+1); setAnswer(''); setFeedback(''); }
      else setGameOver(true);
    }, 2000);
  };

  const handleComplete = () => {
    const completionTime = (Date.now() - startTime) / 1000;
    const accuracy = correct / (correct + wrong) * 100 || 0;
    api.post('/game-results', {
      patientId: user.patientId || user.id,
      gameId,
      level,
      score,
      accuracy,
      correctAnswers: correct,
      wrongAnswers: wrong,
      attempts,
      completionTime,
      averageReactionTime: 0,
      hintsUsed: 0,
      audioUsed: false
    }).then(() => alert('Game completed! Results saved.')).catch(console.error);
  };

  if (gameOver) return (
    <div className="card">
      <h3>Game Over!</h3>
      <p>Score: {score}</p>
      <button onClick={handleComplete}>Save Results</button>
    </div>
  );

  if (!question) return <div>Loading...</div>;

  return (
    <div className="card">
      <h3>Level {level}</h3>
      <div>
        <p>Shopping List:</p>
        <ul>{question.items.map((item, idx) => <li key={idx}>{item.qty} x {item.name} @ ₹{item.price} = ₹{item.itemTotal}</li>)}</ul>
        <p><strong>{question.questionText}</strong></p>
        {question.type !== 'afford' ? (
          <input type="number" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter amount" />
        ) : (
          <select value={answer} onChange={(e) => setAnswer(e.target.value)}>
            <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
          </select>
        )}
        <button onClick={handleSubmit}>Submit</button>
      </div>
      {feedback && <p>{feedback}</p>}
      <p>Score: {score} | Correct: {correct} | Wrong: {wrong}</p>
      <AudioPlayer text="Listen to the shopping task." />
    </div>
  );
};

export default BazaarBuddy;`);

writeFile('frontend/src/games/BazaarBuddy/difficultyConfig.js', `export const getDifficulty = (level) => {
  const configs = {
    1: { itemCount: 2 }, 2: { itemCount: 3 }, 3: { itemCount: 3 }, 4: { itemCount: 4 },
    5: { itemCount: 4 }, 6: { itemCount: 5 }, 7: { itemCount: 5 }, 8: { itemCount: 6 },
    9: { itemCount: 6 }, 10: { itemCount: 7 }
  };
  return configs[level] || configs[1];
};`);

// Spot the Change
writeFile('frontend/src/games/SpotTheChange/index.jsx', `import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../services/api.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const SpotTheChange = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [objects, setObjects] = useState([]);
  const [original, setOriginal] = useState([]);
  const [phase, setPhase] = useState('study');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);

  const emojis = ['🍎','🍌','🍇','🍊','🍓','🍉','🍒','🍑','🥝','🍍','🥭','🍋','🍈','🍏','🍐','🥑'];
  const generateScene = (lvl) => {
    const count = getDifficulty(lvl).objectCount;
    const arr = [];
    for (let i=0; i<count; i++) arr.push(emojis[Math.floor(Math.random()*emojis.length)]);
    return arr;
  };
  const applyChange = (orig) => {
    const changed = [...orig];
    const idx = Math.floor(Math.random() * changed.length);
    const type = Math.floor(Math.random()*4);
    if (type===0) { changed.splice(idx,1); }
    else if (type===1) { let newEm; do { newEm = emojis[Math.floor(Math.random()*emojis.length)]; } while (newEm === changed[idx] || (changed.includes(newEm) && changed.length>1)); changed[idx] = newEm; }
    else if (type===2 && changed.length>1) { const idx2 = (idx+1)%changed.length; [changed[idx], changed[idx2]] = [changed[idx2], changed[idx]]; }
    else { let newEm; do { newEm = emojis[Math.floor(Math.random()*emojis.length)]; } while (changed.includes(newEm)); changed.push(newEm); }
    return changed;
  };

  useEffect(() => {
    const orig = generateScene(level);
    setOriginal(orig);
    setObjects(orig);
    setPhase('study');
    setFeedback('');
    setStartTime(Date.now());
    const timer = setTimeout(() => {
      const changed = applyChange(orig);
      setObjects(changed);
      setPhase('changed');
    }, 3000 - level*100);
    return () => clearTimeout(timer);
  }, [level]);

  const handleSelect = (idx) => {
    if (phase !== 'changed') return;
    const isChanged = original[idx] !== objects[idx] || original.length !== objects.length;
    if (isChanged) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback('Wrong!'); }
    setAttempts(prev=>prev+1);
    setTimeout(() => {
      if (level < 10) setLevel(prev=>prev+1);
      else setGameOver(true);
    }, 1500);
  };

  const handleComplete = () => {
    const completionTime = (Date.now()-startTime)/1000;
    const accuracy = correct/(correct+wrong)*100 || 0;
    api.post('/game-results', {
      patientId: user.patientId || user.id, gameId, level, score, accuracy,
      correctAnswers: correct, wrongAnswers: wrong, attempts, completionTime,
      averageReactionTime: 0, hintsUsed: 0, audioUsed: false
    }).then(() => alert('Results saved!')).catch(console.error);
  };

  if (gameOver) return <div className="card"><h3>Game Over!</h3><p>Score: {score}</p><button onClick={handleComplete}>Save Results</button></div>;
  if (phase === 'study') return (
    <div className="card">
      <h3>Level {level}</h3>
      <p>Study these objects:</p>
      <div style={{display:'flex',gap:'16px',flexWrap:'wrap',fontSize:'2.5rem',justifyContent:'center'}}>
        {original.map((obj,i) => <span key={i}>{obj}</span>)}
      </div>
      <AudioPlayer text="Study these objects carefully" />
    </div>
  );
  return (
    <div className="card">
      <h3>Level {level}</h3>
      <p>What changed? Click the object that is different.</p>
      <div style={{display:'flex',gap:'16px',flexWrap:'wrap',fontSize:'2.5rem',justifyContent:'center'}}>
        {objects.map((obj,i) => (
          <button key={i} onClick={()=>handleSelect(i)} style={{background:'none',border:'2px solid #ccc',borderRadius:'8px',padding:'8px',fontSize:'2.5rem',cursor:'pointer'}}>
            {obj}
          </button>
        ))}
      </div>
      {feedback && <p>{feedback}</p>}
      <p>Score: {score} | Correct: {correct} | Wrong: {wrong}</p>
    </div>
  );
};

export default SpotTheChange;`);

writeFile('frontend/src/games/SpotTheChange/difficultyConfig.js', `export const getDifficulty = (level) => {
  const configs = {
    1: { objectCount: 3 }, 2: { objectCount: 4 }, 3: { objectCount: 4 }, 4: { objectCount: 5 },
    5: { objectCount: 6 }, 6: { objectCount: 6 }, 7: { objectCount: 7 }, 8: { objectCount: 8 },
    9: { objectCount: 9 }, 10: { objectCount: 10 }
  };
  return configs[level] || configs[1];
};`);

// Word Garden
writeFile('frontend/src/games/WordGarden/index.jsx', `import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../services/api.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const WordGarden = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [letter, setLetter] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);

  const wordList = ['apple','banana','cat','dog','elephant','fish','grape','hat','ice','jacket','kite','lion','mango','nest','orange','parrot','queen','rabbit','sun','tree','umbrella','violin','water','xylophone','yoga','zebra','ant','bear','crow','deer'];
  const generateChallenge = (lvl) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randLetter = letters[Math.floor(Math.random()*26)];
    setLetter(randLetter);
    const possible = wordList.filter(w => w.startsWith(randLetter.toLowerCase()));
    if (possible.length === 0) { // fallback
      const fallback = wordList[Math.floor(Math.random()*wordList.length)];
      setTargetWord(fallback);
      return fallback;
    }
    const word = possible[Math.floor(Math.random()*possible.length)];
    setTargetWord(word);
    return word;
  };

  useEffect(() => {
    generateChallenge(level);
    setStartTime(Date.now());
  }, [level]);

  const handleAnswer = (ans) => {
    setAttempts(prev=>prev+1);
    const isCorrect = (ans === 'yes' && targetWord.startsWith(letter.toLowerCase())) ||
                      (ans === 'no' && !targetWord.startsWith(letter.toLowerCase()));
    if (isCorrect) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback(\`Wrong. The word is "\${targetWord}".\`); }
    setTimeout(() => {
      if (level < 10) setLevel(prev=>prev+1);
      else setGameOver(true);
    }, 1500);
  };

  const handleComplete = () => {
    const completionTime = (Date.now()-startTime)/1000;
    const accuracy = correct/(correct+wrong)*100 || 0;
    api.post('/game-results', {
      patientId: user.patientId || user.id, gameId, level, score, accuracy,
      correctAnswers: correct, wrongAnswers: wrong, attempts, completionTime,
      averageReactionTime: 0, hintsUsed: 0, audioUsed: false
    }).then(() => alert('Results saved!')).catch(console.error);
  };

  if (gameOver) return <div className="card"><h3>Game Over!</h3><p>Score: {score}</p><button onClick={handleComplete}>Save Results</button></div>;

  return (
    <div className="card">
      <h3>Level {level}</h3>
      <p>Letter: <strong>{letter}</strong></p>
      <p>Does the word <strong>"{targetWord}"</strong> start with the letter <strong>{letter}</strong>?</p>
      <div style={{display:'flex',gap:'16px'}}>
        <button onClick={()=>handleAnswer('yes')}>Yes</button>
        <button onClick={()=>handleAnswer('no')}>No</button>
      </div>
      {feedback && <p>{feedback}</p>}
      <p>Score: {score} | Correct: {correct} | Wrong: {wrong}</p>
      <AudioPlayer text={\`Does \${targetWord} start with \${letter}?\`} />
    </div>
  );
};

export default WordGarden;`);

writeFile('frontend/src/games/WordGarden/difficultyConfig.js', `export const getDifficulty = (level) => {
  const configs = {
    1: { wordCount: 3 }, 2: { wordCount: 3 }, 3: { wordCount: 4 }, 4: { wordCount: 4 },
    5: { wordCount: 5 }, 6: { wordCount: 5 }, 7: { wordCount: 6 }, 8: { wordCount: 6 },
    9: { wordCount: 7 }, 10: { wordCount: 8 }
  };
  return configs[level] || configs[1];
};`);

// Find My Way Home
writeFile('frontend/src/games/FindMyWayHome/index.jsx', `import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../services/api.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const FindMyWayHome = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState([]);
  const [route, setRoute] = useState([]);
  const [userPath, setUserPath] = useState([]);
  const [phase, setPhase] = useState('study');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);

  const generate = (lvl) => {
    const config = getDifficulty(lvl);
    const size = config.gridSize;
    const steps = config.routeLength;
    const grid = Array.from({length: size}, (_,r) => Array.from({length: size}, (_,c) => ({r,c,label:''})));
    let path = [{r:0,c:0}];
    let cur = {r:0,c:0};
    for (let i=0; i<steps; i++) {
      const moves = [];
      if (cur.r < size-1) moves.push({r:cur.r+1, c:cur.c});
      if (cur.c < size-1) moves.push({r:cur.r, c:cur.c+1});
      if (cur.r > 0) moves.push({r:cur.r-1, c:cur.c});
      if (cur.c > 0) moves.push({r:cur.r, c:cur.c-1});
      if (moves.length===0) break;
      const next = moves[Math.floor(Math.random()*moves.length)];
      path.push(next);
      cur = next;
    }
    path.forEach((p,idx) => {
      if (idx===0) grid[p.r][p.c].label = 'Start';
      else if (idx===path.length-1) grid[p.r][p.c].label = 'Home';
      else grid[p.r][p.c].label = \`\${idx}\`;
    });
    return { grid, route: path };
  };

  useEffect(() => {
    const { grid, route } = generate(level);
    setGrid(grid);
    setRoute(route);
    setUserPath([]);
    setPhase('study');
    setFeedback('');
    setStartTime(Date.now());
    const timer = setTimeout(() => setPhase('recall'), 3000 - level*150);
    return () => clearTimeout(timer);
  }, [level]);

  const handleCellClick = (r,c) => {
    if (phase !== 'recall') return;
    const nextStep = userPath.length;
    if (nextStep >= route.length) return;
    const expected = route[nextStep];
    if (expected.r === r && expected.c === c) {
      setUserPath(prev => [...prev, {r,c}]);
      setCorrect(prev=>prev+1);
      setScore(prev=>prev+5);
      if (nextStep+1 === route.length) {
        setFeedback('You reached home!');
        setTimeout(() => {
          if (level < 10) setLevel(prev=>prev+1);
          else setGameOver(true);
        }, 1500);
      }
    } else {
      setWrong(prev=>prev+1);
      setFeedback('Wrong step!');
      setAttempts(prev=>prev+1);
    }
  };

  const handleComplete = () => {
    const completionTime = (Date.now()-startTime)/1000;
    const accuracy = correct/(correct+wrong)*100 || 0;
    api.post('/game-results', {
      patientId: user.patientId || user.id, gameId, level, score, accuracy,
      correctAnswers: correct, wrongAnswers: wrong, attempts, completionTime,
      averageReactionTime: 0, hintsUsed: 0, audioUsed: false
    }).then(() => alert('Results saved!')).catch(console.error);
  };

  if (gameOver) return <div className="card"><h3>Game Over!</h3><p>Score: {score}</p><button onClick={handleComplete}>Save Results</button></div>;

  return (
    <div className="card">
      <h3>Level {level}</h3>
      {phase === 'study' && (
        <div>
          <p>Study the route from Start to Home.</p>
          <div style={{display:'grid', gridTemplateColumns: \`repeat(\${grid.length}, 60px)\`, gap:'4px'}}>
            {grid.map((row,r) => row.map((cell,c) => (
              <div key={\`\${r}-\${c}\`} style={{width:60,height:60,border:'1px solid #ccc',display:'flex',alignItems:'center',justifyContent:'center',background: cell.label ? '#a8d5e2' : 'white'}}>
                {cell.label}
              </div>
            )))}
          </div>
          <AudioPlayer text="Remember the route." />
        </div>
      )}
      {phase === 'recall' && (
        <div>
          <p>Click the cells in the correct order to reach Home.</p>
          <div style={{display:'grid', gridTemplateColumns: \`repeat(\${grid.length}, 60px)\`, gap:'4px'}}>
            {grid.map((row,r) => row.map((cell,c) => {
              const visited = userPath.some(p => p.r===r && p.c===c);
              return (
                <button key={\`\${r}-\${c}\`} onClick={()=>handleCellClick(r,c)} style={{width:60,height:60,border:'1px solid #ccc',background: visited ? '#b2d8b2' : 'white',cursor:'pointer'}} disabled={visited}>
                  {cell.label}
                </button>
              );
            }))}
          </div>
          {feedback && <p>{feedback}</p>}
        </div>
      )}
      <p>Score: {score} | Correct: {correct} | Wrong: {wrong}</p>
    </div>
  );
};

export default FindMyWayHome;`);

writeFile('frontend/src/games/FindMyWayHome/difficultyConfig.js', `export const getDifficulty = (level) => {
  const configs = {
    1: { gridSize: 3, routeLength: 2 }, 2: { gridSize: 3, routeLength: 3 },
    3: { gridSize: 4, routeLength: 3 }, 4: { gridSize: 4, routeLength: 4 },
    5: { gridSize: 5, routeLength: 4 }, 6: { gridSize: 5, routeLength: 5 },
    7: { gridSize: 6, routeLength: 5 }, 8: { gridSize: 6, routeLength: 6 },
    9: { gridSize: 7, routeLength: 6 }, 10: { gridSize: 7, routeLength: 7 }
  };
  return configs[level] || configs[1];
};`);

// Recipe Helper
writeFile('frontend/src/games/RecipeHelper/index.jsx', `import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../services/api.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const RecipeHelper = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [steps, setSteps] = useState([]);
  const [shuffled, setShuffled] = useState([]);
  const [userOrder, setUserOrder] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);

  const recipes = [
    { name:'Vegetable Soup', steps:['Wash vegetables','Chop vegetables','Boil water','Add vegetables','Simmer for 15 minutes','Add salt and pepper','Serve hot'] },
    { name:'Omelette', steps:['Crack eggs into bowl','Whisk eggs','Heat pan with oil','Pour eggs into pan','Cook until set','Fold and serve'] },
    { name:'Pasta', steps:['Boil water','Add pasta','Cook for 10 minutes','Drain pasta','Add sauce','Mix and serve'] }
  ];

  const generate = (lvl) => {
    const config = getDifficulty(lvl);
    const recipe = recipes[Math.floor(Math.random()*recipes.length)];
    const num = Math.min(config.stepCount, recipe.steps.length);
    const selected = recipe.steps.slice(0,num);
    setSteps(selected);
    setShuffled([...selected].sort(()=>Math.random()-0.5));
    setUserOrder([]);
    setFeedback('');
  };

  useEffect(() => { generate(level); setStartTime(Date.now()); }, [level]);

  const handleStepClick = (step, idx) => {
    if (userOrder.includes(idx)) return;
    const nextExpected = userOrder.length;
    const expected = steps[nextExpected];
    if (step === expected) {
      setUserOrder(prev => [...prev, idx]);
      setCorrect(prev=>prev+1);
      setScore(prev=>prev+10);
      if (userOrder.length+1 === steps.length) {
        setFeedback('Perfect order!');
        setTimeout(() => {
          if (level < 10) setLevel(prev=>prev+1);
          else setGameOver(true);
        }, 1500);
      }
    } else {
      setWrong(prev=>prev+1);
      setFeedback(\`Wrong. The correct next step is "\${expected}"\`);
      setAttempts(prev=>prev+1);
    }
  };

  const handleComplete = () => {
    const completionTime = (Date.now()-startTime)/1000;
    const accuracy = correct/(correct+wrong)*100 || 0;
    api.post('/game-results', {
      patientId: user.patientId || user.id, gameId, level, score, accuracy,
      correctAnswers: correct, wrongAnswers: wrong, attempts, completionTime,
      averageReactionTime: 0, hintsUsed: 0, audioUsed: false
    }).then(() => alert('Results saved!')).catch(console.error);
  };

  if (gameOver) return <div className="card"><h3>Game Over!</h3><p>Score: {score}</p><button onClick={handleComplete}>Save Results</button></div>;

  return (
    <div className="card">
      <h3>Level {level}</h3>
      <p>Arrange the recipe steps in the correct order.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {shuffled.map((step, idx) => (
          <button key={idx} onClick={()=>handleStepClick(step, idx)} disabled={userOrder.includes(idx)} style={{padding:'12px',background: userOrder.includes(idx)?'#c6f6d5':'#edf2f7',border:'1px solid #ccc',borderRadius:'8px',textAlign:'left',cursor: userOrder.includes(idx)?'default':'pointer'}}>
            {step}
          </button>
        ))}
      </div>
      <p>Your order: {userOrder.map(i => shuffled[i]).join(' → ')}</p>
      {feedback && <p>{feedback}</p>}
      <p>Score: {score} | Correct: {correct} | Wrong: {wrong}</p>
      <AudioPlayer text="Arrange the steps in order." />
    </div>
  );
};

export default RecipeHelper;`);

writeFile('frontend/src/games/RecipeHelper/difficultyConfig.js', `export const getDifficulty = (level) => {
  const configs = {
    1: { stepCount: 3 }, 2: { stepCount: 3 }, 3: { stepCount: 4 }, 4: { stepCount: 4 },
    5: { stepCount: 5 }, 6: { stepCount: 5 }, 7: { stepCount: 6 }, 8: { stepCount: 6 },
    9: { stepCount: 7 }, 10: { stepCount: 7 }
  };
  return configs[level] || configs[1];
};`);

// Story Remember
writeFile('frontend/src/games/StoryRemember/index.jsx', `import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import api from '../../services/api.js';
import { getDifficulty } from './difficultyConfig.js';
import AudioPlayer from '../../components/AudioPlayer.jsx';

const StoryRemember = ({ gameId }) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [story, setStory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);
  const [phase, setPhase] = useState('story');

  const templates = [
    { text: 'Rina went to the market on Monday morning. She bought apples and oranges. She spent ₹200.', questions: [{q:'Where did Rina go?', options:['Market','School','Park','Home'], answer:0},{q:'What day did she go?', options:['Tuesday','Wednesday','Monday','Friday'], answer:2},{q:'How much did she spend?', options:['100','200','300','400'], answer:1}] },
    { text: 'Raju lives in a village near the river. He has a dog named Moti. Every morning, Raju takes Moti for a walk along the river.', questions: [{q:'Where does Raju live?', options:['City','Village','Town','Mountain'], answer:1},{q:'What is the dog\\'s name?', options:['Tiger','Moti','Bruno','Max'], answer:1},{q:'When does Raju walk the dog?', options:['Evening','Afternoon','Morning','Night'], answer:2}] }
  ];

  const generate = (lvl) => {
    const config = getDifficulty(lvl);
    const template = templates[Math.floor(Math.random()*templates.length)];
    setStory(template.text);
    const num = Math.min(config.questionCount, template.questions.length);
    setQuestions(template.questions.slice(0,num));
    setCurrentQ(0);
    setFeedback('');
    setPhase('story');
  };

  useEffect(() => { generate(level); setStartTime(Date.now()); }, [level]);

  const handleAnswer = (optionIdx) => {
    const q = questions[currentQ];
    const isCorrect = optionIdx === q.answer;
    if (isCorrect) { setCorrect(prev=>prev+1); setScore(prev=>prev+10); setFeedback('Correct!'); }
    else { setWrong(prev=>prev+1); setFeedback(\`Wrong. Correct: \${q.options[q.answer]}\`); }
    setAttempts(prev=>prev+1);
    setTimeout(() => {
      if (currentQ+1 < questions.length) { setCurrentQ(prev=>prev+1); setFeedback(''); }
      else {
        setPhase('complete');
        if (level < 10) { setTimeout(() => setLevel(prev=>prev+1), 2000); }
        else setGameOver(true);
      }
    }, 1500);
  };

  const handleComplete = () => {
    const completionTime = (Date.now()-startTime)/1000;
    const accuracy = correct/(correct+wrong)*100 || 0;
    api.post('/game-results', {
      patientId: user.patientId || user.id, gameId, level, score, accuracy,
      correctAnswers: correct, wrongAnswers: wrong, attempts, completionTime,
      averageReactionTime: 0, hintsUsed: 0, audioUsed: false
    }).then(() => alert('Results saved!')).catch(console.error);
  };

  if (gameOver) return <div className="card"><h3>Game Over!</h3><p>Score: {score}</p><button onClick={handleComplete}>Save Results</button></div>;

  if (phase === 'story') {
    return (
      <div className="card">
        <h3>Level {level}</h3>
        <p>Read or listen to the story:</p>
        <div style={{background:'#f0f4f8',padding:'16px',borderRadius:'8px',fontSize:'1.2rem'}}>{story}</div>
        <AudioPlayer text={story} />
        <button onClick={()=>setPhase('quiz')} style={{marginTop:'16px'}}>I'm ready for questions</button>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = questions[currentQ];
    if (!q) return <div>No questions</div>;
    return (
      <div className="card">
        <h3>Question {currentQ+1} of {questions.length}</h3>
        <p>{q.q}</p>
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {q.options.map((opt, idx) => <button key={idx} onClick={()=>handleAnswer(idx)} style={{padding:'12px',textAlign:'left'}}>{opt}</button>)}
        </div>
        {feedback && <p>{feedback}</p>}
        <p>Score: {score} | Correct: {correct} | Wrong: {wrong}</p>
      </div>
    );
  }

  return <div className="card"><p>Story completed! Proceeding...</p></div>;
};

export default StoryRemember;`);

writeFile('frontend/src/games/StoryRemember/difficultyConfig.js', `export const getDifficulty = (level) => {
  const configs = {
    1: { questionCount: 2 }, 2: { questionCount: 2 }, 3: { questionCount: 3 }, 4: { questionCount: 3 },
    5: { questionCount: 4 }, 6: { questionCount: 4 }, 7: { questionCount: 5 }, 8: { questionCount: 5 },
    9: { questionCount: 6 }, 10: { questionCount: 6 }
  };
  return configs[level] || configs[1];
};`);

// ----------------------------------------------------------
//  README & .gitignore
// ----------------------------------------------------------

writeFile('README.md', `# SmritiLoom - Cognitive Gaming & Memory Assistance

Prototype for a hackathon. Built with React, Node.js, SQLite, and Groq AI.

## Features
- Six cognitive games with adaptive difficulty.
- Patient and caretaker roles.
- Real-time score tracking and analytics.
- AI-powered performance insights using Groq.
- Audio support via Speech Synthesis.

## Installation

1. Generate the project with \`node generate.js\` (you already did this).
2. Backend:
   \`\`\`
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your GROQ_API_KEY and JWT_SECRET
   npm run seed
   npm run dev
   \`\`\`
3. Frontend (in another terminal):
   \`\`\`
   cd frontend
   npm install
   npm run dev
   \`\`\`
4. Open http://localhost:3000

## Demo Accounts
- Create your own patient/caretaker via registration.

## Tech Stack
- Frontend: React, Vite, React Router, Recharts
- Backend: Node.js, Express, SQLite
- AI: Groq API
`);

writeFile('.gitignore', `node_modules/
.DS_Store
*.log
.env
*.db
dist/
`);

console.log('\n✅ Project created successfully with all fixes!');
console.log('Now run:');
console.log('  cd backend');
console.log('  npm install');
console.log('  cp .env.example .env');
console.log('  # Add your GROQ_API_KEY to .env');
console.log('  npm run seed');
console.log('  npm run dev');
console.log('\nIn another terminal:');
console.log('  cd frontend');
console.log('  npm install');
console.log('  npm run dev');
console.log('\nThen open http://localhost:3000');