const express = require('express');
const https = require('https');
const axios = require('axios');
const { exec } = require('child_process');
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

// Proxy to HaveIBeenPwned - keeps the API key server-side
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

// ── IP info proxy - avoids CORS and mixed-content issues on the client ──────
// No auth required: the caller's own IP is always what's returned.
// Rate-limit is handled by the global Express limiter in index.js.
router.get('/ip-info', (req, res) => {
  // ipwho.is: free, HTTPS, CORS-enabled, 10k req/month.
  // Do NOT forward X-Forwarded-For - sending the client's real IP to a
  // third-party service defeats the purpose of the proxy and would persist
  // the user's real IP in ipwho.is logs.  ipwho.is returns the requester's
  // IP (the server's egress IP) which is what the client needs to verify
  // their VPN exit node.
  const options = {
    hostname: 'ipwho.is',
    path: '/',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
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

// ── Get system DNS servers using Windows PowerShell ─────────────────────────
// No auth required - only returns local system DNS configuration
router.get('/dns-servers', (req, res) => {
  // Use PowerShell to get DNS servers from all active network adapters
  const psCommand = 'Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses} | Select-Object -ExpandProperty ServerAddresses | Select-Object -Unique';
  
  exec(`powershell.exe -Command "${psCommand}"`, { timeout: 5000 }, (error, stdout, stderr) => {
    if (error) {
      logger.error('DNS query error:', error);
      return res.status(500).json({ 
        error: 'Failed to query DNS settings',
        servers: []
      });
    }

    try {
      // Parse PowerShell output - one IP per line
      const servers = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(line));

      // Categorize DNS servers
      const trustedDNS = {
        '1.1.1.1': 'Cloudflare',
        '1.0.0.1': 'Cloudflare',
        '8.8.8.8': 'Google',
        '8.8.4.4': 'Google',
        '9.9.9.9': 'Quad9',
        '149.112.112.112': 'Quad9',
        '208.67.222.222': 'OpenDNS',
        '208.67.220.220': 'OpenDNS',
        '94.140.14.14': 'AdGuard',
        '94.140.15.15': 'AdGuard'
      };

      const results = servers.map(ip => {
        const provider = trustedDNS[ip];
        const isPrivate = ip.startsWith('192.168.') || ip.startsWith('10.') || 
                         ip.startsWith('172.16.') || ip.startsWith('127.');
        
        return {
          ip,
          provider: provider || (isPrivate ? 'Local/Router' : 'Unknown ISP DNS'),
          trusted: !!provider,
          isPrivate
        };
      });

      const hasLeak = results.some(dns => !dns.trusted && !dns.isPrivate);

      res.json({
        servers: results,
        leakDetected: hasLeak,
        secure: results.length > 0 && !hasLeak
      });
    } catch (err) {
      logger.error('DNS parsing error:', err);
      res.status(500).json({ 
        error: 'Failed to parse DNS configuration',
        servers: []
      });
    }
  });
});

// ── Packages checked against the OSV.dev vulnerability database ─────────────
// Versions match the actual values in package.json / server/package.json.
const AUDITED_PACKAGES = [
  // Server dependencies
  { name: 'express',          ecosystem: 'npm', version: '4.18.2',  component: 'API Server (Express)' },
  { name: 'axios',            ecosystem: 'npm', version: '1.6.0',   component: 'HTTP Client (Axios)' },
  { name: 'jsonwebtoken',     ecosystem: 'npm', version: '9.0.2',   component: 'Auth Library (jsonwebtoken)' },
  { name: 'bcryptjs',         ecosystem: 'npm', version: '2.4.3',   component: 'Password Hashing (bcryptjs)' },
  { name: 'ws',               ecosystem: 'npm', version: '8.14.2',  component: 'WebSocket Library (ws)' },
  { name: 'cors',             ecosystem: 'npm', version: '2.8.5',   component: 'CORS Middleware' },
  { name: 'helmet',           ecosystem: 'npm', version: '7.1.0',   component: 'Security Headers (Helmet)' },
  { name: 'better-sqlite3',   ecosystem: 'npm', version: '12.6.2',  component: 'SQLite Database' },
  { name: 'speakeasy',        ecosystem: 'npm', version: '2.0.0',   component: '2FA Library (Speakeasy)' },
  // Client dependencies
  { name: 'react-scripts',    ecosystem: 'npm', version: '5.0.1',   component: 'Build Tools (react-scripts)' },
  { name: 'electron-updater', ecosystem: 'npm', version: '6.8.3',   component: 'Auto-Updater (electron-updater)' },
  { name: 'qrcode',           ecosystem: 'npm', version: '1.5.4',   component: 'QR Code Generator' },
];

function osvSeverity(v) {
  const s = (v.database_specific?.severity || '').toUpperCase();
  const MAP = { CRITICAL: 'critical', HIGH: 'high', MODERATE: 'medium', MEDIUM: 'medium', LOW: 'low' };
  if (MAP[s]) return MAP[s];
  // Fall back to CVSS v3 vector heuristic
  const vec = (v.severity || []).find(x => x.type?.includes('CVSS_V3'))?.score || '';
  if (/[CIA]:H/.test(vec) && /PR:N/.test(vec) && /AV:N/.test(vec)) return 'critical';
  if (/[CIA]:H/.test(vec)) return 'high';
  if (/[CIA]:L/.test(vec)) return 'medium';
  return 'medium';
}

// POST /api/security/vuln-scan
// Queries the OSV.dev batch API with real package versions and returns CVE findings.
router.post('/vuln-scan', authMiddleware, async (req, res) => {
  try {
    const queries = AUDITED_PACKAGES.map(({ name, ecosystem, version }) => ({
      package: { name, ecosystem },
      version,
    }));

    const { data } = await axios.post(
      'https://api.osv.dev/v1/querybatch',
      { queries },
      { timeout: 20000 }
    );

    const results = data.results || [];
    const findings = [];
    let seq = 1;

    results.forEach((result, idx) => {
      const pkg = AUDITED_PACKAGES[idx];
      for (const v of (result.vulns || [])) {
        // Prefer a real CVE alias over the OSV/GHSA id
        const cve = (v.aliases || []).find(a => a.startsWith('CVE-')) || v.id;
        const hasFixed = (v.affected || []).some(a =>
          (a.ranges || []).some(r => (r.events || []).some(e => e.fixed !== undefined)));
        findings.push({
          id: seq++,
          cve,
          osvId: v.id,
          summary: v.summary || `Vulnerability in ${pkg.name}@${pkg.version}`,
          severity: osvSeverity(v),
          component: pkg.component,
          version: pkg.version,
          status: hasFixed ? 'patch_available' : 'investigating',
          references: (v.references || []).slice(0, 2).map(r => r.url),
          type: 'package',
        });
      }
    });

    logger.info(`Vuln scan: ${AUDITED_PACKAGES.length} packages checked, ${findings.length} CVE(s) found`);
    res.json({
      scannedAt: new Date().toISOString(),
      packagesChecked: AUDITED_PACKAGES.length,
      findings,
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: 'OSV vulnerability database timed out' });
    }
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Rate-limited by OSV - try again in a few seconds' });
    }
    logger.error('Vuln scan error:', err.message);
    res.status(502).json({ error: 'Vulnerability scan failed' });
  }
});

module.exports = router;
