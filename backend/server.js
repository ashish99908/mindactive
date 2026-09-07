require('dotenv').config();
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set! Logins will fail. Add JWT_SECRET=... to backend/.env');
}
const express = require('express');
const cors = require('cors');
const path = require('path');

// DB lives outside /var/tmp so the file survives redeploys when a Render disk is mounted.
process.env.DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'database', 'cognitive_gaming.db');

const db = require('./database/db');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const gameRoutes = require('./routes/games');
const gameResultRoutes = require('./routes/gameResults');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: [FRONTEND_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/game-results', gameResultRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
