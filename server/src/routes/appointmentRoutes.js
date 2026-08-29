const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments } = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect);
router.post('/', requireRole('patient'), createAppointment);
router.get('/', getAppointments); // For both patients and doctors

module.exports = router;
