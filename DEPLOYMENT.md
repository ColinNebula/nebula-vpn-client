# Nebula VPN — Deployment Guide

This document walks through every step required to deploy Nebula VPN securely.  
Complete **all** items before going live.

---

## Pre-flight Checklist

### 1 — Generate Production Secrets

Run the secrets generator. It creates (or overwrites with `--force`) `server/.env`
with cryptographically-random 128-char JWT secrets and a 64-char encryption key.

```bash
node scripts/generate-secrets.js \
  --admin-email admin@yourdomain.com \
  --admin-password "YourStr0ng!Passw0rd2026"
```

Requirements for the admin password:
- Minimum 20 characters
- At least one uppercase letter
- At least one digit
- At least one special character

Dry-run preview (no file written):
```bash
node scripts/generate-secrets.js \
  --admin-email admin@yourdomain.com \
  --admin-password "..." \
  --dry-run
```

> **Never commit `server/.env` to version control.**  
> It is already excluded by `.gitignore`.

#### Encryption Key Requirements

The `ENCRYPTION_KEY` is used for AES-256-GCM encryption of sensitive database fields:
- Two-factor authentication secrets
- OAuth tokens
- Backup codes

The key must be:
- **64 hexadecimal characters** (32 bytes)
- Generated cryptographically (via `crypto.randomBytes(32)`)
- Stored securely in `server/.env`
- **Never changed in production** (would break decryption of existing data)

To manually generate an encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The secrets generator automatically creates this key.

---

### 2 — Configure WireGuard Server Values

Edit `server/.env` and replace the `CHANGE_THIS_*` placeholders:

```dotenv
WG_SERVER_PUBLIC_KEY=<output of: cat /etc/wireguard/server_public.key>
WG_SERVER_ENDPOINT=<your.server.ip.or.domain>:51820
WG_INTERFACE=wg0
WG_DNS=1.1.1.1,1.0.0.1
WG_SUBNET=10.8.0.0/24
```

Set up WireGuard on your Linux server:
```bash
apt install wireguard
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key
wg-quick up wg0
```

---

### 3 — Configure Allowed Origins

In `server/.env`, set CORS origins to your actual domains:

```dotenv
ALLOWED_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
```

---

### 4 — Production Rate Limits

Review the rate limiting values in `server/.env`:

```dotenv
RATE_LIMIT_MAX=300          # requests per window per IP
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
```

For high-traffic deployments consider lowering `RATE_LIMIT_MAX` on auth endpoints.

---

### 5 — TLS / HTTPS

The Node.js API server does **not** terminate TLS directly. Place it behind a
reverse proxy (nginx, Caddy, or Traefik) and enforce HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Set `NODE_ENV=production` in `server/.env`. This activates:
- HSTS headers (`Strict-Transport-Security: max-age=31536000`)
- Stricter rate limiting

---

### 5A — Database Encryption at Rest

The server encrypts sensitive user data at rest using AES-256-GCM. This is automatically
configured when you run `generate-secrets.js`, which creates a 64-character hex encryption key.

**Encrypted fields:**
- Two-factor authentication secrets
- OAuth provider tokens
- 2FA backup codes

**Migration for existing databases:**
```bash
cd server
node src/migrations/encrypt-existing-data.js
```

This script is **idempotent** — it detects already-encrypted data and skips it.

**Key rotation** (advanced): If you need to rotate the encryption key:
1. Back up the database
2. Create a manual migration to decrypt with old key and re-encrypt with new key
3. Never change `ENCRYPTION_KEY` without migrating data first

See [server/DATABASE_ENCRYPTION.md](server/DATABASE_ENCRYPTION.md) for details.

---

### 5B — DNS Enforcement & Administrator Privileges

The Electron desktop client enforces DNS through the VPN at the **OS level** using
Windows `netsh` commands (or equivalent on Linux/macOS). This is **not** a UI toggle.

#### Windows Requirements

DNS enforcement requires **Administrator privileges** to execute:
```cmd
netsh interface ipv4 set dnsservers name="Nebulavpn" source=static address=1.1.1.1
```

**What happens without admin:**
- VPN tunnel connects successfully
- VPN IP assigned (e.g., `10.8.0.2`)
- ⚠️ **DNS enforcement fails silently**
- DNS queries leak through ISP's DNS servers

**User experience:**
1. On first launch, app detects missing admin privileges
2. Shows dialog: "DNS enforcement requires Administrator access"
3. Options: **Restart as Admin** | Continue Anyway | Quit
4. If user continues without admin: connection works but DNS leaks

**Deployment best practices:**
- Document admin requirement in installation instructions
- Provide `start-vpn-admin.ps1` launcher script (auto-elevates)
- Show warnings in UI when running without admin
- Provide `verify-dns-simple.ps1` script for users to verify DNS enforcement

#### Linux/macOS Requirements

On Unix-like systems, DNS enforcement requires `sudo`/root to:
- Modify `/etc/resolv.conf` (Linux)
- Run `networksetup -setdnsservers` (macOS)

Electron apps don't typically have `sudo` access. Consider:
- Install a system helper with elevated privileges
- Use platform-specific permission dialogs (macOS)
- Document manual verification steps

#### Verification

Users can verify DNS enforcement:
```powershell
# Windows
.\verify-dns-simple.ps1

# Or manually
nslookup google.com
# Should show VPN DNS (e.g., 1.1.1.1), not ISP DNS
```

See [DNS_ENFORCEMENT_VERIFICATION.md](DNS_ENFORCEMENT_VERIFICATION.md) for full documentation.

---

### 6 — Electron Code Signing

Unsigned Electron builds will trigger OS security warnings. Sign before distribution.

#### Windows
```powershell
# Set via environment variables — never hardcode in package.json
$env:CSC_LINK        = "path\to\your.p12"    # or base64-encoded cert
$env:CSC_KEY_PASSWORD = "certPassword"

npm run electron:build:win
```

#### macOS
```bash
export APPLE_ID="developer@yourdomain.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # app-specific password
export APPLE_TEAM_ID="XXXXXXXXXX"

npm run electron:build:mac
```

macOS hardened runtime is already enabled in `package.json` `build.mac` with  
the required entitlements in `build/entitlements.mac.plist`.

#### Linux
Linux AppImage/deb packages don't require code signing but can be GPG-signed:
```bash
gpg --detach-sign --armor dist/nebula-vpn.AppImage
```

> `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`,  
> and `APPLE_TEAM_ID` must **never** appear in committed source files.

---

### 7 — Auto-Updater

Set the update feed URL as an environment variable (only in the Electron client context):

```bash
export UPDATE_FEED_URL=https://updates.yourdomain.com/nebula-vpn/
```

Or set it in the CI/CD pipeline that builds the release. The main process reads  
`process.env.UPDATE_FEED_URL` at startup.

---

### 8 — Server Hardening

```bash
# Run the server as a non-root user
useradd -r -s /bin/false nebula
chown -R nebula:nebula /opt/nebula-vpn-server

# Run with systemd
cat > /etc/systemd/system/nebula-vpn-server.service << EOF
[Unit]
Description=Nebula VPN API Server
After=network.target

[Service]
User=nebula
WorkingDirectory=/opt/nebula-vpn-server
EnvironmentFile=/opt/nebula-vpn-server/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=5

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/nebula-vpn-server/logs

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable nebula-vpn-server
systemctl start nebula-vpn-server
```

---

### 9 — Firewall Rules

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 443/tcp        # HTTPS (API via nginx)
ufw allow 51820/udp      # WireGuard
ufw enable
```

---

### 10 — Security Audit Commands

```bash
# Check npm dependency vulnerabilities
npm audit --audit-level=high

# Server dependency audit
cd server && npm audit --audit-level=high

# Scan source for hardcoded secrets
npm run security:prepare

# Full security check (audit + secrets scan)
npm run security:check
```

---

### 11 — .gitignore Verification

Confirm sensitive files are excluded before any `git push`:

```bash
git check-ignore -v server/.env      # must output: .gitignore:15:...
git check-ignore -v .env             # must output: .gitignore:15:...
git ls-files --error-unmatch server/.env 2>&1 || echo "OK: not tracked"
```

If `server/.env` is already tracked (accidentally committed previously):

```bash
git rm --cached server/.env
git commit -m "chore: remove accidentally tracked server/.env"
# Then rotate ALL secrets using: node scripts/generate-secrets.js --force ...
```

---

### 12 — Warrant Canary & Transparency

- **Canary**: `public/canary.txt` — re-sign and update every 90 days.  
  Set a calendar reminder 80 days from each signing date.
- **Audit manifest**: `public/audit-manifest.json` — update with real audit firm  
  details when contracted (`"firm": "TBD"` → actual firm name).

---

### 13 — Post-Deployment Verification

```bash
# Verify JWT auth is enforced
curl -s https://api.yourdomain.com/api/admin/users | python3 -m json.tool
# Expected: {"error":"No token provided"}

# Verify rate limiting headers
curl -si https://api.yourdomain.com/api/auth/login -d '{}' -H 'Content-Type: application/json' | grep -i ratelimit

# Verify security headers
curl -si https://api.yourdomain.com/ | grep -iE 'x-frame|csp|hsts|x-content'

# Check WireGuard interface
wg show

# Check server logs for startup errors
journalctl -u nebula-vpn-server -n 50
```

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | 128-char hex JWT signing key |
| `JWT_REFRESH_SECRET` | ✅ | 128-char hex JWT refresh key |
| `ENCRYPTION_KEY` | ✅ | 64-char hex AES-256 key for stored data |
| `ADMIN_EMAIL` | ✅ | Admin account email address |
| `ADMIN_PASSWORD` | ✅ | Admin password (min 20 chars) |
| `NODE_ENV` | ✅ | Must be `production` for live deployments |
| `PORT` | ✅ | Server listen port (default: 3001) |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `WG_SERVER_PUBLIC_KEY` | ✅ | WireGuard server Curve25519 public key |
| `WG_SERVER_ENDPOINT` | ✅ | WireGuard endpoint `host:port` |
| `UPDATE_FEED_URL` | ⬜ | Electron auto-updater feed URL |
| `API_URL` | ⬜ | Electron: override default API base URL |
| `CSC_LINK` | ⬜ | Windows code-signing cert path/base64 |
| `CSC_KEY_PASSWORD` | ⬜ | Windows code-signing cert password |
| `APPLE_ID` | ⬜ | macOS notarization Apple ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | ⬜ | macOS notarization app-specific password |
| `APPLE_TEAM_ID` | ⬜ | macOS Developer Team ID |

---

## Quick Start (Dev)

```bash
# Install all dependencies
npm install
cd server && npm install && cd ..

# Generate dev secrets (first time only)
node scripts/generate-secrets.js \
  --admin-email dev@localhost \
  --admin-password "DevAdmin@Nebula2026!"

# Start everything (React + Electron + Server)
npm run electron-dev
```
