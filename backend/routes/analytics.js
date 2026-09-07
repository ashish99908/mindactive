const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
router.get('/:patientId', auth, controller.getAnalytics);
module.exports = router;