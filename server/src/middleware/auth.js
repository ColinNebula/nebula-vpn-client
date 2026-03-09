const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// In-memory token revocation list.
// Entries are pruned when the token's own exp timestamp passes,
// so memory stays bounded to the number of actively-logged-out tokens.
const revokedTokens = new Set();

const revokeToken = (token) => {
  revokedTokens.add(token);
  // Auto-purge after the token's natural expiry (max 7 days = 604800s)
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      const msRemaining = decoded.exp * 1000 - Date.now();
      if (msRemaining > 0) setTimeout(() => revokedTokens.delete(token), msRemaining);
    }
  } catch { /* ignore */ }
};

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (revokedTokens.has(token)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    req.token = token; // expose for logout handler
    next();
  } catch (error) {
    logger.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based guard — call after authMiddleware
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Unauthorised admin access attempt by ${req.user?.email || 'unknown'}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const planMiddleware = (requiredPlan) => {
  return (req, res, next) => {
    // Admin role bypasses all plan restrictions
    if (req.user?.role === 'admin') return next();

    const userPlan = req.user?.plan || 'free';
    const planHierarchy = { free: 0, premium: 1, ultimate: 2, enterprise: 3 };
    
    if (planHierarchy[userPlan] < planHierarchy[requiredPlan]) {
      return res.status(403).json({ 
        error: 'Upgrade required',
        requiredPlan,
        currentPlan: userPlan
      });
    }
    
    next();
  };
};

module.exports = { authMiddleware, adminMiddleware, planMiddleware, revokeToken };

