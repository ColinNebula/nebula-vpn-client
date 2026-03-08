#!/usr/bin/env node
/**
 * Nebula VPN — Deployment Secrets Generator
 * ==========================================
 * Generates cryptographically secure secrets for server/.env before deployment.
 *
 * Usage:
 *   node scripts/generate-secrets.js \
 *     --admin-email admin@example.com \
 *     --admin-password "YourStrongP@ssword123"
 *
 * Flags:
 *   --admin-email     <email>    Admin account email (required)
 *   --admin-password  <pass>     Admin account password (min 20 chars, required)
 *   --force                      Overwrite existing secrets (use with care)
 *   --dry-run                    Print generated values without writing to .env
 */

'use strict';

const crypto  = require('crypto');
const fs      = require('fs');
const path    = require('path');
const readline = require('readline');

// ── Colour helpers ────────────────────────────────────────────────────────────
const c = {
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};
const ok   = (msg) => console.log(c.green('✓') + ' ' + msg);
const warn = (msg) => console.log(c.yellow('⚠') + ' ' + msg);
const err  = (msg) => console.log(c.red('✗') + ' ' + msg);
const info = (msg) => console.log(c.cyan('ℹ') + ' ' + msg);
const head = (msg) => console.log('\n' + c.bold(c.cyan(`═══ ${msg} ═══`)) + '\n');

// ── Argument parsing ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

const adminEmail    = getArg('--admin-email');
const adminPassword = getArg('--admin-password');
const force         = args.includes('--force');
const dryRun        = args.includes('--dry-run');

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT        = path.resolve(__dirname, '..');
const SERVER_ENV  = path.join(ROOT, 'server', '.env');
const EXAMPLE_ENV = path.join(ROOT, 'server', '.env.example');

// ── Validation ────────────────────────────────────────────────────────────────
function validate() {
  let ok = true;

  if (!adminEmail) {
    err('--admin-email is required');
    ok = false;
  } else {
    const emailRegex = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(adminEmail)) {
      err(`Invalid email format: ${adminEmail}`);
      ok = false;
    }
  }

  if (!adminPassword) {
    err('--admin-password is required');
    ok = false;
  } else {
    if (adminPassword.length < 20) {
      err('Admin password must be at least 20 characters');
      ok = false;
    }
    if (!/[A-Z]/.test(adminPassword)) {
      err('Admin password must contain at least one uppercase letter');
      ok = false;
    }
    if (!/[0-9]/.test(adminPassword)) {
      err('Admin password must contain at least one digit');
      ok = false;
    }
    if (!/[^a-zA-Z0-9]/.test(adminPassword)) {
      err('Admin password must contain at least one special character');
      ok = false;
    }
  }

  return ok;
}

// ── Secret generation ─────────────────────────────────────────────────────────
function generateSecrets() {
  return {
    JWT_SECRET:         crypto.randomBytes(64).toString('hex'),   // 128-char hex
    JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),   // 128-char hex
    ENCRYPTION_KEY:     crypto.randomBytes(32).toString('hex'),   // 64-char hex
  };
}

// ── Read existing .env preserving WireGuard config and other settings ─────────
function readExistingEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const vars = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    vars[key] = val;
  }

  return vars;
}

// ── Write .env file ───────────────────────────────────────────────────────────
function writeEnv(secrets, existing) {
  const now = new Date().toISOString();

  // Preserve operational settings that aren't credentials
  const port            = existing.PORT            || '3001';
  const nodeEnv         = 'production';             // force production
  const host            = existing.HOST            || '0.0.0.0';
  const rateLimitMax    = existing.RATE_LIMIT_MAX  || '300';
  const rateLimitWindow = existing.RATE_LIMIT_WINDOW_MS || '900000';
  const allowedOrigins  = existing.ALLOWED_ORIGINS || 'https://yourdomain.com';
  const logLevel        = existing.LOG_LEVEL       || 'warn';
  const logFormat       = existing.LOG_FORMAT      || 'json';
  const logRequests     = existing.LOG_REQUESTS    || 'true';
  const jwtExpiresIn    = existing.JWT_EXPIRES_IN  || '7d';

  // Preserve WireGuard config (non-secret, operator-specific)
  const wgInterface   = existing.WG_INTERFACE   || 'wg0';
  const wgPubKey      = (existing.WG_SERVER_PUBLIC_KEY || '').startsWith('CHANGE_THIS')
                          ? 'CHANGE_THIS_YOUR_WIREGUARD_SERVER_PUBLIC_KEY'
                          : (existing.WG_SERVER_PUBLIC_KEY || 'CHANGE_THIS_YOUR_WIREGUARD_SERVER_PUBLIC_KEY');
  const wgEndpoint    = (existing.WG_SERVER_ENDPOINT || '').match(/^\d{1,3}(\.\d{1,3}){3}:\d+$/)
                          ? 'CHANGE_THIS_YOUR_SERVER_IP_OR_DOMAIN:51820'  // redact real IP
                          : (existing.WG_SERVER_ENDPOINT || 'CHANGE_THIS_YOUR_SERVER_IP_OR_DOMAIN:51820');
  const wgDns         = existing.WG_DNS    || '1.1.1.1,1.0.0.1';
  const wgSubnet      = existing.WG_SUBNET || '10.8.0.0/24';

  const content = `# ============================================================
# NEBULA VPN SERVER — PRODUCTION ENVIRONMENT
# Generated by scripts/generate-secrets.js on ${now}
# ============================================================
# IMPORTANT: Keep this file secret. Never commit to version control.
# ============================================================

# ── Server ────────────────────────────────────────────────
PORT=${port}
NODE_ENV=${nodeEnv}
HOST=${host}

# ── JWT (auto-generated ${now}) ────────────────────────────
JWT_SECRET=${secrets.JWT_SECRET}
JWT_EXPIRES_IN=${jwtExpiresIn}
JWT_REFRESH_SECRET=${secrets.JWT_REFRESH_SECRET}

# ── Encryption (auto-generated) ──────────────────────────
ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}

# ── Admin Account ────────────────────────────────────────
# Change these values ─ set via env var or edit this file.
ADMIN_EMAIL=${adminEmail}
ADMIN_PASSWORD=${adminPassword}

# ── Rate Limiting ────────────────────────────────────────
RATE_LIMIT_MAX=${rateLimitMax}
RATE_LIMIT_WINDOW_MS=${rateLimitWindow}

# ── CORS ─────────────────────────────────────────────────
ALLOWED_ORIGINS=${allowedOrigins}

# ── Logging ──────────────────────────────────────────────
LOG_LEVEL=${logLevel}
LOG_FORMAT=${logFormat}
LOG_REQUESTS=${logRequests}

# ── WireGuard Server Configuration ───────────────────────
# Set these to your actual WireGuard server values.
WG_INTERFACE=${wgInterface}
WG_SERVER_PUBLIC_KEY=${wgPubKey}
WG_SERVER_ENDPOINT=${wgEndpoint}
WG_DNS=${wgDns}
WG_SUBNET=${wgSubnet}
`;

  return content;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  head('Nebula VPN — Secrets Generator');

  // Validate arguments first
  if (!validate()) {
    console.log('\nUsage example:');
    console.log('  node scripts/generate-secrets.js \\');
    console.log('    --admin-email admin@yourdomain.com \\');
    console.log('    --admin-password "MySecret@Password123!"');
    process.exit(1);
  }

  // Check for existing .env
  const envExists = fs.existsSync(SERVER_ENV);
  if (envExists && !force && !dryRun) {
    warn(`${SERVER_ENV} already exists.`);
    warn('Use --force to overwrite existing secrets (this will rotate all JWT/encryption keys).');
    warn('Use --dry-run to preview the output without writing.');
    process.exit(1);
  }

  info('Generating cryptographic secrets...');

  const secrets  = generateSecrets();
  const existing = envExists ? readExistingEnv(SERVER_ENV) : {};
  const content  = writeEnv(secrets, existing);

  if (dryRun) {
    head('Dry Run — Output Preview');
    console.log(content);
    warn('DRY RUN: No file was written.');
    return;
  }

  // Write atomically via temp file
  const tmpPath = SERVER_ENV + '.tmp.' + Date.now();
  fs.writeFileSync(tmpPath, content, { encoding: 'utf8', mode: 0o600 });

  // Verify the temp file looks valid before replacing
  const written = fs.readFileSync(tmpPath, 'utf8');
  if (!written.includes('JWT_SECRET=') || !written.includes('ADMIN_EMAIL=')) {
    fs.unlinkSync(tmpPath);
    err('Temp file verification failed — aborting.');
    process.exit(1);
  }

  fs.renameSync(tmpPath, SERVER_ENV);

  // Restrict permissions on Unix (chmod 600 — owner read/write only)
  if (process.platform !== 'win32') {
    fs.chmodSync(SERVER_ENV, 0o600);
    ok(`File permissions set to 600 (owner only): ${SERVER_ENV}`);
  }

  head('Secrets Generated Successfully');
  ok(`server/.env written to: ${SERVER_ENV}`);
  ok(`JWT_SECRET:         ${secrets.JWT_SECRET.length}-char hex`);
  ok(`JWT_REFRESH_SECRET: ${secrets.JWT_REFRESH_SECRET.length}-char hex`);
  ok(`ENCRYPTION_KEY:     ${secrets.ENCRYPTION_KEY.length}-char hex`);
  ok(`ADMIN_EMAIL:        ${adminEmail}`);
  ok(`ADMIN_PASSWORD:     ${'*'.repeat(adminPassword.length)} (${adminPassword.length} chars)`);

  console.log('\n' + c.yellow('Next steps:'));
  console.log('  1. Review server/.env and set ALLOWED_ORIGINS, WG_SERVER_PUBLIC_KEY, WG_SERVER_ENDPOINT');
  console.log('  2. Ensure server/.env is in .gitignore (it is by default)');
  console.log('  3. Start the server: cd server && npm start');
  console.log('  4. If rotating secrets on a live server, invalidate existing JWT sessions');
}

main().catch((e) => {
  err('Unexpected error: ' + e.message);
  process.exit(1);
});
