# Nebula VPN - Advanced Security Features

## Overview
Your VPN now includes commercial-grade security features that protect your IP address, DNS queries, and prevent various types of network leaks.

## ✅ ENABLED BY DEFAULT

### 1. **System-Wide IPv6 Blocking** 🛡️
- **What it does**: Completely blocks ALL IPv6 traffic using Windows Firewall
- **Why it matters**: Prevents IPv6 leaks that can expose your real IP address
- **How it works**: Creates inbound + outbound firewall rules to block IPv6 packets
- **Status**: ✅ Automatically enabled on Windows when VPN connects

### 2. **Enhanced Kill Switch** 🔒
- **What it does**: Blocks ALL internet traffic except through the VPN tunnel
- **Why it matters**: If VPN disconnects, your real IP won't be exposed
- **How it works**: 
  - Blocks all outbound traffic by default
  - Only allows VPN server communication (165.227.32.85)
  - Only allows traffic through VPN interface (nebula0)
  - Allows localhost (for essential services)
- **Status**: ✅ Enabled when `killSwitch: true` option is used

### 3. **DNS Leak Prevention** 🔐
- **What it does**: Forces ALL DNS queries through VPN tunnel only
- **Why it matters**: Prevents your ISP from seeing which websites you visit
- **How it works**:
  - Blocks port 53 (DNS) on all interfaces
  - Only allows DNS through VPN interface
  - Uses trusted DNS servers: 1.1.1.1, 1.0.0.1 (Cloudflare)
- **Status**: ✅ Automatically enabled with kill switch

### 4. **Trusted DNS Servers** ✅
- **What they are**: Cloudflare DNS (1.1.1.1, 1.0.0.1)
- **Why they matter**: Privacy-focused, no logging, fast
- **Status**: ✅ Used by default instead of API-provided DNS

### 5. **WebRTC Leak Protection** 🎯
- **What it does**: Prevents browsers from exposing your real IP via WebRTC
- **How it works**: Electron startup flag `force-webrtc-ip-handling-policy`
- **Status**: ✅ Enabled at app startup

## 🔧 AVAILABLE FEATURES (Can be enabled)

### 6. **MAC Address Randomization** 🎭
- **What it does**: Randomizes your network adapter MAC address
- **Why it matters**: Prevents device tracking across networks
- **Trade-off**: May cause network adapter restart
- **How to enable**: Currently requires code integration
- **Code location**: `electron/security-enhancements.js` - `randomizeMacAddress()`

### 7. **Port Randomization** 🎲
- **What it does**: Uses random source port (49152-65535) for VPN connections
- **Why it matters**: Makes traffic harder to identify and block
- **Status**: Available, needs frontend integration

## 🌐 BROWSER vs ELECTRON LIMITATIONS

### ❌ Browser/PWA Version (GitHub Pages)
**CANNOT protect your IP address** - This is a fundamental browser limitation:
- Browsers cannot create VPN tunnels at OS level
- No access to network stack or firewall
- No kill switch capability
- No DNS enforcement
- Shows: "Browser/PWA simulation - external leak probes are blocked"

### ✅ Electron Desktop App
**CAN fully protect your IP address**:
- Creates real WireGuard tunnel at OS level
- Full kill switch support
- System-wide IPv6 blocking
- DNS leak prevention
- MAC randomization (optional)

## 🚀 HOW TO USE

### Step 1: Use Electron App (Not Browser)
The Electron desktop app is required for IP protection. The browser version is for demo/UI purposes only.

### Step 2: Connect with Kill Switch
```javascript
// In the app UI, enable Kill Switch option before connecting
// The app will automatically enable:
// ✅ System-wide IPv6 blocking
// ✅ Enhanced kill switch
// ✅ DNS leak prevention
// ✅ Trusted DNS servers (1.1.1.1, 1.0.0.1)
```

### Step 3: Verify Protection
After connecting, verify your protection:

1. **IP Leak Test**: https://whatismyipaddress.com/
   - Should show: `165.227.32.85` (DigitalOcean Toronto)
   - Should NOT show your real IP

2. **DNS Leak Test**: https://dnsleaktest.com/
   - Should show: Cloudflare DNS (1.1.1.1, 1.0.0.1)
   - Should NOT show your ISP's DNS

3. **IPv6 Leak Test**: https://test-ipv6.com/
   - Should show: IPv6 not supported / blocked
   - Should NOT show your IPv6 address

4. **WebRTC Leak Test**: https://browserleaks.com/webrtc
   - Should NOT show your real IP in local/public candidates

## 🔍 TROUBLESHOOTING

### "My IP is still exposed"
**Solution**:
1. Make sure you're using Electron app, NOT browser version
2. Check VPN connection status shows "✓ Verified desktop tunnel active"
3. Restart the Electron app after server configuration changes
4. Enable Kill Switch option when connecting
5. Check that VPN server is running: `ssh root@165.227.32.85` → `wg show`

### "DNS is still leaking"
**Solution**:
1. Enable Kill Switch (DNS enforcement is automatic with kill switch)
2. Check firewall rules: `powershell -Command "Get-NetFirewallRule -Name 'NebulaVPN-DNS-*'"`
3. Verify DNS servers: `ipconfig /all` - should show 1.1.1.1, 1.0.0.1

### "IPv6 is still visible"
**Solution**:
1. Check firewall rules: `powershell -Command "Get-NetFirewallRule -Name 'NebulaVPN-IPv6-*'"`
2. Verify IPv6 disabled on adapters: `powershell -Command "Get-NetAdapterBinding -ComponentID ms_tcpip6"`
3. Both adapter-level AND firewall-level blocking should be active

## 📊 SECURITY STATUS

Check current security status:
```javascript
// In Electron dev tools console (when app is running):
const status = tunnel._securityEnhancer.getStatus();
console.log(status);
// Returns:
// {
//   ipv6SystemBlocked: true/false,
//   macRandomized: true/false,
//   killSwitchActive: true/false,
//   randomizedPort: null or port number
// }
```

## ⚠️ IMPORTANT NOTES

1. **Administrator Rights Required**: Kill switch and firewall rules require admin privileges on Windows
2. **Disconnect Cleanup**: All security features are automatically cleaned up on disconnect
3. **MAC Randomization**: Not enabled by default - can cause network disruption
4. **Development Mode**: If `ALLOW_INSECURE_WG_DEV=true` in .env, security features may be bypassed

## 🆚 COMPARISON TO COMMERCIAL VPNS

| Feature | Nebula VPN | Commercial VPNs | Notes |
|---------|-----------|-----------------|-------|
| Kill Switch | ✅ Enhanced | ✅ Standard | Ours includes auto-reconnect support |
| IPv6 Leak Prevention | ✅ System-wide | ✅ Adapter-level | Ours uses both methods |
| DNS Leak Prevention | ✅ Enforced | ✅ Enforced | Firewall-based port 53 blocking |
| Trusted DNS | ✅ Cloudflare | ✅ Various | 1.1.1.1, 1.0.0.1 (no logging) |
| WebRTC Protection | ✅ Chromium-level | ⚠️ Browser ext | Built into Electron app |
| MAC Randomization | 🔧 Available | ⚠️ Rare | Requires manual enable |
| Split Tunneling | ✅ App-based | ✅ App-based | Per-application VPN bypass |
| DoH/DoT Support | ✅ Yes | ✅ Yes | DNS over HTTPS/TLS |
| Obfuscation | ✅ Shadowsocks | ⚠️ Proprietary | Deep packet inspection bypass |

## 🔐 NEXT STEPS

To achieve full commercial-grade protection:

1. ✅ **DONE**: System-wide IPv6 blocking integrated
2. ✅ **DONE**: Enhanced kill switch with DNS enforcement
3. ✅ **DONE**: Trusted DNS servers (Cloudflare)
4. ✅ **DONE**: WebRTC leak protection
5. 🔧 **TODO**: Add MAC randomization toggle in UI
6. 🔧 **TODO**: Add port randomization in UI
7. 🔧 **TODO**: Add security status indicator in UI
8. 🔧 **TODO**: Add one-click "Maximum Security" profile

## 📝 CODE REFERENCES

- **Main Implementation**: `electron/vpn-tunnel.js`
- **Security Enhancements**: `electron/security-enhancements.js`
- **IPC Handlers**: `electron/main.js`
- **UI Components**: `src/components/ConnectButton/`

---

**Your VPN now has commercial-grade security features!** 🎉

Make sure to use the **Electron desktop app** (not browser) and enable **Kill Switch** when connecting.
