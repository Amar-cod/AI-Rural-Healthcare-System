const express = require('express');
const router = express.Router();
const { applyProfile, getProfile, getApprovedDoctors } = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Public route for patients to find doctors
router.get('/', protect, getApprovedDoctors);

// Protected routes for doctors
router.post('/apply', protect, requireRole('doctor'), applyProfile);
router.get('/profile', protect, requireRole('doctor'), getProfile);

module.exports = router;
