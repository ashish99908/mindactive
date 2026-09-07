const db = require('../database/db');
const groqService = require('../services/groqService');

exports.analyzePatient = async (req, res) => {
  const patientId = req.params.patientId;
  db.get(`SELECT u.name FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?`, [patientId], async (err, patient) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    db.all(`SELECT gr.*, g.name as game_name FROM game_results gr JOIN games g ON gr.game_id = g.id WHERE gr.patient_id = ? ORDER BY gr.created_at ASC`, [patientId], async (err2, results) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (results.length === 0) return res.status(400).json({ error: 'No game results found' });
      const patientData = { patientName: patient.name, gameResults: results };
      try {
        const analysis = await groqService.analyzePerformance(patientData);
        db.run(`INSERT INTO ai_analyses (patient_id, analysis) VALUES (?,?)`, [patientId, JSON.stringify(analysis)]);
        res.json(analysis);
      } catch (error) {
        console.error('AI error:', error.message);
        // Surface the real reason (bad key, decommissioned model, rate limit…) so the UI can show it
        res.status(502).json({ error: `AI analysis failed — ${error.message}` });
      }
    });
  });
};