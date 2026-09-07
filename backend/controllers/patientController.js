const db = require('../database/db');


exports.createPatient = (req, res) => {
  const { name, email, password, age, gender, preferredLanguage, emergencyContact, notes } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const caretakerUserId = req.user.userId; // from JWT

  // First, get the caretaker's internal id from the caretakers table
  db.get(`SELECT id FROM caretakers WHERE user_id = ?`, [caretakerUserId], (err, caretaker) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!caretaker) return res.status(404).json({ error: 'Caretaker profile not found' });

    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Use explicit transactions for both SQLite and Postgres
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
        return new Promise((resolve) => {
          db.pg.query('ROLLBACK', (err) => {
            if (err) console.error(e); else resolve();
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
          db.run(
            `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'patient')`,
            [name, email, passwordHash],
            (err, result) => {
              if (err) {
                rollbackTran().then(() => reject(err));
                return;
              }
              if (db.isPostgres) {
                db.get(`SELECT LASTVAL() as id`, [], (err2, row) => {
                  userId = row ? row.id : null;
                  resolve();
                });
              } else {
                userId = result.lastID;
                resolve();
              }
            }
          );
        });

        let patientId;
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO patients (user_id, age, gender, preferred_language, emergency_contact, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, age, gender, preferredLanguage, emergencyContact, notes],
            (err, result) => {
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
            }
          );
        });

        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO patient_caretakers (patient_id, caretaker_id) VALUES (?, ?)`,
            [patientId, caretaker.id],
            (err) => {
              if (err) {
                rollbackTran().then(() => reject(err));
                return;
              }
              resolve();
            }
          );
        });

        await commitTran();
        res.status(201).json({
          message: 'Patient created and linked to caretaker',
          patientId: patientId,
          userId: userId
        });
      } catch (err) {
        try { await rollbackTran(); } catch (e) {}
        if (err.message && err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
    })();
  });
};
exports.getAllPatients = (req, res) => {
  const caretakerId = req.user.userId;
  db.get(`SELECT id FROM caretakers WHERE user_id = ?`, [caretakerId], (err, caretaker) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!caretaker) return res.status(404).json({ error: 'Caretaker not found' });
    db.all(`
      SELECT p.id AS patient_id, u.id AS user_id, u.name, u.email, p.age, p.gender, 
      p.preferred_language, p.emergency_contact, p.notes, p.created_at,
      (SELECT AVG(accuracy) FROM game_results WHERE patient_id = p.id) AS avg_accuracy,
      (SELECT COUNT(*) FROM game_results WHERE patient_id = p.id) AS games_completed,
      (SELECT MAX(created_at) FROM game_results WHERE patient_id = p.id) AS last_activity
      FROM patient_caretakers pc
      JOIN patients p ON pc.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE pc.caretaker_id = ?
    `, [caretaker.id], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(rows);
    });
  });
};

exports.getPatientById = (req, res) => {
  const patientId = req.params.id;
  db.get(`SELECT u.id AS user_id, u.name, u.email, p.* FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?`, [patientId], (err, patient) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  });
};

// ---- Medical reports (PDF / image, stored in DB) ----

exports.uploadReport = (req, res) => {
  const patientId = req.params.id;
  if (!req.file) {
    return res.status(400).json({ error: req.fileFilterMessage || 'No file uploaded' });
  }
  db.get(`SELECT id FROM patients WHERE id = ?`, [patientId], (err, p) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    db.run(
      `INSERT INTO medical_reports (patient_id, file_name, mime_type, size, data) VALUES (?,?,?,?,?)`,
      [patientId, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const reportId = db.isPostgres ? (result.rows && result.rows[0] ? result.rows[0].id : null) : result.lastID;
        res.status(201).json({ message: 'Report uploaded', reportId: reportId || result.lastID, fileName: req.file.originalname, size: req.file.size });
      }
    );
  });
};

exports.getReportMeta = (req, res) => {
  db.get(
    `SELECT id, file_name, mime_type, size, created_at FROM medical_reports WHERE patient_id = ? ORDER BY id DESC LIMIT 1`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'No report uploaded' });
      res.json(row);
    }
  );
};

exports.getReport = (req, res) => {
  db.get(
    `SELECT file_name, mime_type, data FROM medical_reports WHERE patient_id = ? ORDER BY id DESC LIMIT 1`,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'No report uploaded' });
      res.set('Content-Type', row.mime_type);
      res.set('Content-Disposition', `inline; filename="${String(row.file_name).replace(/[^\w.\-]/g, '_')}"`);
      res.send(row.data);
    }
  );
};

exports.updatePatient = (req, res) => {
  const patientId = req.params.id;
  const { age, gender, preferredLanguage, emergencyContact, notes } = req.body;
  db.run(`UPDATE patients SET age=?, gender=?, preferred_language=?, emergency_contact=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`, [age, gender, preferredLanguage, emergencyContact, notes, patientId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Updated' });
  });
};