# Nebula VPN - System-Wide GPS Spoofing Guide

> **Enterprise-Grade GPS/Location Spoofing for Complete Privacy**

**Last Updated:** April 16, 2026  
**Author:** ColinNebula - Nebula Media 3D  
**Version:** 1.0.0

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Platform Support](#-platform-support)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)
- [Technical Details](#-technical-details)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)
- [Legal & Ethical Use](#-legal--ethical-use)

---

## 🌍 Overview

Nebula VPN now includes **system-wide GPS spoofing** capabilities that go beyond browser-level location blocking. This feature intercepts GPS/location requests at the OS level, ensuring that **ALL applications** on your system see your spoofed location instead of your real one.

### Why System-Wide GPS Spoofing?

- **Complete Privacy:** Prevents location tracking by ANY app, not just browsers
- **Gaming & Apps:** Use location-based mobile apps from anywhere
- **Regional Testing:** Test geo-restricted features without VPN disconnects
- **Anti-Tracking:** Stop apps from correlating your VPN IP with real GPS location
- **Consistency:** Match your VPN server location with GPS coordinates

---

## ✨ Features

### 🔐 Security Features

- ✅ **Windows Location Service Interception** - Registry-based system hooks
- ✅ **Privacy Protection** - Disables real GPS to prevent leaks
- ✅ **Administrator Integration** - Proper privilege elevation handling
- ✅ **Backup & Restore** - Automatic backup of original settings
- ✅ **Multiple Modes** - Registry, Service Hook, Virtual Driver (future)

### 🎯 Functionality

- ✅ **Preset Locations** - Quick access to major cities worldwide
- ✅ **Custom Coordinates** - Enter any latitude/longitude manually
- ✅ **VPN Auto-Match** - Automatically match GPS to VPN server location
- ✅ **GPS Jitter** - Simulate realistic movement with random drift
- ✅ **Accuracy Control** - High/Medium/Low precision settings
- ✅ **Timezone Alignment** - Match timezone to spoofed location

### 🖥️ Platform Support

| Platform | Status | Method | Admin Required |
|----------|--------|--------|----------------|
| **Windows 10/11** | ✅ Fully Supported | Registry Interception | Yes |
| **Windows 7/8** | ⚠️ Partial Support | Registry Interception | Yes |
| **macOS** | 🔜 Planned | CoreLocation Override | Yes |
| **Linux** | 🔜 Planned | GeoClue Override | Yes (sudo) |
| **Android** | 📱 Template Ready | Mock Location Provider | Developer Mode |
| **iOS** | ❌ Not Possible | System Restrictions | - |

---

## 🛠️ Installation & Setup

### Prerequisites

1. **Administrator Privileges**
   - Windows: Run as Administrator
   - macOS/Linux: sudo access

2. **Nebula VPN Desktop App**
   - Electron version with GPS module
   - Version 1.0.0 or higher

### Quick Setup (Windows)

#### Method 1: PowerShell Script (Recommended)

```powershell
# Run as Administrator
.\SETUP-GPS-SPOOFING.ps1
```

The script will:
- Check for admin privileges
- Backup current location settings
- Configure GPS spoofing
- Provide interactive menu

#### Method 2: Manual Registry Setup

```powershell
# 1. Backup original settings
reg export "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location" location_backup.reg

# 2. Disable Windows Location Service
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location" /v Value /t REG_SZ /d Deny /f

# 3. Set spoofed coordinates (example: New York)
reg add "HKCU\SOFTWARE\Nebula\VPN\GPS" /v Latitude /t REG_SZ /d "40.7128" /f
reg add "HKCU\SOFTWARE\Nebula\VPN\GPS" /v Longitude /t REG_SZ /d "-74.0060" /f
reg add "HKCU\SOFTWARE\Nebula\VPN\GPS" /v Accuracy /t REG_DWORD /d 10 /f
reg add "HKCU\SOFTWARE\Nebula\VPN\GPS" /v Enabled /t REG_DWORD /d 1 /f
```

---

## 📘 Usage Guide

### Using the Electron App (Recommended)

1. **Launch Nebula VPN as Administrator**
   ```powershell
   .\start-vpn-admin.ps1
   ```

2. **Navigate to Settings → GPS Override**

3. **Select Location Method:**
   - **Auto-Match VPN Server:** Automatically sets GPS to match your VPN server
   - **Preset Locations:** Choose from 50+ cities worldwide
   - **Custom Coordinates:** Enter specific lat/lng values

4. **Enable System-Wide GPS Spoofing**
   - Click the "Enable" button in the System GPS Control panel
   - All apps will now see your spoofed location

5. **Verify Spoofing Works**
   - Open Google Maps or any location-based app
   - Check if it shows your spoofed location

### Using PowerShell Script Directly

```powershell
# Enable GPS spoofing with coordinates
.\SETUP-GPS-SPOOFING.ps1 -Latitude 40.7128 -Longitude -74.0060 -Enable

# Check current status
.\SETUP-GPS-SPOOFING.ps1 -Status

# Disable GPS spoofing
.\SETUP-GPS-SPOOFING.ps1 -Disable

# Use preset location (interactive menu)
.\SETUP-GPS-SPOOFING.ps1
```

### Programmatic API (JavaScript/Electron)

```javascript
// Enable GPS spoofing
const result = await window.electron.gps.enable({
  location: { lat: 40.7128, lng: -74.0060, accuracy: 10 },
  mode: 'registry' // or 'service_hook', 'virtual_driver', 'android_mock'
});

console.log(result.success); // true

// Update location
await window.electron.gps.update({
  location: { lat: 51.5074, lng: -0.1278 }
});

// Add GPS jitter (5 meters)
await window.electron.gps.addJitter({ maxMeters: 5 });

// Get current status
const status = await window.electron.gps.getStatus();
console.log(status.enabled, status.location);

// Disable GPS spoofing
await window.electron.gps.disable();
```

---

## 🔧 Technical Details

### Windows Implementation

#### Method 1: Registry-Based Interception (Current)

**How it works:**
1. Disables Windows Location Service via registry (`HKLM\...\location`)
2. Stores spoofed coordinates in `HKCU\SOFTWARE\Nebula\VPN\GPS`
3. Apps reading from these registry keys get spoofed data

**Pros:**
- No driver required
- Easy to implement and reverse
- Works for most apps

**Cons:**
- Some apps bypass registry and use direct GPS hardware
- Requires admin privileges

**Registry Locations:**
- **System Location:** `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location`
- **Nebula GPS Data:** `HKCU\SOFTWARE\Nebula\VPN\GPS`

#### Method 2: Service Hook (Planned)

**How it works:**
1. Intercepts `ILocationProvider` COM interface
2. Injects DLL into Windows Location Service process
3. Hooks system GPS calls and returns spoofed data

**Status:** Template ready, requires DLL implementation

#### Method 3: Virtual GPS Sensor Driver (Future)

**How it works:**
1. Kernel-mode driver registered as GPS sensor
2. Intercepts all GPS requests at driver level
3. Most transparent and powerful method

**Status:** Design complete, requires driver signing

### Android Implementation (Mobile)

**For React Native:**
```javascript
import MockLocation from 'react-native-location-mock';

// Enable mock location
await MockLocation.setMockLocationEnabled(true);

// Set location
await MockLocation.setMockLocation({
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10
});
```

**Requirements:**
- Developer Options enabled
- "Allow mock locations" toggled ON
- `android.permission.ACCESS_MOCK_LOCATION` in manifest

---

## 🔒 Security Considerations

### Privacy Protection

✅ **GPS spoofing ENHANCES privacy by:**
- Preventing correlation of VPN IP with real GPS location
- Stopping apps from tracking your actual movements
- Matching your virtual location to your VPN server

### What GPS Spoofing Does NOT Protect

❌ **Not protected against:**
- IP address leaks (requires VPN)
- Browser fingerprinting (requires privacy extensions)
- WiFi/Cell tower triangulation (requires airplane mode)
- Bluetooth beacon tracking (disable Bluetooth)

### Best Practices

1. **Always use with VPN** - GPS spoofing alone doesn't hide your IP
2. **Match GPS to VPN location** - Prevents location correlation
3. **Disable real GPS hardware** - Turn off GPS in Windows/BIOS when possible
4. **Use airplane mode on mobile** - Prevents cell tower triangulation
5. **Regular verification** - Test with mapping apps to ensure spoofing works

---

## 🐛 Troubleshooting

### GPS Spoofing Not Working

**Problem:** Apps still see my real location

**Solutions:**
1. **Check admin privileges:**
   ```powershell
   # Run this to verify admin access
   reg query "HKU\S-1-5-19" 2>nul && echo Admin || echo Not Admin
   ```

2. **Restart the app** after enabling GPS spoofing

3. **Check registry values:**
   ```powershell
   reg query "HKCU\SOFTWARE\Nebula\VPN\GPS"
   ```

4. **Some apps use hardware GPS directly** - GPS spoofing won't affect them (rare)

### Administrator Access Denied

**Problem:** "Access denied" when running setup script

**Solution:**
```powershell
# Right-click PowerShell → Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
.\SETUP-GPS-SPOOFING.ps1
```

### Cannot Disable GPS Spoofing

**Problem:** Script fails to restore original settings

**Solution:**
```powershell
# Manual restore from backup
reg import location_backup.reg

# Or manually re-enable location service
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location" /v Value /t REG_SZ /d Allow /f
```

### Apps Crash or Behave Strangely

**Problem:** Some apps don't handle spoofed GPS well

**Solution:**
- Disable GPS spoofing for that specific app
- Use higher accuracy setting (more realistic)
- Enable GPS jitter for natural movement simulation

---

## ⚖️ Legal & Ethical Use

### Permitted Uses

✅ **Legitimate use cases:**
- **Privacy protection** - Preventing location tracking
- **Security testing** - Testing geo-restrictions
- **Development** - Testing location-based features
- **Research** - Academic studies on location privacy
- **Personal privacy** - Protecting your own data

### Prohibited Uses

❌ **Do NOT use GPS spoofing for:**
- **Cheating in games** - Violates terms of service
- **Fraud** - Fake locations for financial gain
- **Stalking/harassment** - Impersonating someone's location
- **Bypassing legal restrictions** - Evading law enforcement
- **Terms of service violations** - Breaking app rules

### Legal Notice

> GPS spoofing technology is a privacy tool. Users are responsible for complying with all applicable laws and terms of service. Nebula VPN provides this feature for **legitimate privacy protection only**. Misuse may result in:
> - Account bans from services
> - Legal consequences depending on jurisdiction
> - Criminal charges for fraud or other illegal activities

**Always use GPS spoofing ethically and legally.**

---

## 📚 Additional Resources

### Files in This Project

- **`electron/gps-spoofer.js`** - Main GPS spoofing module
- **`electron/android-gps-mock.js`** - Android implementation template
- **`SETUP-GPS-SPOOFING.ps1`** - Windows setup script
- **`src/components/GPSOverride/`** - React UI component

### Related Documentation

- [SECURITY_PRIVACY.md](SECURITY_PRIVACY.md) - Complete privacy features
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Technical implementation details
- [README.md](README.md) - Main project documentation

### External References

- [Windows Location Services](https://docs.microsoft.com/en-us/windows/win32/locationapi/)
- [Android Mock Location](https://developer.android.com/reference/android/location/LocationManager#addTestProvider)
- [GPS Spoofing Detection](https://www.sciencedirect.com/topics/computer-science/gps-spoofing)

---

## 🤝 Support

### Getting Help

If you encounter issues with GPS spoofing:

1. **Check this guide** - Most issues are covered above
2. **Review error messages** - Enable verbose logging
3. **Test with simple setup** - Use PowerShell script first
4. **Report bugs** - Open GitHub issue with details

### Contributing

GPS spoofing improvements are welcome:
- macOS/Linux implementations
- Virtual driver development
- UI enhancements
- Documentation improvements

---

**Built with 🛡️ by Nebula Media 3D**  
*Protecting your digital privacy, one location at a time.*
