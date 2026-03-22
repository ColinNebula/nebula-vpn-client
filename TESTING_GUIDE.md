# Quick Test Guide - VPN Security Features

## 🚀 IMMEDIATE NEXT STEPS

### 1. Restart Your Electron App
The server WireGuard configuration was fixed, and advanced security features were just integrated. You MUST restart the Electron app to use the new configuration.

**If app is running:**
```powershell
# Close the Electron app completely (not just minimize)
# Then restart it
cd d:\Development\nebula-vpn-client
npm run electron
```

### 2. Connect with Kill Switch Enabled
In the Electron app UI:
1. Select a server (e.g., Toronto, Canada)
2. **✅ CHECK the "Kill Switch" option** (important!)
3. Click "Connect"

### 3. Verify Connection
After connecting, console should show:
```
✓ System-wide IPv6 blocking enabled
✓ Enhanced kill switch enabled  
✓ DNS leak prevention enabled
[WireGuard] Connected – interface nebula0, IP 10.8.0.x
```

### 4. Test IP Protection
Visit these sites to verify your IP is protected:

**A. IP Leak Test**
- Go to: https://whatismyipaddress.com/
- **Expected**: `165.227.32.85` (DigitalOcean Toronto)
- **NOT expected**: Your real home/ISP IP

**B. DNS Leak Test**  
- Go to: https://dnsleaktest.com/
- Click "Extended Test"
- **Expected**: Cloudflare DNS (1.1.1.1 or 1.0.0.1)
- **NOT expected**: Your ISP's DNS servers

**C. IPv6 Leak Test**
- Go to: https://test-ipv6.com/
- **Expected**: "Your Internet provider has not deployed IPv6" or similar
- **NOT expected**: Your IPv6 address showing

**D. WebRTC Leak Test**
- Go to: https://browserleaks.com/webrtc
- **Expected**: No local IP or only VPN IP (10.8.0.x or 165.227.32.85)
- **NOT expected**: Your real local network IP (192.168.x.x, etc.)

## 🔍 ADVANCED VERIFICATION

### Check Firewall Rules (PowerShell as Admin)
```powershell
# Check IPv6 blocking rules
Get-NetFirewallRule -Name "NebulaVPN-IPv6-*" | Select-Object Name, Enabled, Direction, Action

# Check Kill Switch rules  
Get-NetFirewallRule -Name "NebulaVPN-KS-*" | Select-Object Name, Enabled, Direction, Action

# Check DNS leak prevention rules
Get-NetFirewallRule -Name "NebulaVPN-DNS-*" | Select-Object Name, Enabled, Direction, Action
```

Expected output:
```
Name                           Enabled Direction Action
----                           ------- --------- ------
NebulaVPN-IPv6-Block-Out       True    Outbound  Block
NebulaVPN-IPv6-Block-In        True    Inbound   Block
NebulaVPN-KS-BlockAll          True    Outbound  Block
NebulaVPN-KS-AllowVPN          True    Outbound  Allow
NebulaVPN-KS-AllowInterface    True    Outbound  Allow
NebulaVPN-KS-AllowLocalhost    True    Outbound  Allow
NebulaVPN-DNS-Block            True    Outbound  Block
NebulaVPN-DNS-Allow            True    Outbound  Allow
```

### Check WireGuard Interface
```powershell
# Check if nebula0 interface is active
ipconfig /all | Select-String -Pattern "nebula0" -Context 5,10

# Should show:
# - IPv4 Address: 10.8.0.x
# - DNS Servers: 1.1.1.1, 1.0.0.1
```

### Check Server Connection (SSH to server)
```bash
ssh root@165.227.32.85
wg show

# Should show your peer with recent handshake:
# peer: YOUR_PUBLIC_KEY
# allowed ips: 10.8.0.x/32
# latest handshake: X seconds ago
# transfer: X received, Y sent
```

## ❌ TROUBLESHOOTING

### Issue: "IP is still my real IP"

**Possible Causes:**
1. Using browser version instead of Electron app
2. VPN not actually connected (check status in app)
3. Kill switch not enabled
4. Electron app not restarted after server fix

**Solutions:**
```powershell
# 1. Verify you're in Electron app (not browser)
#    - Browser URL: https://username.github.io/nebula-vpn-client
#    - Electron app: Standalone window, no URL bar

# 2. Check WireGuard tunnel exists
ipconfig | Select-String "nebula0"
# Should show adapter "nebula0" with IP 10.8.0.x

# 3. Verify server is reachable
Test-NetConnection -ComputerName 165.227.32.85 -Port 51820

# 4. Restart Electron app
# Close completely, then:
cd d:\Development\nebula-vpn-client
npm run electron
```

### Issue: "DNS is leaking to my ISP"

**Solution:**
```powershell
# 1. Ensure Kill Switch is enabled (DNS enforcement requires it)

# 2. Check DNS on VPN adapter
Get-DnsClientServerAddress -InterfaceAlias "nebula0"
# Should show: 1.1.1.1, 1.0.0.1

# 3. Verify DNS firewall rules active
Get-NetFirewallRule -Name "NebulaVPN-DNS-*"
```

### Issue: "IPv6 address is visible"

**Solution:**
```powershell
# 1. Check system-wide IPv6 firewall rules
Get-NetFirewallRule -Name "NebulaVPN-IPv6-*"

# 2. Check IPv6 disabled on adapters
Get-NetAdapterBinding -ComponentID ms_tcpip6 | Where-Object {$_.Enabled -eq $true}
# Should NOT show physical adapters (only nebula0 if any)

# 3. Force IPv6 test
Test-NetConnection -ComputerName ipv6.google.com
# Should FAIL or timeout (IPv6 blocked)
```

### Issue: "Administrator privileges required"

**Solution:**
Kill switch and firewall features require admin rights.

**Windows:**
```powershell
# Run Electron app as Administrator:
# 1. Right-click npm or node executable
# 2. Select "Run as administrator"
# 3. Navigate to project folder
# 4. Run: npm run electron
```

## 📊 WHAT YOU SHOULD SEE

### ✅ Successful Connection
```
Console output:
[Security] Advanced security enhancer initialized
[Security] Enabling system-wide IPv6 blocking...
[Security] ✓ System-wide IPv6 blocking enabled
[DNS Protection] Using trusted DNS servers: 1.1.1.1, 1.0.0.1
[Security] Enabling enhanced kill switch with auto-reconnect...
[Security] ✓ Enhanced kill switch enabled
[Security] Enforcing DNS through VPN tunnel...
[Security] ✓ DNS leak prevention enabled
[KillSwitch] Enabled – blocking non-VPN traffic
[WireGuard] Connected – interface nebula0, IP 10.8.0.2

IP Leak Test: ✅ 165.227.32.85 (Toronto, Canada)
DNS Leak Test: ✅ Cloudflare (1.1.1.1)
IPv6 Leak Test: ✅ Not supported/blocked
WebRTC Leak Test: ✅ No real IP visible
```

### ❌ Failed Connection / Leaking IP
```
Browser version:
❌ Browser/PWA simulation - external leak probes are blocked

IP Leak Test: ❌ Shows your real IP
This means: Using browser or VPN not connected
```

## 🎯 COMPARISON TEST

**Before connecting to VPN:**
1. Visit https://whatismyipaddress.com/
2. Note your real IP (e.g., 203.0.113.45)
3. Note your location (e.g., Your City, Your Country)

**After connecting to VPN:**
1. Visit https://whatismyipaddress.com/
2. Should show: `165.227.32.85`
3. Should show: `Toronto, Canada`
4. Should say: `DigitalOcean` as the ISP

**If both show the same IP, VPN is NOT working!**

## 🔒 SECURITY CHECKLIST

Before each VPN session:
- [ ] Using Electron desktop app (not browser)
- [ ] Kill Switch option enabled
- [ ] Connection status shows "Connected"
- [ ] IP leak test shows `165.227.32.85`
- [ ] DNS leak test shows Cloudflare
- [ ] IPv6 test shows blocked/not supported
- [ ] WebRTC test shows no real IP

## 🆘 STILL NOT WORKING?

If after all troubleshooting your IP is still exposed:

1. **Check server status:**
```bash
ssh root@165.227.32.85
systemctl status wg-quick@wg0
wg show
pm2 list
```

2. **Check logs in Electron:**
   - Open Developer Tools (Ctrl+Shift+I)
   - Go to Console tab
   - Look for errors in red

3. **Re-verify server configuration:**
```bash
# On server
cat /opt/nebula/server/.env | grep WG_SERVER_PUBLIC_KEY
# Should match: nxC+gn6X3tVjxBZSWGyVT59kJNvcZS+TKVy5on6DhUw=
```

4. **Nuclear option - Full cleanup and reconnect:**
```powershell
# In Electron app: Disconnect VPN
# Then clean up all firewall rules:
powershell -Command "Get-NetFirewallRule -Name 'NebulaVPN-*' | Remove-NetFirewallRule"

# Restart Electron app
# Connect again with Kill Switch enabled
```

---

## ✨ SUCCESS CRITERIA

✅ Your IP protection is working when ALL of these are true:
1. Using Electron desktop app (not browser)
2. WireGuard interface nebula0 exists
3. IP leak test shows 165.227.32.85
4. DNS leak test shows Cloudflare (1.1.1.1)
5. IPv6 leak test shows blocked
6. WebRTC leak test shows no real IP
7. Firewall rules show NebulaVPN-* rules active

Good luck! 🚀
