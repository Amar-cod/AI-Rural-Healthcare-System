const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chatWithAI, handoffSession } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Rate limiter: 20 requests per minute per IP to protect free Gemini quota
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { message: 'Too many requests. Please wait a moment before sending another message.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.post('/chat', requireRole('patient'), aiChatLimiter, chatWithAI);
router.post('/session/:id/handoff', requireRole('patient'), handoffSession);

module.exports = router;
