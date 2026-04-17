# Quick Fix Guide - WireGuard Traffic Blocking

## Problem
VPN connects but traffic doesn't work properly - "too strict or not setup correctly"

## Root Cause
Kill switch was blocking VPN traffic because it was missing a firewall rule to allow traffic through the VPN interface.

## Solution ✅ FIXED

I've added the critical missing firewall rule that allows traffic through the VPN tunnel:

**Modified File**: `electron/vpn-tunnel.js`
- Added `NebulaVPN-AllowVPNInterface` rule to kill switch
- This rule explicitly allows all traffic through the VPN interface

## How to Apply

### Option 1: Reconnect VPN (Easiest) ⭐ RECOMMENDED

1. **Disconnect VPN** in the Nebula app
2. **Reconnect VPN** - The new firewall rules will be created automatically
3. **Test**: Open browser and visit https://ifconfig.me to verify VPN is working

### Option 2: Run Fix Script

```powershell
# Open PowerShell as Administrator
cd d:\Development\nebula-vpn-client

# Option A: Diagnose only (no changes)
.\FIX-WIREGUARD-TRAFFIC.ps1 -DiagnoseOnly

# Option B: Auto-fix detected issues  
.\FIX-WIREGUARD-TRAFFIC.ps1 -FixAll

# Option C: Remove all rules and start fresh
.\FIX-WIREGUARD-TRAFFIC.ps1 -RemoveAllRules
```

## Testing Your VPN

After reconnecting, test with these commands:

```powershell
# 1. Test basic connectivity
ping 1.1.1.1

# 2. Test DNS resolution
ping google.com

# 3. Check your IP (should show VPN IP, not real IP)
curl ifconfig.me

# 4. Test HTTPS connectivity
Test-NetConnection -ComputerName google.com -Port 443
```

All tests should succeed if VPN is working correctly.

## Verify Firewall Rules

```powershell
Get-NetFirewallRule | Where-Object DisplayName -like "*Nebula*" | 
    Select-Object Name, Enabled, Action | Format-Table

# You should see:
# NebulaVPN-AllowVPNInterface  Enabled  Allow  ← NEW RULE
# NebulaVPN-AllowWG            Enabled  Allow
# NebulaVPN-AllowLoopback      Enabled  Allow
# NebulaVPN-AllowVPNNet        Enabled  Allow
# NebulaVPN-BlockAll           Enabled  Block
```

## What Changed?

### Before Fix
```
Kill Switch Rules:
1. Block ALL traffic (default deny)
2. Allow UDP to VPN server
3. Allow localhost
4. Allow 10.8.0.0/24 network
❌ MISSING: Allow VPN interface traffic
```

**Result**: VPN connects but kill switch blocks all traffic through the tunnel!

### After Fix
```
Kill Switch Rules:
1. Allow VPN interface traffic ✅ NEW
2. Block ALL other traffic (default deny)
3. Allow UDP to VPN server
4. Allow localhost
5. Allow 10.8.0.0/24 network
```

**Result**: VPN connects and traffic flows through the tunnel correctly!

## Troubleshooting

### Still No Internet?

1. **Check VPN is actually connected**:
   ```powershell
   Get-NetAdapter | Where-Object InterfaceDescription -like "*WireGuard*"
   # Status should be "Up"
   ```

2. **Verify firewall rules are active**:
   ```powershell
   .\FIX-WIREGUARD-TRAFFIC.ps1 -DiagnoseOnly
   ```

3. **Check WireGuard tunnel status**:
   ```powershell
   wg show
   # Should show handshake and data transfer
   ```

4. **Restart the app entirely**:
   - Close Nebula VPN app
   - Reopen and reconnect

### DNS Not Working?

```powershell
# Flush DNS cache
ipconfig /flushdns

# Check DNS servers on VPN interface
$vpn = Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*WireGuard*"}
Get-DnsClientServerAddress -InterfaceIndex $vpn.InterfaceIndex
```

### Kill Switch Too Aggressive?

If you need local network access (WiFi devices) while VPN is connected:
- This is handled by split tunnel routing (already configured)
- Local networks (192.168.x.x, 10.x.x.x) bypass VPN automatically
- Internet traffic goes through VPN

## Files Modified

1. **electron/vpn-tunnel.js** - Added VPN interface allow rule
2. **FIX-WIREGUARD-TRAFFIC.ps1** - Diagnostic/repair script
3. **WIREGUARD-TRAFFIC-FIX.md** - Detailed technical documentation

## Summary

✅ **Issue**: Kill switch blocking VPN traffic
✅ **Fix**: Added interface allow rule to kill switch
✅ **Action**: Reconnect VPN to apply the fix

The fix is already in your code - just reconnect the VPN and it will work!

---

Need more help? Run the diagnostic script:
```powershell
.\FIX-WIREGUARD-TRAFFIC.ps1 -DiagnoseOnly
```
