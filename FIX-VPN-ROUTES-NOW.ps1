# Manual VPN Route Fix Script
# Run this as Administrator to immediately fix routing while VPN is connected

Write-Host "`n=== NEBULA VPN - EMERGENCY ROUTE FIX ===" -ForegroundColor Cyan
Write-Host "This will immediately fix routing to restore VPN functionality`n" -ForegroundColor Yellow

$ErrorActionPreference = "Continue"

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script MUST be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Get VPN interface
$vpnAdapter = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*Nebula*" }
if (-not $vpnAdapter) {
    Write-Host "[ERROR] No WireGuard VPN adapter found. Is the VPN connected?" -ForegroundColor Red
    exit 1
}

$interfaceIndex = $vpnAdapter.InterfaceIndex
Write-Host "[OK] Found VPN interface: $($vpnAdapter.Name) (index $interfaceIndex)" -ForegroundColor Green

# Check VPN tunnel health before proceeding
Write-Host "[CHECK] Verifying VPN tunnel health..." -ForegroundColor Yellow
$vpnIP = Get-NetIPAddress -InterfaceIndex $interfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
if ($vpnIP -and $vpnIP.IPAddress -notlike "169.254.*") {
    Write-Host "[OK] VPN has valid IP: $($vpnIP.IPAddress)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] VPN tunnel not properly established!" -ForegroundColor Red
    if ($vpnIP) {
        Write-Host "       Current IP: $($vpnIP.IPAddress) (APIPA/invalid)" -ForegroundColor Red
    } else {
        Write-Host "       No IP assigned to VPN interface" -ForegroundColor Red
    }
    Write-Host "[SOLUTION] Try:" -ForegroundColor Yellow
    Write-Host "  1. Disconnect and reconnect VPN" -ForegroundColor White
    Write-Host "  2. Check VPN server connectivity" -ForegroundColor White
    Write-Host "  3. Verify WireGuard configuration" -ForegroundColor White
    exit 1
}

# Enhanced gateway detection with multiple methods
$physicalGateway = $null
$gatewayMethods = @()

# Method 1: Try to find non-VPN default route
$allRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Where-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
    $adapter -and $adapter.InterfaceDescription -notlike "*WireGuard*" -and $adapter.Name -notlike "*Nebula*"
}
if ($allRoutes) {
    $physicalGateway = ($allRoutes | Sort-Object RouteMetric | Select-Object -First 1).NextHop
    $gatewayMethods += "PowerShell NetRoute"
}

# Method 2: Parse route table if Method 1 failed
if (-not $physicalGateway -or $physicalGateway -eq "0.0.0.0") {
    $routeOutput = cmd /c "route print 0.0.0.0" 2>&1
    $routeLines = $routeOutput | Where-Object { $_ -match "^\s*0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)" }
    foreach ($line in $routeLines) {
        if ($line -match "(\d+\.\d+\.\d+\.\d+)\s+(\d+)\s*$") {
            $gw = $matches[1]
            $metric = [int]$matches[2]
            # Skip VPN gateways and select lowest metric
            if ($gw -ne "0.0.0.0" -and (-not $physicalGateway -or $metric -lt 50)) {
                $physicalGateway = $gw
                $gatewayMethods += "Route Table"
                break
            }
        }
    }
}

# Method 3: Get from WiFi adapter if still not found
if (-not $physicalGateway -or $physicalGateway -eq "0.0.0.0") {
    $wifiAdapter = Get-NetAdapter | Where-Object {
        $_.Status -eq "Up" -and 
        ($_.Name -like "*WiFi*" -or $_.Name -like "*Wireless*" -or $_.InterfaceDescription -like "*Wireless*")
    } | Select-Object -First 1
    
    if ($wifiAdapter) {
        $wifiGateway = Get-NetIPConfiguration -InterfaceIndex $wifiAdapter.InterfaceIndex -ErrorAction SilentlyContinue
        if ($wifiGateway -and $wifiGateway.IPv4DefaultGateway) {
            $physicalGateway = $wifiGateway.IPv4DefaultGateway.NextHop
            $gatewayMethods += "WiFi Adapter"
        }
    }
}

# Method 4: Fallback to common router IPs
if (-not $physicalGateway -or $physicalGateway -eq "0.0.0.0") {
    $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "172.16.0.1")
    foreach ($gw in $commonGateways) {
        if (Test-Connection -ComputerName $gw -Count 1 -Quiet -TimeoutSec 2) {
            $physicalGateway = $gw
            $gatewayMethods += "Ping Test"
            break
        }
    }
}

if ($physicalGateway -and $physicalGateway -ne "0.0.0.0") {
    Write-Host "[OK] Physical gateway: $physicalGateway" -ForegroundColor Green
    Write-Host "     Detected via: $($gatewayMethods -join ', ')" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Could not detect physical gateway!" -ForegroundColor Red
    Write-Host "This means local network routes cannot be configured properly." -ForegroundColor Yellow
    Write-Host "You may lose access to WiFi/LAN devices when VPN routes are applied." -ForegroundColor Yellow
    Write-Host "`n[MANUAL INTERVENTION] Please:" -ForegroundColor Red
    Write-Host "  1. Find your router IP manually (usually 192.168.1.1 or 192.168.0.1)" -ForegroundColor White
    Write-Host "  2. Run: ipconfig /all | findstr Gateway" -ForegroundColor Gray
    Write-Host "  3. Or check your WiFi network properties" -ForegroundColor White
    Write-Host "  4. Then edit this script and set: `$physicalGateway = 'YOUR_ROUTER_IP'" -ForegroundColor White
    $continue = Read-Host "`nContinue anyway? (may break WiFi access) [y/N]"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "Aborting. Please fix gateway detection first." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[WARN] Proceeding without local network routes..." -ForegroundColor Yellow
}

if ($physicalGateway -and $physicalGateway -ne "0.0.0.0") {    
    # Add local network routes FIRST (before VPN routes)
    # This preserves WiFi/LAN access while routing internet through VPN
    Write-Host "`n[FIX] Adding local network bypass routes..." -ForegroundColor Yellow
    Write-Host "      (This keeps your WiFi/LAN working)" -ForegroundColor Cyan
    
    $localNetworks = @(
        @{Network='192.168.0.0'; Mask='255.255.0.0'; Desc='Class C private'},
        @{Network='10.0.0.0'; Mask='255.0.0.0'; Desc='Class A private'},
        @{Network='172.16.0.0'; Mask='255.240.0.0'; Desc='Class B private'},
        @{Network='169.254.0.0'; Mask='255.255.0.0'; Desc='Link-local'},
        @{Network='224.0.0.0'; Mask='240.0.0.0'; Desc='Multicast'}
    )
    
    foreach ($net in $localNetworks) {
        $cmd = "route add $($net.Network) mask $($net.Mask) $physicalGateway metric 1"
        try {
            Invoke-Expression $cmd 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] $($net.Desc) network will use WiFi/LAN" -ForegroundColor Green
            }
        } catch {
            if ($_.Exception.Message -notlike "*exists*") {
                Write-Host "  [INFO] $($net.Desc) route may already exist" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "`n[FIX] Adding VPN routes..." -ForegroundColor Yellow
Write-Host "      (Forcing internet traffic through VPN tunnel)" -ForegroundColor Cyan

# Step 1: Remove any existing conflicting routes
Write-Host "  Cleaning existing conflicting routes..." -ForegroundColor Gray
$existingRoutes = @("0.0.0.0 mask 128.0.0.0", "128.0.0.0 mask 128.0.0.0")
foreach ($route in $existingRoutes) {
    try {
        cmd /c "route delete $route" 2>&1 | Out-Null
    } catch {
        # Ignore errors - route may not exist
    }
}

# Step 2: Add split default routes (0.0.0.0/1 + 128.0.0.0/1)
# These override the physical default route with higher priority

$route1 = "route add 0.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"
$route2 = "route add 128.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"

Write-Host "  Adding primary route: 0.0.0.0/1 via VPN..." -ForegroundColor Gray
$route1Result = cmd /c $route1 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Route 0.0.0.0/1 -> VPN tunnel" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Route 1 issue: $route1Result" -ForegroundColor Yellow
}

Write-Host "  Adding secondary route: 128.0.0.0/1 via VPN..." -ForegroundColor Gray
$route2Result = cmd /c $route2 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Route 128.0.0.0/1 -> VPN tunnel" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Route 2 issue: $route2Result" -ForegroundColor Yellow
}

# Step 3: Flush DNS to ensure fresh resolution
Write-Host "  Flushing DNS cache..." -ForegroundColor Gray
cmd /c "ipconfig /flushdns" 2>&1 | Out-Null

# Step 4: Verify routing table
Write-Host "  Verifying routing table..." -ForegroundColor Gray
$currentRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Sort-Object RouteMetric | Select-Object -First 3
$vpnRouteFound = $false
foreach ($route in $currentRoutes) {
    $adapter = Get-NetAdapter -InterfaceIndex $route.ifIndex -ErrorAction SilentlyContinue
    if ($adapter -and ($adapter.InterfaceDescription -like "*WireGuard*" -or $adapter.Name -like "*Nebula*")) {
        $vpnRouteFound = $true
        Write-Host "  [OK] VPN route active (metric $($route.RouteMetric))" -ForegroundColor Green
    }
}

if (-not $vpnRouteFound) {
    Write-Host "  [WARN] No VPN default route found in routing table" -ForegroundColor Yellow
    Write-Host "        This may indicate a configuration issue" -ForegroundColor Gray
}

Write-Host "`n[INFO] Waiting 3 seconds for routes to take effect..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n=== CONNECTIVITY VERIFICATION ===" -ForegroundColor Cyan

# Test 1: Local network access
Write-Host "`n[TEST 1] Verifying local network access..." -ForegroundColor Yellow
if ($physicalGateway) {
    $localTest = Test-Connection $physicalGateway -Count 1 -Quiet -TimeoutSec 3
    if ($localTest) {
        Write-Host "  ✅ WiFi/LAN router accessible ($physicalGateway)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ WiFi/LAN router not accessible" -ForegroundColor Red
        Write-Host "     This may cause local network connectivity issues" -ForegroundColor Yellow
    }
}

# Test 2: External IP check
Write-Host "`n[TEST 2] Verifying VPN tunnel connectivity..." -ForegroundColor Yellow
try {
    $newIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content
    Write-Host "  ✅ External IP retrieved: $newIP" -ForegroundColor Green
    Write-Host "     🎯 VPN tunnel is working!" -ForegroundColor Cyan
    
    # Try to get location info
    try {
        $ipInfo = Invoke-RestMethod -Uri "http://ip-api.com/json/$newIP" -TimeoutSec 5
        Write-Host "     📍 Location: $($ipInfo.city), $($ipInfo.country)" -ForegroundColor Cyan
    } catch {
        Write-Host "     📍 Location check failed (but IP is working)" -ForegroundColor Gray
    }
    
    Write-Host "`n🚀 SUCCESS! Run the tunnel test again:" -ForegroundColor Green
    Write-Host "   .\\TEST-VPN-TUNNEL.ps1" -ForegroundColor White
} catch {
    Write-Host "  ❌ Could not retrieve external IP: $($_.Exception.Message)" -ForegroundColor Red
    
    # Enhanced diagnostics for connection failures
    Write-Host "`n[DIAGNOSIS] Analyzing connection issues..." -ForegroundColor Yellow
    
    # Test DNS resolution
    try {
        $dnsTest = Test-Connection 8.8.8.8 -Count 1 -Quiet -TimeoutSec 5
        if ($dnsTest) {
            Write-Host "  ✅ DNS servers reachable (8.8.8.8)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ DNS servers not reachable" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ DNS test failed" -ForegroundColor Red
    }
    
    # Check if VPN tunnel has valid IP
    if ($vpnIP -and $vpnIP.IPAddress -like "169.254.*") {
        Write-Host "  ❌ VPN has APIPA address - tunnel not established!" -ForegroundColor Red
        Write-Host "     💡 Solution: Disconnect VPN and reconnect" -ForegroundColor Yellow
    }
    
    Write-Host "`n[NEXT STEPS] Try these in order:" -ForegroundColor Yellow
    Write-Host "  1. 🔄 Disconnect and reconnect VPN" -ForegroundColor White
    Write-Host "  2. 🖥️  Try different VPN server location" -ForegroundColor White  
    Write-Host "  3. 📞 Check if VPN service is working" -ForegroundColor White
    Write-Host "  4. 🔧 Run: .\\FIX-WIFI-BLOCKING.ps1" -ForegroundColor White
    Write-Host "  5. 🧪 Test: .\\TEST-VPN-TUNNEL.ps1" -ForegroundColor White
}

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
Write-Host "Routes are now configured. This is temporary - they will reset when you:" -ForegroundColor Yellow
Write-Host "  - Disconnect the VPN" -ForegroundColor White
Write-Host "  - Restart Windows" -ForegroundColor White
Write-Host "`nFor permanent fix: Update the app with the patched code." -ForegroundColor Yellow
    
    Write-Host "`n[NEXT STEPS] Try these in order:" -ForegroundColor Yellow
    Write-Host "  1. 🔄 Disconnect and reconnect VPN" -ForegroundColor White
    Write-Host "  2. 🖥️  Try different VPN server location" -ForegroundColor White  
    Write-Host "  3. 📞 Check if VPN service is working" -ForegroundColor White
    Write-Host "  4. 🔧 Run: .\\FIX-WIFI-BLOCKING.ps1" -ForegroundColor White
    Write-Host "  5. 🧪 Test: .\\TEST-VPN-TUNNEL.ps1" -ForegroundColor White
}

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
Write-Host "Routes are now configured. This is temporary - they will reset when you:" -ForegroundColor Yellow
Write-Host "  - Disconnect the VPN" -ForegroundColor White
Write-Host "  - Restart Windows" -ForegroundColor White
Write-Host "`nFor permanent fix: Update the app with the patched code." -ForegroundColor Yellow
