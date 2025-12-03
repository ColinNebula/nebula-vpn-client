const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, (req, res) => {
  res.json({
    email: req.user.email,
    plan: req.user.plan,
    // Add more user data as needed
  });
});

// Update user plan (for testing - in production this would be via payment)
router.post('/upgrade', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!['free', 'premium', 'ultimate'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // In production, verify payment here
    req.user.plan = plan;
    
    logger.info(`User ${req.user.email} upgraded to ${plan}`);
    
    res.json({
      success: true,
      plan,
      message: `Successfully upgraded to ${plan}`
    });
  } catch (error) {
    logger.error('Upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

module.exports = router;
