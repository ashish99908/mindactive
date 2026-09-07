const db = require('../database/db');
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
    db.run(`INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)`, [name,email,passwordHash,role], function(err) {
      if (err) { db.run('ROLLBACK'); return res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Email exists' : err.message }); }
      const userId = this.lastID;
      if (role === 'patient') {
        db.run(`INSERT INTO patients (user_id, age, gender, preferred_language, emergency_contact, notes) VALUES (?,?,?,?,?,?)`, [userId, age, gender, preferredLanguage, emergencyContact, notes], function(err2) {
          if (err2) { db.run('ROLLBACK'); return res.status(500).json({ error: err2.message }); }
          const patientId = this.lastID;
          db.run('COMMIT');
          const token = jwt.sign({ userId, role, patientId }, process.env.JWT_SECRET, { expiresIn: '7d' });
          res.status(201).json({ token, user: { id: userId, name, email, role, patientId } });
        });
      } else {
        db.run(`INSERT INTO caretakers (user_id, phone) VALUES (?,?)`, [userId, phone], function(err2) {
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
  db.get(`SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND role = ?`, [email, role], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });

    const issueToken = (patientId) => {
      const token = jwt.sign({ userId: user.id, role, patientId }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role, patientId } });
    };

    if (role === 'patient') {
      // Must wait for the lookup: signing before this callback made patientId always null in tokens
      db.get(`SELECT id FROM patients WHERE user_id = ?`, [user.id], (err2, p) => {
        issueToken(p ? p.id : null);
      });
    } else {
      issueToken(null);
    }
  });
};