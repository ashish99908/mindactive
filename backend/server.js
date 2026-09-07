require('dotenv').config();
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set! Logins will fail. Add JWT_SECRET=... to backend/.env');
}
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));