const express = require('express');
const router = express.Router();
const { getMyVillages } = require('../controllers/ashaController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(protect);
router.use(requireRole('asha_worker'));

router.get('/villages', getMyVillages);

module.exports = router;
