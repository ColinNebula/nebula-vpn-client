const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get connection history
router.get('/history', authMiddleware, (req, res) => {
  // Mock data - replace with database query
  res.json({
    connections: [
      { timestamp: new Date(), server: 'US East', duration: 3600, dataUsed: 1024 }
    ]
  });
});

// Get data usage
router.get('/usage', authMiddleware, (req, res) => {
  res.json({
    today: 512,
    thisWeek: 2048,
    thisMonth: 8192,
    total: 50000
  });
});

module.exports = router;
