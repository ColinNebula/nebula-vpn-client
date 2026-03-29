# DEPLOY-ALL.ps1 Usage Guide

Complete deployment script for Nebula VPN frontend and backend.

## Quick Start

### Local Development Build
```powershell
.\DEPLOY-ALL.ps1 -Target local
```

### Production Deployment (Frontend Only)
```powershell
.\DEPLOY-ALL.ps1 -Target production
```

### Full Production Deployment (Frontend + Backend)
```powershell
.\DEPLOY-ALL.ps1 -Target production `
  -DeployBackend `
  -ServerHost user@yourserver.com `
  -RestartServer
```

## Parameters

### `-Target`
Deployment environment (default: `local`)
- `local` - Development build
- `staging` - Staging environment
- `production` - Production environment

### `-SkipSecrets`
Skip generation of production secrets (`.env` file)

**Use when:**
- Secrets already exist
- Updating deployment without changing credentials

```powershell
.\DEPLOY-ALL.ps1 -SkipSecrets
```

### `-SkipTests`
Skip security audits and tests

**Use when:**
- Rapid iteration during development
- Security checks already passed

```powershell
.\DEPLOY-ALL.ps1 -SkipTests
```

### `-SkipElectron`
Skip Electron desktop app builds

**Use when:**
- Only deploying web frontend
- Building desktop apps separately

```powershell
.\DEPLOY-ALL.ps1 -SkipElectron
```

### `-ElectronPlatform`
Build Electron for specific platform (default: `win`)
- `win` - Windows only
- `mac` - macOS only
- `linux` - Linux only
- `all` - All platforms

```powershell
.\DEPLOY-ALL.ps1 -ElectronPlatform all
```

### `-DeployBackend`
Deploy backend to remote server

**Requirements:**
- SSH access configured
- `-ServerHost` specified

```powershell
.\DEPLOY-ALL.ps1 -DeployBackend -ServerHost user@server.com
```

### `-ServerHost`
SSH host for backend deployment

**Format:** `user@hostname` or `user@ip-address`

```powershell
.\DEPLOY-ALL.ps1 -DeployBackend -ServerHost deploy@vpn.example.com
```

### `-ServerPath`
Remote server path (default: `/opt/nebula-vpn-server`)

```powershell
.\DEPLOY-ALL.ps1 -DeployBackend `
  -ServerHost user@server.com `
  -ServerPath /home/deploy/nebula-vpn
```

### `-RestartServer`
Restart server service after deployment

**Requires:** systemd service `nebula-vpn-server` configured

```powershell
.\DEPLOY-ALL.ps1 -DeployBackend `
  -ServerHost user@server.com `
  -RestartServer
```

## Common Scenarios

### Scenario 1: First Time Deployment

Full deployment with secret generation:

```powershell
.\DEPLOY-ALL.ps1 -Target production `
  -DeployBackend `
  -ServerHost root@vpn.example.com `
  -RestartServer
```

**Steps performed:**
1. ✓ Generate production secrets
2. ✓ Install all dependencies
3. ✓ Run security checks
4. ✓ Build React frontend
5. ✓ Build Windows Electron app
6. ✓ Deploy backend to server
7. ✓ Restart server service

### Scenario 2: Frontend Update Only

Deploy frontend changes without touching backend:

```powershell
.\DEPLOY-ALL.ps1 -Target production `
  -SkipSecrets `
  -SkipElectron
```

**Steps performed:**
1. ○ Skip secrets
2. ✓ Install dependencies
3. ✓ Security checks
4. ✓ Build frontend
5. ○ Skip Electron
6. ○ No backend deployment

### Scenario 3: Backend Update Only

Deploy only backend changes:

```powershell
.\DEPLOY-ALL.ps1 -Target production `
  -SkipSecrets `
  -SkipElectron `
  -DeployBackend `
  -ServerHost user@server.com `
  -RestartServer
```

### Scenario 4: Build All Desktop Apps

Build Electron apps for all platforms:

```powershell
.\DEPLOY-ALL.ps1 -Target production `
  -ElectronPlatform all `
  -SkipSecrets
```

**Output:** Windows, macOS, and Linux builds in `dist/` folder

### Scenario 5: Quick Development Build

Fast iteration during development:

```powershell
.\DEPLOY-ALL.ps1 -Target local `
  -SkipSecrets `
  -SkipTests `
  -SkipElectron
```

**Steps performed:**
1. ○ Skip secrets
2. ✓ Install dependencies
3. ○ Skip tests
4. ✓ Build frontend
5. ○ Skip Electron

### Scenario 6: CI/CD Pipeline

Automated deployment from CI/CD:

```powershell
# Secrets and SSH keys configured via CI environment
.\DEPLOY-ALL.ps1 -Target production `
  -SkipSecrets `
  -ElectronPlatform all `
  -DeployBackend `
  -ServerHost $env:DEPLOY_HOST `
  -RestartServer
```

## Prerequisites

### Required Tools
- **Node.js** (v16+)
- **npm** (v8+)
- **PowerShell** (v5.1+ or PowerShell Core 7+)

### Optional Tools
- **Git** (recommended for version control)
- **SSH client** (required for backend deployment)
- **tar** (required for backend deployment archives)

### Server Requirements

For backend deployment:
- SSH access with sudo privileges
- Node.js installed on server
- systemd service configured (for restart)

## Script Workflow

### Step 1: Prerequisites Check
- Verifies Node.js, npm, Git
- Checks SSH if deploying backend

### Step 2: Secret Generation
- Prompts for admin credentials
- Generates JWT secrets (128 chars)
- Generates encryption key (64 hex chars)
- Creates `server/.env` file

### Step 3: Dependency Installation
- Installs frontend dependencies
- Installs backend dependencies

### Step 4: Security Checks
- Runs security preparation
- Executes security audit
- Checks for npm vulnerabilities

### Step 5: Frontend Build
- Builds React production bundle
- Verifies build output
- Reports build size

### Step 6: Electron Build
- Builds for selected platform(s)
- Lists generated artifacts
- Reports file sizes

### Step 7: Backend Deployment
- Creates deployment package
- Uploads to server via SCP
- Extracts on server
- Installs production dependencies
- Runs database migrations

### Step 8: Server Restart
- Restarts systemd service
- Verifies service status

## Troubleshooting

### "Node.js is not installed"
**Solution:** Install Node.js from https://nodejs.org/

### "SSH client required for backend deployment"
**Solution:** 
- Windows: Install OpenSSH client
- Or use WSL with SSH

### "Secret generation failed"
**Causes:**
- Admin password too weak (< 20 chars)
- Missing required password complexity
- Node.js permission issues

**Solution:** Ensure password meets requirements:
- Minimum 20 characters
- At least one uppercase letter
- At least one digit
- At least one special character

### "Frontend build failed"
**Common causes:**
- Syntax errors in React code
- Missing dependencies
- Out of memory

**Solution:**
```powershell
# Clear caches and rebuild
Remove-Item -Path node_modules -Recurse -Force
Remove-Item -Path build -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run build
```

### "Electron build had errors"
**Common causes:**
- Missing code signing certificates
- Insufficient disk space
- Platform-specific build tools not installed

**Solution:**
- For Windows builds: Install Windows SDK
- For macOS builds: Run on macOS with Xcode
- For Linux builds: Install AppImage dependencies

### "Upload failed"
**Causes:**
- SSH key not configured
- Insufficient permissions
- Network issues

**Solution:**
```powershell
# Test SSH connection
ssh user@server.com "echo Connection OK"

# Configure SSH key
ssh-copy-id user@server.com
```

### "Service restart may have failed"
**Causes:**
- systemd service not configured
- Service name mismatch
- Insufficient sudo permissions

**Solution:**
```bash
# Check service status
sudo systemctl status nebula-vpn-server

# Enable service if not enabled
sudo systemctl enable nebula-vpn-server
```

## Security Notes

### Secrets Management
- **Never commit** `server/.env` to version control
- Store secrets securely (password manager, vault)
- Use different secrets for staging/production

### SSH Keys
For automated deployment, use SSH keys:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "deploy@nebula"

# Copy to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server.com
```

### Code Signing
For Electron builds, configure signing certificates:

**Windows:**
```powershell
$env:CSC_LINK = "C:\path\to\certificate.p12"
$env:CSC_KEY_PASSWORD = "cert-password"
```

**macOS:**
```bash
export APPLE_ID="developer@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

## Post-Deployment Verification

### Frontend Verification
```powershell
# Check build output
ls build

# Start local Electron app
npm run electron
```

### Backend Verification
```bash
# SSH to server
ssh user@server.com

# Check service status
sudo systemctl status nebula-vpn-server

# View logs
sudo journalctl -u nebula-vpn-server -f

# Test API endpoint
curl http://localhost:3001/health
```

### DNS Enforcement Verification
```powershell
# Run DNS verification script
.\verify-dns-simple.ps1
```

### VPN Connection Test
```powershell
# Start VPN with admin privileges
.\start-vpn-admin.ps1
```

## Rollback Procedure

If deployment fails:

### Frontend Rollback
```powershell
# Restore from Git
git checkout HEAD~1 -- build/

# Or rebuild from previous commit
git checkout HEAD~1
npm run build
```

### Backend Rollback
```bash
# SSH to server
ssh user@server.com

# Restore from backup
sudo cp -r /opt/nebula-vpn-server.backup/* /opt/nebula-vpn-server/

# Restart service
sudo systemctl restart nebula-vpn-server
```

## Best Practices

1. **Always test locally first**
   ```powershell
   .\DEPLOY-ALL.ps1 -Target local
   ```

2. **Use staging before production**
   ```powershell
   .\DEPLOY-ALL.ps1 -Target staging
   ```

3. **Backup before deploying to production**
   ```bash
   ssh user@server.com "sudo cp -r /opt/nebula-vpn-server /opt/nebula-vpn-server.backup"
   ```

4. **Monitor logs during deployment**
   ```bash
   ssh user@server.com "sudo journalctl -u nebula-vpn-server -f"
   ```

5. **Verify after deployment**
   - Test VPN connection
   - Check DNS enforcement
   - Verify API endpoints
   - Test Electron desktop app

## Support

For issues or questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if available
- Check server logs: `sudo journalctl -u nebula-vpn-server -f`
- Review build logs in PowerShell output

## License

Same as Nebula VPN project.
