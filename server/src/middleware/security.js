/**
 * Security Middleware for Nebula VPN Server
 * Provides comprehensive protection against common web attacks
 */

const crypto = require('crypto');

/**
 * Enhanced security headers middleware
 * Implements OWASP recommended security headers
 */
const securityHeaders = (req, res, next) => {
  // Generate nonce for inline scripts (CSP)
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  // Content Security Policy - strict policy to prevent XSS
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'", // Required for some UI frameworks
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.nebulavpn.com wss:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Security Headers
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Remove potentially dangerous headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Strict Transport Security (enable in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * Input sanitization middleware
 * Cleans and validates all incoming data
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove null bytes
      obj = obj.replace(/\0/g, '');
      // Escape HTML entities
      obj = obj
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      // Trim whitespace
      obj = obj.trim();
      // Limit string length to prevent DOS
      if (obj.length > 10000) {
        obj = obj.substring(0, 10000);
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key of Object.keys(obj)) {
        // Sanitize keys too (prevent prototype pollution)
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
        if (safeKey && safeKey !== '__proto__' && safeKey !== 'constructor' && safeKey !== 'prototype') {
          sanitized[safeKey] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Request validation middleware
 * Validates request structure and prevents malicious payloads
 */
const validateRequest = (req, res, next) => {
  // Check Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    if (contentType && !contentType.includes('application/json') && 
        !contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('multipart/form-data')) {
      return res.status(415).json({ error: 'Unsupported Media Type' });
    }
  }

  // Check request size (additional layer on top of body-parser limit)
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (contentLength > maxSize) {
    return res.status(413).json({ error: 'Request Entity Too Large' });
  }

  // Block suspicious user agents
  const userAgent = req.get('user-agent') || '';
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /arachni/i,
    /w3af/i,
    /^$/  // Empty user agent
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  next();
};

/**
 * SQL Injection prevention patterns
 */
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /(--|#|\/\*|\*\/)/,
  /(\bOR\b|\bAND\b)\s*[\d\w'"=]/i,
  /'\s*(OR|AND)\s*'?\d/i,
  /;\s*(DROP|DELETE|UPDATE|INSERT)/i
];

/**
 * XSS prevention patterns
 */
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /data:text\/html/gi
];

/**
 * Path traversal prevention patterns
 */
const pathTraversalPatterns = [
  /\.\.\//,
  /\.\.\\/, 
  /%2e%2e/i,
  /%252e/i
];

/**
 * Deep injection check middleware
 * Scans all input for malicious patterns
 */
const injectionCheck = (req, res, next) => {
  const checkValue = (value, path = '') => {
    if (typeof value === 'string') {
      // Check for SQL injection
      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(value)) {
          return { blocked: true, reason: 'SQL Injection detected', path };
        }
      }
      // Check for XSS
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          return { blocked: true, reason: 'XSS detected', path };
        }
      }
      // Check for path traversal
      for (const pattern of pathTraversalPatterns) {
        if (pattern.test(value)) {
          return { blocked: true, reason: 'Path traversal detected', path };
        }
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const result = checkValue(value[i], `${path}[${i}]`);
        if (result.blocked) return result;
      }
    } else if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        const result = checkValue(value[key], `${path}.${key}`);
        if (result.blocked) return result;
      }
    }
    return { blocked: false };
  };

  // Check body, query, and params
  const sources = [
    { data: req.body, name: 'body' },
    { data: req.query, name: 'query' },
    { data: req.params, name: 'params' }
  ];

  for (const source of sources) {
    if (source.data) {
      const result = checkValue(source.data, source.name);
      if (result.blocked) {
        console.warn(`[SECURITY] ${result.reason} at ${result.path}`, {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        return res.status(400).json({ error: 'Invalid input detected' });
      }
    }
  }

  next();
};

/**
 * CORS preflight cache
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400 // 24 hours
};

/**
 * IP-based blocking middleware
 * Blocks known malicious IPs (can be enhanced with external threat feeds)
 */
const blockedIPs = new Set();

const ipBlocker = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};

/**
 * Add IP to blocklist
 */
const blockIP = (ip) => {
  blockedIPs.add(ip);
};

/**
 * Remove IP from blocklist
 */
const unblockIP = (ip) => {
  blockedIPs.delete(ip);
};

/**
 * Brute force protection
 * Tracks failed attempts per IP
 */
const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const bruteForceProtection = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const attempts = failedAttempts.get(clientIP);
  
  if (attempts && attempts.count >= MAX_FAILED_ATTEMPTS) {
    const timeSinceLockout = Date.now() - attempts.lastAttempt;
    if (timeSinceLockout < LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLockout) / 1000 / 60);
      return res.status(429).json({ 
        error: 'Too many failed attempts',
        retryAfter: remainingTime + ' minutes'
      });
    } else {
      // Lockout expired, reset
      failedAttempts.delete(clientIP);
    }
  }
  
  // Add helper to record failed attempts
  res.locals.recordFailedAttempt = () => {
    const current = failedAttempts.get(clientIP) || { count: 0 };
    failedAttempts.set(clientIP, {
      count: current.count + 1,
      lastAttempt: Date.now()
    });
  };
  
  // Add helper to reset on successful auth
  res.locals.resetFailedAttempts = () => {
    failedAttempts.delete(clientIP);
  };
  
  next();
};

module.exports = {
  securityHeaders,
  sanitizeInput,
  validateRequest,
  injectionCheck,
  corsOptions,
  ipBlocker,
  blockIP,
  unblockIP,
  bruteForceProtection
};
