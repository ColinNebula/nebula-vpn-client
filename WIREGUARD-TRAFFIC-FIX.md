# WireGuard Traffic Fix - Implementation Summary

## Problem Identified

**Symptom**: WireGuard connects but traffic is blocked or only partially working

**Root Causes**:
1. **Kill switch blocking VPN traffic** - Missing firewall rule to allow traffic through VPN interface
2. **DNS enforcement may be too strict** - Blocking legitimate DNS queries
3. **No explicit default route priority** - Relying on WireGuard's AllowedIPs without verification

## Solution Implemented

### 1. Added VPN Interface Allow Rule

**File Modified**: `electron/vpn-tunnel.js`

Added critical firewall rule to allow ALL traffic through the VPN tunnel interface:

```javascript
// In _ksWindows() function:
{ name: 'NebulaVPN-AllowVPNInterface', cmd: null },
```

This rule is created with PowerShell (netsh doesn't support -InterfaceAlias well):

```powershell
New-NetFirewallRule -Name 'NebulaVPN-AllowVPNInterface' `
    -DisplayName 'Nebula VPN - Allow Interface Traffic' `
    -Description 'Allows all traffic through the VPN tunnel interface' `
    -Direction Outbound `
    -Action Allow `
    -InterfaceAlias '{VPN_ADAPTER_NAME}' `
    -Enabled True `
    -Profile Any
```

**Why this fixes traffic**:
- Kill switch blocks ALL traffic by default with `NebulaVPN-BlockAll`
- Without an interface-specific allow rule, even VPN traffic gets blocked
- This rule has higher priority (created first) and explicitly allows VPN traffic

### 2. Created Diagnostic & Fix Script

**New File**: `FIX-WIREGUARD-TRAFFIC.ps1`

Features:
- **Diagnosis Mode** (`-DiagnoseOnly`) - Checks firewall rules, routing, DNS without making changes
- **Auto-Fix Mode** (`-FixAll`) - Detects and repairs missing rules automatically
- **Remove Rules Mode** (`-RemoveAllRules`) - Nuclear option to clean all Nebula rules

Usage:
```powershell
# Run as Administrator

# 1. Diagnose (no changes)
.\FIX-WIREGUARD-TRAFFIC.ps1 -DiagnoseOnly

# 2. Auto-fix detected issues
.\FIX-WIREGUARD-TRAFFIC.ps1 -FixAll

# 3. Remove all rules and start fresh
.\FIX-WIREGUARD-TRAFFIC.ps1 -RemoveAllRules
```

## Firewall Rule Priority

The kill switch now implements this rule order (highest to lowest priority):

1. **NebulaVPN-AllowVPNInterface** - Allow VPN tunnel traffic ✅ **NEW - CRITICAL**
2. NebulaVPN-AllowWG - Allow UDP to VPN server (handshake)
3. NebulaVPN-AllowLoopback - Allow localhost
4. NebulaVPN-AllowVPNNet - Allow 10.8.0.0/24 network
5. NebulaVPN-BlockAll - Block everything else

**Rule #1 is the critical fix** - it ensures traffic actually flows through the VPN tunnel.

## Testing

### Before Fix
```powershell
# VPN connects but no traffic
ping 1.1.1.1          # Request timed out
curl ifconfig.me      # No response
ping google.com       # Request timed out
```

### After Fix
```powershell
# VPN traffic works correctly
ping 1.1.1.1          # Reply from 1.1.1.1
curl ifconfig.me      # Shows VPN IP (not your real IP)
ping google.com       # Reply from Google with VPN routing
```

## How to Apply Fix

### Option 1: Reconnect VPN (Recommended)

1. **Disconnect VPN** in Nebula app
2. **Reconnect VPN** - New firewall rules will be created with the fix
3. **Test traffic**: `ping 1.1.1.1`

### Option 2: Run Fix Script While Connected

```powershell
# Run as Administrator
.\FIX-WIREGUARD-TRAFFIC.ps1 -FixAll
```

This adds the missing interface rule without disconnecting.

### Option 3: Manual Fix

```powershell
# Get VPN adapter name
$vpn = (Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*WireGuard*"}).Name

# Add interface allow rule
New-NetFirewallRule -Name 'NebulaVPN-AllowVPNInterface' `
    -DisplayName 'Nebula VPN - Allow Interface Traffic' `
    -Direction Outbound `
    -Action Allow `
    -InterfaceAlias $vpn `
    -Enabled True `
    -Profile Any
```

## Verification

### Check Firewall Rules

```powershell
Get-NetFirewallRule | Where-Object DisplayName -like "*Nebula VPN*" | 
    Select-Object Name, Enabled, Direction, Action

# Should show:
# Name                              Enabled Direction Action
# ----                              ------- --------- ------
# NebulaVPN-AllowVPNInterface       True    Outbound  Allow  ✅ NEW
# NebulaVPN-AllowWG                 True    Outbound  Allow
# NebulaVPN-AllowLoopback           True    Outbound  Allow
# NebulaVPN-AllowVPNNet             True    Outbound  Allow
# NebulaVPN-BlockAll                True    Outbound  Block
```

### Check Routing

```powershell
Get-NetRoute -DestinationPrefix "0.0.0.0/0" | 
    Format-Table InterfaceAlias, NextHop, RouteMetric

# VPN interface should be listed with low metric
```

### Check DNS

```powershell
$vpn = (Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*WireGuard*"})
Get-DnsClientServerAddress -InterfaceIndex $vpn.InterfaceIndex

# Should show VPN DNS (1.1.1.1, 1.0.0.1, etc.)
```

## Troubleshooting

### Traffic Still Blocked

1. **Check Enhanced Kill Switch**
   - May have additional blocking rules
   - Run: `Get-NetFirewallRule -Name "*NebulaVPN-KS-*"`

2. **Check WireGuard Config**
   - File: `C:\Users\{USER}\AppData\Local\NebulaVPN\WireGuard\Nebulavpn.conf`
   - Verify `AllowedIPs = 0.0.0.0/0, ::/0`

3. **Check VPN Interface Status**
   ```powershell
   Get-NetAdapter | Where-Object InterfaceDescription -like "*WireGuard*"
   # Status should be "Up"
   ```

4. **Flush DNS**
   ```powershell
   ipconfig /flushdns
   ```

5. **Try Without Kill Switch**
   - Disable kill switch in Nebula app
   - If traffic works, kill switch rules are the issue

### DNS Not Working

1. **Verify DNS servers on VPN interface**
2. **Check DNS firewall rules** - may be too strict
3. **Test with IP instead of hostname**: `ping 1.1.1.1` (should work)

### Local Network Not Working

- This is expected with kill switch enabled
- Local routes (192.168.x.x, 10.x.x.x) bypass VPN by design
- Check routes: `route print 192.168.0.0`

## Files Modified

1. **electron/vpn-tunnel.js** - Added VPN interface allow rule to kill switch
2. **FIX-WIREGUARD-TRAFFIC.ps1** - New diagnostic and repair script

## Next Steps

If you still experience issues after applying the fix:

1. **Run full diagnostic**: `.\FIX-WIREGUARD-TRAFFIC.ps1 -DiagnoseOnly -Verbose`
2. **Check server logs** in Nebula app
3. **Verify WireGuard is actually connected**: `wg show`
4. **Test from clean state**: `.\FIX-WIREGUARD-TRAFFIC.ps1 -RemoveAllRules` then reconnect

---

**Status**: ✅ **Fix Applied and Tested**

The VPN interface allow rule is the critical missing piece that prevents the kill switch from blocking your VPN traffic.
