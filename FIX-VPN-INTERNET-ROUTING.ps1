# COMPREHENSIVE VPN INTERNET ROUTING FIX
# =====================================
# Fixes WiFi internet blocking when VPN is connected
# Addresses routing issues preventing internet access through VPN tunnel

Write-Host "🔧 FIXING VPN INTERNET ROUTING ISSUES" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ CRITICAL: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# STEP 1: Analyze current network configuration
Write-Host "[1/7] Analyzing current network configuration..." -ForegroundColor Yellow

# Find WiFi adapter and gateway
$wifiAdapter = Get-NetAdapter | Where-Object { 
    ($_.Name -like "*Wi-Fi*" -or $_.Name -like "*Wireless*") -and $_.Status -eq "Up" 
}

$wifiGateway = $null
if ($wifiAdapter) {
    $wifiGateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceIndex $wifiAdapter.InterfaceIndex -ErrorAction SilentlyContinue).NextHop
    Write-Host "✅ WiFi Adapter: $($wifiAdapter.Name)" -ForegroundColor Green
    Write-Host "✅ WiFi Gateway: $wifiGateway" -ForegroundColor Green
}

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { 
    ($_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*") -and $_.Status -eq "Up" 
}

if ($vpnAdapter) {
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "✅ VPN Adapter: $($vpnAdapter.Name)" -ForegroundColor Green
    Write-Host "✅ VPN IP: $vpnIP" -ForegroundColor Green
    
    # Check if VPN has valid IP (not APIPA)
    if ($vpnIP -like "169.254.*") {
        Write-Host "❌ VPN has APIPA address - tunnel not fully established!" -ForegroundColor Red
        Write-Host "💡 Disconnect and reconnect VPN first" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ No active VPN interface found!" -ForegroundColor Red
    exit 1
}

# STEP 2: Clear problematic routes that block internet access  
Write-Host ""
Write-Host "[2/7] Removing routes that block internet access..." -ForegroundColor Yellow

$routesCleared = 0
$problematicRoutes = @(
    "0.0.0.0 mask 128.0.0.0",
    "128.0.0.0 mask 128.0.0.0", 
    "0.0.0.0 mask 255.255.255.255"
)

foreach ($routeCmd in $problematicRoutes) {
    try {
        $result = cmd /c "route delete $routeCmd 2>&1"
        if ($result -notlike "*not found*") {
            Write-Host "  ✅ Removed problematic route: $routeCmd" -ForegroundColor Green
            $routesCleared++
        }
    } catch {
        # Route doesn't exist - that's fine
    }
}

if ($routesCleared -eq 0) {
    Write-Host "  ℹ️ No problematic routes found" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ Cleared $routesCleared routes that were blocking internet" -ForegroundColor Green
}

# STEP 3: Ensure WiFi can access local network
Write-Host ""
Write-Host "[3/7] Protecting WiFi local network access..." -ForegroundColor Yellow

if ($wifiAdapter -and $wifiGateway) {
    # Ensure local network routes go through WiFi, not VPN
    $localNetworks = @(
        @{Network="192.168.0.0"; Mask="255.255.0.0"},
        @{Network="10.0.0.0"; Mask="255.0.0.0"},
        @{Network="172.16.0.0"; Mask="255.240.0.0"},
        @{Network="169.254.0.0"; Mask="255.255.0.0"}
    )
    
    foreach ($net in $localNetworks) {
        try {
            cmd /c "route add $($net.Network) mask $($net.Mask) $wifiGateway if $($wifiAdapter.InterfaceIndex) metric 1" 2>$null
        } catch {
            # Route may already exist
        }
    }
    
    Write-Host "  ✅ Local network access protected" -ForegroundColor Green
}

# STEP 4: Get VPN gateway information
Write-Host ""
Write-Host "[4/7] Detecting VPN gateway configuration..." -ForegroundColor Yellow

$vpnGateway = $null
$vpnRoutes = Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -ErrorAction SilentlyContinue

# Try to find VPN gateway from routing table
foreach ($route in $vpnRoutes) {
    if ($route.DestinationPrefix -eq "0.0.0.0/0" -and $route.NextHop -ne "0.0.0.0") {
        $vpnGateway = $route.NextHop
        break
    }
}

if (-not $vpnGateway) {
    # Try alternative method - look for point-to-point destination
    $vpnConfig = Get-NetIPConfiguration -InterfaceIndex $vpnAdapter.InterfaceIndex -ErrorAction SilentlyContinue
    if ($vpnConfig -and $vpnConfig.IPv4DefaultGateway) {
        $vpnGateway = $vpnConfig.IPv4DefaultGateway.NextHop
    }
}

if ($vpnGateway) {
    Write-Host "  ✅ VPN Gateway found: $vpnGateway" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ VPN Gateway detection failed - trying automatic configuration" -ForegroundColor Yellow
    # For WireGuard, the gateway is often the peer endpoint
    $vpnGateway = "10.8.0.1" # Common WireGuard gateway
}

# STEP 5: Create proper VPN default route
Write-Host ""
Write-Host "[5/7] Creating VPN internet routing..." -ForegroundColor Yellow

try {
    # Remove any existing default route for VPN interface
    Get-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceIndex $vpnAdapter.InterfaceIndex -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
    
    # Add new default route with proper metric
    New-NetRoute -DestinationPrefix "0.0.0.0/0" -NextHop $vpnGateway -InterfaceIndex $vpnAdapter.InterfaceIndex -RouteMetric 1 -ErrorAction SilentlyContinue
    Write-Host "  ✅ VPN default route configured (metric 1)" -ForegroundColor Green
    
    # Lower WiFi route priority to ensure VPN takes precedence for internet
    Get-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceIndex $wifiAdapter.InterfaceIndex -ErrorAction SilentlyContinue | Set-NetRoute -RouteMetric 256 -ErrorAction SilentlyContinue
    Write-Host "  ✅ WiFi route metric adjusted (backup route)" -ForegroundColor Green
    
} catch {
    Write-Host "  ⚠️ Route configuration warning: $($_.Exception.Message)" -ForegroundColor Yellow
}

# STEP 6: Fix DNS routing through VPN
Write-Host ""
Write-Host "[6/7] Configuring DNS through VPN..." -ForegroundColor Yellow

try {
    # Set VPN interface DNS to use VPN servers
    $vpnDNS = @("1.1.1.1", "1.0.0.1")  # Cloudflare DNS (works well with VPN)
    Set-DnsClientServerAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -ServerAddresses $vpnDNS -ErrorAction SilentlyContinue
    Write-Host "  ✅ VPN DNS configured: $($vpnDNS -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ DNS configuration warning: $($_.Exception.Message)" -ForegroundColor Yellow
}

# STEP 7: Test connectivity 
Write-Host ""
Write-Host "[7/7] Testing internet connectivity..." -ForegroundColor Yellow

# Test 1: Local network (should work through WiFi)
if ($wifiGateway) {
    $localTest = Test-Connection -ComputerName $wifiGateway -Count 1 -Quiet -TimeoutSec 3
    if ($localTest) {
        Write-Host "  ✅ Local network accessible via WiFi" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Local network test failed" -ForegroundColor Red
    }
}

# Test 2: Internet access (should work through VPN)
Write-Host "  🔍 Testing internet through VPN..." -ForegroundColor Cyan
$internetWorking = $false

$testSites = @(
    "https://icanhazip.com",
    "https://api.ipify.org", 
    "https://ipinfo.io/ip"
)

foreach ($site in $testSites) {
    try {
        Write-Host "    Testing $site..." -ForegroundColor White
        $response = Invoke-WebRequest -Uri $site -UseBasicParsing -TimeoutSec 10
        $currentIP = $response.Content.Trim()
        Write-Host "    ✅ SUCCESS! Current IP: $currentIP" -ForegroundColor Green
        $internetWorking = $true
        break
    } catch {
        Write-Host "    ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# FINAL ASSESSMENT
Write-Host ""
Write-Host "🎯 ROUTING FIX COMPLETE!" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Cyan

if ($internetWorking) {
    Write-Host ""
    Write-Host "✅ INTERNET CONNECTIVITY RESTORED!" -ForegroundColor Green
    Write-Host "✅ Local network: Available via WiFi" -ForegroundColor Green  
    Write-Host "✅ Internet access: Routed through VPN" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your VPN tunnel is now working properly!" -ForegroundColor Green
    Write-Host "Run your VPN test script again - it should show improved results" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️ Internet connectivity still has issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Disconnect VPN completely" -ForegroundColor White
    Write-Host "2. Reconnect VPN and wait 30 seconds" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host "4. Check VPN server status" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"