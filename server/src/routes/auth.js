const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory user store (replace with database in production)
const users = new Map();

// ── Seed default admin account on startup ────────────────────────────
;(async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    logger.error('FATAL: ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set. Refusing to start.');
    process.exit(1);
  }
  if (!users.has(adminEmail)) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    users.set(adminEmail, {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      plan: 'enterprise',
      createdAt: new Date(),
      devices: [],
      dataUsage: 0
    });
    logger.info(`Admin account seeded: ${adminEmail}`);
  }
})();

// Expose users map so admin routes can read/modify it
// users map is attached to router below before export

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Enforce password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter and one number' });
    }

    // Enforce field length limits
    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Input exceeds maximum length' });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = {
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user',
      plan: 'free',
      createdAt: new Date(),
      devices: [],
      dataUsage: 0,
      settings: {}
    };

    users.set(email, user);

    const token = jwt.sign(
      { email, plan: user.plan, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      token,
      user: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        settings: user.settings
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.get(email);
    if (!user) {
      // Perform dummy compare to prevent timing-based user enumeration
      await bcrypt.compare(password, '$2a$12$invalidhashpaddingtopreventitenumeration000000000000000');
      res.locals.recordFailedAttempt?.();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.locals.recordFailedAttempt?.();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.locals.resetFailedAttempts?.();

    const token = jwt.sign(
      { email, plan: user.plan, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        settings: user.settings || {}
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.get(decoded.email);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        settings: user.settings || {}
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// OAuth / Social Sign-In — finds or creates a user from a provider identity
// In production: verify the provider token (id_token / access_token) server-side
// before trusting the profile payload (e.g. google-auth-library, apple-signin-auth, @azure/msal-node).
router.post('/oauth', async (req, res) => {
  try {
    const { provider, profile } = req.body;

    const allowedProviders = ['google', 'apple', 'microsoft'];
    if (!provider || !allowedProviders.includes(provider)) {
      return res.status(400).json({ error: 'Unsupported or missing OAuth provider' });
    }

    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({ error: 'OAuth profile is required' });
    }

    const email = (profile.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email in OAuth profile' });
    }

    // Sanitise name — strip any control characters and limit length
    const rawName = typeof profile.name === 'string' ? profile.name : '';
    const name = rawName.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 100) || email.split('@')[0];

    let user = users.get(email);
    const isNewUser = !user;

    if (isNewUser) {
      user = {
        email,
        password: null, // OAuth users authenticate via provider — no local password
        name,
        role: 'user',
        plan: 'free',
        createdAt: new Date(),
        devices: [],
        dataUsage: 0,
        settings: {},
        oauthProvider: provider,
        oauthId: typeof profile.sub === 'string' ? profile.sub.slice(0, 128) : email
      };
      users.set(email, user);
      logger.info(`New user registered via ${provider} OAuth: ${email}`);
    } else {
      logger.info(`User signed in via ${provider} OAuth: ${email}`);
    }

    const token = jwt.sign(
      { email: user.email, plan: user.plan, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    res.status(isNewUser ? 201 : 200).json({
      token,
      isNewUser,
      user: {
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
        settings: user.settings || {}
      }
    });
  } catch (error) {
    logger.error('OAuth error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

router.users = users;
module.exports = router;
