const express = require('express');
const router = express.Router();
const { getAllApplications, updateDoctorStatus } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect, requireRole('admin'));

router.get('/doctors', getAllApplications);
router.patch('/doctors/:id/status', updateDoctorStatus);

module.exports = router;
