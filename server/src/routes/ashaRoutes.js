const express = require('express');
const router = express.Router();
const { 
  getMyVillages,
  registerPatient,
  uploadPatientPhoto,
  uploadPatientReport,
  getVillagePatients
} = require('../controllers/ashaController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { verifyAshaPatientAccess } = require('../middleware/verifyAshaPatientAccess');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(requireRole('asha_worker'));

// Phase 2C
router.get('/villages', getMyVillages);

// Phase 2D
router.get('/villages/:id/patients', getVillagePatients);
router.post('/patients', registerPatient);

// Apply verifyAshaPatientAccess before multer to ensure auth, 
// then upload.single, then controller.
router.post('/patients/:id/photo', verifyAshaPatientAccess, upload.single('photo'), uploadPatientPhoto);
router.post('/patients/:id/report', verifyAshaPatientAccess, upload.single('report'), uploadPatientReport);

module.exports = router;
