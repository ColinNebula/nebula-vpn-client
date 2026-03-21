# Building Nebula VPN Installers

This guide explains how to create installers for Nebula VPN on Windows, macOS, and Linux.

## Prerequisites

### All Platforms
- Node.js 18+ and npm
- All dependencies installed: `npm install`

### Windows
- Windows 10/11
- **WireGuard for Windows** installed (required for VPN functionality)
- Administrator privileges (for DNS and network configuration)

### macOS
- macOS 10.13+
- Xcode Command Line Tools
- Optional: Apple Developer ID for code signing

### Linux
- For AppImage: No additional requirements
- For DEB: `dpkg` and `fakeroot`
- For RPM: `rpmbuild`

## Quick Start

### Build for Your Current Platform

```bash
# Build installer for your platform
npm run dist
```

The installer will be created in the `dist/` folder.

### Platform-Specific Builds

```bash
# Windows (NSIS installer + portable)
npm run electron:build:win

# macOS (DMG + ZIP)
npm run electron:build:mac

# Linux (AppImage + DEB)
npm run electron:build:linux
```

## Build Outputs

### Windows
- `dist/Nebula VPN-Setup-{version}.exe` - NSIS installer (recommended)
- `dist/Nebula VPN-{version}.exe` - Portable executable

**Important**: The Windows installer is configured to:
- ✅ Request administrator privileges (required for VPN/DNS operations)
- ✅ Check for WireGuard installation
- ✅ Configure Windows Firewall rules automatically
- ✅ Create desktop and start menu shortcuts

### macOS
- `dist/Nebula VPN-{version}.dmg` - Disk image
- `dist/Nebula VPN-{version}-mac.zip` - ZIP archive

### Linux
- `dist/Nebula VPN-{version}.AppImage` - Portable AppImage
- `dist/nebula-vpn-client_{version}_amd64.deb` - Debian package

## Configuration

The installer configuration is in `package.json` under the `"build"` key. Key settings:

```json
{
  "build": {
    "appId": "com.nebula.vpn",
    "productName": "Nebula VPN",
    "win": {
      "requestedExecutionLevel": "requireAdministrator"  // Critical for VPN
    }
  }
}
```

## Custom Installer Script

The NSIS installer uses a custom script at `build/installer.nsh` that:
- Checks for WireGuard installation
- Prompts user to download WireGuard if missing
- Configures Windows Firewall rules
- Cleans up properly on uninstall

## Troubleshooting

### "electron-builder: command not found"
```bash
npm install --save-dev electron-builder
```

### Windows Build Fails
- Ensure you have Windows SDK installed
- Run `npm run build` first to create the React build

### Icons Not Working
- Windows needs `.ico` format (256x256)
- macOS needs `.icns` format
- Linux can use `.png` format
- Run `npm run generate-icons` if you have that script

### "Application Requires Administrator"
This is **intentional** for Nebula VPN. The app needs admin privileges to:
- Configure network adapters
- Modify DNS settings
- Create WireGuard tunnels
- Manage firewall rules

## Code Signing

### Windows
For production releases, sign the installer with a code signing certificate:

```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password"
  }
}
```

### macOS
For distribution outside the App Store:

```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)"
  }
}
```

## Auto-Updates

The app uses `electron-updater` for automatic updates. Configure your release strategy in `package.json`:

```json
{
  "publish": {
    "provider": "github",
    "owner": "ColinNebula",
    "repo": "nebula-vpn-client"
  }
}
```

## Testing the Installer

1. Build the installer: `npm run electron:build:win`
2. Find the installer in `dist/` folder
3. Run the installer (requires admin rights)
4. Test the application launches correctly
5. Test VPN connection functionality
6. Test uninstaller removes everything properly

## Additional Commands

```bash
# Build React app only (no installer)
npm run build

# Pack without installer (for testing)
npm run electron-pack

# Run security audit before release
npm run security:audit

# Generate icons from logo
npm run generate-icons
```

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Run `npm run security:audit`
- [ ] Test on clean Windows installation
- [ ] Verify WireGuard detection works
- [ ] Test VPN connection
- [ ] Test DNS leak protection
- [ ] Build installer: `npm run electron:build:win`
- [ ] Test installer on another machine
- [ ] Sign the installer (production only)
- [ ] Upload to GitHub releases
- [ ] Test auto-update from previous version

## Files Included in Installer

```
build/**/*           - React build files
electron/**/*        - Electron main process files
public/electron.js   - Electron entry point
node_modules/**/*    - Dependencies
```

## Support

For issues with building installers:
1. Check `dist/` folder for build logs
2. Ensure all dependencies are installed
3. Verify WireGuard is installed (Windows)
4. Check that you're running as administrator (Windows)

---

**Note**: The installer is configured for production use. For development, use `npm run electron` instead.
