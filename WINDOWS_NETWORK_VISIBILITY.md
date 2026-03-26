# Windows Network Settings Visibility Guide

## ✅ Changes Made

The VPN adapter is now configured to be **more visible** in Windows network settings:

### 1. **Friendly Adapter Name**
- **Old Name**: `Nebulavpn` or `nebula0`
- **New Name**: `Nebula VPN`
- More recognizable in Windows UI

### 2. **Automatic Renaming**
When you connect to the VPN, the adapter is automatically renamed to "Nebula VPN" for better visibility.

---

## 🔍 Where to Find Your VPN in Windows

### Method 1: Network Connections (Classic View) - RECOMMENDED ✅
This always works and shows ALL network adapters:

1. **Press** `Windows + R`
2. **Type**: `ncpa.cpl`
3. **Press** Enter

You'll see "Nebula VPN" listed alongside Wi-Fi, Ethernet, etc.

**Right-click options:**
- Status → View connection details
- Properties → Configure adapter settings
- Disable/Enable
- Rename

---

### Method 2: Windows Settings (Modern UI) ⚠️

**Windows 11:**
1. Settings → Network & Internet
2. Click "Advanced network settings"
3. Look under "Network adapters" or "More network adapter options"
4. Should see "Nebula VPN"

**Windows 10:**
1. Settings → Network & Internet
2. Click "Change adapter options" (right side)
3. Opens classic view (same as `ncpa.cpl`)

**Note**: Tunnel-type adapters may not always appear prominently in the modern Settings app.

---

### Method 3: PowerShell ⚡
```powershell
# View VPN adapter details
Get-NetAdapter -Name "Nebula VPN"

# View connection status
Get-NetAdapter -Name "Nebula VPN" | Format-List

# View IP configuration
Get-NetIPAddress -InterfaceAlias "Nebula VPN"

# View DNS servers
Get-DnsClientServerAddress -InterfaceAlias "Nebula VPN"
```

---

### Method 4: Command Prompt 💻
```cmd
# View all network interfaces (look for "Nebula VPN")
ipconfig /all

# View only VPN adapter
ipconfig /all | findstr /C:"Nebula VPN" /A:15
```

---

### Method 5: Device Manager 🔧
1. **Press** `Windows + X` → Device Manager
2. Expand **Network adapters**
3. Look for **WireGuard Tunnel** or **Nebula VPN**

---

## 🚀 After Next VPN Connection

1. **Disconnect** current VPN (if connected)
2. **Restart** Electron app
3. **Connect** again

The adapter will now be named **"Nebula VPN"** instead of "Nebulavpn".

---

## 🔍 Verify Visibility

**Open Network Connections:**
```powershell
ncpa.cpl
```

**You should see:**
- **Name**: Nebula VPN
- **Type**: WAN Miniport (Network Monitor) or WireGuard Tunnel
- **Status**: Connected (when VPN is active)

**Right-click → Status:**
- IPv4 Address: `10.8.0.x` (your VPN IP)
- DNS Servers: `1.1.1.1, 1.0.0.1` (Cloudflare)
- Default Gateway: Should be set

---

## ⚠️ Troubleshooting

### Issue: Adapter Still Shows as "Nebulavpn"

**Cause**: Old tunnel service still running with old name.

**Solution 1 - Clean Restart:**
```powershell
# Disconnect VPN in app first, then:
Get-Service "WireGuardTunnel*" | Stop-Service
Get-Service "WireGuardTunnel*" | Set-Service -StartupType Manual

# Restart Electron app and reconnect
```

**Solution 2 - Manual Rename:**
```powershell
# Rename existing adapter
Rename-NetAdapter -Name "Nebulavpn" -NewName "Nebula VPN"
```

---

### Issue: Adapter Not Visible in Windows Settings App

**This is NORMAL** for WireGuard tunnel adapters created as Windows services.

**Why?**
- Windows Settings (modern UI) prioritizes physical adapters (Wi-Fi, Ethernet)
- Virtual/tunnel adapters may be hidden or in "More options"
- WireGuard service tunnels are system-level, not user-level

**Solution:**
Use **Classic Network Connections** (`ncpa.cpl`) - this ALWAYS shows all adapters.

---

### Issue: Adapter Shows "Unknown adapter" in ipconfig

**Cause**: Adapter hasn't received IP configuration from VPN server.

**Check:**
```powershell
# Should show Connected
Get-NetAdapter -Name "Nebula VPN" | Select-Object Status

# Should show VPN IP (10.8.0.x)
Get-NetIPAddress -InterfaceAlias "Nebula VPN" -AddressFamily IPv4
```

**If autoconfiguration IP (169.254.x.x):**
- VPN tunnel created but not properly configured
- Check VPN server is running and accessible
- Verify WireGuard keys match

---

## 🎯 Quick Verification Commands

**One-liner to check VPN status:**
```powershell
Get-NetAdapter -Name "*Nebula*" | Select-Object Name, Status, LinkSpeed, InterfaceDescription
```

**Expected output when connected:**
```
Name       Status LinkSpeed InterfaceDescription
----       ------ --------- --------------------
Nebula VPN Up     100 Gbps  WireGuard Tunnel
```

**Check VPN service:**
```powershell
Get-Service "WireGuardTunnel*"
```

**Expected output:**
```
Status   Name                      DisplayName
------   ----                      -----------
Running  WireGuardTunnel$Nebula_VPN WireGuard Tunnel: Nebula_VPN
```

---

## 📊 Full Diagnostic

Run this to see complete VPN adapter info:
```powershell
$adapter = Get-NetAdapter -Name "*Nebula*"
$adapter | Format-List *

# IP Configuration
Get-NetIPAddress -InterfaceAlias $adapter.Name

# DNS Configuration
Get-DnsClientServerAddress -InterfaceAlias $adapter.Name

# Routes
Get-NetRoute -InterfaceAlias $adapter.Name

# Firewall rules affecting this adapter
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Nebula*"}
```

---

## 🔐 Security Note

The adapter being visible in Windows Settings does NOT affect VPN security. It only improves:
- User visibility
- Easier configuration
- Better Windows integration
- Simplified troubleshooting

All security features (kill switch, IPv6 blocking, DNS leak prevention) work regardless of adapter visibility in the Settings app.

---

## 📝 Summary

| Location | Visibility |
|----------|-----------|
| `ncpa.cpl` (Classic) | ✅ Always visible |
| Windows 11 Settings | ⚠️ Under "More options" |
| Windows 10 Settings | ✅ Via "Change adapter options" |
| PowerShell/CMD | ✅ Always visible |
| Device Manager | ✅ Visible |
| Taskbar Network Icon | ⚠️ Not shown (by design) |

**Best Practice**: Bookmark `ncpa.cpl` or create a desktop shortcut for quick VPN adapter access.

---

**Your VPN is now configured for maximum Windows visibility!** 🎉

After reconnecting, the adapter will appear as **"Nebula VPN"** in Network Connections.
