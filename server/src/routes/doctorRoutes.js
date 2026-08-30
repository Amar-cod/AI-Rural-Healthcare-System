const express = require('express');
const router = express.Router();
const { applyProfile, getProfile, getApprovedDoctors, getPatients, escalatePatientPriority } = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Public route for patients to find doctors
router.get('/', protect, getApprovedDoctors);

// Protected routes for doctors
router.post('/apply', protect, requireRole('doctor'), applyProfile);
router.get('/profile', protect, requireRole('doctor'), getProfile);
router.get('/patients', protect, requireRole('doctor'), getPatients);
router.patch('/patients/:id/escalate', protect, requireRole('doctor'), escalatePatientPriority);

module.exports = router;
