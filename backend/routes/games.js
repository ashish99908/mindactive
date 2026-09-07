const express = require('express');
const router = express.Router();
const db = require('../database/db');
router.get('/', (req, res) => {
  db.all(`SELECT * FROM games ORDER BY id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM games WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Game not found' });
    res.json(row);
  });
});
module.exports = router;