const express = require('express');
const router = express.Router();
const { getAllSymptoms } = require('../controllers/symptomController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllSymptoms);

module.exports = router;
