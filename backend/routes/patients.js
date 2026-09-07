const express = require('express');
const multer = require('multer');
const router = express.Router();
const patientController = require('../controllers/patientController');
const auth = require('../middleware/auth');

// Medical report uploads: PDF or image, max 5 MB, kept in memory then stored in SQLite
const ALLOWED_MIME = ['application/pdf', 'image/png', 'image/jpeg'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    req.fileFilterMessage = 'Only PDF, PNG or JPG files are allowed';
    cb(null, false);
  },
});

router.get('/', auth, patientController.getAllPatients);
router.get('/:id', auth, patientController.getPatientById);
router.post('/', auth, patientController.createPatient);
router.put('/:id', auth, patientController.updatePatient);

// Medical report (latest per patient)
router.post('/:id/report', auth, upload.single('report'), patientController.uploadReport);
router.get('/:id/report', auth, patientController.getReport);
router.get('/:id/report/meta', auth, patientController.getReportMeta);

// JSON errors for multer failures (file too large etc.)
router.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large — maximum size is 5 MB' });
  }
  next(err);
});

module.exports = router;
