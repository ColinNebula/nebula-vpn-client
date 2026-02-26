const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Server database (in production, this would be in a database)
const servers = [
  { id: '1', name: 'US East', location: 'New York', country: 'US', flag: '🇺🇸', ip: '192.0.2.1', load: 45, ping: 25, streaming: true, gaming: true, p2p: true, tier: 'free' },
  { id: '2', name: 'US West', location: 'Los Angeles', country: 'US', flag: '🇺🇸', ip: '192.0.2.2', load: 32, ping: 18, streaming: true, gaming: true, p2p: false, tier: 'free' },
  { id: '3', name: 'Europe', location: 'Frankfurt', country: 'DE', flag: '🇩🇪', ip: '192.0.2.3', load: 67, ping: 45, streaming: true, gaming: false, p2p: true, tier: 'free' },
  { id: '4', name: 'Asia Gaming', location: 'Singapore', country: 'SG', flag: '🇸🇬', ip: '192.0.2.4', load: 23, ping: 120, streaming: false, gaming: true, p2p: false, tier: 'premium' },
  { id: '5', name: 'Canada', location: 'Toronto', country: 'CA', flag: '🇨🇦', ip: '192.0.2.5', load: 56, ping: 30, streaming: true, gaming: true, p2p: true, tier: 'premium' },
  { id: '6', name: 'UK Streaming', location: 'London', country: 'GB', flag: '🇬🇧', ip: '192.0.2.6', load: 78, ping: 55, streaming: true, gaming: false, p2p: false, tier: 'premium' },
  { id: '7', name: 'Australia', location: 'Sydney', country: 'AU', flag: '🇦🇺', ip: '192.0.2.7', load: 34, ping: 180, streaming: true, gaming: false, p2p: true, tier: 'premium' },
  { id: '8', name: 'Japan Gaming', location: 'Tokyo', country: 'JP', flag: '🇯🇵', ip: '192.0.2.8', load: 89, ping: 140, streaming: false, gaming: true, p2p: false, tier: 'premium' },
  { id: '9', name: 'Netherlands P2P', location: 'Amsterdam', country: 'NL', flag: '🇳🇱', ip: '192.0.2.9', load: 42, ping: 50, streaming: false, gaming: false, p2p: true, tier: 'ultimate' },
  { id: '10', name: 'France', location: 'Paris', country: 'FR', flag: '🇫🇷', ip: '192.0.2.10', load: 65, ping: 48, streaming: true, gaming: true, p2p: false, tier: 'ultimate' }
];

// Get all servers (filtered by plan)
router.get('/', authMiddleware, (req, res) => {
  try {
    const userPlan = req.user.plan || 'free';
    const isAdmin = req.user.role === 'admin';
    
    let availableServers = servers;
    
    // Admin gets access to all servers; otherwise filter based on plan
    if (!isAdmin) {
      if (userPlan === 'free') {
        availableServers = servers.filter(s => s.tier === 'free');
      } else if (userPlan === 'premium') {
        availableServers = servers.filter(s => s.tier === 'free' || s.tier === 'premium');
      }
    }
    
    // Add random ping variation for realism
    availableServers = availableServers.map(server => ({
      ...server,
      ping: server.ping + Math.floor(Math.random() * 10 - 5),
      load: Math.min(100, Math.max(0, server.load + Math.floor(Math.random() * 10 - 5)))
    }));

    res.json({ 
      servers: availableServers,
      count: availableServers.length
    });
  } catch (error) {
    logger.error('Get servers error:', error);
    res.status(500).json({ error: 'Failed to get servers' });
  }
});

// Get single server
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const server = servers.find(s => s.id === req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const userPlan = req.user.plan || 'free';
    const isAdmin = req.user.role === 'admin';
    const planHierarchy = { free: 0, premium: 1, ultimate: 2 };
    const serverHierarchy = { free: 0, premium: 1, ultimate: 2 };

    if (!isAdmin && planHierarchy[userPlan] < serverHierarchy[server.tier]) {
      return res.status(403).json({ 
        error: 'Upgrade required',
        requiredPlan: server.tier 
      });
    }

    res.json(server);
  } catch (error) {
    logger.error('Get server error:', error);
    res.status(500).json({ error: 'Failed to get server' });
  }
});

// Test server ping
router.post('/:id/ping', authMiddleware, async (req, res) => {
  try {
    const server = servers.find(s => s.id === req.params.id);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Simulate ping test
    const pingResult = server.ping + Math.floor(Math.random() * 10 - 5);
    
    res.json({
      serverId: server.id,
      ping: pingResult,
      status: 'online'
    });
  } catch (error) {
    logger.error('Ping test error:', error);
    res.status(500).json({ error: 'Ping test failed' });
  }
});

module.exports = router;
