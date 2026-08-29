const express = require('express');
const router = express.Router();
const { getHandedOffSessions, overridePriority } = require('../controllers/consultationController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect);
router.get('/', requireRole('doctor'), getHandedOffSessions);
router.patch('/:id/priority', requireRole('doctor'), overridePriority);

module.exports = router;
