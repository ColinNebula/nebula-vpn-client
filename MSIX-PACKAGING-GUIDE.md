# MSIX Packaging Guide for Nebula VPN

## Overview

MSIX is Microsoft's modern app packaging format that enables:
- Microsoft Store distribution
- Automatic updates via Windows Update
- Clean installation and uninstallation
- App containerization for security
- Simplified deployment

## ✅ Configuration Complete

The project is now configured for MSIX packaging! Here's what was added:

### 1. package.json Updates

Added MSIX target to electron-builder:
```json
{
  "target": "appx",
  "arch": ["x64", "arm64"]
}
```

Added MSIX-specific configuration:
```json
"appx": {
  "applicationId": "NebulaVPN",
  "identityName": "NebulaMedia3D.NebulaVPN",
  "publisher": "CN=Nebula Media 3D",
  "publisherDisplayName": "Nebula Media 3D",
  "displayName": "Nebula VPN",
  "backgroundColor": "#1a1a2e",
  "showNameOnTiles": true,
  "languages": ["en-US"],
  "addAutoLaunchExtension": true,
  "setBuildNumber": true
}
```

### 2. AppxManifest.xml Template

Created `build/appxmanifest.xml` with required capabilities:
- `runFullTrust` - Full trust execution (required for VPN)
- `allowElevation` - Admin privilege elevation
- `broadFileSystemAccess` - File system access
- Network capabilities for VPN operations
- Device capabilities for network adapter control

## 🚀 Building MSIX Package

### Basic Build

```powershell
# Build MSIX package
npm run build
npx electron-builder --win --x64 --config.win.target=appx

# Or add to package.json
npm run electron:build:msix
```

### Add Build Script to package.json

```json
"scripts": {
  "electron:build:msix": "npm run electron:prepare && electron-builder --win --x64 --config.win.target=appx"
}
```

### Build Output

The MSIX package will be created in:
```
dist/
  └── Nebula VPN 0.2.0.appx
```

## ⚠️ Critical Challenges for VPN Apps

### 1. **Admin Privileges Limitation**

**Problem:**
- MSIX apps run in an app container with restricted capabilities
- Your VPN app requires admin privileges for:
  - WireGuard tunnel creation (`wg` commands)
  - Windows Firewall modifications (Kill Switch, IPv6 blocking)
  - DNS configuration (`netsh` commands)
  - Network adapter management

**Solution Options:**

**Option A: Full Trust Package (Recommended)**
- Use `runFullTrust` capability in manifest ✅ (Already configured)
- Package as "Desktop Bridge" app
- Requires code signing certificate
- Cannot be distributed via Microsoft Store without special approval

**Option B: Full Trust with Installer**
- MSIX installs the app
- App requests elevation at runtime
- Less sandboxed, more like traditional app

**Option C: Helper Service Pattern**
- Main MSIX app runs sandboxed
- Separate Windows Service runs elevated
- MSIX app communicates with service via named pipes/RPC
- **Best for Microsoft Store submission**

### 2. **Microsoft Store Restrictions**

**Problem:**
- Microsoft Store has strict policies for VPN apps
- Requires special certification
- `allowElevation` capability requires justification

**Solution:**
1. **Apply for VPN app certification:**
   - Contact Microsoft Store support
   - Explain VPN functionality requirements
   - Request approval for restricted capabilities

2. **Alternative: Sideload Distribution**
   - Distribute MSIX outside the Store
   - Requires code signing certificate
   - Users must enable sideloading in Windows Settings

### 3. **Code Signing Requirements**

**Problem:**
- MSIX packages MUST be signed
- Microsoft Store requires specific certificate

**Solution:**

**For Testing (Development Certificate):**
```powershell
# Create self-signed certificate
$cert = New-SelfSignedCertificate `
  -Type Custom `
  -Subject "CN=Nebula Media 3D" `
  -KeyUsage DigitalSignature `
  -FriendlyName "Nebula VPN Development" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")

# Export certificate
$password = ConvertTo-SecureString -String "YourPassword" -Force -AsPlainText
Export-PfxCertificate `
  -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" `
  -FilePath "NebulaVPN.pfx" `
  -Password $password

# Trust the certificate
Import-Certificate `
  -FilePath "NebulaVPN.cer" `
  -CertStoreLocation "Cert:\LocalMachine\Root"
```

**For Production (Commercial Certificate):**
- Purchase from DigiCert, Sectigo, GlobalSign, etc.
- OR use Microsoft Store signing (automatic if published to Store)

### 4. **App Container Limitations**

**Problem:**
- Sandboxed apps have limited network stack access
- Cannot directly modify firewall rules
- Cannot create virtual network adapters

**Solutions:**

**A. Desktop Bridge / Centennial**
- Package as "Desktop Bridge" app
- Runs with full trust, minimal container restrictions
- Configure in `appxmanifest.xml`:
  ```xml
  <desktop:Extension Category="windows.fullTrustProcess" Executable="NebulaVPN.exe" />
  ```
  ✅ Already configured in our manifest

**B. Windows Service Pattern (Recommended for Store)**

Create separate components:

1. **MSIX App** (UI only, sandboxed)
   - React frontend
   - Electron window
   - Communicates with service

2. **Windows Service** (elevated, unrestricted)
   - VPN tunnel management
   - Firewall configuration
   - DNS settings
   - Installed separately or packaged as MSI

**Implementation:**

```javascript
// electron/vpn-service-client.js
const net = require('net');

class VPNServiceClient {
  constructor() {
    this.pipeName = '\\\\.\\pipe\\NebulaVPNService';
  }

  async sendCommand(command, data) {
    return new Promise((resolve, reject) => {
      const client = net.connect(this.pipeName, () => {
        client.write(JSON.stringify({ command, data }));
      });

      client.on('data', (response) => {
        resolve(JSON.parse(response.toString()));
        client.end();
      });

      client.on('error', reject);
    });
  }

  async connect(serverId, config) {
    return this.sendCommand('CONNECT', { serverId, config });
  }

  async disconnect() {
    return this.sendCommand('DISCONNECT', {});
  }

  async enableKillSwitch() {
    return this.sendCommand('ENABLE_KILLSWITCH', {});
  }
}

module.exports = VPNServiceClient;
```

**Windows Service** (separate project in C#/C++):
```csharp
// VPN Service that runs elevated
using System.ServiceProcess;
using System.IO.Pipes;

public class NebulaVPNService : ServiceBase
{
    private NamedPipeServerStream pipeServer;

    protected override void OnStart(string[] args)
    {
        pipeServer = new NamedPipeServerStream("NebulaVPNService", 
            PipeDirection.InOut, 1, 
            PipeTransmissionMode.Message,
            PipeOptions.Asynchronous);
        
        pipeServer.BeginWaitForConnection(OnClientConnect, null);
    }

    private void OnClientConnect(IAsyncResult result)
    {
        pipeServer.EndWaitForConnection(result);
        
        // Handle VPN commands
        var command = ReadCommand(pipeServer);
        
        switch (command.Type)
        {
            case "CONNECT":
                ConnectVPN(command.Data);
                break;
            case "DISCONNECT":
                DisconnectVPN();
                break;
            case "ENABLE_KILLSWITCH":
                EnableKillSwitch();
                break;
        }
    }

    private void ConnectVPN(dynamic data)
    {
        // Execute WireGuard commands
        // Configure firewall
        // Set DNS
    }
}
```

## 🎯 Recommended Approach

### For Development & Testing:
1. ✅ Use current NSIS installer (already working)
2. ✅ Build MSIX with self-signed certificate for testing
3. Test MSIX functionality on local machines

### For Production Distribution:

**Option 1: Sideload Distribution (Immediate)**
- Build MSIX with commercial code signing certificate
- Distribute via your website
- Users install via double-click (after enabling sideloading)
- Pros: Full functionality, no Store restrictions
- Cons: Requires user to enable sideloading

**Option 2: Microsoft Store (Long-term)**
- Refactor to use Windows Service pattern
- Apply for VPN app certification
- Submit to Microsoft Store
- Pros: Easy distribution, auto-updates, trust
- Cons: Requires service pattern, certification process

**Option 3: Hybrid Approach (Best)**
- Keep NSIS installer for power users (current)
- Add MSIX for Microsoft Store (future)
- Add Portable .exe for quick testing

## 📦 Building All Package Types

Add this npm script:

```json
"scripts": {
  "dist:all": "npm run build && electron-builder --win --x64 -c.win.target=nsis -c.win.target=portable -c.win.target=appx"
}
```

## 🔐 Code Signing Setup

### 1. Get Certificate

**Option A: Self-Signed (Development)**
```powershell
.\scripts\create-dev-certificate.ps1
```

**Option B: Commercial (Production)**
- Purchase from DigiCert: https://www.digicert.com/code-signing/
- Cost: ~$400-600/year
- Validates your identity

### 2. Configure electron-builder

Update `package.json`:
```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "your-password",
  "signingHashAlgorithms": ["sha256"],
  "signDlls": true
}
```

**Security Note:** Never commit certificates or passwords to Git!

Use environment variables:
```json
"win": {
  "certificateFile": "${env.CERTIFICATE_FILE}",
  "certificatePassword": "${env.CERTIFICATE_PASSWORD}"
}
```

## 🧪 Testing MSIX Package

### 1. Install Dependencies
```powershell
# Windows SDK (includes MakeAppx.exe)
# Already included in Windows 10/11 SDK
```

### 2. Build MSIX
```powershell
npm run electron:build:msix
```

### 3. Install for Testing
```powershell
# Option 1: Double-click the .appx file

# Option 2: PowerShell
Add-AppxPackage -Path "dist\Nebula VPN 0.2.0.appx"

# Option 3: With dependency check
Add-AppxPackage -Path "dist\Nebula VPN 0.2.0.appx" -DependencyPath "C:\path\to\dependencies"
```

### 4. Test App
```powershell
# Launch from Start Menu or
Start-Process "shell:AppsFolder\NebulaMedia3D.NebulaVPN_<random-id>!NebulaVPN"
```

### 5. Uninstall
```powershell
Remove-AppxPackage -Package "NebulaMedia3D.NebulaVPN_<version>_x64__<publisher-id>"
```

## 📋 Pre-Submission Checklist

Before submitting to Microsoft Store:

- [ ] App uses Full Trust properly
- [ ] All restricted capabilities justified
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Age rating determined
- [ ] App screenshots prepared (1366x768, 1920x1080)
- [ ] Store listing description written
- [ ] VPN functionality clearly disclosed
- [ ] Code signing certificate purchased
- [ ] Windows App Certification Kit (WACK) passed
- [ ] Special VPN certification obtained

## 🚨 Common Issues

### "This app can't run on your PC"
- **Cause:** MSIX not signed or certificate not trusted
- **Fix:** Install certificate to Trusted Root, or use commercial cert

### "Deployment failed"
- **Cause:** Previous version installed or capability conflict
- **Fix:** Uninstall old version first

### "App crashes on launch"
- **Cause:** Missing dependencies or capability restrictions
- **Fix:** Check Event Viewer logs, verify capabilities

### VPN features don't work
- **Cause:** App container restrictions
- **Fix:** Ensure `runFullTrust` capability is enabled

## 📚 Resources

- [Electron Builder MSIX Docs](https://www.electron.build/configuration/appx)
- [MSIX Packaging Tool](https://docs.microsoft.com/en-us/windows/msix/packaging-tool/tool-overview)
- [Windows App Certification Kit](https://developer.microsoft.com/en-us/windows/downloads/app-certification-kit/)
- [Microsoft Store Policies](https://docs.microsoft.com/en-us/windows/uwp/publish/store-policies)
- [Desktop Bridge](https://docs.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-root)

## 🎬 Next Steps

1. **Test MSIX build:** `npm run electron:build:msix`
2. **Test installation:** Install generated .appx file
3. **Test VPN functionality:** Verify all features work
4. **Decide distribution strategy:** Store vs Sideload vs Both
5. **Get code signing certificate** (if planning production)
6. **Consider Windows Service refactor** (if targeting Store)

---

**Note:** MSIX is a great modern packaging format, but for VPN apps with admin requirements, traditional NSIS installer may still be the most straightforward approach for general distribution. MSIX makes most sense for:
- Microsoft Store presence
- Enterprise deployment via Microsoft Endpoint Manager
- Modern Windows 11 integration
