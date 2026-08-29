const express = require('express');
const router = express.Router();
const { joinQueue, getQueue, updateQueueStatus } = require('../controllers/queueController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect);
router.post('/join', requireRole('patient'), joinQueue);
router.get('/:doctorId', getQueue); // Public for all logged-in users to see wait list
router.patch('/:id/status', requireRole('doctor'), updateQueueStatus);

module.exports = router;
