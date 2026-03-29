# VPN Tunnel Testing Guide

Complete guide for verifying your Nebula VPN tunnel integrity and security.

## 🚀 Quick Start

### Quick Status Check (5 seconds)
```powershell
.\TEST-VPN-QUICK.ps1
```

### Full Tunnel Verification (30-60 seconds)
```powershell
.\TEST-VPN-TUNNEL.ps1
```

### Quick Tests Only (Skip speed tests)
```powershell
.\TEST-VPN-TUNNEL.ps1 -Quick
```

## 📊 Test Scripts

### TEST-VPN-QUICK.ps1 - Fast Status Check
**Use when:** You need quick confirmation VPN is working

**Tests:**
- ✓ VPN Interface Status
- ✓ Public IP Address
- ✓ DNS Configuration
- ✓ Default Route

**Example output:**
```
  [✓] VPN Interface - Nebulavpn
  [✓] Public IP - 104.28.15.123
  [✓] VPN DNS - 1.1.1.1
  [✓] Default Route - Nebulavpn
  
  Overall: VPN ACTIVE & SECURE
```

### TEST-VPN-TUNNEL.ps1 - Comprehensive Testing
**Use when:** You want thorough security verification

**Tests performed:**
1. **VPN Interface Status** - Checks WireGuard adapter
2. **IP Address Leak Test** - Verifies real IP is hidden
3. **DNS Leak Test** - Ensures DNS queries go through VPN
4. **IPv6 Leak Test** - Checks for IPv6 exposure
5. **WebRTC Configuration** - Verifies WebRTC protection
6. **Routing Table** - Confirms traffic routes through VPN
7. **Connection Speed** - Measures download speed
8. **Latency Test** - Tests ping times
9. **Kill Switch** - Verifies firewall protection

## 💻 Usage Examples

### Basic Usage
```powershell
# Quick check
.\TEST-VPN-QUICK.ps1

# Full test
.\TEST-VPN-TUNNEL.ps1

# Full test with verbose output
.\TEST-VPN-TUNNEL.ps1 -VerboseOutput
```

### Advanced Usage
```powershell
# Quick tests only (no speed test)
.\TEST-VPN-TUNNEL.ps1 -Quick

# Skip speed test
.\TEST-VPN-TUNNEL.ps1 -SkipSpeedTest

# Verify specific VPN IP range
.\TEST-VPN-TUNNEL.ps1 -ExpectedVPNIP "10.8.0.*"

# Verbose output with expected IP
.\TEST-VPN-TUNNEL.ps1 -VerboseOutput -ExpectedVPNIP "10.8.0.*"
```

### CI/CD Integration
```powershell
# Run in automated tests
.\TEST-VPN-TUNNEL.ps1 -Quick
if ($LASTEXITCODE -ne 0) {
    Write-Error "VPN tunnel verification failed"
    exit 1
}
```

## 🔍 Understanding Test Results

### Exit Codes
| Code | Status | Meaning |
|------|--------|---------|
| 0 | Success | All tests passed, VPN secure |
| 1 | Warning | Some tests failed, partial security |
| 2 | Failure | Multiple failures, VPN insecure |
| 3 | Error | Test execution failed |

### Test Status Indicators
- **✓ PASS** (Green) - Test passed successfully
- **✗ FAIL** (Red) - Test failed, security issue detected
- **⚠ WARNING** (Yellow) - Non-critical issue or manual verification needed

## 🛠 Troubleshooting

### "VPN Interface Not Found"
**Cause:** WireGuard adapter not detected

**Solutions:**
1. Check if VPN is connected
2. Start VPN: `.\start-vpn-admin.ps1`
3. Verify WireGuard installation
4. Check adapter name: `Get-NetAdapter`

### "IP Address Leak Detected"
**Cause:** Real IP address is exposed

**Solutions:**
1. Reconnect VPN
2. Check VPN credentials
3. Verify server configuration
4. Check firewall rules

### "DNS Leak Detected"
**Cause:** DNS queries not going through VPN

**Solutions:**
1. Check DNS enforcement in VPN settings
2. Run with admin privileges
3. Manually set DNS:
   ```powershell
   Set-DnsClientServerAddress -InterfaceAlias "Nebulavpn" -ServerAddresses "1.1.1.1","1.0.0.1"
   ```

### "IPv6 Leak Detected"
**Cause:** IPv6 traffic not routed through VPN

**Solutions:**
1. Disable IPv6:
   ```powershell
   Disable-NetAdapterBinding -Name "*" -ComponentID ms_tcpip6
   ```
2. Or configure VPN to handle IPv6

### "Routing Not Through VPN"
**Cause:** Default route not pointing to VPN

**Solutions:**
1. Check routing table:
   ```powershell
   Get-NetRoute -DestinationPrefix "0.0.0.0/0"
   ```
2. Reconnect VPN
3. Check VPN software configuration

### "Speed Test Failed"
**Cause:** Could not measure connection speed

**Solutions:**
1. Check internet connectivity
2. Verify firewall not blocking test
3. Skip speed test: `.\TEST-VPN-TUNNEL.ps1 -SkipSpeedTest`

## 📈 Performance Benchmarks

### Expected Results
| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| **Download Speed** | >50 Mbps | 10-50 Mbps | <10 Mbps |
| **Latency** | <50 ms | 50-150 ms | >150 ms |
| **DNS Resolution** | <50 ms | 50-200 ms | >200 ms |
| **Connection Time** | <2 sec | 2-5 sec | >5 sec |

### Factors Affecting Performance
- Server location (closer = faster)
- Server load (fewer users = faster)
- Your internet connection speed
- VPN encryption overhead (typically 10-20%)
- ISP throttling

## 🔒 Security Best Practices

### Before Running Tests
1. **Connect VPN first**
   ```powershell
   .\start-vpn-admin.ps1
   ```

2. **Run with Administrator privileges**
   - Required for full DNS and routing tests

3. **Close other applications**
   - Ensure accurate speed tests

### Regular Testing Schedule
- **Daily:** Quick status check
- **Weekly:** Full tunnel verification
- **After updates:** Complete security audit
- **Before sensitive tasks:** Always verify

### Recommended Testing Workflow
```powershell
# 1. Start VPN
.\start-vpn-admin.ps1

# 2. Wait for connection
Start-Sleep -Seconds 5

# 3. Quick verification
.\TEST-VPN-QUICK.ps1

# 4. If quick test passes, continue work
# 5. If issues detected, run full test
.\TEST-VPN-TUNNEL.ps1 -VerboseOutput
```

## 🎯 Manual Verification

While automated tests are helpful, also verify manually:

### Browser-Based Tests
1. **IP Check:** https://whatismyipaddress.com/
2. **DNS Leak:** https://www.dnsleaktest.com/
3. **WebRTC Leak:** https://browserleaks.com/webrtc
4. **IPv6 Test:** https://test-ipv6.com/
5. **Full Test:** https://ipleak.net/

### Command-Line Verification
```powershell
# Check your public IP
Invoke-RestMethod -Uri "https://api.ipify.org?format=json"

# Check DNS servers
Get-DnsClientServerAddress -AddressFamily IPv4

# Check routing
Get-NetRoute -DestinationPrefix "0.0.0.0/0"

# Check VPN adapter
Get-NetAdapter | Where-Object { $_.Status -eq "Up" }

# Test DNS resolution
Resolve-DnsName google.com
```

## 📝 Test Results Interpretation

### All Tests Passed (100%)
✓ **Your VPN tunnel is secure!**
- IP address is hidden
- DNS queries are encrypted
- No IPv6 leaks
- Traffic properly routed
- Connection is stable

### Most Tests Passed (80-99%)
⚠ **VPN is working but has minor issues**
- Review failed tests
- Check warnings
- May still be usable for general browsing
- Fix issues before sensitive activities

### Many Tests Failed (<80%)
✗ **VPN tunnel is not secure**
- Do not use for sensitive activities
- Reconnect VPN
- Check configuration
- Contact support if issues persist

## 🔧 Advanced Diagnostics

### Enable Verbose Logging
```powershell
$VerbosePreference = "Continue"
.\TEST-VPN-TUNNEL.ps1 -VerboseOutput
```

### Check Specific Components
```powershell
# Test only IP and DNS
.\TEST-VPN-TUNNEL.ps1 -Quick

# Test without speed test
.\TEST-VPN-TUNNEL.ps1 -SkipSpeedTest

# Custom IP range check
.\TEST-VPN-TUNNEL.ps1 -ExpectedVPNIP "172.16.*"
```

### Export Test Results
```powershell
.\TEST-VPN-TUNNEL.ps1 -VerboseOutput > vpn-test-results.txt
```

### Automated Monitoring
```powershell
# Run every hour
while ($true) {
    .\TEST-VPN-QUICK.ps1
    if ($LASTEXITCODE -ne 0) {
        # Send alert or notification
        Write-Warning "VPN issue detected at $(Get-Date)"
    }
    Start-Sleep -Seconds 3600
}
```

## 🆘 Getting Help

### Test Script Issues
1. Run with verbose output: `-VerboseOutput`
2. Check PowerShell execution policy
3. Ensure running as Administrator
4. Review error messages

### VPN Connection Issues
1. Check server status
2. Verify credentials
3. Review firewall rules
4. Check WireGuard logs

### False Positives
Some tests may fail even with working VPN:
- Speed test failure (server overloaded)
- Latency spikes (temporary network congestion)
- WebRTC test (requires manual browser check)

## 📚 Related Files

- [start-vpn-admin.ps1](start-vpn-admin.ps1) - Start VPN with elevated privileges
- [verify-dns-simple.ps1](verify-dns-simple.ps1) - DNS verification script
- [DEPLOY-CLOUD.ps1](DEPLOY-CLOUD.ps1) - Cloud deployment script
- [DNS_ENFORCEMENT_VERIFICATION.md](DNS_ENFORCEMENT_VERIFICATION.md) - DNS docs

## 🎓 Additional Resources

- **WireGuard Documentation:** https://www.wireguard.com/
- **Privacy Testing Tools:** https://privacytools.io/
- **Network Diagnostics:** https://docs.microsoft.com/en-us/windows-server/networking/

---

**Quick Reference:**
```powershell
# Fast check
.\TEST-VPN-QUICK.ps1

# Full test
.\TEST-VPN-TUNNEL.ps1

# Detailed test
.\TEST-VPN-TUNNEL.ps1 -VerboseOutput

# Quick test only
.\TEST-VPN-TUNNEL.ps1 -Quick
```

Stay secure! 🔒
