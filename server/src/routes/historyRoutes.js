const express = require('express');
const router = express.Router();
const { getPatientHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/:patientId', getPatientHistory);

module.exports = router;
