const express = require('express');
const { authMiddleware, planMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const VPNService = require('../services/vpnService');

const router = express.Router();
const vpnService = new VPNService();

// Get connection status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = await vpnService.getStatus(req.user.email);
    res.json(status);
  } catch (error) {
    logger.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Connect to VPN
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { serverId, protocol, clientPublicKey } = req.body;

    if (!serverId) {
      return res.status(400).json({ error: 'Server ID required' });
    }

    // clientPublicKey is optional here — when the Electron client sends it the
    // server registers it as a WireGuard peer.  Browser/PWA sessions omit it.
    if (clientPublicKey !== undefined) {
      // Validate: must be a 44-char base64 string encoding 32 bytes
      const buf = Buffer.from(clientPublicKey, 'base64');
      if (typeof clientPublicKey !== 'string' || buf.length !== 32) {
        return res.status(400).json({ error: 'Invalid clientPublicKey' });
      }
    }

    const result = await vpnService.connect({
      userId: req.user.email,
      serverId,
      protocol: protocol || 'wireguard',
      plan: req.user.plan,
      clientPublicKey: clientPublicKey || undefined,
    });

    logger.info(`User ${req.user.email} connected to server ${serverId}`);

    res.json(result);
  } catch (error) {
    logger.error('Connection error:', error);
    res.status(500).json({ error: error.message || 'Connection failed' });
  }
});

// Disconnect from VPN
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const result = await vpnService.disconnect(req.user.email);
    logger.info(`User ${req.user.email} disconnected`);
    res.json(result);
  } catch (error) {
    logger.error('Disconnection error:', error);
    res.status(500).json({ error: 'Disconnection failed' });
  }
});

// Get connection config (WireGuard)
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const config = await vpnService.getConfig(req.user.email);
    res.json(config);
  } catch (error) {
    logger.error('Config error:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Multi-hop connection (Premium+)
router.post('/multihop', authMiddleware, planMiddleware('premium'), async (req, res) => {
  try {
    const { serverIds } = req.body;

    if (!serverIds || !Array.isArray(serverIds) || serverIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 servers required for multi-hop' });
    }

    const result = await vpnService.multiHopConnect({
      userId: req.user.email,
      serverIds,
      plan: req.user.plan
    });

    res.json(result);
  } catch (error) {
    logger.error('Multi-hop error:', error);
    res.status(500).json({ error: 'Multi-hop connection failed' });
  }
});

// Get traffic stats
router.get('/traffic', authMiddleware, async (req, res) => {
  try {
    const stats = await vpnService.getTrafficStats(req.user.email);
    res.json(stats);
  } catch (error) {
    logger.error('Traffic stats error:', error);
    res.status(500).json({ error: 'Failed to get traffic stats' });
  }
});

module.exports = router;
