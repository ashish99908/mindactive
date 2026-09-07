const express = require('express');
const router = express.Router();
const controller = require('../controllers/gameResultController');
const auth = require('../middleware/auth');
router.post('/', auth, controller.saveResult);
router.get('/', auth, controller.getMyResults);      // results for the logged-in patient
router.get('/:patientId', auth, controller.getResults); // results for a specific patient (caretaker)
module.exports = router;