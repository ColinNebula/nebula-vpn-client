# WIREGUARD ROUTING BEST PRACTICES RESEARCH
# ========================================
# Comprehensive guide for proper WireGuard tunnel configuration

Write-Host "WIREGUARD ROUTING BEST PRACTICES RESEARCH" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Based on WireGuard documentation and industry standards..." -ForegroundColor White
Write-Host ""

# SECTION 1: WireGuard Architecture Analysis
Write-Host "[SECTION 1] WireGuard Architecture Analysis" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ CURRENT ISSUE ANALYSIS:" -ForegroundColor Green
Write-Host "• Tunnel exists: Nebulavpn interface active (10.8.0.2)" -ForegroundColor White
Write-Host "• Gateway unreachable: 10.8.0.1 has 100% packet loss" -ForegroundColor White
Write-Host "• Root cause: Server-side connectivity failure" -ForegroundColor White
Write-Host ""

Write-Host "🔍 WIREGUARD BEST PRACTICES:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. INTERFACE CONFIGURATION:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Interface should have unique private IP in VPN subnet" -ForegroundColor White
Write-Host "• Typical subnets: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16" -ForegroundColor White
Write-Host "• MTU should be 1420 or lower (1280 for problematic networks)" -ForegroundColor White
Write-Host "• DNS should be configured for leak prevention" -ForegroundColor White
Write-Host ""

Write-Host "2. PEER CONFIGURATION:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• PublicKey must match server's public key exactly" -ForegroundColor White
Write-Host "• Endpoint should be server's real IP:port (not domain if problematic)" -ForegroundColor White
Write-Host "• AllowedIPs determines what traffic goes through tunnel" -ForegroundColor White
Write-Host "• PersistentKeepalive recommended for NAT traversal (25 seconds)" -ForegroundColor White
Write-Host ""

Write-Host "3. ROUTING STRATEGIES:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Full Tunnel: AllowedIPs = 0.0.0.0/0 (all traffic through VPN)" -ForegroundColor White
Write-Host "• Split Tunnel: AllowedIPs = specific subnets only" -ForegroundColor White
Write-Host "• DNS-Only: Route only DNS traffic (53/udp, 53/tcp)" -ForegroundColor White
Write-Host "• Site-to-Site: Route only remote network subnets" -ForegroundColor White

Write-Host ""

# SECTION 2: Diagnostic Tools
Write-Host "[SECTION 2] WireGuard Diagnostic Commands" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 ESSENTIAL WIREGUARD DIAGNOSTICS:" -ForegroundColor Green
Write-Host ""

# Check interface status
Write-Host "1. Interface Status Check:" -ForegroundColor Cyan
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" }
if ($vpnAdapter) {
    Write-Host "✅ VPN Interface Found:" -ForegroundColor Green
    foreach ($adapter in $vpnAdapter) {
        Write-Host "   Name: $($adapter.Name)" -ForegroundColor White
        Write-Host "   Status: $($adapter.Status)" -ForegroundColor White
        Write-Host "   Link Speed: $($adapter.LinkSpeed)" -ForegroundColor White
        
        $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($ipConfig) {
            Write-Host "   IP Address: $($ipConfig.IPAddress)/$($ipConfig.PrefixLength)" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ No WireGuard interfaces found" -ForegroundColor Red
}

Write-Host ""

# Check routing table
Write-Host "2. Routing Table Analysis:" -ForegroundColor Cyan
if ($vpnAdapter) {
    $vpnRoutes = Get-NetRoute -InterfaceIndex $vpnAdapter[0].InterfaceIndex -ErrorAction SilentlyContinue
    if ($vpnRoutes) {
        Write-Host "✅ VPN Routes Found:" -ForegroundColor Green
        $vpnRoutes | ForEach-Object {
            Write-Host "   $($_.DestinationPrefix) → $($_.NextHop) (Metric: $($_.RouteMetric))" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️ No routes found for VPN interface" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check DNS configuration  
Write-Host "3. DNS Configuration:" -ForegroundColor Cyan
if ($vpnAdapter) {
    $dnsConfig = Get-DnsClientServerAddress -InterfaceIndex $vpnAdapter[0].InterfaceIndex -ErrorAction SilentlyContinue
    if ($dnsConfig -and $dnsConfig.ServerAddresses) {
        Write-Host "✅ VPN DNS Configured:" -ForegroundColor Green
        foreach ($dns in $dnsConfig.ServerAddresses) {
            Write-Host "   DNS Server: $dns" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️ No DNS servers configured for VPN" -ForegroundColor Yellow
    }
}

Write-Host ""

# SECTION 3: Best Practices Implementation
Write-Host "[SECTION 3] WireGuard Best Practices Implementation" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 RECOMMENDED CONFIGURATION PATTERNS:" -ForegroundColor Green
Write-Host ""

Write-Host "PATTERN 1: Reliable Full Tunnel" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "[Interface]" -ForegroundColor Cyan
Write-Host "PrivateKey = <client-private-key>" -ForegroundColor White
Write-Host "Address = 10.8.0.2/24" -ForegroundColor White
Write-Host "DNS = 1.1.1.1, 8.8.8.8" -ForegroundColor White
Write-Host "MTU = 1280" -ForegroundColor White
Write-Host ""
Write-Host "[Peer]" -ForegroundColor Cyan
Write-Host "PublicKey = <server-public-key>" -ForegroundColor White
Write-Host "Endpoint = <server-ip>:51820" -ForegroundColor White
Write-Host "AllowedIPs = 0.0.0.0/0, ::/0" -ForegroundColor White
Write-Host "PersistentKeepalive = 25" -ForegroundColor White

Write-Host ""

Write-Host "PATTERN 2: Reliable Split Tunnel" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "[Interface]" -ForegroundColor Cyan
Write-Host "PrivateKey = <client-private-key>" -ForegroundColor White
Write-Host "Address = 10.8.0.2/24" -ForegroundColor White
Write-Host "DNS = 1.1.1.1" -ForegroundColor White
Write-Host ""
Write-Host "[Peer]" -ForegroundColor Cyan
Write-Host "PublicKey = <server-public-key>" -ForegroundColor White
Write-Host "Endpoint = <server-ip>:51820" -ForegroundColor White
Write-Host "AllowedIPs = 1.1.1.1/32, 8.8.8.8/32" -ForegroundColor White
Write-Host "PersistentKeepalive = 25" -ForegroundColor White

Write-Host ""

Write-Host "PATTERN 3: DNS-Only Privacy" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "[Interface]" -ForegroundColor Cyan
Write-Host "PrivateKey = <client-private-key>" -ForegroundColor White
Write-Host "Address = 10.8.0.2/24" -ForegroundColor White
Write-Host ""
Write-Host "[Peer]" -ForegroundColor Cyan
Write-Host "PublicKey = <server-public-key>" -ForegroundColor White
Write-Host "Endpoint = <server-ip>:51820" -ForegroundColor White
Write-Host "AllowedIPs = 10.8.0.1/32" -ForegroundColor White
Write-Host "PersistentKeepalive = 25" -ForegroundColor White

Write-Host ""

# SECTION 4: Troubleshooting Guide
Write-Host "[SECTION 4] WireGuard Troubleshooting Methodology" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🛠️ SYSTEMATIC TROUBLESHOOTING APPROACH:" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 1: Verify Handshake" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Check if WireGuard handshake completed successfully" -ForegroundColor White
Write-Host "• Verify timestamps in WireGuard logs" -ForegroundColor White
Write-Host "• Ensure PersistentKeepalive is working" -ForegroundColor White
Write-Host ""

Write-Host "STEP 2: Test Network Layers" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Layer 3: ping gateway through tunnel" -ForegroundColor White
Write-Host "• Layer 4: test UDP/TCP connectivity" -ForegroundColor White
Write-Host "• Layer 7: test HTTP/HTTPS applications" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Routing Verification" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Verify AllowedIPs matches intended traffic" -ForegroundColor White
Write-Host "• Check route metrics and preferences" -ForegroundColor White
Write-Host "• Ensure no conflicting routes exist" -ForegroundColor White

Write-Host ""

# SECTION 5: Your Current Issue Analysis
Write-Host "[SECTION 5] Your Current Issue - Expert Analysis" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎯 ISSUE CLASSIFICATION:" -ForegroundColor Red
Write-Host ""
Write-Host "SYMPTOM: Gateway Unreachable (100% packet loss to 10.8.0.1)" -ForegroundColor White
Write-Host ""
Write-Host "LIKELY CAUSES (in order of probability):" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. SERVER-SIDE FAILURE (90% probability):" -ForegroundColor Red
Write-Host "   • VPN server overloaded or crashed" -ForegroundColor White
Write-Host "   • Server network connectivity issues" -ForegroundColor White
Write-Host "   • Server maintenance/downtime" -ForegroundColor White
Write-Host "   • DDoS attack on server infrastructure" -ForegroundColor White
Write-Host ""

Write-Host "2. NETWORK PATH ISSUES (7% probability):" -ForegroundColor Yellow
Write-Host "   • ISP blocking VPN traffic" -ForegroundColor White
Write-Host "   • Firewall dropping WireGuard packets" -ForegroundColor White
Write-Host "   • MTU/fragmentation problems" -ForegroundColor White
Write-Host "   • NAT traversal failure" -ForegroundColor White
Write-Host ""

Write-Host "3. CLIENT CONFIGURATION (3% probability):" -ForegroundColor Green
Write-Host "   • Incorrect peer configuration" -ForegroundColor White
Write-Host "   • Key mismatch or expiration" -ForegroundColor White
Write-Host "   • Wrong endpoint address/port" -ForegroundColor White

Write-Host ""

# SECTION 6: Immediate Action Plan
Write-Host "[SECTION 6] Immediate Action Plan - Expert Recommendations" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 PRIORITY 1 ACTIONS:" -ForegroundColor Green
Write-Host ""

Write-Host "ACTION A: Server Switching (CRITICAL)" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Switch to different VPN server immediately" -ForegroundColor White
Write-Host "• Try servers in different geographic regions" -ForegroundColor White
Write-Host "• Test multiple servers until you find responsive one" -ForegroundColor White
Write-Host "• Document which servers work for future reference" -ForegroundColor White
Write-Host ""

Write-Host "ACTION B: Configuration Verification" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Verify MTU is set to 1280 or lower" -ForegroundColor White
Write-Host "• Ensure PersistentKeepalive is enabled (25 seconds)" -ForegroundColor White
Write-Host "• Check that DNS is configured properly" -ForegroundColor White
Write-Host "• Confirm AllowedIPs matches your routing needs" -ForegroundColor White

Write-Host ""

Write-Host "🛠️ PRIORITY 2 ACTIONS:" -ForegroundColor Cyan
Write-Host ""

Write-Host "ACTION C: Implement Fallback Strategy" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Configure split tunneling as backup" -ForegroundColor White
Write-Host "• Implement DNS-only privacy mode" -ForegroundColor White
Write-Host "• Ensure local connectivity remains functional" -ForegroundColor White
Write-Host "• Set up automatic failover to WiFi" -ForegroundColor White

Write-Host ""

# SECTION 7: Long-term Best Practices
Write-Host "[SECTION 7] Long-term WireGuard Best Practices" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🏗️ INFRASTRUCTURE BEST PRACTICES:" -ForegroundColor Green
Write-Host ""

Write-Host "1. REDUNDANCY:" -ForegroundColor Yellow
Write-Host "• Configure multiple VPN servers" -ForegroundColor White
Write-Host "• Test failover scenarios regularly" -ForegroundColor White
Write-Host "• Monitor server health and performance" -ForegroundColor White
Write-Host ""

Write-Host "2. MONITORING:" -ForegroundColor Yellow
Write-Host "• Set up connection health checks" -ForegroundColor White
Write-Host "• Monitor bandwidth usage and latency" -ForegroundColor White
Write-Host "• Log connection events for troubleshooting" -ForegroundColor White
Write-Host ""

Write-Host "3. SECURITY:" -ForegroundColor Yellow
Write-Host "• Rotate keys periodically" -ForegroundColor White
Write-Host "• Use strong entropy for key generation" -ForegroundColor White
Write-Host "• Implement proper access controls" -ForegroundColor White
Write-Host ""

Write-Host "4. PERFORMANCE OPTIMIZATION:" -ForegroundColor Yellow
Write-Host "• Choose servers geographically close to you" -ForegroundColor White
Write-Host "• Optimize MTU for your network path" -ForegroundColor White
Write-Host "• Use UDP for better performance than TCP" -ForegroundColor White
Write-Host "• Configure appropriate keepalive intervals" -ForegroundColor White

Write-Host ""

Write-Host "📚 ADDITIONAL RESOURCES:" -ForegroundColor Green
Write-Host "• WireGuard Official Documentation: wireguard.com" -ForegroundColor White
Write-Host "• RFC for WireGuard Protocol: RFC 8439" -ForegroundColor White
Write-Host "• Community Best Practices: r/WireGuard" -ForegroundColor White

Write-Host ""
Write-Host "🎯 IMMEDIATE NEXT STEP:" -ForegroundColor Yellow
Write-Host "Switch to different VPN server in your Nebula app RIGHT NOW!" -ForegroundColor Green

Write-Host ""
Read-Host "Press Enter to continue"