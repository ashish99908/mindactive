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

    // Start transaction to create user + patient + link
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Hash password
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      // Insert user with role 'patient'
      db.run(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'patient')`,
        [name, email, passwordHash],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            if (err.message.includes('UNIQUE')) {
              return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
          }
          const userId = this.lastID;

          // Insert patient record
          db.run(
            `INSERT INTO patients (user_id, age, gender, preferred_language, emergency_contact, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, age, gender, preferredLanguage, emergencyContact, notes],
            function(err2) {
              if (err2) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err2.message });
              }
              const patientId = this.lastID;

              // Link patient to caretaker
              db.run(
                `INSERT INTO patient_caretakers (patient_id, caretaker_id) VALUES (?, ?)`,
                [patientId, caretaker.id],
                function(err3) {
                  if (err3) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err3.message });
                  }
                  db.run('COMMIT');
                  res.status(201).json({
                    message: 'Patient created and linked to caretaker',
                    patientId: patientId,
                    userId: userId
                  });
                }
              );
            }
          );
        }
      );
    });
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

// ---- Medical reports (PDF / image, stored in SQLite) ----

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
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ message: 'Report uploaded', reportId: this.lastID, fileName: req.file.originalname, size: req.file.size });
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