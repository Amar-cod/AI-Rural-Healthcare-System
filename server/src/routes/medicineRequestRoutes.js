const express = require('express');
const router = express.Router();
const { createMedicineRequest, getMyRequests, updateRequestStatus } = require('../controllers/medicineRequestController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect);
router.post('/', requireRole('patient'), createMedicineRequest);
router.get('/mine', requireRole('patient'), getMyRequests);

// In a real app, 'pharmacist' might be a role. We will use admin for now.
router.patch('/:id/status', requireRole('admin'), updateRequestStatus);

module.exports = router;
