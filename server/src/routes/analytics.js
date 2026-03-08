const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// Receives the shared users Map from index.js
const createAnalyticsRouter = (users) => {
  const router = express.Router();

  // Get connection history
  router.get('/history', authMiddleware, (req, res) => {
    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ connections: user.connectionHistory || [] });
  });

  // Log a connection event (called by client on connect/disconnect)
  router.post('/connections', authMiddleware, (req, res) => {
    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { server, protocol, status, startTime, endTime, duration, dataUsed, ip } = req.body;

    if (!server || !status) {
      return res.status(400).json({ error: 'server and status are required' });
    }

    // Validate status value
    const validStatuses = ['active', 'completed', 'failed', 'disconnected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (!user.connectionHistory) user.connectionHistory = [];

    // Cap stored history at 500 entries per user
    if (user.connectionHistory.length >= 500) {
      user.connectionHistory = user.connectionHistory.slice(-499);
    }

    const entry = {
      id: `conn-${Date.now()}`,
      server:     String(server).slice(0, 100),
      protocol:   protocol ? String(protocol).slice(0, 50) : 'wireguard',
      status,
      startTime:  startTime || new Date().toISOString(),
      endTime:    endTime || null,
      duration:   duration || null,
      dataUsed:   dataUsed != null ? Number(dataUsed) : null,
      ip:         ip ? String(ip).slice(0, 45) : null,
      encryption: 'AES-256',
    };

    user.connectionHistory.push(entry);
    logger.info(`Connection logged for ${req.user.email}: ${status} ${server}`);

    res.status(201).json(entry);
  });

  // Get data usage
  router.get('/usage', authMiddleware, (req, res) => {
    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = user.connectionHistory || [];
    const now = Date.now();
    const dayMs   = 86400000;
    const weekMs  = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const sum = (entries) =>
      entries.reduce((acc, c) => acc + (c.dataUsed || 0), 0);

    res.json({
      today:     sum(history.filter(c => now - new Date(c.startTime).getTime() < dayMs)),
      thisWeek:  sum(history.filter(c => now - new Date(c.startTime).getTime() < weekMs)),
      thisMonth: sum(history.filter(c => now - new Date(c.startTime).getTime() < monthMs)),
      total:     sum(history),
    });
  });

  return router;
};

module.exports = createAnalyticsRouter;
