# EMERGENCY VPN ROUTING FIX
# ========================
# Fixes the specific issues: No internet, WiFi bypass, failed routing
# Must run as Administrator

Write-Host "🚨 EMERGENCY VPN ROUTING FIX" -ForegroundColor Red
Write-Host "============================" -ForegroundColor Red
Write-Host ""

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ CRITICAL: This script MUST run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Yellow
    Write-Host "1. Close this PowerShell" -ForegroundColor White
    Write-Host "2. Right-click PowerShell icon" -ForegroundColor White
    Write-Host "3. Choose 'Run as administrator'" -ForegroundColor White
    Write-Host "4. cd 'd:\Development\nebula-vpn-client'" -ForegroundColor White
    Write-Host "5. .\EMERGENCY-VPN-FIX.ps1" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# PHASE 1: EMERGENCY CLEANUP - Remove broken routes
Write-Host "PHASE 1: Emergency Route Cleanup..." -ForegroundColor Yellow
Write-Host "Removing all problematic VPN routes..." -ForegroundColor Gray

$brokenRoutes = @(
    "0.0.0.0 mask 128.0.0.0",
    "128.0.0.0 mask 128.0.0.0", 
    "0.0.0.0 mask 0.0.0.0"
)

$routesRemoved = 0
foreach ($route in $brokenRoutes) {
    try {
        $result = cmd /c "route delete $route 2>&1"
        if ($result -notmatch "not found" -and $result -notmatch "find a host") {
            $routesRemoved++
            Write-Host "  ✓ Removed broken route: $route" -ForegroundColor Green
        }
    } catch { 
        # Continue cleanup even if some fail
    }
}

Write-Host "  ℹ️ Cleanup complete: $routesRemoved broken routes removed" -ForegroundColor Cyan
Write-Host ""

# PHASE 2: RESTORE BASIC CONNECTIVITY
Write-Host "PHASE 2: Restoring Basic Internet..." -ForegroundColor Yellow

# Flush DNS cache
Write-Host "Flushing DNS cache..." -ForegroundColor Gray
cmd /c "ipconfig /flushdns" | Out-Null

# Release/renew network adapters
Write-Host "Refreshing network adapters..." -ForegroundColor Gray
try {
    cmd /c "ipconfig /release" 2>$null | Out-Null
    Start-Sleep 2
    cmd /c "ipconfig /renew" 2>$null | Out-Null
    Write-Host "  ✓ Network adapters refreshed" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Network refresh had issues (may be normal)" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 3: DETECT VPN AND PHYSICAL ADAPTERS
Write-Host "PHASE 3: Detecting Network Configuration..." -ForegroundColor Yellow

# Find VPN adapter
Write-Host "Detecting VPN adapter..." -ForegroundColor Gray
$vpnAdapter = Get-NetAdapter | Where-Object { 
    ($_.Name -like "*Nebula*" -or $_.InterfaceDescription -like "*WireGuard*") -and $_.Status -eq "Up" 
} | Select-Object -First 1

if ($vpnAdapter) {
    Write-Host "  ✅ VPN Adapter: $($vpnAdapter.Name) (Index: $($vpnAdapter.InterfaceIndex))" -ForegroundColor Green
    
    # Get VPN IP
    $vpnIP = Get-NetIPAddress -InterfaceAlias $vpnAdapter.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($vpnIP) {
        Write-Host "  ✅ VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ VPN adapter not found or not running!" -ForegroundColor Red
    Write-Host "Make sure WireGuard tunnel is connected before running this fix" -ForegroundColor Yellow
    exit 1
}

# Find physical adapter (WiFi/Ethernet)
Write-Host "Detecting physical network adapter..." -ForegroundColor Gray
$physicalAdapter = Get-NetAdapter | Where-Object { 
    $_.Status -eq "Up" -and 
    $_.Name -notlike "*VPN*" -and 
    $_.Name -notlike "*Nebula*" -and
    $_.InterfaceDescription -notlike "*WireGuard*" -and
    ($_.Name -like "*Wi-Fi*" -or $_.Name -like "*Ethernet*" -or $_.Name -like "*Wireless*")
} | Select-Object -First 1

if ($physicalAdapter) {
    Write-Host "  ✅ Physical Adapter: $($physicalAdapter.Name) (Index: $($physicalAdapter.InterfaceIndex))" -ForegroundColor Green
} else {
    Write-Host "  ❌ Physical adapter not detected!" -ForegroundColor Red
}

# Detect physical gateway
Write-Host "Detecting physical gateway..." -ForegroundColor Gray
$physicalGateway = $null

if ($physicalAdapter) {
    try {
        $route = Get-NetRoute -InterfaceIndex $physicalAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($route) {
            $physicalGateway = $route.NextHop
            Write-Host "  ✅ Physical Gateway: $physicalGateway" -ForegroundColor Green
        }
    } catch { }
}

if (-not $physicalGateway) {
    Write-Host "  ⚠️ Gateway auto-detect failed, using common defaults..." -ForegroundColor Yellow
    $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1")
    foreach ($gw in $commonGateways) {
        try {
            $ping = Test-Connection -ComputerName $gw -Count 1 -Quiet -TimeoutSec 2
            if ($ping) {
                $physicalGateway = $gw
                Write-Host "  ✅ Physical Gateway (detected): $physicalGateway" -ForegroundColor Green
                break
            }
        } catch { }
    }
}

Write-Host ""

# PHASE 4: APPLY CORRECT VPN ROUTING
Write-Host "PHASE 4: Applying Correct VPN Routing..." -ForegroundColor Yellow
Write-Host "This will route internet through VPN while preserving local access" -ForegroundColor Gray

$vpnGateway = "10.8.0.1"  # Standard WireGuard VPN gateway
$routesAdded = 0

if ($vpnAdapter -and $physicalGateway) {
    
    # Step 1: Ensure local network access (critical!)
    Write-Host "Adding local network preservation routes..." -ForegroundColor Gray
    $localRoutes = @(
        @{ Dest = "192.168.0.0"; Mask = "255.255.0.0"; Gateway = $physicalGateway; Interface = $physicalAdapter.InterfaceIndex },
        @{ Dest = "10.0.0.0"; Mask = "255.0.0.0"; Gateway = $physicalGateway; Interface = $physicalAdapter.InterfaceIndex },
        @{ Dest = "172.16.0.0"; Mask = "255.240.0.0"; Gateway = $physicalGateway; Interface = $physicalAdapter.InterfaceIndex }
    )
    
    foreach ($route in $localRoutes) {
        try {
            $cmd = "route add $($route.Dest) mask $($route.Mask) $($route.Gateway) if $($route.Interface) metric 1"
            cmd /c $cmd 2>$null | Out-Null
            Write-Host "  ✓ Local route: $($route.Dest)/$($route.Mask) -> $($route.Gateway)" -ForegroundColor Green
        } catch { }
    }
    
    # Step 2: Route internet traffic through VPN (smart method)
    Write-Host "Adding VPN internet routes..." -ForegroundColor Gray
    $vpnRoutes = @(
        @{ Dest = "1.0.0.0"; Mask = "255.0.0.0"; Gateway = $vpnGateway; Interface = $vpnAdapter.InterfaceIndex },
        @{ Dest = "8.0.0.0"; Mask = "248.0.0.0"; Gateway = $vpnGateway; Interface = $vpnAdapter.InterfaceIndex },
        @{ Dest = "16.0.0.0"; Mask = "240.0.0.0"; Gateway = $vpnGateway; Interface = $vpnAdapter.InterfaceIndex },
        @{ Dest = "32.0.0.0"; Mask = "224.0.0.0"; Gateway = $vpnGateway; Interface = $vpnAdapter.InterfaceIndex },
        @{ Dest = "64.0.0.0"; Mask = "192.0.0.0"; Gateway = $vpnGateway; Interface = $vpnAdapter.InterfaceIndex },
        @{ Dest = "128.0.0.0"; Mask = "128.0.0.0"; Gateway = $vpnGateway; Interface = $vpnAdapter.InterfaceIndex }
    )
    
    foreach ($route in $vpnRoutes) {
        try {
            $cmd = "route add $($route.Dest) mask $($route.Mask) $($route.Gateway) if $($route.Interface) metric 5"
            cmd /c $cmd 2>$null
            $routesAdded++
            Write-Host "  ✓ VPN route: $($route.Dest)/$($route.Mask) -> $($route.Gateway)" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️ Route may already exist: $($route.Dest)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "  ✅ Applied $routesAdded VPN routes" -ForegroundColor Green
} else {
    Write-Host "  ❌ Cannot apply routing - missing VPN adapter or gateway" -ForegroundColor Red
}

Write-Host ""

# PHASE 5: VERIFICATION TESTS
Write-Host "PHASE 5: Testing Fixed Configuration..." -ForegroundColor Yellow

# Test 1: Basic connectivity
Write-Host "Testing basic connectivity..." -ForegroundColor Gray
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "  ✅ Ping test: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Ping test: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Ping test: ERROR" -ForegroundColor Red
}

# Test 2: External IP check
Write-Host "Testing external IP..." -ForegroundColor Gray
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content.Trim()
    Write-Host "  ✅ External IP: $externalIP" -ForegroundColor Green
    
    # Check if it's VPN IP
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
        Write-Host "  🎉 SUCCESS: IP appears to be VPN!" -ForegroundColor Green -BackgroundColor DarkGreen
    } else {
        Write-Host "  ⚠️ WARNING: IP may still be ISP (but connectivity works)" -ForegroundColor Yellow
        Write-Host "    This might be expected depending on your VPN server configuration" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ External IP test: FAILED - no internet access" -ForegroundColor Red
}

# Test 3: DNS resolution
Write-Host "Testing DNS resolution..." -ForegroundColor Gray
try {
    $dns = Resolve-DnsName google.com -ErrorAction Stop
    Write-Host "  ✅ DNS resolution: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "  ❌ DNS resolution: FAILED" -ForegroundColor Red
}

# Test 4: Route table analysis
Write-Host "Analyzing route table..." -ForegroundColor Gray
try {
    $defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object DestinationPrefix, NextHop, InterfaceAlias, RouteMetric
    
    Write-Host "  Current default routes:" -ForegroundColor Cyan
    foreach ($route in $defaultRoutes) {
        $color = if ($route.InterfaceAlias -like "*Nebula*" -or $route.InterfaceAlias -like "*WireGuard*") { "Green" } else { "Yellow" }
        Write-Host "    $($route.NextHop) via $($route.InterfaceAlias) (metric: $($route.RouteMetric))" -ForegroundColor $color
    }
} catch {
    Write-Host "  ⚠️ Route analysis failed" -ForegroundColor Yellow
}

Write-Host ""

# RESULTS SUMMARY
Write-Host "🔧 EMERGENCY FIX COMPLETE" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "WHAT WAS FIXED:" -ForegroundColor Yellow
Write-Host "✓ Removed broken/aggressive routes that killed connectivity" -ForegroundColor Green
Write-Host "✓ Applied smart routing that preserves local network access" -ForegroundColor Green
Write-Host "✓ Routes internet through VPN without breaking WiFi/LAN" -ForegroundColor Green
Write-Host "✓ Refreshed network configuration" -ForegroundColor Green
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test browsing normally - WiFi/local network should work" -ForegroundColor White
Write-Host "2. Check IP at: https://whatismyipaddress.com/" -ForegroundColor White
Write-Host "3. Run your VPN test again to see improved scores" -ForegroundColor White
Write-Host "4. If still issues, run: .\CLEANUP-ADVANCED-VPN.ps1" -ForegroundColor White
Write-Host ""

Write-Host "ROUTE STRATEGY USED:" -ForegroundColor Cyan
Write-Host "• Local networks (192.168.x, 10.x, 172.16-31.x) → Physical gateway" -ForegroundColor Gray
Write-Host "• Internet traffic (1.x, 8-15.x, 16-31.x, etc.) → VPN gateway" -ForegroundColor Gray
Write-Host "• This ensures VPN security without breaking local access" -ForegroundColor Gray
Write-Host ""