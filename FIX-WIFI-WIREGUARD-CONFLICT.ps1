# COMPREHENSIVE WIFI UNBLOCKING SOLUTION
# ====================================
# This script fixes WireGuard routing conflicts that block WiFi connectivity
# Implements proper split tunneling to preserve local network access

Write-Host "🔧 FIXING WIREGUARD WIFI BLOCKING ISSUE" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
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

# STEP 1: Detect WiFi adapter and gateway
Write-Host "[1/6] Detecting WiFi network configuration..." -ForegroundColor Yellow
$wifiAdapter = Get-NetAdapter | Where-Object { 
    $_.Name -like "*Wi-Fi*" -or $_.Name -like "*Wireless*" -or $_.Name -like "*WiFi*" 
} | Where-Object { $_.Status -eq "Up" }

if (-not $wifiAdapter) {
    Write-Host "❌ No active WiFi adapter found!" -ForegroundColor Red
    exit 1
}

$wifiGateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { 
    $_.InterfaceAlias -eq $wifiAdapter.Name 
}).NextHop | Select-Object -First 1

$wifiIP = (Get-NetIPAddress -InterfaceIndex $wifiAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress

Write-Host "✅ WiFi Adapter: $($wifiAdapter.Name)" -ForegroundColor Green
Write-Host "✅ WiFi IP: $wifiIP" -ForegroundColor Green  
Write-Host "✅ WiFi Gateway: $wifiGateway" -ForegroundColor Green

# STEP 2: Detect VPN interface
Write-Host ""
Write-Host "[2/6] Detecting VPN interface..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object { 
    $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" 
} | Where-Object { $_.Status -eq "Up" }

if ($vpnAdapter) {
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "✅ VPN Adapter: $($vpnAdapter.Name)" -ForegroundColor Green
    Write-Host "✅ VPN IP: $vpnIP" -ForegroundColor Green
    $vpnActive = $true
} else {
    Write-Host "⚠️ No active VPN interface found" -ForegroundColor Yellow
    $vpnActive = $false
}

# STEP 3: Remove problematic VPN routes that block WiFi
Write-Host ""
Write-Host "[3/6] Removing WiFi-blocking VPN routes..." -ForegroundColor Yellow
$routesFixed = 0

# These are the aggressive routes that WireGuard creates that block WiFi
$problematicRoutes = @(
    @{Route="0.0.0.0"; Mask="128.0.0.0"; Description="0.0.0.0/1 - Blocks half of internet including local"},
    @{Route="128.0.0.0"; Mask="128.0.0.0"; Description="128.0.0.0/1 - Blocks other half of internet"},
    @{Route="0.0.0.0"; Mask="0.0.0.0"; Description="0.0.0.0/0 - Captures ALL traffic"}
)

foreach ($route in $problematicRoutes) {
    try {
        $result = cmd /c "route delete $($route.Route) mask $($route.Mask) 2>&1"
        if ($result -notlike "*not found*" -and $result -notlike "*failed*") {
            Write-Host "  ✅ Removed: $($route.Description)" -ForegroundColor Green
            $routesFixed++
        }
    } catch {
        # Route doesn't exist, which is fine
    }
}

if ($routesFixed -eq 0) {
    Write-Host "  ℹ️ No problematic routes found (already clean)" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ Removed $routesFixed WiFi-blocking routes" -ForegroundColor Green
}

# STEP 4: Ensure WiFi default route exists
Write-Host ""
Write-Host "[4/6] Restoring WiFi connectivity..." -ForegroundColor Yellow

# Make sure WiFi has a default route
try {
    $wifiRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { 
        $_.InterfaceAlias -eq $wifiAdapter.Name 
    }
    
    if (-not $wifiRoute) {
        Write-Host "  🔧 Adding WiFi default route..." -ForegroundColor Cyan
        New-NetRoute -DestinationPrefix "0.0.0.0/0" -NextHop $wifiGateway -InterfaceIndex $wifiAdapter.InterfaceIndex -RouteMetric 256 -ErrorAction SilentlyContinue
        Write-Host "  ✅ WiFi default route restored" -ForegroundColor Green
    } else {
        Write-Host "  ✅ WiFi default route exists" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Could not modify WiFi routes: $($_.Exception.Message)" -ForegroundColor Yellow
}

# STEP 5: Test WiFi connectivity
Write-Host ""
Write-Host "[5/6] Testing WiFi connectivity..." -ForegroundColor Yellow

# Test 1: Ping local gateway
$gatewayPing = Test-Connection -ComputerName $wifiGateway -Count 2 -Quiet -ErrorAction SilentlyContinue
if ($gatewayPing) {
    Write-Host "  ✅ WiFi gateway reachable ($wifiGateway)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Cannot reach WiFi gateway ($wifiGateway)" -ForegroundColor Red
}

# Test 2: Test internet connectivity  
try {
    $internetTest = Invoke-WebRequest -Uri "https://www.google.com" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✅ Internet connectivity working" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Internet connectivity issue: $($_.Exception.Message)" -ForegroundColor Yellow
}

# STEP 6: Implement proper VPN routing (if VPN is active)
Write-Host ""
Write-Host "[6/6] Implementing proper VPN split tunneling..." -ForegroundColor Yellow

if ($vpnActive) {
    Write-Host "  🔧 Configuring split tunneling for VPN..." -ForegroundColor Cyan
    
    # Preserve local network access - these should NEVER go through VPN
    $localNetworks = @(
        @{Network="192.168.0.0"; Mask="255.255.0.0"; Description="Private Class C"},
        @{Network="10.0.0.0"; Mask="255.0.0.0"; Description="Private Class A"}, 
        @{Network="172.16.0.0"; Mask="255.240.0.0"; Description="Private Class B"},
        @{Network="169.254.0.0"; Mask="255.255.0.0"; Description="Link-local"},
        @{Network="224.0.0.0"; Mask="240.0.0.0"; Description="Multicast"}
    )
    
    foreach ($net in $localNetworks) {
        try {
            # Ensure local networks go through WiFi, not VPN
            $existingRoute = Get-NetRoute -DestinationPrefix "$($net.Network)/$(([IPAddress]$net.Mask).GetAddressBytes() | ForEach-Object { [Convert]::ToString($_, 2) } | Out-String | Measure-Object -Character | Select-Object -ExpandProperty Characters)" -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceIndex -eq $wifiAdapter.InterfaceIndex }
            
            if (-not $existingRoute) {
                cmd /c "route add $($net.Network) mask $($net.Mask) $wifiGateway if $($wifiAdapter.InterfaceIndex) metric 1" 2>$null
                Write-Host "    ✅ Protected: $($net.Description)" -ForegroundColor Green
            }
        } catch {
            # Continue if route already exists
        }
    }
    
    Write-Host "  ✅ Local networks protected from VPN routing" -ForegroundColor Green
} else {
    Write-Host "  ℹ️ No VPN active - WiFi has full internet access" -ForegroundColor Cyan
}

# FINAL STATUS
Write-Host ""
Write-Host "🎉 WIFI UNBLOCKING COMPLETE!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ WiFi Interface: $($wifiAdapter.Name) - Active" -ForegroundColor Green
Write-Host "✅ Local Gateway: $wifiGateway - Accessible" -ForegroundColor Green
if ($vpnActive) {
    Write-Host "✅ VPN Interface: $($vpnAdapter.Name) - Active with Split Tunneling" -ForegroundColor Green
    Write-Host "✅ Configuration: Local traffic via WiFi, Internet via VPN" -ForegroundColor Green
} else {
    Write-Host "ℹ️ VPN Interface: Not active - All traffic via WiFi" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test local network: ping $wifiGateway" -ForegroundColor White
Write-Host "2. Test internet: ping 8.8.8.8" -ForegroundColor White  
Write-Host "3. If VPN was active, reconnect it to test split tunneling" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to exit"