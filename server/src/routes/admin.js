const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require a valid JWT AND admin role
router.use(authMiddleware, adminMiddleware);

// ── Helper: strip sensitive fields before sending ──────────────────────────
const sanitizeUser = (user) => ({
  email: user.email,
  name: user.name,
  role: user.role,
  plan: user.plan,
  createdAt: user.createdAt,
  dataUsage: user.dataUsage,
  deviceCount: (user.devices || []).length
});

// ── GET /api/admin/users ─────────────────────────────────────────────────
// List all registered users
router.get('/users', (req, res) => {
  try {
    const { users } = require('./auth');
    const list = Array.from(users.values()).map(sanitizeUser);
    res.json({ users: list, total: list.length });
  } catch (err) {
    logger.error('Admin list users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── PATCH /api/admin/users/:email/role ────────────────────────────────────
// Change a user's role (user | admin)
router.patch('/users/:email/role', (req, res) => {
  try {
    const { users } = require('./auth');
    const { email } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin"' });
    }

    // Prevent the last admin from demoting themselves
    if (email === req.user.email && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const user = users.get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;
    users.set(email, user);
    logger.info(`Admin ${req.user.email} changed role of ${email} to ${role}`);
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    logger.error('Admin change role error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ── PATCH /api/admin/users/:email/plan ───────────────────────────────────
// Change a user's subscription plan
router.patch('/users/:email/plan', (req, res) => {
  try {
    const { users } = require('./auth');
    const { email } = req.params;
    const { plan } = req.body;

    if (!['free', 'premium', 'ultimate', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const user = users.get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.plan = plan;
    users.set(email, user);
    logger.info(`Admin ${req.user.email} changed plan of ${email} to ${plan}`);
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    logger.error('Admin change plan error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// ── DELETE /api/admin/users/:email ───────────────────────────────────────
// Delete a user account
router.delete('/users/:email', (req, res) => {
  try {
    const { users } = require('./auth');
    const { email } = req.params;

    if (email === req.user.email) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    if (!users.has(email)) return res.status(404).json({ error: 'User not found' });

    users.delete(email);
    logger.info(`Admin ${req.user.email} deleted user ${email}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── GET /api/admin/stats ─────────────────────────────────────────────────
// System-wide statistics
router.get('/stats', (req, res) => {
  try {
    const { users } = require('./auth');
    const all = Array.from(users.values());

    const planBreakdown = all.reduce((acc, u) => {
      acc[u.plan] = (acc[u.plan] || 0) + 1;
      return acc;
    }, {});

    const roleBreakdown = all.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalUsers: all.length,
      planBreakdown,
      roleBreakdown,
      serverUptime: process.uptime(),
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
