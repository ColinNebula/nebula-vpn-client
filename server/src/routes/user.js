const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// Factory: receives the shared users Map from auth.js so settings persist in-memory
module.exports = function createUserRouter(users) {
  const router = express.Router();

  // Get user profile (includes saved settings)
  router.get('/profile', authMiddleware, (req, res) => {
    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      email: user.email,
      name: user.name,
      plan: user.plan,
      role: user.role,
      settings: user.settings || {}
    });
  });

  // Save user preferences / settings
  router.put('/settings', authMiddleware, (req, res) => {
    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Whitelist the keys we allow to be stored — never let a client
    // smuggle in role, plan, password, or other privileged fields.
    const ALLOWED_KEYS = [
      'settings', 'isDarkMode', 'selectedServerId',
      'recentServers', 'favoriteServers',
      'rotatingIPEnabled', 'rotatingIPInterval',
      'autoConnectWiFiEnabled', 'trustedNetworks',
      'splitTunnelApps', 'multiHopServerIds'
    ];

    const sanitized = {};
    for (const key of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        sanitized[key] = req.body[key];
      }
    }

    user.settings = sanitized;
    logger.info(`Settings saved for ${req.user.email}`);
    res.json({ ok: true });
  });

  // Update user plan (payment verification required)
  // NOTE: self-service plan changes are intentionally disabled.
  // Plan upgrades must be managed by an admin via /api/admin/users/:email/plan
  // or through a verified payment webhook integration.
  router.post('/upgrade', authMiddleware, (req, res) => {
    return res.status(403).json({
      error: 'Self-service plan upgrades are not permitted. Please complete a payment or contact support.'
    });
  });

  return router;
};
