const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  const { name, email, password, role, age, gender, preferredLanguage, emergencyContact, notes, phone } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['patient','caretaker'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Use explicit transaction for both SQLite and Postgres
  const beginTran = () => {
    if (db.isPostgres) {
      return new Promise((resolve, reject) => {
        db.pg.query('BEGIN', (err) => {
          if (err) reject(err); else resolve();
        });
      });
    } else {
      return new Promise((resolve) => {
        db.run('BEGIN TRANSACTION', [], resolve);
      });
    }
  };

  const commitTran = () => {
    if (db.isPostgres) {
      return new Promise((resolve, reject) => {
        db.pg.query('COMMIT', (err) => {
          if (err) reject(err); else resolve();
        });
      });
    } else {
      return new Promise((resolve) => {
        db.run('COMMIT', [], resolve);
      });
    }
  };

  const rollbackTran = () => {
    if (db.isPostgres) {
      return new Promise((resolve, reject) => {
        db.pg.query('ROLLBACK', (err) => {
          if (err) reject(err); else resolve();
        });
      });
    } else {
      return new Promise((resolve) => {
        db.run('ROLLBACK', [], resolve);
      });
    }
  };

  (async () => {
    try {
      await beginTran();
      
      let userId;
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)`, [name,email,passwordHash,role], (err, result) => {
          if (err) {
            rollbackTran().then(() => reject(err));
            return;
          }
          // For Postgres, get the id from the returning clause or sequence
          if (db.isPostgres) {
            db.get(`SELECT LASTVAL() as id`, [], (err2, row) => {
              userId = row ? row.id : null;
              resolve();
            });
          } else {
            userId = result.lastID;
            resolve();
          }
        });
      });

      if (role === 'patient') {
        let patientId;
        await new Promise((resolve, reject) => {
          db.run(`INSERT INTO patients (user_id, age, gender, preferred_language, emergency_contact, notes) VALUES (?,?,?,?,?,?)`, [userId, age, gender, preferredLanguage, emergencyContact, notes], (err, result) => {
            if (err) {
              rollbackTran().then(() => reject(err));
              return;
            }
            if (db.isPostgres) {
              db.get(`SELECT LASTVAL() as id`, [], (err2, row) => {
                patientId = row ? row.id : null;
                resolve();
              });
            } else {
              patientId = result.lastID;
              resolve();
            }
          });
        });
        
        await commitTran();
        const token = jwt.sign({ userId, role, patientId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: userId, name, email, role, patientId } });
      } else {
        await new Promise((resolve, reject) => {
          db.run(`INSERT INTO caretakers (user_id, phone) VALUES (?,?)`, [userId, phone], (err, result) => {
            if (err) {
              rollbackTran().then(() => reject(err));
              return;
            }
            resolve();
          });
        });
        await commitTran();
        const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: userId, name, email, role } });
      }
    } catch (err) {
      try { await rollbackTran(); } catch (e) {}
      if (err.message && err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  })();
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
      db.get(`SELECT id FROM patients WHERE user_id = ?`, [user.id], (err2, p) => {
        issueToken(p ? p.id : null);
      });
    } else {
      issueToken(null);
    }
  });
};