const express = require('express');
const router = express.Router();
const { createPrescription, getMyPrescriptions } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect);
router.post('/', requireRole('doctor'), createPrescription);
router.get('/mine', requireRole('patient'), getMyPrescriptions);

module.exports = router;
