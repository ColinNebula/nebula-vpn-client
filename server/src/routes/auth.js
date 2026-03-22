const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../utils/logger');
const { authMiddleware, revokeToken } = require('../middleware/auth');
const { UserStore } = require('../db');

const router = express.Router();

// SQLite-backed user store
const users = new UserStore();

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
      // Generic message to prevent email enumeration
      return res.status(409).json({ error: 'Registration failed. Please try a different email or log in.' });
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
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
        twoFactorEnabled: !!user.twoFactorEnabled,
        settings: user.settings || {}
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// OAuth / Social Sign-In - finds or creates a user from a provider identity
//
// SECURITY: This endpoint MUST verify the provider-issued token server-side
// before trusting any profile data. The provider token (id_token / access_token)
// must be sent by the client and validated here using the provider's SDK:
//   • Google  - google-auth-library: verifyIdToken()
//   • Apple   - apple-signin-auth: verifyIdToken()
// Logout - revoke the token server-side so it can't be reused even if stolen
router.post('/logout', authMiddleware, (req, res) => {
  revokeToken(req.token);
  logger.info(`User logged out: ${req.user.email}`);
  res.json({ ok: true });
});

//   • Microsoft - @azure/msal-node
//
// Until that verification is in place the endpoint is disabled to prevent
// authentication bypass (an attacker could supply any email as `profile.email`
// and receive a valid JWT for that account, including admin accounts).
router.post('/oauth', async (req, res) => {
  // TODO: implement server-side provider token verification before enabling.
  return res.status(501).json({
    error: 'OAuth sign-in is not yet available. Please use email/password login.',
  });

  /* eslint-disable no-unreachable */
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

    // Sanitise name - strip any control characters and limit length
    const rawName = typeof profile.name === 'string' ? profile.name : '';
    const name = rawName.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 100) || email.split('@')[0];

    let user = users.get(email);
    const isNewUser = !user;

    if (isNewUser) {
      user = {
        email,
        password: null, // OAuth users authenticate via provider - no local password
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

// ── OAuth 2.0 Authorization Code Flow ──────────────────────────────────────
// Redirect-based flow: browser → backend /start → provider → backend /callback → frontend

const OAUTH_ALLOWED_APP_URLS = (process.env.ALLOWED_ORIGINS || '').split(',').map(u => u.trim()).filter(Boolean);

// In-memory CSRF state store { state → { provider, appUrl, expiresAt } }
const oauthStateStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of oauthStateStore) {
    if (v.expiresAt < now) oauthStateStore.delete(k);
  }
}, 600_000);

function oauthSafeAppUrl(raw) {
  try {
    const url = new URL(raw);
    if (OAUTH_ALLOWED_APP_URLS.some(allowed => raw.startsWith(allowed))) return url.href;
  } catch {}
  return OAUTH_ALLOWED_APP_URLS[0] || 'https://colinnebula.github.io/nebula-vpn-client/';
}

function oauthProviderConfig(provider) {
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const cfgs = {
    google: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: 'openid email profile',
      clientId,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      usesIdToken: true,
    },
    github: {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      scopes: 'read:user user:email',
      clientId,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      usesIdToken: false, // GitHub uses access_token + user API, no id_token
    },
  };
  return cfgs[provider] || null;
}

// Redirect user to provider sign-in page
router.get('/oauth/:provider/start', (req, res) => {
  const { provider } = req.params;
  const config = oauthProviderConfig(provider);
  const appUrl = oauthSafeAppUrl(req.query.app_url || '');

  if (!config || !config.clientId) {
    logger.warn(`OAuth start: ${provider} not configured`);
    return res.redirect(`${appUrl}?oauth_error=${encodeURIComponent(provider + '_not_configured')}`);
  }

  // Limit state store size to prevent memory exhaustion
  if (oauthStateStore.size >= 5000) {
    const oldest = oauthStateStore.keys().next().value;
    oauthStateStore.delete(oldest);
  }

  const state = crypto.randomBytes(20).toString('hex');
  oauthStateStore.set(state, { provider, appUrl, expiresAt: Date.now() + 600_000 });

  const backendBase = process.env.BACKEND_BASE_URL || 'https://api.nebula3ddev.com/api';
  const redirectUri = `${backendBase}/auth/oauth/${provider}/callback`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scopes,
    response_type: 'code',
    state,
    ...(provider === 'google' ? { access_type: 'online', prompt: 'select_account' } : {}),
  });

  logger.info(`OAuth ${provider} flow started`);
  res.redirect(`${config.authUrl}?${params}`);
});

// Handle provider callback - GET for Google/Microsoft, POST for Apple (form_post)
const handleOAuthCallback = async (req, res) => {
  const { provider } = req.params;
  // Merge query + body so both GET and Apple's form POST work uniformly
  const { code, state, error } = { ...req.query, ...req.body };

  const storedState = state ? oauthStateStore.get(state) : null;
  const appUrl = storedState?.appUrl || oauthSafeAppUrl('');

  if (error || !storedState || storedState.provider !== provider) {
    logger.warn(`OAuth ${provider} callback: ${error || 'invalid state'}`);
    return res.redirect(`${appUrl}?oauth_error=${encodeURIComponent(error || 'state_mismatch')}`);
  }
  oauthStateStore.delete(state);

  if (!code) return res.redirect(`${appUrl}?oauth_error=no_code`);

  const config = oauthProviderConfig(provider);
  const backendBase = process.env.BACKEND_BASE_URL || 'https://api.nebula3ddev.com/api';
  const redirectUri = `${backendBase}/auth/oauth/${provider}/callback`;

  try {
    const tokenRes = await axios.post(
      config.tokenUrl,
      new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, timeout: 10_000 }
    );

    const { id_token, access_token } = tokenRes.data;

    let email = '';
    let name  = '';
    let sub   = '';

    if (config.usesIdToken) {
      // Google: parse the signed id_token JWT
      if (!id_token) throw new Error('No id_token in provider response');
      const decoded = jwt.decode(id_token);
      if (!decoded) throw new Error('Could not decode id_token');
      email = (decoded.email || '').trim().toLowerCase();
      name  = decoded.name || decoded.given_name || '';
      sub   = String(decoded.sub || email).slice(0, 128);
    } else {
      // GitHub: exchange gives only access_token - call the user API
      if (!access_token) throw new Error('No access_token in provider response');
      const [userRes, emailsRes] = await Promise.all([
        axios.get('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'Nebula-VPN' }, timeout: 8_000,
        }),
        axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'Nebula-VPN' }, timeout: 8_000,
        }),
      ]);
      name  = (userRes.data.name || userRes.data.login || '').trim();
      sub   = String(userRes.data.id || '').slice(0, 128);
      // Pick the primary verified email; fall back to public email field
      const primaryEmail = (emailsRes.data || []).find(e => e.primary && e.verified);
      email = (primaryEmail?.email || userRes.data.email || '').trim().toLowerCase();
    }

    const emailRegex = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) throw new Error('No valid email in OAuth token');

    const safeName = (typeof name === 'string' ? name : '').replace(/[\x00-\x1F\x7F]/g, '').slice(0, 100) || email.split('@')[0];

    let user = users.get(email);
    const isNewUser = !user;
    if (isNewUser) {
      user = { email, password: null, name: safeName, role: 'user', plan: 'free', createdAt: new Date(), devices: [], dataUsage: 0, settings: {}, oauthProvider: provider, oauthId: sub };
      users.set(email, user);
      logger.info(`New user via ${provider} OAuth: ${email}`);
    } else {
      logger.info(`Sign-in via ${provider} OAuth: ${email}`);
    }

    const token = jwt.sign(
      { email: user.email, plan: user.plan, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    const dest = new URL(appUrl);
    dest.searchParams.set('_oauthToken', token);
    if (isNewUser) dest.searchParams.set('_oauthNew', '1');
    dest.searchParams.set('_oauthProvider', provider);
    res.redirect(dest.toString());
  } catch (err) {
    logger.error(`OAuth ${provider} callback error:`, err.message);
    res.redirect(`${appUrl}?oauth_error=auth_failed`);
  }
};

router.get('/oauth/:provider/callback', handleOAuthCallback);

// ── Two-Factor Authentication ─────────────────────────────────────────────

// Generate a TOTP secret and QR code for setup
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `Nebula VPN (${req.user.email})`,
      issuer: 'Nebula VPN',
      length: 32,
    });

    // Store secret temporarily until verified (not yet enabled)
    user.twoFactorTempSecret = secret.base32;
    users.set(user.email, user); // persist temp secret

    const otpauthUrl = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Generate backup codes (8 × 10-char random hex codes)
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g).join('-')
    );
    // Store hashed backup codes
    user.twoFactorBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    logger.info(`2FA setup initiated for ${req.user.email}`);

    res.json({
      secret: secret.base32,
      otpauthUrl,
      qrDataUrl,
      backupCodes, // shown to user once; hashed version stored above
    });
  } catch (error) {
    logger.error('2FA setup error:', error);
    res.status(500).json({ error: '2FA setup failed' });
  }
});

// Verify a TOTP code to complete 2FA enrollment
router.post('/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || !/^\d{6}$/.test(token)) {
      return res.status(400).json({ error: 'A 6-digit verification code is required' });
    }

    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = user.twoFactorEnabled
      ? user.twoFactorSecret       // re-verify after enable
      : user.twoFactorTempSecret;  // first-time setup

    if (!secret) {
      return res.status(400).json({ error: '2FA setup has not been initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Promote temp secret to permanent
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    delete user.twoFactorTempSecret;
    users.set(user.email, user); // persist to SQLite

    logger.info(`2FA enabled for ${req.user.email}`);
    res.json({ success: true, message: '2FA has been enabled' });
  } catch (error) {
    logger.error('2FA verify error:', error);
    res.status(500).json({ error: '2FA verification failed' });
  }
});

// Disable 2FA
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || !/^\d{6}$/.test(token)) {
      return res.status(400).json({ error: 'Current 2FA code required to disable' });
    }

    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    user.twoFactorEnabled = false;
    delete user.twoFactorSecret;
    delete user.twoFactorBackupCodes;
    users.set(user.email, user); // persist to SQLite

    logger.info(`2FA disabled for ${req.user.email}`);
    res.json({ success: true, message: '2FA has been disabled' });
  } catch (error) {
    logger.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

router.users = users;
module.exports = router;
