const express = require('express');
const router = express.Router();
const { 
  getPendingApplications, 
  updateApplicationStatus,
  getVillages,
  createVillage,
  getAshaWorkers,
  createAshaWorker,
  assignAshaToVillage
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect, requireRole('admin'));

// Doctor applications
router.get('/doctors', getPendingApplications);
router.patch('/doctors/:id/status', updateApplicationStatus);

// Villages
router.get('/villages', getVillages);
router.post('/villages', createVillage);
router.post('/villages/:villageId/assign', assignAshaToVillage);

// ASHA Workers
router.get('/asha-workers', getAshaWorkers);
router.post('/asha-workers', createAshaWorker);

module.exports = router;
