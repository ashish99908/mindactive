const db = require('../database/db');

exports.getAnalytics = (req, res) => {
  const patientId = req.params.patientId;
  db.all(`SELECT gr.*, g.name as game_name FROM game_results gr JOIN games g ON gr.game_id = g.id WHERE gr.patient_id = ? ORDER BY gr.created_at ASC`, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};