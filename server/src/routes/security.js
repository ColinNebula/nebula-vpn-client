const express = require('express');
const https = require('https');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,}$/;

// Severity mapping based on HIBP breach data types
const getSeverity = (dataClasses) => {
  const critical = ['Passwords', 'Credit cards', 'Bank account numbers', 'Social security numbers'];
  const high = ['Email addresses', 'Phone numbers', 'Physical addresses', 'Dates of birth'];
  const medium = ['Usernames', 'Names', 'IP addresses', 'Geographic locations'];

  if (dataClasses.some(d => critical.includes(d))) return 'critical';
  if (dataClasses.some(d => high.includes(d))) return 'high';
  if (dataClasses.some(d => medium.includes(d))) return 'medium';
  return 'low';
};

// Proxy to HaveIBeenPwned — keeps the API key server-side
router.get('/breaches', authMiddleware, (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Dark web monitoring is not configured (missing HIBP_API_KEY)' });
  }

  const encodedEmail = encodeURIComponent(email.toLowerCase());
  const options = {
    hostname: 'haveibeenpwned.com',
    path: `/api/v3/breachedaccount/${encodedEmail}?truncateResponse=false`,
    method: 'GET',
    headers: {
      'hibp-api-key': apiKey,
      'user-agent': 'Nebula-VPN-Client/1.0',
    },
  };

  const hibpReq = https.request(options, (hibpRes) => {
    let body = '';
    hibpRes.on('data', chunk => { body += chunk; });
    hibpRes.on('end', () => {
      if (hibpRes.statusCode === 404) {
        // No breaches found
        return res.json({ breaches: [] });
      }
      if (hibpRes.statusCode === 401) {
        logger.error('HIBP: invalid API key');
        return res.status(503).json({ error: 'Dark web monitoring service unavailable' });
      }
      if (hibpRes.statusCode === 429) {
        return res.status(429).json({ error: 'Too many requests, please try again later' });
      }
      if (hibpRes.statusCode !== 200) {
        logger.error(`HIBP: unexpected status ${hibpRes.statusCode}`);
        return res.status(502).json({ error: 'Dark web monitoring service error' });
      }

      try {
        const rawBreaches = JSON.parse(body);
        const breaches = rawBreaches.map(b => ({
          id: b.Name,
          site: b.Title,
          domain: b.Domain,
          date: b.BreachDate,
          exposedData: b.DataClasses || [],
          severity: getSeverity(b.DataClasses || []),
          count: b.PwnCount ? `${(b.PwnCount / 1e6).toFixed(1)}M accounts` : 'Unknown',
          description: b.Description
            ? b.Description.replace(/<[^>]+>/g, '').slice(0, 200)
            : '',
        }));
        res.json({ breaches });
      } catch {
        res.status(502).json({ error: 'Invalid response from breach monitoring service' });
      }
    });
  });

  hibpReq.on('error', (err) => {
    logger.error('HIBP request error:', err);
    res.status(502).json({ error: 'Failed to reach breach monitoring service' });
  });

  hibpReq.setTimeout(10000, () => {
    hibpReq.destroy();
    res.status(504).json({ error: 'Breach monitoring service timed out' });
  });

  hibpReq.end();
});

// ── IP info proxy — avoids CORS and mixed-content issues on the client ──────
// No auth required: the caller's own IP is always what's returned.
// Rate-limit is handled by the global Express limiter in index.js.
router.get('/ip-info', (req, res) => {
  // ipwho.is: free, HTTPS, CORS-enabled, 10k req/month
  const options = {
    hostname: 'ipwho.is',
    path: '/',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      // Use the verified server-side req.ip only — never trust client-supplied
      // X-Forwarded-For header (SSRF / spoofing risk).
      'X-Forwarded-For': req.ip || '',
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let body = '';
    proxyRes.on('data', chunk => { body += chunk; });
    proxyRes.on('end', () => {
      if (proxyRes.statusCode !== 200) {
        return res.status(502).json({ error: 'IP lookup service unavailable' });
      }
      try {
        const d = JSON.parse(body);
        res.json({
          ip:           d.ip           || null,
          org:          d.connection?.isp || d.org || null,
          city:         d.city         || null,
          country_name: d.country      || null,
        });
      } catch {
        res.status(502).json({ error: 'Invalid response from IP lookup service' });
      }
    });
  });

  proxyReq.on('error', (err) => {
    logger.error('IP info proxy error:', err);
    res.status(502).json({ error: 'Failed to reach IP lookup service' });
  });

  proxyReq.setTimeout(8000, () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'IP lookup timed out' });
  });

  proxyReq.end();
});

module.exports = router;
