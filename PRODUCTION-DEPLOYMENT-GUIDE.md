# Nebula VPN - Production Deployment Guide

## 🚀 Quick Deploy to Digital Ocean

Your droplet IP: **165.227.32.85** (already configured)

### Prerequisites Checklist

- [ ] Digital Ocean droplet running (Ubuntu 20.04+ recommended)
- [ ] SSH access configured: `ssh root@165.227.32.85`
- [ ] Node.js installed on droplet (v16+)
- [ ] WireGuard installed on droplet
- [ ] Firewall configured (ports 3001, 51820/udp)

---

## Option 1: Quick Deployment (Recommended)

### Step 1: Prepare Environment

Your `.env` file needs production settings. Current issues to fix:

1. **ALLOW_INSECURE_WG_DEV** - Line 7 AND line 64 conflict
   - Line 7: `ALLOW_INSECURE_WG_DEV=false` ✅
   - Line 64: `ALLOW_INSECURE_WG_DEV=true` ❌ (CONFLICTS!)

2. **Generate new secrets** (current ones were exposed in docs):
   ```bash
   # Run these on your droplet or locally:
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_REFRESH_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ENCRYPTION_KEY
   ```

### Step 2: Deploy Backend

```powershell
# Simple backend-only deployment
.\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP 165.227.32.85

# Or skip Electron builds for faster deployment:
.\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP 165.227.32.85 -SkipElectron
```

This will:
1. Build production server bundle
2. Upload to `/opt/nebula-vpn-server/`
3. Install dependencies
4. Configure systemd service
5. Start the service

### Step 3: Verify Deployment

```powershell
# Test health endpoint
Invoke-WebRequest -Uri http://165.227.32.85:3001/health -UseBasicParsing

# Check service status
ssh root@165.227.32.85 'systemctl status nebula-vpn-server'

# View live logs
ssh root@165.227.32.85 'journalctl -u nebula-vpn-server -f'
```

Expected health response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-17T...",
  "uptime": 123.45
}
```

---

## Option 2: Manual Deployment

### Step 1: Package Server

```powershell
cd server
npm install --production
cd ..
Compress-Archive -Path server/* -DestinationPath nebula-backend.zip
```

### Step 2: Upload to Droplet

```bash
scp nebula-backend.zip root@165.227.32.85:/tmp/
ssh root@165.227.32.85
```

### Step 3: Install on Droplet

```bash
# On the droplet:
cd /opt
rm -rf nebula-vpn-server
mkdir -p nebula-vpn-server
cd nebula-vpn-server
unzip /tmp/nebula-backend.zip
npm install --production

# Copy your .env file (or create one)
nano .env  # Paste your production .env content
```

### Step 4: Create systemd Service

```bash
cat > /etc/systemd/system/nebula-vpn-server.service << 'EOF'
[Unit]
Description=Nebula VPN API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nebula-vpn-server
EnvironmentFile=/opt/nebula-vpn-server/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### Step 5: Start Service

```bash
systemctl daemon-reload
systemctl enable nebula-vpn-server
systemctl start nebula-vpn-server
systemctl status nebula-vpn-server
```

---

## Firewall Configuration

### Digital Ocean Firewall

```bash
# On droplet:
ufw allow 3001/tcp comment 'Nebula VPN API'
ufw allow 51820/udp comment 'WireGuard VPN'
ufw allow 22/tcp comment 'SSH'
ufw enable
```

### Or use Digital Ocean Cloud Firewall:
- Inbound: 22 (SSH), 3001 (API), 51820/UDP (WireGuard)
- Outbound: All

---

## Environment Configuration

### Critical Settings to Change

Edit `server/.env` before deploying:

```bash
# Production mode
NODE_ENV=production
ALLOW_INSECURE_WG_DEV=false

# NEW secrets (not the exposed ones):
JWT_SECRET=<generate-new-64-byte-hex>
JWT_REFRESH_SECRET=<generate-new-64-byte-hex>
ENCRYPTION_KEY=<generate-new-32-byte-hex>

# Your WireGuard server
WG_SERVER_PUBLIC_KEY=BSeB+/gtlMv0jMnDcmSvlzLWA7eNIPuYIXiN5r3KgDo=
WG_SERVER_ENDPOINT=165.227.32.85:51820

# CORS origins (add your production frontend URL)
ALLOWED_ORIGINS=https://colinnebula.github.io,https://api.nebula3ddev.com
```

---

## WireGuard Server Setup

If WireGuard isn't configured yet on your droplet:

```bash
# Run the included setup script:
scp server/setup-wireguard-server.sh root@165.227.32.85:/tmp/
ssh root@165.227.32.85 'bash /tmp/setup-wireguard-server.sh'
```

Or manually:

```bash
# Install WireGuard
apt update
apt install -y wireguard

# Generate keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# Create config
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = $(cat /etc/wireguard/server_private.key)
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
EOF

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p

# Start WireGuard
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
journalctl -u nebula-vpn-server -n 50 --no-pager

# Check if port is in use
lsof -i :3001
netstat -tlnp | grep 3001

# Kill conflicting processes
pkill -f "node.*index.js"
pm2 stop all && pm2 delete all
```

### Can't Connect from Client

```bash
# Test API directly
curl http://165.227.32.85:3001/health

# Check firewall
ufw status

# Check service
systemctl status nebula-vpn-server

# Check WireGuard
wg show
```

### Port 3001 Already in Use

```bash
# Find and kill the process
fuser -k 3001/tcp

# Or find the PID
lsof -ti:3001 | xargs kill -9
```

---

## Post-Deployment Testing

### 1. Test Health Endpoint
```powershell
Invoke-WebRequest http://165.227.32.85:3001/health
```

### 2. Test Auth Endpoints
```powershell
# Register test user
$body = @{
    email = "test@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

Invoke-WebRequest -Method POST -Uri http://165.227.32.85:3001/api/auth/register -Body $body -ContentType "application/json"
```

### 3. Test from Electron App

Update your local `.env` or electron client to point to production:
```
REACT_APP_API_URL=http://165.227.32.85:3001/api
```

---

## SSL/HTTPS Setup (Optional)

For production, you should use HTTPS. Options:

### Option 1: Nginx Reverse Proxy with Let's Encrypt

```bash
apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx
cat > /etc/nginx/sites-available/nebula-vpn << 'EOF'
server {
    listen 80;
    server_name api.nebula3ddev.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/nebula-vpn /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d api.nebula3ddev.com
```

### Option 2: Cloudflare Tunnel (Free)

1. Install cloudflared
2. Create a tunnel pointing to `localhost:3001`
3. No firewall configuration needed

---

## Monitoring

### View Logs in Real-Time
```bash
ssh root@165.227.32.85 'journalctl -u nebula-vpn-server -f'
```

### Check Service Status
```bash
ssh root@165.227.32.85 'systemctl status nebula-vpn-server'
```

### Restart Service
```bash
ssh root@165.227.32.85 'systemctl restart nebula-vpn-server'
```

---

## Next Steps

1. ✅ Deploy backend to Digital Ocean
2. ⏳ Point client app to production API
3. ⏳ Test VPN connection from client
4. ⏳ Setup SSL with domain name
5. ⏳ Configure monitoring/alerts
6. ⏳ Setup automated backups

---

## Quick Reference

| Resource | Value |
|----------|-------|
| Droplet IP | 165.227.32.85 |
| API Port | 3001 |
| Health URL | http://165.227.32.85:3001/health |
| WireGuard Port | 51820/UDP |
| Service Name | nebula-vpn-server |
| Install Path | /opt/nebula-vpn-server |
| Logs | `journalctl -u nebula-vpn-server` |

---

**Need Help?** Check [BACKEND_DEPLOYMENT_SUCCESS.md](BACKEND_DEPLOYMENT_SUCCESS.md) for common issues and solutions.
