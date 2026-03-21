require('dotenv').config();

// ── Startup security checks ───────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET environment variable is missing or too short (minimum 32 characters). Set it in your .env file.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Security middleware
const {
  securityHeaders,
  sanitizeInput,
  validateRequest,
  injectionCheck,
  corsOptions,
  bruteForceProtection
} = require('./middleware/security');

// Routes
const authRoutes = require('./routes/auth');
const vpnRoutes = require('./routes/vpn');
const serverRoutes = require('./routes/servers');
const createUserRouter = require('./routes/user');
const analyticsRoutes = require('./routes/analytics');
const securityRoutes = require('./routes/security');
// Share the users Map so the user router and analytics router can read/write user data
const userRoutes = createUserRouter(authRoutes.users);
const analyticsRouter = analyticsRoutes(authRoutes.users);
const adminRoutes = require('./routes/admin');
const speedtestRoutes = require('./routes/speedtest');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Core security middleware (order matters!)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Additional security headers
app.use(securityHeaders);

// CORS with strict configuration
app.use(cors(corsOptions));

// Global rate limiting
const isDev = process.env.NODE_ENV !== 'production';
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || (isDev ? 5000 : 300),
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => isDev  // no rate limiting in development
});
app.use(globalLimiter);

// Stricter rate limit for auth endpoints — count ALL attempts (success and failure)
// to prevent password-spraying attacks across many valid accounts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 10,
  message: { error: 'Too many authentication attempts' },
  skipSuccessfulRequests: false
});

// Body parsing with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security: Validate and sanitize all requests
app.use(validateRequest);
app.use(sanitizeInput);
app.use(injectionCheck);

// Request logging (sanitized)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 200)
  });
  next();
});

// Health check (public, no auth needed)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes with appropriate middleware
app.use('/api/auth', authLimiter, bruteForceProtection, authRoutes);
app.use('/api/vpn', vpnRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/user', userRoutes);
app.use('/api/analytics', analyticsRouter);
app.use('/api/security', securityRoutes);
app.use('/api/admin', adminRoutes);
// Speed-test upload uses raw body (binary stream), not JSON — mount before body parsers cap the size
app.use('/api/speedtest', speedtestRoutes);

// Error handling (sanitized - don't expose internal errors)
app.use((err, req, res, next) => {
  // Log the full error internally
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Send sanitized response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({ 
    error: statusCode === 500 ? 'Internal server error' : err.message,
    // Only include details in development
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Nebula VPN Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔐 Security middleware enabled`);
});

module.exports = app;
