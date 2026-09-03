const express = require('express');
const router = express.Router();
const { getAllVillages, getVillageHistory } = require('../controllers/villageController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAllVillages);
router.get('/:id/history', getVillageHistory);

module.exports = router;
