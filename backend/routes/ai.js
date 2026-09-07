const express = require('express');
const router = express.Router();
const controller = require('../controllers/aiController');
const auth = require('../middleware/auth');
router.post('/analyze/:patientId', auth, controller.analyzePatient);
module.exports = router;