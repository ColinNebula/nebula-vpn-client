# 🚀 Nebula VPN - Deployment Scripts Quick Reference

Choose the right deployment script for your needs.

## 📋 Available Scripts

### 1. [DEPLOY-CLOUD.ps1](DEPLOY-CLOUD.ps1) - **GitHub Pages + DigitalOcean** ⭐ RECOMMENDED
**Best for:** Cloud deployment to GitHub Pages (frontend) and DigitalOcean (backend)

```powershell
# Full cloud deployment
.\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP 159.89.123.45 -UpdateHomepage

# Quick interactive wizard
.\DEPLOY-CLOUD-QUICK.ps1
```

**Features:**
- ✅ Deploy frontend to GitHub Pages (free hosting)
- ✅ Deploy backend to DigitalOcean droplet
- ✅ Configure new droplet automatically
- ✅ Install WireGuard VPN server
- ✅ Setup SSL certificates
- ✅ Build Electron desktop apps

**When to use:**
- ✓ First-time deployment
- ✓ Production deployment
- ✓ You want free frontend hosting
- ✓ You have a DigitalOcean account

📖 **Guide:** [DEPLOY-CLOUD-GUIDE.md](DEPLOY-CLOUD-GUIDE.md)

---

### 2. [DEPLOY-ALL.ps1](DEPLOY-ALL.ps1) - **Generic Cloud Deployment**
**Best for:** Deploying to any server with SSH access (not specific to DigitalOcean)

```powershell
# Deploy to any server
.\DEPLOY-ALL.ps1 -Target production -DeployBackend -ServerHost user@yourserver.com -RestartServer
```

**Features:**
- ✅ Deploy to any VPS/server via SSH
- ✅ Works with AWS, Linode, custom servers
- ✅ Build frontend locally
- ✅ Build Electron desktop apps
- ✅ Security audits

**When to use:**
- ✓ You have your own VPS/server
- ✓ Using AWS EC2, Linode, or other providers
- ✓ Need flexibility in server choice
- ✓ Backend-only deployment

📖 **Guide:** [DEPLOY-ALL-GUIDE.md](DEPLOY-ALL-GUIDE.md)

---

### 3. [DEPLOY-CLOUD-QUICK.ps1](DEPLOY-CLOUD-QUICK.ps1) - **Interactive Wizard** 🎯
**Best for:** Beginners or guided deployment

```powershell
# Interactive menu
.\DEPLOY-CLOUD-QUICK.ps1

# Or specify scenario directly
.\DEPLOY-CLOUD-QUICK.ps1 setup      # Setup DigitalOcean droplet
.\DEPLOY-CLOUD-QUICK.ps1 frontend   # Deploy to GitHub Pages
.\DEPLOY-CLOUD-QUICK.ps1 backend    # Deploy to DigitalOcean
.\DEPLOY-CLOUD-QUICK.ps1 full       # Full deployment
.\DEPLOY-CLOUD-QUICK.ps1 update     # Update existing deployment
```

**Features:**
- ✅ Interactive menu system
- ✅ Step-by-step prompts
- ✅ Preset configurations
- ✅ Beginner-friendly

**When to use:**
- ✓ First time deploying
- ✓ Prefer guided approach
- ✓ Not sure what options to use

---

### 4. [DEPLOY-QUICK.ps1](DEPLOY-QUICK.ps1) - **Development Shortcuts**
**Best for:** Quick development builds and testing

```powershell
.\DEPLOY-QUICK.ps1 dev          # Fast dev build
.\DEPLOY-QUICK.ps1 build        # Frontend only
.\DEPLOY-QUICK.ps1 full         # Local full build
.\DEPLOY-QUICK.ps1 production   # All platforms
```

**Features:**
- ✅ Preset build configurations
- ✅ No deployment, just building
- ✅ Fast iteration

**When to use:**
- ✓ Local development
- ✓ Testing builds
- ✓ Not deploying anywhere

---

## 🎯 Which Script Should I Use?

### Scenario: "I want to deploy to production"
```powershell
# Use DEPLOY-CLOUD.ps1 for cloud deployment
.\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP YOUR_IP -UpdateHomepage
```

### Scenario: "I'm deploying for the first time"
```powershell
# Use the interactive wizard
.\DEPLOY-CLOUD-QUICK.ps1
```

### Scenario: "I have my own AWS server"
```powershell
# Use DEPLOY-ALL.ps1 for any server
.\DEPLOY-ALL.ps1 -Target production -DeployBackend -ServerHost user@aws-server.com
```

### Scenario: "I only want to update the frontend"
```powershell
# Use DEPLOY-CLOUD.ps1 for GitHub Pages
.\DEPLOY-CLOUD.ps1 -DeployFrontend -SkipTests
```

### Scenario: "I just want to build locally"
```powershell
# Use DEPLOY-QUICK.ps1 for local builds
.\DEPLOY-QUICK.ps1 build
```

---

## 📊 Feature Comparison

| Feature | DEPLOY-CLOUD | DEPLOY-ALL | DEPLOY-CLOUD-QUICK | DEPLOY-QUICK |
|---------|--------------|------------|-------------------|--------------|
| **GitHub Pages** | ✅ | ❌ | ✅ | ❌ |
| **DigitalOcean** | ✅ | ✅ | ✅ | ❌ |
| **Any Server** | ❌ | ✅ | ❌ | ❌ |
| **Droplet Setup** | ✅ | ❌ | ✅ | ❌ |
| **WireGuard Install** | ✅ | ❌ | ✅ | ❌ |
| **SSL Setup** | ✅ | ❌ | ✅ | ❌ |
| **Interactive** | ❌ | ❌ | ✅ | ✅ |
| **Electron Builds** | ✅ | ✅ | ⚠️ Optional | ⚠️ Optional |
| **Local Only** | ❌ | ⚠️ Optional | ❌ | ✅ |

---

## 🚀 Common Workflows

### Workflow 1: Fresh Deployment to Cloud

1. **Setup droplet:**
   ```powershell
   .\DEPLOY-CLOUD-QUICK.ps1 setup
   ```

2. **Configure environment:**
   - Copy WireGuard keys to `server/.env`
   - Run `node scripts/generate-secrets.js`

3. **Full deployment:**
   ```powershell
   .\DEPLOY-CLOUD-QUICK.ps1 full
   ```

### Workflow 2: Update Existing Deployment

```powershell
# Frontend and backend update
.\DEPLOY-CLOUD-QUICK.ps1 update

# Or direct command
.\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP YOUR_IP -SkipTests
```

### Workflow 3: Development to Production

1. **Develop locally:**
   ```powershell
   npm start
   ```

2. **Test build:**
   ```powershell
   .\DEPLOY-QUICK.ps1 build
   ```

3. **Deploy to staging:**
   ```powershell
   .\DEPLOY-CLOUD.ps1 -DeployFrontend -GitHubBranch staging
   ```

4. **Deploy to production:**
   ```powershell
   .\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP YOUR_IP
   ```

---

## 📖 Documentation

- **[DEPLOY-CLOUD-GUIDE.md](DEPLOY-CLOUD-GUIDE.md)** - Complete GitHub + DigitalOcean guide
- **[DEPLOY-ALL-GUIDE.md](DEPLOY-ALL-GUIDE.md)** - Generic server deployment guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Original deployment documentation

---

## 💡 Tips

### For Beginners
Start with the interactive wizard:
```powershell
.\DEPLOY-CLOUD-QUICK.ps1
```

### For Cloud Deployment
Use DEPLOY-CLOUD.ps1 for GitHub Pages + DigitalOcean:
```powershell
.\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP YOUR_IP
```

### For Custom Servers
Use DEPLOY-ALL.ps1 for any server:
```powershell
.\DEPLOY-ALL.ps1 -DeployBackend -ServerHost user@server.com
```

### For Quick Testing
Use DEPLOY-QUICK.ps1 for local builds:
```powershell
.\DEPLOY-QUICK.ps1 dev
```

---

## 🆘 Need Help?

1. **Prerequisites issues?** Check [DEPLOY-CLOUD-GUIDE.md](DEPLOY-CLOUD-GUIDE.md#prerequisites)
2. **Deployment errors?** See [DEPLOY-CLOUD-GUIDE.md](DEPLOY-CLOUD-GUIDE.md#troubleshooting)
3. **First time?** Use `.\DEPLOY-CLOUD-QUICK.ps1` for guided setup

---

## ⚡ Quick Commands Cheatsheet

```powershell
# Interactive wizard (recommended for beginners)
.\DEPLOY-CLOUD-QUICK.ps1

# Setup new DigitalOcean droplet
.\DEPLOY-CLOUD.ps1 -ConfigureDroplet -InstallWireGuard -DropletIP YOUR_IP

# Deploy frontend to GitHub Pages
.\DEPLOY-CLOUD.ps1 -DeployFrontend -UpdateHomepage

# Deploy backend to DigitalOcean
.\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP YOUR_IP

# Full cloud deployment
.\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP YOUR_IP

# Deploy to custom server
.\DEPLOY-ALL.ps1 -DeployBackend -ServerHost user@server.com

# Quick dev build
.\DEPLOY-QUICK.ps1 dev

# Update existing deployment
.\DEPLOY-CLOUD-QUICK.ps1 update
```

---

**Choose your deployment path and get started! 🚀**
