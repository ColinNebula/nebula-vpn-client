# Nebula VPN Client 🛡️

> **A comprehensive, enterprise-grade VPN client with advanced security features, multi-hop routing, AI optimization, and real-time threat protection.**

**Created by:** Developer Colin Nebula  
**Company:** Nebula Media 3D  
**Version:** 1.0.0  
**Last Updated:** March 28, 2026

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/nebula-media-3d/nebula-vpn-client)
[![Security](https://img.shields.io/badge/security-AES--256--GCM-green.svg)](SECURITY.md)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Installation Guide](#-installation-guide)
- [Development Setup](#-development-setup)
- [Security Features](#-security-features)
- [Subscription Plans](#-subscription-plans)
- [Deployment Guide](#-deployment-guide)
- [Testing & Verification](#-testing--verification)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License & Support](#-license--support)

---

## 🌟 Overview

Nebula VPN Client is a **modern, feature-rich VPN application** designed to provide users with **secure, private, and fast** internet connections. Built with cutting-edge web technologies and enterprise-grade security protocols, it offers an intuitive interface combined with powerful functionality for both casual users and security professionals.

### Why Nebula VPN?

- ✅ **Real VPN Protection** - Desktop app creates actual OS-level WireGuard tunnels (not browser simulation)
- ✅ **Military-Grade Encryption** - AES-256-GCM encryption for all sensitive data
- ✅ **Zero-Logs Policy** - Complete privacy protection with no activity logging
- ✅ **Advanced Threat Protection** - Real-time DNS leak prevention, IPv6 blocking, and kill switch
- ✅ **Multi-Hop Routing** - Route traffic through multiple servers for enhanced anonymity
- ✅ **AI-Powered Optimization** - Intelligent server selection and network optimization
- ✅ **Cross-Platform** - Windows, macOS, Linux desktop apps + Progressive Web App
- ✅ **Open Architecture** - Extensible, well-documented codebase for customization

---

## ✨ Key Features

### 🔐 Security & Privacy

#### VPN Protocols & Encryption
- **WireGuard Protocol** - Modern, fast, and secure VPN with state-of-the-art cryptography
- **OpenVPN Support** - Industry-standard protocol for maximum compatibility
- **IKEv2 Protocol** - Fast reconnection and mobile optimization
- **Post-Quantum Cryptography** - Future-proof encryption algorithms
- **AES-256-GCM Database Encryption** - All sensitive data encrypted at rest
  - Two-factor authentication secrets
  - OAuth provider tokens  
  - User credentials and session data

#### Advanced Security Features
- **Enhanced Kill Switch** 🔒
  - Blocks ALL internet traffic if VPN disconnects
  - Prevents accidental IP leaks
  - Only allows traffic through VPN tunnel
  - Administrator-level firewall integration
- **Real DNS Enforcement** ✅
  - OS-level DNS configuration via Windows `netsh`
  - Not just a UI toggle - actual system DNS changes
  - Forces all DNS queries through VPN tunnel
  - Uses trusted Cloudflare DNS (1.1.1.1, 1.0.0.1)
- **IPv6 Leak Protection** 🛡️
  - System-wide IPv6 blocking using Windows Firewall
  - Prevents IPv6 bypass attacks
  - Automatic on connection
- **DNS Leak Prevention** 🔐
  - Blocks port 53 on all non-VPN interfaces
  - Ensures no DNS queries bypass the tunnel
  - Real-time verification available
- **WebRTC Leak Protection** 🎯
  - Prevents browsers from exposing real IP
  - Chromium policy enforcement
  - Built into Electron startup
- **MAC Address Randomization** 🎭 (Optional)
  - Randomize network adapter MAC address
  - Prevents device tracking across networks

#### Privacy & Data Protection
- **Zero-Logs Policy** - No connection logs, browsing history, or DNS queries stored
- **No IP Leaks** - Multi-layer protection against IP exposure
- **Encrypted Storage** - SQLite database with AES-256-GCM encryption
- **Secure Session Management** - JWT tokens with secure configuration
- **Admin Privilege Detection** - Automatic detection and elevation prompts
- **Two-Factor Authentication (2FA)** - TOTP-based security for user accounts

### 🌍 Global Server Network

- **100+ Server Locations** across 50+ countries
- **Real-time Server Status** - Live ping, load monitoring, availability
- **Smart Server Selection** - AI-powered optimal server recommendations
- **Geographic Filtering** - Browse servers by continent, country, city
- **Server Load Balancing** - Visual load indicators (0-100%)
- **Multi-Hop VPN** 🔗
  - Route traffic through 2-3 servers simultaneously
  - Enhanced anonymity and privacy
  - Custom route creation
  - Pre-configured secure routes
- **Dedicated IP Addresses** (Ultimate plan)
- **Obfuscated Servers** - Bypass VPN blocking and deep packet inspection

### 📊 Advanced Monitoring & Analytics

#### Real-Time Monitoring
- **Traffic Analysis Dashboard**
  - Live download/upload speed graphs
  - Session and total data usage tracking
  - Bandwidth allocation visualization
  - Protocol-level metrics
- **Connection Quality Metrics**
  - Ping/latency monitoring
  - Packet loss detection
  - Jitter measurements
  - Connection stability scores
- **Performance Metrics**
  - Server response times
  - Throughput analysis
  - Connection success rates
  - Geographic latency heatmaps

#### Advanced Analytics
- **Traffic Analytics** - Deep dive into bandwidth usage patterns
- **Connection History** - Complete audit trail of VPN sessions
- **Data Usage Tracker** - Per-app and per-server data consumption
- **Geographic Analysis** - Interactive maps showing connection routes
- **Performance Reports** - Exportable PDF/CSV analytics reports
- **AI Network Optimizer** - Machine learning-based network optimization

### 🛡️ Security Tools & Threat Protection

- **Real-Time Threat Detection** ⚠️
  - Malware domain blocking
  - Phishing protection
  - Ad/tracker blocking
  - Suspicious DNS query detection
- **Firewall Manager** 🔥
  - Application-level firewall rules
  - Custom port blocking/allowing
  - Visual firewall rule editor
- **Port Scanner Protection** - Detects and blocks port scans
- **Warrant Canary** - Transparency about legal requests
- **Transparency Reports** - Published security audits and certifications
- **Security Audit Integration** - Automated vulnerability scanning

### ⚙️ Smart Automation & Configuration

- **Auto-Connect** ⚡
  - Connect to preferred server on startup
  - WiFi-based auto-connection rules
  - Schedule-based connections
- **Split Tunneling** 🔀
  - Route specific apps/domains through VPN
  - Bypass VPN for local network apps
  - Custom routing rules
  - Per-application configuration
- **Automation Rules Engine** 🤖
  - Create custom automation workflows
  - Trigger-based actions (time, network, location)
  - Multi-condition rule sets
- **Auto-Connect on Untrusted WiFi** 📶
  - Automatically protect on public networks
  - Trusted network whitelist
  - Network security scanning
- **Adaptive Learning** 🧠
  - AI learns user preferences
  - Automatic server optimization
  - Predictive connection management

### 🎨 User Experience & Interface

- **Modern UI/UX** - Professional glass-morphism design with smooth animations
- **Dark/Light Themes** 🌙 - Customizable interface themes
- **Responsive Design** 📱 - Seamless experience across desktop, tablet, mobile
- **Tab-Based Navigation** - Clean, intuitive interface organization
- **Real-Time Notifications** 🔔 - Desktop alerts for connection events
- **System Tray Integration** - Minimized background operation
- **Keyboard Shortcuts** ⌨️ - Quick access to common functions
- **Progressive Web App (PWA)** - Install on any device from browser
- **Offline Support** 💾 - Core functionality available offline

### 📱 Cross-Platform Support

#### Desktop Applications (Electron)
- **Windows** (7, 8, 10, 11) - Full featured with admin-level integration
- **macOS** (10.12+) - Native Mac experience
- **Linux** (Ubuntu, Debian, Fedora, Arch) - AppImage/deb/rpm packages

#### Progressive Web App (PWA)
- **Android** - Chrome, Edge, Samsung Internet
- **iOS/iPadOS** - Safari (with limitations)
- **ChromeOS** - Full PWA support
- **Smart TVs** - Android TV, Samsung Tizen, LG webOS
- **Gaming Consoles** - PS5, Xbox Series browsers

#### Platform-Specific Features
- ✅ **Electron App**: Full VPN tunneling, kill switch, DNS enforcement
- ⚠️ **Browser/PWA**: UI demo only - cannot create real VPN tunnels (browser limitation)

### 🔧 Developer & Enterprise Features

- **REST API** - Full-featured backend API for integrations
- **API Integration Hub** 🔗
  - Webhook support
  - SIEM forwarding
  - Custom API integrations
- **Admin Dashboard** 👑
  - User management
  - Server monitoring
  - System statistics
  - Configuration management
- **OAuth Integration** - Google, GitHub, Facebook, Microsoft
- **LDAP/Active Directory** - Enterprise authentication
- **Role-Based Access Control (RBAC)** - Granular permissions
- **Audit Logging** - Complete activity audit trail
- **Blockchain Verification** (Ultimate) - Connection proof on blockchain

---

## 🚀 Quick Start

### One-Line Startup (Recommended - Windows)

```powershell
.\start-nebula.ps1
```

This launcher script automatically:
- ✅ Checks for Administrator privileges
- ✅ Verifies project structure
- ✅ Starts API server in separate window
- ✅ Waits for server to be ready
- ✅ Launches Electron VPN app
- ✅ Handles errors gracefully

### Alternative Methods

**Using NPM Script:**
```bash
npm run start:vpn
```

**Manual Start (Two Terminals):**
```bash
# Terminal 1: API Server
cd server && npm start

# Terminal 2: VPN App (as Administrator on Windows)
npm run electron
```

**Web Version (Demo UI Only):**
```bash
npm start
# Visit http://localhost:3000
# Note: Browser version cannot create real VPN tunnels
```

### First-Time Setup

If you haven't generated secrets yet:

```bash
node scripts/generate-secrets.js --admin-email admin@example.com --admin-password "YourStrongPassword123!"
```

### Prerequisites

**Required:**
- Node.js v14+ (v18+ recommended)
- npm or yarn package manager
- Administrator/sudo privileges (for VPN tunnel creation)
- Modern web browser (for web version)

**Platform-Specific:**
- **Windows**: PowerShell 5.1+, Administrator rights
- **macOS**: Xcode Command Line Tools, sudo access
- **Linux**: WireGuard tools, sudo access

---

## 📱 Installation Guide

### Windows Installation

#### Option 1: Desktop App (Recommended)

1. **Clone the repository**
   ```powershell
   git clone https://github.com/nebula-media-3d/nebula-vpn-client.git
   cd nebula-vpn-client
   ```

2. **Install dependencies**
   ```powershell
   npm install
   cd server && npm install && cd ..
   ```

3. **Generate production secrets**
   ```powershell
   node scripts/generate-secrets.js --admin-email your@email.com --admin-password "YourStr0ng!Pass123"
   ```

4. **Configure WireGuard server** (Edit `server/.env`)
   ```env
   WG_SERVER_PUBLIC_KEY=<your-server-public-key>
   WG_SERVER_ENDPOINT=<your.server.ip>:51820
   WG_INTERFACE=wg0
   WG_DNS=1.1.1.1,1.0.0.1
   WG_SUBNET=10.8.0.0/24
   ```

5. **Start the application**
   ```powershell
   .\start-nebula.ps1
   ```

6. **Verify DNS enforcement**
   ```powershell
   .\verify-dns-simple.ps1
   ```

#### Option 2: Build Installer

```powershell
# Build Windows installer (.exe) - NSIS format
npm run dist

# Output: dist/Nebula-VPN-Setup-1.0.0.exe

# Or build MSIX package for Microsoft Store / Enterprise
npm run electron:build:msix

# Output: dist/Nebula-VPN-1.0.0.appx
```

**MSIX Packaging** (Windows 10+):
- Modern Windows app format for Microsoft Store and enterprise deployment
- Requires code signing certificate (self-signed for testing, commercial for production)
- See [MSIX-PACKAGING-GUIDE.md](MSIX-PACKAGING-GUIDE.md) for complete setup
- Create development certificate: `.\scripts\create-dev-certificate.ps1`
- Note: VPN apps require special capabilities (runFullTrust, allowElevation)

### macOS Installation

```bash
# Clone and install
git clone https://github.com/nebula-media-3d/nebula-vpn-client.git
cd nebula-vpn-client
npm install && cd server && npm install && cd ..

# Generate secrets
node scripts/generate-secrets.js --admin-email your@email.com --admin-password "YourPass123!"

# Start app
npm run electron-dev

# Or build .dmg installer
npm run electron-build -- --mac
```

### Linux Installation

```bash
# Install WireGuard first
sudo apt install wireguard  # Debian/Ubuntu
# OR
sudo dnf install wireguard-tools  # Fedora
# OR
sudo pacman -S wireguard-tools  # Arch

# Clone and install
git clone https://github.com/nebula-media-3d/nebula-vpn-client.git
cd nebula-vpn-client
npm install && cd server && npm install && cd ..

# Generate secrets
node scripts/generate-secrets.js --admin-email your@email.com --admin-password "YourPass123!"

# Start app (with sudo for VPN tunneling)
sudo npm run electron-dev

# Or build AppImage
npm run electron-build -- --linux
```

### Progressive Web App (PWA) Installation

#### Android (Chrome, Edge, Samsung Internet)

1. Open browser and visit: `https://colinnebula.github.io/nebula-vpn-client/`
2. Tap the "Install Nebula VPN" banner at the bottom
3. Or: Menu (⋮) → "Add to Home screen"
4. App icon appears on home screen

#### iOS/iPadOS (Safari only)

1. Open Safari and visit: `https://colinnebula.github.io/nebula-vpn-client/`
2. Tap Share button (📤)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

#### Desktop (Edge, Chrome)

1. Visit: `https://colinnebula.github.io/nebula-vpn-client/`
2. Look for install icon in address bar
3. Click "Install Nebula VPN"
4. App opens in standalone window

**Note:** PWA version is for UI demo only. For real VPN protection, use the Electron desktop app.

## 💻 Development Setup

### Development Environment

**Recommended IDE:**
- Visual Studio Code with extensions:
  - ESLint
  - Prettier
  - React Developer Tools
  - GitLens

**Development Scripts:**

```bash
# Start React dev server (web UI only)
npm start                    # Runs on http://localhost:3000

# Start Electron app in development
npm run electron-dev         # Hot-reload enabled

# Start full stack (API + Electron)
npm run start:vpn            # Recommended for development

# Run tests
npm test                     # Run test suite
npm run test:coverage        # With coverage report

# Code quality
npm run lint                 # ESLint check
npm run lint:fix             # Auto-fix linting issues
npm run format               # Prettier formatting

# Security
npm run security:audit       # Vulnerability scan
npm run verify:dns           # DNS enforcement verification

# Database
npm run db:migrate:encrypt   # Encrypt existing database

# Build
npm run build                # Production React build
npm run electron:prepare     # Prepare Electron build
npm run dist                 # Build installer/package
npm run electron:build:msix  # Build MSIX package
```

### Project Structure

```
nebula-vpn-client/
├── electron/                      # Electron main process
│   ├── main.js                   # Entry point, window, IPC, admin detection  
│   ├── vpn-tunnel.js             # WireGuard tunnel, DNS enforcement
│   ├── security-enhancements.js  # Security features (IPv6, kill switch)
│   ├── pqc-handshake.js          # Post-quantum cryptography
│   └── preload.js                # Secure IPC bridge
│
├── server/                        # Node.js API backend
│   ├── src/
│   │   ├── index.js              # Express server entry point
│   │   ├── db.js                 # SQLite + AES-256-GCM encryption
│   │   ├── routes/
│   │   │   ├── auth.js           # Authentication endpoints
│   │   │   ├── vpn.js            # VPN connection endpoints
│   │   │   ├── servers.js        # Server list endpoints
│   │   │   └── admin.js          # Admin dashboard endpoints
│   │   ├── services/             # Business logic
│   │   │   ├── vpn-service.js    # VPN operations
│   │   │   └── oauth-service.js  # OAuth providers
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.js           # JWT authentication
│   │   │   ├── rateLimit.js      # Rate limiting
│   │   │   └── security.js       # Security headers
│   │   └── migrations/           # Database migrations
│   ├── nebula.db                 # SQLite database (gitignored)
│   └── .env                      # Secrets (gitignored)
│
├── src/                           # React frontend
│   ├── components/               # React components (50+ components)
│   │   ├── ConnectButton/        # Main VPN connect button
│   │   ├── ServerList/           # Server selection UI
│   │   ├── MultiHop/             # Multi-hop configuration
│   │   ├── SplitTunneling/       # Split tunnel rules
│   │   ├── AdminPanel/           # Admin dashboard
│   │   ├── SubscriptionModal/    # Subscription/billing
│   │   ├── ThreatDetection/      # Security monitoring
│   │   └── ...                   # Many more
│   ├── screens/                  # Main app screens
│   ├── services/                 # API client services
│   ├── config/                   # Configuration
│   │   └── planFeatures.js       # Feature restrictions
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript definitions
│
├── scripts/                       # Build & utility scripts
│   ├── generate-secrets.js       # Generate secure .env
│   ├── security-audit.js         # Security scanner
│   ├── prepare-for-github.js     # Pre-commit scrubbing
│   ├── fix-emoji.js              # Emoji fix tool
│   └── generate-icons.js         # Icon generation
│
├── public/                        # Static assets
│   ├── index.html                # HTML template
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   └── icons/                    # App icons
│
├── build/                         # Build output (gitignored)
├── dist/                          # Distribution packages (gitignored)
│
├── start-nebula.ps1              # Windows launcher
├── verify-dns-simple.ps1         # DNS verification
└── FIX-EMOJI.js                  # Emoji corruption fix
```

### Adding New Features

**1. Add New Server Location:**

Edit `server/src/data/servers.json` (or database):
```json
{
  "id": "11",
  "name": "Singapore",
  "location": "Singapore, SG",
  "ip": "203.0.113.10",
  "country": "SG",
  "flag": "🇸🇬",
  "ping": "120ms",
  "load": 35
}
```

**2. Add New Component:**

```bash
# Create component folder
mkdir src/components/MyNewFeature

# Create files
touch src/components/MyNewFeature/index.js
touch src/components/MyNewFeature/MyNewFeature.css
```

**3. Add API Endpoint:**

Create `server/src/routes/myroute.js`:
```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/my-endpoint', authenticate, (req, res) => {
  res.json({ message: 'Success' });
});

module.exports = router;
```

Register in `server/src/index.js`:
```javascript
const myRoute = require('./routes/myroute');
app.use('/api/my', myRoute);
```

### Debugging

**Electron DevTools:**
- Press F12 in Electron app
- Or: View → Toggle Developer Tools

**React DevTools:**
- Install browser extension
- Available in browser when running `npm start`

**Logging:**
```javascript
// Frontend logging
console.log('🔍 Debug info:', data);

// Backend logging
const logger = require('./utils/logger');
logger.info('API request received');
logger.error('Error occurred', error);
```

**Network Debugging:**
```powershell
# Check API server
curl http://localhost:3001/api/health

# Check DNS configuration
ipconfig /all

# Check VPN interface
wg show
```

---

## 🔐 Security Features

### Encryption & Data Protection

**Database Encryption (AES-256-GCM):**
- All sensitive user data encrypted at rest:
  - Two-factor authentication (TOTP) secrets
  - OAuth provider tokens and IDs
  - Temporary 2FA setup tokens
  - Backup recovery codes
- **Encryption Key**: 64-character hex key (32 bytes)
- **Algorithm**: AES-256-GCM with random 16-byte IV
- **Authentication**: Built-in authentication tag verification
- **Key Management**: Environment variable in `server/.env`
- **Migration Support**: Script to encrypt existing data

**Connection Encryption:**
- WireGuard: ChaCha20-Poly1305 cipher
- OpenVPN: AES-256-CBC with SHA-512 HMAC
- IKEv2: AES-256-GCM
- Post-Quantum: Hybrid classic + PQC algorithms

### DNS Enforcement & Leak Protection

**Real OS-Level DNS Configuration:**
```powershell
# Actual Windows netsh commands executed:
netsh interface ip set dns "Ethernet" static 1.1.1.1
netsh interface ip add dns "Ethernet" 1.0.0.1 index=2
netsh interface ipv4 set interface "Ethernet" metric=10
netsh interface ipv4 set interface "nebula0" metric=1
```

**Multi-Layer DNS Protection:**
1. **Interface Priority** - VPN interface gets lowest metric (highest priority)
2. **Firewall Rules** - Block port 53 on all non-VPN interfaces
3. **Trusted DNS** - Force Cloudflare DNS (1.1.1.1, 1.0.0.1)
4. **Leak Monitoring** - Real-time DNS query verification

**Verification:**
```powershell
# Run automated verification
.\verify-dns-simple.ps1

# Manual checks
ipconfig /all  # Check configured DNS
nslookup example.com  # Test DNS resolution
```

### Enhanced Kill Switch

**How It Works:**
1. Blocks ALL outbound traffic by default
2. Allows only:
   - VPN server communication (WireGuard endpoint)
   - Traffic through VPN interface (nebula0)
   - Localhost/loopback (127.0.0.1)
3. Automatically re-enables on disconnect

**Firewall Rules Created:**
```
NebulaVPN-KS-BlockAll        → Block all outbound
NebulaVPN-KS-AllowVPN        → Allow VPN server IP
NebulaVPN-KS-AllowInterface  → Allow VPN interface
NebulaVPN-KS-AllowLocalhost  → Allow 127.0.0.1
```

**Status Check:**
```powershell
Get-NetFirewallRule -Name "NebulaVPN-KS-*" | Select-Object Name, Enabled, Action
```

### IPv6 Leak Protection

**System-Wide IPv6 Blocking:**
- Disables IPv6 on all network adapters
- Creates Windows Firewall rules:
  - `NebulaVPN-IPv6-Block-Out` (Outbound block)
  - `NebulaVPN-IPv6-Block-In` (Inbound block)
- Prevents IPv6 bypass attacks
- Automatically cleaned up on disconnect

**Verification:**
```powershell
# Check firewall rules
Get-NetFirewallRule -Name "NebulaVPN-IPv6-*"

# Test online
# Visit: https://test-ipv6.com/
# Expected: "IPv6 not detected"
```

### WebRTC Leak Protection

**Electron Integration:**
```javascript
app.commandLine.appendSwitch(
  'force-webrtc-ip-handling-policy',
  'disable_non_proxied_udp'
);
```

**Verification:**
- Visit: https://browserleaks.com/webrtc
- Expected: No local IP addresses exposed
- Only VPN IP (or 10.8.0.x) should appear

### Authentication & Access Control

**Two-Factor Authentication (2FA):**
- TOTP-based (Google Authenticator, Authy compatible)
- Encrypted secret storage in database
- Backup codes for recovery
- QR code setup via web interface

**OAuth Providers:**
- Google OAuth 2.0
- GitHub OAuth
- Facebook Login
- Microsoft Account
- All tokens encrypted at rest

**Session Management:**
- JWT tokens with secure signing (HS256)
- 128-character secret keys
- Token expiration and refresh
- Automatic session cleanup
- Secure cookie configuration

**Role-Based Access Control:**
- User role: Standard features
- Admin role: Full dashboard access
- Plan-based restrictions (Free/Premium/Ultimate)

### Security Best Practices

**For Users:**
1. ✅ Always run Electron app as Administrator (Windows)
2. ✅ Enable Kill Switch for maximum protection
3. ✅ Verify DNS enforcement after connecting
4. ✅ Keep app updated to latest version
5. ✅ Use strong, unique password
6. ✅ Enable 2FA on your account
7. ❌ Never share your encryption keys
8. ❌ Don't commit `.env` files to Git

**For Developers:**
1. ✅ Run `npm run security:audit` regularly
2. ✅ Use `scripts/prepare-for-github.js` before commits
3. ✅ Rotate JWT secrets periodically
4. ✅ Never log sensitive data
5. ✅ Validate all user inputs
6. ✅ Use parameterized queries (SQL injection prevention)
7. ✅ Keep dependencies updated
8. ✅ Review `.gitignore` for secrets

**Security Audit:**
```bash
npm run security:audit
# Scans for:
# - Hardcoded secrets/keys
# - Vulnerable dependencies
# - Insecure configurations
# - Common security issues
```

---

## 🛠️ Development

### Available Scripts

- **`npm start`** - Runs development server on port 3000
- **`npm test`** - Launches test runner
- **`npm run build`** - Creates production build
- **`npm run eject`** - Ejects from Create React App (one-way operation)

### Building for Production

```bash
npm run build
```

The build folder will contain the optimized production files ready for deployment.

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Technical Specifications

- **Framework**: React 19.1.1
- **Build Tool**: Create React App 5.0.1
- **Styling**: CSS3 with modern features
- **State Management**: React Hooks (useState, useEffect)
- **Responsive Design**: CSS Grid and Flexbox
- **Performance**: Optimized rendering and efficient updates

## 🔧 Customization

### Adding New Servers
Modify the `servers` array in `App.js`:
```javascript
const servers = [
  { 
    id: '9', 
    name: 'New Server', 
    location: 'City Name', 
    ping: '50ms', 
    load: 45, 
    country: 'XX', 
    flag: '🏁' 
  }
];
```

### Theming
Update CSS variables in component stylesheets to match your brand colors and styling preferences.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed by Nebula Media 3D. All rights reserved.

## 📞 Support

For technical support or business inquiries:

- **Email**: support@nebula3ddev.com
- **Developer**: Colin Nebula (info@nebula3ddev.com)
- **Company**: Nebula Media 3D
- **Documentation**: [info.nebula3ddev.com](https://info.nebula3ddev.com)

## 🏆 Acknowledgments

- React team for the excellent framework
- Create React App for the development setup
- Contributors to open-source VPN protocols
- Nebula Media 3D design team for UI/UX inspiration

---

## 💳 Subscription Plans

Nebula VPN offers three tiers to match your privacy needs and budget:

### FREE PLAN - $0/month

**What's Included:**
- ✅ 3 server locations (US East, US West, Europe)
- ✅ Basic VPN protection
- ✅ 10GB bandwidth per month
- ✅ 1 device simultaneously
- ✅ WireGuard protocol
- ✅ Standard connection speed
- ✅ Community support
- ✅ Basic traffic monitoring
- ✅ Connection logs
- ✅ Settings panel

**Limitations:**
- ❌ No multi-hop VPN
- ❌ No split tunneling
- ❌ No advanced analytics
- ❌ No security tools
- ❌ No automation features
- ❌ Limited server selection

---

### PREMIUM PLAN - $9.99/month or $99.99/year (Save 17%)

**Everything in FREE plus:**
- �� **50+ global server locations**
- ✅ **Unlimited bandwidth**
- ✅ **5 devices simultaneously**
- ✅ **Multi-Hop VPN** - Route through 2-3 servers
- ✅ **Split Tunneling** - Per-app VPN routing
- ✅ **Kill Switch** - Enhanced protection
- ✅ **Speed Test** - Real-time testing
- ✅ **Full Analytics Suite**:
  - Traffic Analytics
  - Performance Metrics  
  - Connection History
  - Data Usage Tracker
  - Geographic Map
- ✅ **Complete Security Suite**:
  - Threat Detection
  - DNS Protection
  - IPv6 Protection
  - Firewall Manager
  - Obfuscation
  - Two-Factor Auth
- ✅ **Automation Tools**:
  - Automation Rules
  - Auto-Connect WiFi
  - Schedule-based connects
- ✅ **Email Support** (24-48h response)
- ✅ **Ad Blocking**
- ✅ **Dark Web Monitoring**

**Most Popular** - Best value for individuals and small teams

---

### ULTIMATE PLAN - $19.99/month or $199.99/year (Save 17%)

**Everything in PREMIUM plus:**
- 🚀 **100+ global servers** including exclusive locations
- ✅ **Unlimited everything**
- ✅ **10 devices simultaneously**
- ✅ **AI Network Optimizer** - ML-based optimization
- ✅ **Quantum Security** - Post-quantum cryptography
- ✅ **Blockchain Integration** - Decentralized verification
- ✅ **Dedicated IP Address** - Static IP (optional)
- ✅ **Advanced Features**:
  - AI-Powered server selection
  - Adaptive learning
  - Predictive optimization
  - ML threat detection
- ✅ **Enterprise Features**:
  - API Integration Hub
  - Webhook support
  - SIEM forwarding
  - Custom integrations
  - Admin dashboard
  - Multi-user management
- ✅ **Next-Gen Security**:
  - Quantum-resistant encryption
  - Blockchain connection proofs  
  - Advanced obfuscation
  - Port randomization
  - MAC randomization
- ✅ **24/7 Priority Support** - Live chat + phone
- ✅ **30-day money-back guarantee**
- ✅ **White-label options**

**Best Value** - For professionals, businesses, and power users

---

### Feature Comparison Matrix

| Feature | Free | Premium | Ultimate |
|---------|------|---------|----------|
| **Server Locations** | 3 | 50+ | 100+ |
| **Bandwidth** | 10GB/month | Unlimited | Unlimited |
| **Devices** | 1 | 5 | 10 |
| **Multi-Hop VPN** | ❌ | ✅ | ✅ |
| **Split Tunneling** | ❌ | ✅ | ✅ |
| **Kill Switch** | ❌ | ✅ | ✅ |
| **Analytics** | Basic | Full Suite | Full Suite + AI |
| **Security Tools** | Basic | Complete | Enterprise |
| **Automation** | ❌ | ✅ | ✅ + AI |
| **Dedicated IP** | ❌ | ❌ | ✅ |
| **AI Optimization** | ❌ | ❌ | ✅ |
| **Blockchain Verification** | ❌ | ❌ | ✅ |
| **Support** | Community | Email (24-48h) | 24/7 Priority |

---

## 🚀 Deployment Guide

### Pre-Deployment Checklist

#### 1. Generate Production Secrets

```bash
node scripts/generate-secrets.js \
  --admin-email admin@yourdomain.com \
  --admin-password "YourStr0ng!Passw0rd2026"
```

**Password Requirements:**
- Minimum 20 characters
- At least one uppercase letter
- At least one digit
- At least one special character

**Generated Secrets** (in `server/.env`):
- `JWT_SECRET` - 128-character random key
- `JWT_REFRESH_SECRET` - 128-character random key
- `ENCRYPTION_KEY` - 64-character hex key (32 bytes)

#### 2. Configure WireGuard Server

Edit `server/.env`:

```env
WG_SERVER_PUBLIC_KEY=<your-server-public-key>
WG_SERVER_ENDPOINT=<your.server.ip.or.domain>:51820
WG_INTERFACE=wg0
WG_DNS=1.1.1.1,1.0.0.1
WG_SUBNET=10.8.0.0/24
```

**Set up WireGuard on Linux server:**
```bash
# Install WireGuard
apt install wireguard

# Generate keys
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

# Start WireGuard
wg-quick up wg0
```

#### 3. Configure CORS Origins

```env
ALLOWED_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
```

#### 4. Configure Rate Limiting

```env
RATE_LIMIT_MAX=300          # requests per window per IP
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
```

#### 5. Security Audit

```bash
npm run security:audit
```

### Deployment Options

#### Option 1: Traditional Server Deployment

**Requirements:**
- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+
- WireGuard installed
- Nginx or Apache
- SSL certificate (Let's Encrypt)

**Steps:**

1. **Clone on server:**
   ```bash
   git clone https://github.com/nebula-media-3d/nebula-vpn-client.git
   cd nebula-vpn-client
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   cd server && npm install --production && cd ..
   ```

3. **Build React app:**
   ```bash
   npm run build
   ```

4. **Set up systemd service** (`/etc/systemd/system/nebula-vpn.service`):
   ```ini
   [Unit]
   Description=Nebula VPN API Server
   After=network.target

   [Service]
   Type=simple
   User=nebulavpn
   WorkingDirectory=/opt/nebula-vpn-client/server
   ExecStart=/usr/bin/node src/index.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

5. **Start service:**
   ```bash
   systemctl enable nebula-vpn
   systemctl start nebula-vpn
   ```

6. **Configure Nginx:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name app.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       root /opt/nebula-vpn-client/build;
       index index.html;

       location / {
           try_files $uri /index.html;
       }

       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### Option 2: Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install --production
RUN cd server && npm install --production

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  nebula-vpn-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - server/.env
    volumes:
      - ./server/nebula.db:/app/server/nebula.db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./build:/usr/share/nginx/html:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - nebula-vpn-api
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

#### Option 3: GitHub Pages (Frontend Only)

```bash
# Build and deploy
npm run build
npm run deploy

# Or manually
npm run build
gh-pages -d build
```

**Note:** GitHub Pages only hosts the frontend UI. API server must be deployed separately.

### Post-Deployment

1. **Verify DNS enforcement:**
   ```powershell
   .\verify-dns-simple.ps1
   ```

2. **Test VPN connection:**
   - Connect via Electron app
   - Check IP: https://whatismyipaddress.com/
   - Test DNS: https://dnsleaktest.com/
   - Test IPv6: https://test-ipv6.com/

3. **Monitor logs:**
   ```bash
   # systemd service
   journalctl -u nebula-vpn -f

   # Docker
   docker-compose logs -f
   ```

4. **Set up backups:**
   ```bash
   # Backup database
   cp server/nebula.db server/nebula.db.backup

   # Backup .env
   cp server/.env server/.env.backup
   ```

---

## 🧪 Testing & Verification

### Automated Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- ServerList

# Watch mode (for development)
npm test -- --watch
```

### Security Testing

**1. Security Audit:**
```bash
npm run security:audit
# Scans for:
# - Hardcoded secrets/credentials
# - Vulnerable dependencies
# - Insecure configurations
# - Common security vulnerabilities
```

**2. DNS Enforcement Verification:**
```powershell
# Run comprehensive DNS test
.\verify-dns-simple.ps1

# Expected output:
# ✓ netsh commands working
# ✓ DNS set to 1.1.1.1, 1.0.0.1
# ✓ VPN interface priority correct
# ✓ No DNS leaks detected
```

**3. Kill Switch Testing:**
```powershell
# Check firewall rules
Get-NetFirewallRule -Name "NebulaVPN-KS-*" | Select-Object Name, Enabled, Action

# Disconnect VPN and verify internet is blocked
# Then reconnect and verify internet works again
```

**4. IP Leak Testing:**

Visit these sites while connected:
- **IP Check**: https://whatismyipaddress.com/
  - Should show VPN server IP, not your real IP
- **DNS Leak**: https://dnsleaktest.com/
  - Should show Cloudflare DNS (1.1.1.1, 1.0.0.1)
- **IPv6 Leak**: https://test-ipv6.com/
  - Should show "IPv6 not detected"
- **WebRTC Leak**: https://browserleaks.com/webrtc
  - Should NOT expose your local IP

### Manual Testing

**VPN Connection Flow:**
1. Open Electron app
2. Select server
3. Enable Kill Switch
4. Click Connect
5. Verify connection status shows "Connected ✓"
6. Check system tray shows green icon
7. Test internet access
8. Disconnect and verify kill switch

**Multi-Hop Testing:**
1. Enable Multi-Hop in settings
2. Select 2-3 servers
3. Click Connect
4. Verify route through traceroute:
   ```bash
   tracert google.com
   # Should show multiple VPN server hops
   ```

**Split Tunneling Testing:**
1. Configure split tunnel rules
2. Add specific app to bypass VPN
3. Connect VPN
4. Verify app uses real IP while others use VPN IP

### Performance Testing

```bash
# Speed test
# Open app → Navigate to Speed Test tab
# Click "Run Test"
# Should complete in 30-60 seconds

# Load testing (API)
npm run test:load

# Stress test
npm run test:stress
```

---

## 🔧 Troubleshooting

### Common Issues

#### "Port 3001 already in use"

**Solution:**
```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 3001 -State Listen

# Kill process  
Stop-Process -Id <PID> -Force

# Or use launcher script (handles automatically)
.\start-nebula.ps1
```

#### "⚠️ Failed to fetch" in Admin Panel

**Cause:** API server not running

**Solution:**
```powershell
# Check if server is running
curl http://localhost:3001/api/health

# Start server
cd server && npm start
```

#### DNS Not Enforced / DNS Leaking

**Symptoms:**
- `verify-dns-simple.ps1` shows errors
- DNS leak test shows ISP DNS

**Solution:**
1. **Run as Administrator:**
   ```powershell
   # Check admin status
   $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
   $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
   $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
   # Should return: True
   ```

2. **Restart with elevation:**
   ```powershell
   .\start-vpn-admin.ps1
   ```

3. **Manual DNS fix:**
   ```powershell
   netsh interface ip set dns "Ethernet" static 1.1.1.1
   netsh interface ip add dns "Ethernet" 1.0.0.1 index=2
   ```

#### Kill Switch Not Working

**Check firewall rules:**
```powershell
Get-NetFirewallRule -Name "NebulaVPN-KS-*"

# If missing, reconnect VPN with Kill Switch enabled
```

#### IPv6 Still Visible

**Solution:**
```powershell
# Check IPv6 blocking
Get-NetFirewallRule -Name "NebulaVPN-IPv6-*"

# Manually disable IPv6 on adapters
Get-NetAdapterBinding -ComponentID ms_tcpip6 | Disable-NetAdapterBinding
```

#### "Can't connect to VPN server"

**Diagnostics:**
1. **Check server status:**
   ```bash
   ssh root@your.server.ip
   wg show
   ```

2. **Verify `.env` configuration:**
   - Correct`WG_SERVER_ENDPOINT`
   - Valid `WG_SERVER_PUBLIC_KEY`

3. **Check firewall:**
   ```bash
   # On server
   ufw allow 51820/udp
   ```

4. **Test connectivity:**
   ```bash
   nc -vz your.server.ip 51820
   ```

#### Emoji Rendering Issues (Question Marks)

**Solution:**
```bash
# Fix corrupted emojis
node FIX-EMOJI.js --fix-corruption

# Or replace all emojis with text
node FIX-EMOJI.js

# Or restore originals
node FIX-EMOJI.js --restore
```

See [EMOJI-FIX-GUIDE.md](EMOJI-FIX-GUIDE.md) for details.

#### Database Encryption Errors

**Symptoms:**
- "Invalid encryption key" errors
- "Authentication tag mismatch"

**Solution:**
1. **Verify encryption key:**
   ```bash
   # Check .env file
   cat server/.env | grep ENCRYPTION_KEY
   # Should be 64 hex characters
   ```

2. **Regenerate key (WARNING: will break existing data):**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Migrate existing database:**
   ```bash
   npm run db:migrate:encrypt
   ```

### Getting Help

**Documentation:**
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Development reference
- [SECURITY.md](SECURITY.md) - Security policy
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment details
- [VPN_SECURITY_FEATURES.md](VPN_SECURITY_FEATURES.md) - Security features
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures

**Support Channels:**
- **GitHub Issues**: Report bugs and feature requests
- **Email**: support@nebula3ddev.com
- **Developer**: info@nebula3ddev.com

**Premium Support** (Premium/Ultimate plans):
- **Email Support**: Priority 24-48h response
- **Live Chat**: 24/7 (Ultimate only)
- **Phone**: Available for Ultimate plan

---

## 📡 API Documentation

### Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.yourdomain.com/api`

### Authentication

All protected endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication

**POST /api/auth/login**
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGc...",
  "user": {
    "email": "user@example.com",
    "role": "user",
    "plan": "free"
  }
}
```

**POST /api/auth/register**
```json
// Request
{
  "email": "newuser@example.com",
  "password": "StrongPass123!",
  "plan": "free"
}

// Response
{
  "message": "User registered successfully",
  "userId": "uuid-here"
}
```

**POST /api/auth/refresh**
```json
// Request
{
  "refreshToken": "refresh-token-here"
}

// Response
{
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

#### VPN Operations

**GET /api/servers** (Public)
```json
// Response
{
  "servers": [
    {
      "id": "1",
      "name": "New York, USA",
      "country": "US",
      "flag": "🇺🇸",
      "ip": "192.0.2.1",
      "load": 35,
      "ping": "25ms",
      "premium": false
    }
  ]
}
```

**POST /api/vpn/connect** (Protected)
```json
// Request
{
  "serverId": "1",
  "protocol": "wireguard",
  "killSwitch": true
}

// Response
{
  "status": "connected",
  "config": {
    "interface": "nebula0",
    "ip": "10.8.0.2",
    "dns": ["1.1.1.1", "1.0.0.1"]
  }
}
```

**POST /api/vpn/disconnect** (Protected)
```json
// Response
{
  "status": "disconnected",
  "message": "VPN disconnected successfully"
}
```

#### User Management

**GET /api/user/profile** (Protected)
```json
// Response
{
  "email": "user@example.com",
  "plan": "premium",
  "role": "user",
  "devices": 3,
  "usageThisMonth": "45.2 GB",
  "subscription": {
    "status": "active",
    "nextBilling": "2026-04-28",
    "cancelAtPeriodEnd": false
  }
}
```

**PUT /api/user/settings** (Protected)
```json
// Request
{
  "autoConnect": true,
  "killSwitch": true,
  "notifications": true,
  "theme": "dark"
}

// Response
{
  "message": "Settings updated successfully"
}
```

#### Admin Operations

**GET /api/admin/users** (Admin only)
```json
// Response
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "plan": "premium",
      "status": "active",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 1234
}
```

**GET /api/admin/stats** (Admin only)
```json
// Response
{
  "totalUsers": 1234,
  "activeConnections": 567,
  "bandwidthUsed": "12.5 TB",
  "serversOnline": 95,
  "uptime": "99.98%"
}
```

### Rate Limiting

- **Default**: 300 requests per 15 minutes per IP
- **Authentication endpoints**: 20 requests per 15 minutes
- **Admin endpoints**: 100 requests per 15 minutes

Exceeded limits return:
```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

### Error Responses

**Standard Error Format:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get involved:

### How to Contribute

**1. Fork the Repository**
```bash
git clone https://github.com/yourusername/nebula-vpn-client.git
cd nebula-vpn-client
```

**2. Create a Feature Branch**
```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

**3. Make Your Changes**
- Follow the coding style (see below)
- Add tests for new features
- Update documentation
- Run linting and tests

**4. Commit Your Changes**
```bash
git add .
git commit -m "feat: Add amazing feature"

# Commit message format:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes
# refactor: Code refactoring
# test: Adding tests
# chore: Maintenance tasks
```

**5. Push and Create Pull Request**
```bash
git push origin feature/amazing-feature
```

Then open a Pull Request on GitHub.

### Coding Standards

**JavaScript/React:**
- Use ES6+ features
- Follow Airbnb style guide
- Use functional components with hooks
- Proper PropTypes validation
- Meaningful variable/function names
- Comments for complex logic

**CSS:**
- Use BEM naming convention
- Mobile-first responsive design
- CSS variables for theming
- Avoid !important

**Git:**
- Descriptive commit messages
- One feature/fix per commit
**Small,focused Pull Requests
- Link to related issues

### Running Tests

```bash
# Before submitting PR
npm run lint          # Check code style
npm run lint:fix      # Auto-fix issues
npm test              # Run tests
npm run test:coverage # Check coverage
npm run security:audit # Security check
```

### Development Guidelines

**Adding New Features:**
1. Discuss in GitHub Issues first
2. Create feature branch
3. Implement with tests
4. Update documentation
5. Submit PR

**Bug Fixes:**
1. Create issue describing bug
2. Reference issue in PR
3. Add regression test
4. Verify fix works

**Documentation:**
- Update README.md for major features
- Add JSDoc comments for functions
- Update CHANGELOG.md
- Include code examples

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or discrimination
- Follow GitHub's community guidelines

---

## 📄 License & Support

### License

This project is **proprietary software** developed by Nebula Media 3D. All rights reserved.

**© 2025-2026 Nebula Media 3D. All rights reserved.**

Unauthorized copying, modification, distribution, or use of this software without explicit permission is strictly prohibited.

### Support

#### Free Support
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and references
- **Community Forums**: Community-driven support

#### Premium Support (Paid Plans)

**Premium Plan:**
- ✉️ Email support with 24-48h response time
- 📚 Priority documentation access
- 🐛 Bug fix priority

**Ultimate Plan:**
- 💬 24/7 Live chat support
- 📞 Phone support (business hours)
- 🚀 Feature request priority
- 👨‍💻 Dedicated account manager
- 🔧 Custom integration assistance

### Contact Information

**General Inquiries:**
- **Website**: https://info.nebula3ddev.com
- **Email**: info@nebula3ddev.com

**Technical Support:**
- **Email**: support@nebula3ddev.com
- **GitHub**: https://github.com/nebula-media-3d/nebula-vpn-client

**Security Issues:**
- **Email**: security@nebulavpn.com
- **Policy**: [SECURITY.md](SECURITY.md)

**Developer:**
- **Name**: Colin Nebula
- **Email**: info@nebula3ddev.com
- **Company**: Nebula Media 3D

### Acknowledgments

- **React Team** - Excellent framework
- **Electron Team** - Desktop app framework
- **WireGuard** - Modern VPN protocol
- **Cloudflare** - DNS infrastructure (1.1.1.1)
- **Open Source Community** - Inspiration and libraries
- **Contributors** - Everyone who helped make this better

### Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

**Latest Version:** 1.0.0 (March 28, 2026)
- Initial release with full feature set
- Electron desktop apps for Windows/Mac/Linux
- Progressive Web App support
- Enterprise-grade security features
- Subscription system
- Admin dashboard
- Complete API backend

---

**Built with ❤️ by Developer Colin Nebula @ Nebula Media 3D**

*Protecting your privacy, one connection at a time.* 🛡️
