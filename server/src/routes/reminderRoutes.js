const express = require('express');
const router = express.Router();
const { getMyReminders, updateReminderStatus, subscribeToPush } = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All reminder routes require patient role
router.use(protect);
router.use(requireRole('patient'));

router.get('/me', getMyReminders);
router.patch('/:id', updateReminderStatus);
router.post('/subscribe', subscribeToPush);

module.exports = router;
