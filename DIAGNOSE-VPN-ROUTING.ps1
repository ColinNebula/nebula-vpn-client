# COMPREHENSIVE VPN ROUTING DIAGNOSIS
# ===================================
# Diagnoses why VPN tunnel is connected but internet traffic isn't routing properly

Write-Host "🔍 DIAGNOSING VPN INTERNET ROUTING FAILURE" -ForegroundColor Red
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 1: Verify VPN tunnel status
Write-Host "[1] VPN Tunnel Analysis..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" }
if ($vpnAdapter -and $vpnAdapter.Status -eq "Up") {
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "✅ VPN Interface: $($vpnAdapter.Name)" -ForegroundColor Green
    Write-Host "✅ VPN IP: $vpnIP" -ForegroundColor Green
    Write-Host "✅ Interface Index: $($vpnAdapter.InterfaceIndex)" -ForegroundColor Green
} else {
    Write-Host "❌ No active VPN interface!" -ForegroundColor Red
    exit 1
}

# STEP 2: Analyze routing table in detail
Write-Host ""
Write-Host "[2] Routing Table Analysis..." -ForegroundColor Yellow
Write-Host ""

# Show all default routes
Write-Host "All default routes (0.0.0.0/0):" -ForegroundColor Cyan
Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object DestinationPrefix, NextHop, InterfaceAlias, InterfaceIndex, RouteMetric | Format-Table -AutoSize

# Check VPN-specific routes
Write-Host "VPN interface routes:" -ForegroundColor Cyan
Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex | Select-Object DestinationPrefix, NextHop, RouteMetric | Format-Table -AutoSize

# STEP 3: VPN Gateway Detection and Verification
Write-Host ""
Write-Host "[3] VPN Gateway Analysis..." -ForegroundColor Yellow

# Find VPN gateway from the routing table
$vpnGateway = $null
$vpnRoutes = Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -ErrorAction SilentlyContinue

foreach ($route in $vpnRoutes) {
    if ($route.DestinationPrefix -eq "0.0.0.0/0") {
        $vpnGateway = $route.NextHop
        Write-Host "✅ VPN Gateway found: $vpnGateway (metric: $($route.RouteMetric))" -ForegroundColor Green
        break
    }
}

if (-not $vpnGateway -or $vpnGateway -eq "0.0.0.0") {
    Write-Host "❌ No valid VPN gateway found in routing table!" -ForegroundColor Red
    Write-Host "NOTICE: This is likely why internet traffic isn't routing through VPN" -ForegroundColor Yellow
    
    # Try to determine the correct gateway
    Write-Host ""
    Write-Host "Attempting to determine correct VPN gateway..." -ForegroundColor Cyan
    
    # Method 1: Check WireGuard config
    $configPath = "C:\Program Files\WireGuard\Data\Configurations\Nebulavpn.conf.dpapi"
    if (Test-Path $configPath) {
        Write-Host "Found WireGuard config file" -ForegroundColor Green
        # For WireGuard, gateway is typically the peer endpoint or a specific IP
        $vpnGateway = "10.8.0.1" # Common WireGuard gateway
        Write-Host "SUGGESTION: Suggested VPN Gateway: $vpnGateway" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ VPN Gateway: $vpnGateway" -ForegroundColor Green
}

# STEP 4: Test VPN Gateway Connectivity
Write-Host ""
Write-Host "[4] VPN Gateway Connectivity Test..." -ForegroundColor Yellow

if ($vpnGateway -and $vpnGateway -ne "0.0.0.0") {
    try {
        Write-Host "Testing connectivity to VPN gateway ($vpnGateway)..." -ForegroundColor Cyan
        $gatewayTest = Test-Connection -ComputerName $vpnGateway -Count 2 -Quiet -ErrorAction Stop
        if ($gatewayTest) {
            Write-Host "✅ VPN Gateway is reachable" -ForegroundColor Green
        } else {
            Write-Host "❌ VPN Gateway is NOT reachable" -ForegroundColor Red
            Write-Host "NOTICE: This explains why internet traffic fails" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ VPN Gateway test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ No VPN gateway to test" -ForegroundColor Red
}

# STEP 5: Check for route conflicts
Write-Host ""
Write-Host "[5] Route Conflict Analysis..." -ForegroundColor Yellow

# Check if WiFi has higher priority routes
$wifiAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }
if ($wifiAdapter) {
    $wifiRoutes = Get-NetRoute -InterfaceIndex $wifiAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
    
    foreach ($route in $wifiRoutes) {
        if ($route.RouteMetric -le 1) {
            Write-Host "❌ WiFi has high-priority route (metric $($route.RouteMetric))" -ForegroundColor Red
            Write-Host "   This may override VPN routing!" -ForegroundColor Yellow
        } else {
            Write-Host "✅ WiFi route has lower priority (metric $($route.RouteMetric))" -ForegroundColor Green
        }
    }
}

# STEP 6: DNS Configuration Check
Write-Host ""
Write-Host "[6] DNS Configuration Analysis..." -ForegroundColor Yellow
$dnsConfig = Get-DnsClientServerAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
if ($dnsConfig -and $dnsConfig.ServerAddresses) {
    Write-Host "✅ VPN DNS Servers: $($dnsConfig.ServerAddresses -join ', ')" -ForegroundColor Green
} else {
    Write-Host "❌ No DNS servers configured for VPN interface" -ForegroundColor Red
}

# STEP 7: Firewall Check
Write-Host ""
Write-Host "[7] Firewall Analysis..." -ForegroundColor Yellow
try {
    $firewallProfiles = Get-NetFirewallProfile
    foreach ($profile in $firewallProfiles) {
        if ($profile.Enabled -eq $true) {
            Write-Host "✅ Firewall Profile $($profile.Name): Enabled" -ForegroundColor Green
        }
    }
    Write-Host "NOTICE: Firewall may be blocking VPN traffic" -ForegroundColor Yellow
} catch {
    Write-Host "⚠️ Could not check firewall status" -ForegroundColor Yellow
}

# STEP 8: Suggested Fixes
Write-Host ""
Write-Host "🔧 SUGGESTED FIXES" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

if (-not $vpnGateway -or $vpnGateway -eq "0.0.0.0") {
    Write-Host "PRIORITY 1: Fix missing VPN gateway route" -ForegroundColor Red
    Write-Host "  • Run as Administrator:" -ForegroundColor White
    Write-Host "  • route add 0.0.0.0 mask 0.0.0.0 10.8.0.1 if $($vpnAdapter.InterfaceIndex) metric 1" -ForegroundColor Green
    Write-Host ""
}

Write-Host "PRIORITY 2: Test specific fixes" -ForegroundColor Yellow
Write-Host "  • Disconnect and reconnect VPN" -ForegroundColor White
Write-Host "  • Check VPN server status" -ForegroundColor White
Write-Host "  • Try different VPN server location" -ForegroundColor White
Write-Host "  • Disable Windows Firewall temporarily" -ForegroundColor White

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Run the suggested route command as Administrator" -ForegroundColor White
Write-Host "2. Test internet connectivity again" -ForegroundColor White
Write-Host "3. If still fails, disconnect/reconnect VPN" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to exit"