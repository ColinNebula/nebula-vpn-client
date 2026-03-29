# Nebula VPN Cloud Deployment Guide

Complete guide for deploying Nebula VPN to GitHub Pages (frontend) and DigitalOcean (backend).

## 🚀 Quick Start

### Full Deployment (First Time)
```powershell
# 1. Setup DigitalOcean droplet
.\DEPLOY-CLOUD.ps1 -ConfigureDroplet -InstallWireGuard -DropletIP 159.89.123.45

# 2. Update server/.env with WireGuard keys (shown in output)

# 3. Deploy everything
.\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP 159.89.123.45 -UpdateHomepage
```

### Frontend Only (GitHub Pages)
```powershell
.\DEPLOY-CLOUD.ps1 -DeployFrontend -UpdateHomepage
```

### Backend Only (DigitalOcean)
```powershell
.\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP 159.89.123.45
```

---

## 📋 Prerequisites

### Required Tools
- **Node.js** v16+ and npm
- **Git** (for GitHub Pages deployment)
- **PowerShell** 5.1+ or PowerShell Core
- **SSH client** (for DigitalOcean deployment)
- **tar** (usually pre-installed)

### Required Accounts
- **GitHub** account with repository access
- **DigitalOcean** account with droplet created

### SSH Key Setup
Configure SSH key for passwordless access:
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy to DigitalOcean droplet
ssh-copy-id root@your-droplet-ip
```

---

## 🎯 Deployment Scenarios

### Scenario 1: Fresh DigitalOcean Droplet Setup

**Step 1: Create Droplet**
- Login to DigitalOcean
- Create new droplet (Ubuntu 22.04 LTS recommended)
- Minimum: 1GB RAM, 1 CPU
- Add your SSH key during creation
- Note the droplet IP address

**Step 2: Configure Droplet**
```powershell
.\DEPLOY-CLOUD.ps1 -ConfigureDroplet -DropletIP 159.89.123.45
```

This installs:
- ✓ Node.js 20.x
- ✓ System packages (git, curl, tar)
- ✓ Firewall (UFW) with required ports
- ✓ Fail2ban for security
- ✓ Deployment user

**Step 3: Install WireGuard**
```powershell
.\DEPLOY-CLOUD.ps1 -InstallWireGuard -DropletIP 159.89.123.45
```

This:
- ✓ Installs WireGuard
- ✓ Generates server keys
- ✓ Creates wg0 interface configuration
- ✓ Enables IP forwarding
- ✓ Outputs configuration for server/.env

**Step 4: Configure Environment**
Copy the WireGuard configuration output and add to `server/.env`:
```env
WG_SERVER_PUBLIC_KEY=<public-key-from-output>
WG_SERVER_ENDPOINT=159.89.123.45:51820
WG_INTERFACE=wg0
WG_DNS=1.1.1.1,1.0.0.1
WG_SUBNET=10.8.0.0/24
```

**Step 5: Deploy Backend**
```powershell
.\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP 159.89.123.45
```

**Step 6: Verify**
```bash
# Test API endpoint
curl http://159.89.123.45:3001/health

# Check service status
ssh root@159.89.123.45 'systemctl status nebula-vpn-server'
```

### Scenario 2: Frontend to GitHub Pages

**Step 1: Ensure GitHub Repo**
```bash
# Initialize git if needed
git init
git remote add origin https://github.com/username/repo-name.git

# Or check existing
git remote -v
```

**Step 2: Update Homepage**
```powershell
.\DEPLOY-CLOUD.ps1 -DeployFrontend -UpdateHomepage
```

This:
- ✓ Detects your GitHub repo
- ✓ Updates package.json homepage
- ✓ Builds frontend
- ✓ Deploys to gh-pages branch
- ✓ Shows deployment URL

**Step 3: Configure GitHub Pages**
1. Go to repository Settings → Pages
2. Source: `gh-pages` branch
3. Wait 1-2 minutes for deployment

**Your app:** `https://username.github.io/repo-name/`

### Scenario 3: Full Production Deployment

Complete deployment of frontend + backend + desktop apps:

```powershell
.\DEPLOY-CLOUD.ps1 `
  -DeployFrontend `
  -DeployBackend `
  -DropletIP 159.89.123.45 `
  -ElectronPlatform all `
  -UpdateHomepage
```

This deploys:
- ✓ Frontend → GitHub Pages
- ✓ Backend → DigitalOcean
- ✓ Electron apps → Built to `dist/` folder

### Scenario 4: Update Existing Deployment

**Frontend update:**
```powershell
.\DEPLOY-CLOUD.ps1 -DeployFrontend -SkipTests
```

**Backend update:**
```powershell
.\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP 159.89.123.45 -SkipTests
```

**Both:**
```powershell
.\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP 159.89.123.45 -SkipTests
```

### Scenario 5: SSL/TLS with Custom Domain

**Prerequisites:**
- Domain name pointing to droplet IP
- DNS A record configured

**Setup:**
```powershell
.\DEPLOY-CLOUD.ps1 `
  -SetupSSL `
  -DomainName api.yourdomain.com `
  -DropletIP 159.89.123.45
```

This:
- ✓ Installs Certbot
- ✓ Obtains Let's Encrypt certificate
- ✓ Configures auto-renewal

**Configure Nginx (manual):**
```bash
ssh root@159.89.123.45

# Install nginx
apt install nginx

# Create config
cat > /etc/nginx/sites-available/nebula-api << 'EOF'
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/nebula-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 🔧 Parameters Reference

### Deployment Targets

| Parameter | Description | Example |
|-----------|-------------|---------|
| `-DeployFrontend` | Deploy to GitHub Pages | `-DeployFrontend` |
| `-DeployBackend` | Deploy to DigitalOcean | `-DeployBackend` |

### DigitalOcean Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-DropletIP` | (required) | Droplet IP address |
| `-DropletUser` | `root` | SSH user |
| `-ServerPath` | `/opt/nebula-vpn-server` | Installation path |

### GitHub Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-GitHubRepo` | (auto-detect) | GitHub repo URL |
| `-GitHubBranch` | `gh-pages` | Deployment branch |
| `-UpdateHomepage` | (switch) | Update package.json |

### Build Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-SkipTests` | (switch) | Skip security audits |
| `-SkipElectron` | (switch) | Skip desktop builds |
| `-ElectronPlatform` | `win` | `win`, `mac`, `linux`, `all` |

### Droplet Setup

| Parameter | Description |
|-----------|-------------|
| `-ConfigureDroplet` | Initial droplet configuration |
| `-InstallWireGuard` | Install WireGuard VPN |
| `-SetupSSL` | Setup Let's Encrypt SSL |
| `-DomainName` | Domain for SSL certificate |

---

## 🔍 Verification & Testing

### Frontend Verification
```bash
# Check GitHub Pages deployment
curl -I https://username.github.io/repo-name/

# Check assets loading
curl https://username.github.io/repo-name/static/js/main.*.js
```

### Backend Verification
```bash
# Health check
curl http://droplet-ip:3001/health

# Test authentication endpoint
curl -X POST http://droplet-ip:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### WireGuard Verification
```bash
ssh root@droplet-ip

# Check WireGuard status
wg show

# Check interface
ip addr show wg0

# Check service
systemctl status wg-quick@wg0
```

### Service Logs
```bash
# Real-time logs
ssh root@droplet-ip 'journalctl -u nebula-vpn-server -f'

# Last 100 lines
ssh root@droplet-ip 'journalctl -u nebula-vpn-server -n 100 --no-pager'

# Errors only
ssh root@droplet-ip 'journalctl -u nebula-vpn-server -p err -n 50'
```

---

## 🛠 Troubleshooting

### Error: "Cannot connect to droplet"
**Causes:**
- Wrong IP address
- SSH key not configured
- Firewall blocking SSH

**Solutions:**
```bash
# Test SSH connection
ssh -v root@droplet-ip

# Check SSH key
ssh-add -l

# Add SSH key to agent
ssh-add ~/.ssh/id_ed25519
```

### Error: "gh-pages deployment failed"
**Causes:**
- Not in git repository
- No remote configured
- No push permissions

**Solutions:**
```bash
# Check git status
git remote -v

# Initialize if needed
git init
git remote add origin https://github.com/username/repo.git

# Check authentication
git config --list | grep user
```

### Error: "Frontend build failed"
**Solutions:**
```powershell
# Clear and rebuild
Remove-Item node_modules -Recurse -Force
Remove-Item build -Recurse -Force
npm install
npm run build
```

### Error: "Service not starting on droplet"
**Check logs:**
```bash
ssh root@droplet-ip 'journalctl -u nebula-vpn-server -n 50'
```

**Common issues:**
- Missing .env file
- Port 3001 already in use
- Node.js version mismatch

**Solutions:**
```bash
ssh root@droplet-ip

# Check .env exists
ls -la /opt/nebula-vpn-server/.env

# Check port
netstat -tlnp | grep 3001

# Restart service
systemctl restart nebula-vpn-server
```

### GitHub Pages Shows 404
**Causes:**
- GitHub Pages not enabled
- Wrong branch selected
- Build path incorrect

**Solutions:**
1. Go to repository Settings → Pages
2. Select `gh-pages` branch
3. Wait 1-2 minutes
4. Check `homepage` in package.json matches repo URL

### WireGuard Not Working
**Check configuration:**
```bash
ssh root@droplet-ip

# Check interface
ip addr show wg0

# Check routing
ip route | grep wg0

# Check firewall
ufw status
```

---

## 🔒 Security Best Practices

### SSH Key Security
```bash
# Use strong key
ssh-keygen -t ed25519 -C "deployment-key"

# Set correct permissions
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### Firewall Configuration
```bash
# Only allow required ports
ssh root@droplet-ip

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3001/tcp  # API
ufw allow 51820/udp # WireGuard
ufw enable
```

### Secrets Management
- ✓ Never commit `.env` files
- ✓ Use strong passwords (20+ characters)
- ✓ Rotate JWT secrets regularly
- ✓ Keep encryption keys secure

### Monitoring
```bash
# Setup monitoring
ssh root@droplet-ip

# Install monitoring tools
apt install htop iotop nethogs

# Check disk usage
df -h

# Check memory
free -h

# Check CPU
htop
```

---

## 📊 Cost Estimation

### DigitalOcean Pricing (as of 2026)
| Droplet Size | RAM | CPU | Storage | Price/mo |
|--------------|-----|-----|---------|----------|
| Basic | 1GB | 1 vCPU | 25GB | $6 |
| Standard | 2GB | 1 vCPU | 50GB | $12 |
| Pro | 4GB | 2 vCPU | 80GB | $24 |

**Recommended:** Standard ($12/mo) for production

### GitHub Pages
- ✓ **Free** for public repositories
- ✓ 100GB bandwidth/month
- ✓ Custom domains supported

### Total Monthly Cost
- Frontend (GitHub Pages): **Free**
- Backend (DigitalOcean): **$6-24**
- Domain (optional): **$12-15/year**

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Deploy Frontend
        run: |
          .\DEPLOY-CLOUD.ps1 -DeployFrontend -SkipTests
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Deploy Backend
        run: |
          .\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP ${{ secrets.DROPLET_IP }} -SkipTests
```

---

## 📚 Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [DEPLOY-ALL.ps1](DEPLOY-ALL.ps1) - Generic deployment script
- [DigitalOcean Docs](https://docs.digitalocean.com/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [WireGuard Docs](https://www.wireguard.com/quickstart/)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `ssh root@droplet-ip 'journalctl -u nebula-vpn-server -n 100'`
2. Verify configuration: Check `server/.env` file
3. Test connectivity: `curl http://droplet-ip:3001/health`
4. Review security: Check firewall rules with `ufw status`

## License

Same as Nebula VPN project.
