# 🚀 Quick Start - Nebula VPN

**Last Updated**: March 26, 2026

---

## One-Line Startup (Recommended)

```powershell
.\start-nebula.ps1
```

This script automatically:
- ✅ Checks for Administrator privileges
- ✅ Verifies project structure
- ✅ Starts API server in separate window
- ✅ Waits for server to be ready
- ✅ Launches Electron VPN app
- ✅ Handles errors gracefully

---

## Alternative: NPM Script

```bash
npm run start:vpn
```

---

## Manual Start (If Preferred)

### Terminal 1: API Server
```bash
cd server
npm start
```

### Terminal 2: VPN App
```powershell
.\start-vpn-admin.ps1
```

---

## First Time Setup

If you haven't generated secrets yet:

```bash
node scripts/generate-secrets.js --admin-email admin@example.com --admin-password "YourPassword"
```

---

## Verify Everything Works

```powershell
# Check DNS enforcement
.\verify-dns-simple.ps1

# OR
npm run verify:dns
```

---

## Common Issues

### "Port 3001 already in use"
The launcher script automatically handles this. If running manually:

```powershell
# Find process using port 3001
Get-NetTCPConnection -LocalPort 3001 -State Listen

# Kill it (replace PID with actual process ID)
Stop-Process -Id <PID> -Force
```

### "⚠️ Failed to fetch" in Admin Panel
This means the API server isn't running. Use the launcher script:

```powershell
.\start-nebula.ps1
```

### DNS Not Enforced
Make sure you're running as Administrator:

```powershell
# Check if running as admin
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
# Should return: True
```

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `start-nebula.ps1` | ⭐ All-in-one launcher (server + app) |
| `start-vpn-admin.ps1` | Start Electron app only (as admin) |
| `verify-dns-simple.ps1` | Check DNS enforcement working |
| `verify-dns-enforcement.ps1` | Detailed DNS verification |

---

## Documentation

- [README.md](README.md) - Full project documentation
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Developer reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [CHANGELOG.md](CHANGELOG.md) - Version history

---

**Need Help?** Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#common-issues--solutions) for troubleshooting.
