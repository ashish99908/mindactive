const db = require('../database/db');

/**
 * Resolve the authoritative patients.id for the authenticated user.
 * - Patients: ALWAYS resolved from their own user_id (client-sent ids are untrusted
 *   and caused results being stored under users.id instead of patients.id).
 * - Caretakers: may post on behalf of a patient via body.patientId.
 */
const resolvePatientId = (req, callback) => {
  if (req.user.role === 'patient') {
    db.get(`SELECT id FROM patients WHERE user_id = ?`, [req.user.userId], (err, p) => {
      if (err || !p) return callback(new Error('Patient profile not found'));
      callback(null, p.id);
    });
  } else {
    const pid = Number(req.body.patientId);
    if (!pid) return callback(new Error('Missing patientId'));
    db.get(`SELECT id FROM patients WHERE id = ?`, [pid], (err, p) => {
      if (err || !p) return callback(new Error('Patient not found'));
      callback(null, p.id);
    });
  }
};

exports.saveResult = (req, res) => {
  const { gameId, level, score, accuracy, correctAnswers, wrongAnswers, attempts, completionTime, reactionTime, hintsUsed, audioUsed } = req.body;
  if (!gameId || level === undefined) return res.status(400).json({ error: 'Missing fields' });

  resolvePatientId(req, (err, patientId) => {
    if (err) return res.status(400).json({ error: err.message });
    db.run(`
      INSERT INTO game_results
      (patient_id, game_id, level, score, accuracy, correct_answers, wrong_answers, attempts, completion_time, average_reaction_time, hints_used, audio_used)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `, [patientId, gameId, level, score || 0, accuracy || 0, correctAnswers || 0, wrongAnswers || 0, attempts || 0, completionTime || 0, reactionTime || 0, hintsUsed || 0, audioUsed ? 1 : 0], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({ id: this.lastID, patientId });
    });
  });
};

exports.getResults = (req, res) => {
  const patientId = req.params.patientId;
  db.all(`SELECT gr.*, g.name as game_name FROM game_results gr JOIN games g ON gr.game_id = g.id WHERE gr.patient_id = ? ORDER BY gr.created_at DESC`, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// GET /api/game-results — results for the authenticated patient (id resolved from token,
// so it works even for tokens issued before patientId was embedded correctly).
exports.getMyResults = (req, res) => {
  if (req.user.role !== 'patient') return res.status(400).json({ error: 'Patient role required' });
  db.get(`SELECT id FROM patients WHERE user_id = ?`, [req.user.userId], (err, p) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!p) return res.json([]);
    db.all(`SELECT gr.*, g.name as game_name FROM game_results gr JOIN games g ON gr.game_id = g.id WHERE gr.patient_id = ? ORDER BY gr.created_at DESC`, [p.id], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(rows);
    });
  });
};
