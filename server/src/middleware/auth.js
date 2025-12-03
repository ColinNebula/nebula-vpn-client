const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const planMiddleware = (requiredPlan) => {
  return (req, res, next) => {
    const userPlan = req.user?.plan || 'free';
    const planHierarchy = { free: 0, premium: 1, ultimate: 2 };
    
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

module.exports = { authMiddleware, planMiddleware };
