# VPN ROUTING DIAGNOSTIC - FIXED VERSION
# =====================================

Write-Host "VPN ROUTING DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Analyzing current VPN routing issues..." -ForegroundColor Yellow
Write-Host ""

# Check 1: VPN Interface Status
Write-Host "[1] VPN Interface Analysis" -ForegroundColor Cyan
$vpnAdapter = Get-NetAdapter | Where-Object { 
    ($_.Name -like "*Nebula*" -or $_.InterfaceDescription -like "*WireGuard*") -and $_.Status -eq "Up" 
}

if ($vpnAdapter) {
    Write-Host "  PASS - VPN Interface: $($vpnAdapter.Name) - ACTIVE" -ForegroundColor Green
    
    $vpnIP = Get-NetIPAddress -InterfaceAlias $vpnAdapter.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($vpnIP) {
        Write-Host "  PASS - VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Green
    }
} else {
    Write-Host "  FAIL - VPN Interface: NOT FOUND OR DOWN" -ForegroundColor Red
    Write-Host "     Make sure WireGuard tunnel is connected" -ForegroundColor Yellow
}

Write-Host ""

# Check 2: Current Route Table Problems
Write-Host "[2] Route Table Analysis" -ForegroundColor Cyan
Write-Host "Checking for problematic routes..." -ForegroundColor Gray

try {
    $allRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
    $problemRoutes = @()
    $workingRoutes = @()

    foreach ($route in $allRoutes) {
        $adapter = Get-NetAdapter -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue
        
        if ($adapter) {
            $routeInfo = @{
                Destination = $route.DestinationPrefix
                Gateway = $route.NextHop  
                Interface = $adapter.Name
                Metric = $route.RouteMetric
                Status = $adapter.Status
            }
            
            if ($adapter.Name -like "*Wi-Fi*" -or $adapter.Name -like "*Ethernet*") {
                $workingRoutes += $routeInfo
                Write-Host "  WARN - BYPASS ROUTE: $($route.NextHop) via $($adapter.Name) (metric: $($route.RouteMetric))" -ForegroundColor Yellow
                Write-Host "     WARNING: This is why traffic bypasses VPN!" -ForegroundColor Yellow
            } elseif ($adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*") {
                $workingRoutes += $routeInfo
                Write-Host "  PASS - VPN ROUTE: $($route.NextHop) via $($adapter.Name) (metric: $($route.RouteMetric))" -ForegroundColor Green
            } else {
                $workingRoutes += $routeInfo
                Write-Host "  INFO - OTHER ROUTE: $($route.NextHop) via $($adapter.Name) (metric: $($route.RouteMetric))" -ForegroundColor Gray
            }
        }
    }

    if ($workingRoutes.Count -eq 0) {
        Write-Host "  FAIL - NO DEFAULT ROUTES FOUND - This explains the no internet issue!" -ForegroundColor Red
    }
} catch {
    Write-Host "  FAIL - Route analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check 3: Internet Connectivity Test
Write-Host "[3] Connectivity Analysis" -ForegroundColor Cyan

Write-Host "Testing basic internet access..." -ForegroundColor Gray
$pingWorking = $false
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "  PASS - Internet: WORKING" -ForegroundColor Green
        $pingWorking = $true
    } else {
        Write-Host "  FAIL - Internet: BROKEN - Cannot reach 8.8.8.8" -ForegroundColor Red
        Write-Host "     This is why your VPN tests are failing!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAIL - Internet: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing external IP retrieval..." -ForegroundColor Gray
$externalIPWorking = $false
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "  PASS - External IP: $externalIP" -ForegroundColor Green
    $externalIPWorking = $true
    
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
        Write-Host "     SUCCESS - IP is VPN (private range)" -ForegroundColor Green
    } else {
        Write-Host "     WARNING - IP appears to be ISP (leak?)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAIL - External IP: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "     This is why 'Public IP Retrieved' test failed!" -ForegroundColor Yellow
}

Write-Host ""

# Check 4: Route Priority Analysis
Write-Host "[4] Route Priority Analysis" -ForegroundColor Cyan
Write-Host "Analyzing why traffic goes through WiFi instead of VPN..." -ForegroundColor Gray

try {
    $defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Sort-Object RouteMetric
    Write-Host "  Current default routes (by priority):" -ForegroundColor Cyan

    foreach ($route in $defaultRoutes) {
        $adapter = Get-NetAdapter -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue
        if ($adapter) {
            $priority = if ($route.RouteMetric -lt 10) { "HIGH" } elseif ($route.RouteMetric -lt 50) { "MEDIUM" } else { "LOW" }
            $color = if ($adapter.Name -like "*Wi-Fi*") { "Red" } elseif ($adapter.Name -like "*Nebula*") { "Green" } else { "Gray" }
            
            Write-Host "    Priority $($route.RouteMetric) ($priority): $($route.NextHop) via $($adapter.Name)" -ForegroundColor $color
            
            if ($adapter.Name -like "*Wi-Fi*" -and $route.RouteMetric -lt 50) {
                Write-Host "      WARNING - WiFi route has higher priority than VPN!" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "  FAIL - Route priority analysis failed" -ForegroundColor Red
}

Write-Host ""

# Problem Summary
Write-Host "PROBLEM SUMMARY" -ForegroundColor Red
Write-Host "===============" -ForegroundColor Red

try {
    $defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue

    $wifiBypass = $defaultRoutes | Where-Object { 
        $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue
        $adapter -and ($adapter.Name -like "*Wi-Fi*" -or $adapter.Name -like "*Ethernet*") -and $_.RouteMetric -lt 50
    }

    $vpnRoute = $defaultRoutes | Where-Object {
        $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue  
        $adapter -and ($adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*")
    }

    if ($wifiBypass -and $vpnRoute) {
        Write-Host "ROOT CAUSE: WiFi route has higher priority than VPN route" -ForegroundColor Red
        Write-Host "EFFECT: All traffic bypasses VPN tunnel -> Security failure" -ForegroundColor Yellow
    } elseif (-not $vpnRoute) {
        Write-Host "ROOT CAUSE: No VPN default route exists" -ForegroundColor Red  
        Write-Host "EFFECT: All traffic goes through physical connection" -ForegroundColor Yellow
    } elseif ($wifiBypass) {
        Write-Host "ROOT CAUSE: Physical adapter route overriding VPN" -ForegroundColor Red
        Write-Host "EFFECT: Traffic leaks through WiFi/Ethernet" -ForegroundColor Yellow
    } elseif (-not $pingWorking) {
        Write-Host "ROOT CAUSE: No internet connectivity at all" -ForegroundColor Red
        Write-Host "EFFECT: Broken routing preventing all network access" -ForegroundColor Yellow
    } else {
        Write-Host "STATUS: Network appears to be working normally" -ForegroundColor Green
    }
} catch {
    Write-Host "ROOT CAUSE: Unable to analyze routes - system networking issue" -ForegroundColor Red
}

Write-Host ""
Write-Host "SOLUTION" -ForegroundColor Green
Write-Host "========" -ForegroundColor Green

if (-not $pingWorking -and -not $externalIPWorking) {
    Write-Host "CRITICAL: No internet connectivity" -ForegroundColor Red
    Write-Host "Run this command as Administrator:" -ForegroundColor Yellow
    Write-Host ".\EMERGENCY-VPN-FIX-FINAL.ps1" -ForegroundColor White
} elseif ($externalIPWorking -and -not $pingWorking) {
    Write-Host "PARTIAL: Web access works but ping blocked" -ForegroundColor Yellow  
    Write-Host "Run this command as Administrator:" -ForegroundColor Yellow
    Write-Host ".\WORKING-VPN-CLEANUP-FINAL.ps1" -ForegroundColor White
} else {
    Write-Host "Run this command as Administrator:" -ForegroundColor Yellow
    Write-Host ".\WORKING-VPN-CLEANUP-FINAL.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "- Remove broken/conflicting routes" -ForegroundColor White
Write-Host "- Apply smart routing that preserves local network access" -ForegroundColor White  
Write-Host "- Route internet through VPN while keeping WiFi for local" -ForegroundColor White
Write-Host "- Fix the 'Default Route via VPN' test failure" -ForegroundColor White
Write-Host "- Restore internet connectivity" -ForegroundColor White
Write-Host ""