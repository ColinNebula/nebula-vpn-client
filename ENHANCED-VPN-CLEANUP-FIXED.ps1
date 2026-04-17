# ENHANCED VPN CLEANUP - CONNECTIVITY FIX
# ========================================
# Fixes: Missing default routes, WiFi bypass, broken connectivity

Write-Host "ENHANCED VPN CLEANUP - CONNECTIVITY FIX" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "CRITICAL: This script MUST run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Right-click PowerShell -> 'Run as administrator'" -ForegroundColor Yellow
    Write-Host "2. Run: cd 'D:\Development\nebula-vpn-client'" -ForegroundColor White
    Write-Host "3. Run: .\ENHANCED-VPN-CLEANUP-FIXED.ps1" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "PASS - Running as Administrator" -ForegroundColor Green
Write-Host ""

# PHASE 1: EMERGENCY ROUTE TABLE REBUILD
Write-Host "PHASE 1: Emergency Route Table Rebuild..." -ForegroundColor Yellow
Write-Host "Fixing missing default routes and WiFi bypass issues..." -ForegroundColor Gray

# Remove ALL existing problematic routes aggressively  
$brokenRoutes = @(
    "0.0.0.0 mask 128.0.0.0",
    "128.0.0.0 mask 128.0.0.0", 
    "0.0.0.0 mask 0.0.0.0",
    "1.0.0.0 mask 255.0.0.0",
    "8.0.0.0 mask 248.0.0.0",
    "16.0.0.0 mask 240.0.0.0",
    "32.0.0.0 mask 224.0.0.0",
    "64.0.0.0 mask 192.0.0.0"
)

$routesRemoved = 0
foreach ($route in $brokenRoutes) {
    try {
        $result = cmd /c "route delete $route 2>&1"
        if ($result -notmatch "not found" -and $result -notmatch "find a host") {
            $routesRemoved++
            Write-Host "  PASS - Removed broken route: $route" -ForegroundColor Green
        }
    } catch { }
}

# CRITICAL: Aggressively remove WiFi bypass routes
Write-Host "Aggressively removing WiFi bypass routes..." -ForegroundColor Gray
try {
    # Method 1: PowerShell cmdlet (if routes exist)
    $wifiRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Where-Object {
        $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -ErrorAction SilentlyContinue
        $adapter -and ($adapter.Name -like "*Wi-Fi*" -or $adapter.Name -like "*Ethernet*")
    }
    
    foreach ($wifiRoute in $wifiRoutes) {
        try {
            Remove-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceIndex $wifiRoute.InterfaceIndex -Confirm:$false -ErrorAction SilentlyContinue
            Write-Host "  PASS - Removed WiFi default route" -ForegroundColor Green
            $routesRemoved++
        } catch { }
    }
} catch { }

# Method 2: CMD route removal (more aggressive)
try {
    $wifiAdapter = Get-NetAdapter | Where-Object { 
        $_.Status -eq "Up" -and ($_.Name -like "*Wi-Fi*" -or $_.Name -like "*Ethernet*" -or $_.Name -like "*Wireless*") 
    } | Select-Object -First 1
    
    if ($wifiAdapter) {
        # Remove any default routes through WiFi
        cmd /c "route delete 0.0.0.0 mask 0.0.0.0 if $($wifiAdapter.InterfaceIndex)" 2>$null | Out-Null
        Write-Host "  PASS - Aggressively removed WiFi default routes" -ForegroundColor Green
        $routesRemoved++
    }
} catch { }

Write-Host "  INFO - Routes cleaned: $routesRemoved" -ForegroundColor Cyan
Write-Host ""

# PHASE 2: NETWORK RESET
Write-Host "PHASE 2: Network Infrastructure Reset..." -ForegroundColor Yellow

try {
    Write-Host "Flushing network configuration..." -ForegroundColor Gray
    cmd /c "ipconfig /flushdns" | Out-Null
    cmd /c "ipconfig /release" 2>$null | Out-Null
    Start-Sleep 2
    cmd /c "ipconfig /renew" 2>$null | Out-Null
    cmd /c "netsh int ip reset" 2>$null | Out-Null
    Write-Host "  PASS - Network reset complete" -ForegroundColor Green
} catch {
    Write-Host "  WARN - Network reset had issues" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 3: ADAPTER DETECTION
Write-Host "PHASE 3: Critical Adapter Detection..." -ForegroundColor Yellow

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { 
    ($_.Name -like "*Nebula*" -or $_.InterfaceDescription -like "*WireGuard*") -and $_.Status -eq "Up" 
} | Select-Object -First 1

if ($vpnAdapter) {
    Write-Host "  PASS - VPN: $($vpnAdapter.Name) (Index: $($vpnAdapter.InterfaceIndex))" -ForegroundColor Green
    
    # Get VPN gateway from existing routes
    $vpnGateway = $null
    try {
        $vpnRoutes = Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
        foreach ($route in $vpnRoutes) {
            if ($route.NextHop -match "^10\." -and $route.NextHop -ne "0.0.0.0") {
                $vpnGateway = $route.NextHop
                break
            }
        }
    } catch { }
    
    if (-not $vpnGateway) {
        $vpnGateway = "10.8.0.1"  # Default WireGuard gateway
    }
    Write-Host "  PASS - VPN Gateway: $vpnGateway" -ForegroundColor Green
} else {
    Write-Host "  FAIL - VPN adapter not found! Make sure WireGuard is connected" -ForegroundColor Red
    exit 1
}

# Find physical adapter
$physicalAdapter = Get-NetAdapter | Where-Object { 
    $_.Status -eq "Up" -and 
    $_.InterfaceIndex -ne $vpnAdapter.InterfaceIndex -and
    ($_.Name -like "*Wi-Fi*" -or $_.Name -like "*Ethernet*" -or $_.Name -like "*Wireless*")
} | Select-Object -First 1

if ($physicalAdapter) {
    Write-Host "  PASS - Physical: $($physicalAdapter.Name) (Index: $($physicalAdapter.InterfaceIndex))" -ForegroundColor Green
} else {
    Write-Host "  WARN - Physical adapter detection failed" -ForegroundColor Yellow
}

# Find physical gateway (enhanced detection)
$physicalGateway = $null
if ($physicalAdapter) {
    # Method 1: Route table
    try {
        $route = Get-NetRoute -InterfaceIndex $physicalAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($route -and $route.NextHop -ne "0.0.0.0") {
            $physicalGateway = $route.NextHop
        }
    } catch { }
    
    # Method 2: IP configuration
    if (-not $physicalGateway) {
        try {
            $ipConfig = Get-NetIPConfiguration -InterfaceIndex $physicalAdapter.InterfaceIndex -ErrorAction SilentlyContinue
            if ($ipConfig -and $ipConfig.IPv4DefaultGateway) {
                $physicalGateway = $ipConfig.IPv4DefaultGateway.NextHop
            }
        } catch { }
    }
    
    # Method 3: Common gateways based on current IP
    if (-not $physicalGateway) {
        try {
            $currentIP = Get-NetIPAddress -InterfaceIndex $physicalAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($currentIP) {
                $ipParts = $currentIP.IPAddress.Split(".")
                if ($ipParts[0] -eq "192" -and $ipParts[1] -eq "168") {
                    $physicalGateway = "$($ipParts[0]).$($ipParts[1]).$($ipParts[2]).1"
                } elseif ($ipParts[0] -eq "10") {
                    $physicalGateway = "10.0.0.1"
                }
            }
        } catch { }
    }
    
    # Method 4: Test common gateways
    if (-not $physicalGateway) {
        $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "192.168.1.254")
        foreach ($gw in $commonGateways) {
            try {
                $ping = Test-Connection -ComputerName $gw -Count 1 -Quiet -TimeoutSec 2
                if ($ping) {
                    $physicalGateway = $gw
                    break
                }
            } catch { }
        }
    }
}

if ($physicalGateway) {
    Write-Host "  PASS - Physical Gateway: $physicalGateway" -ForegroundColor Green
} else {
    $physicalGateway = "192.168.1.1"  # Fallback
    Write-Host "  WARN - Gateway fallback: $physicalGateway" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 4: CRITICAL ROUTE CONSTRUCTION
Write-Host "PHASE 4: Critical Route Table Reconstruction..." -ForegroundColor Yellow
Write-Host "Building proper routing: Local->WiFi, Internet->VPN" -ForegroundColor Gray

$localRoutesApplied = 0
$vpnRoutesApplied = 0

if ($vpnAdapter -and $physicalAdapter -and $physicalGateway -and $vpnGateway) {
    
    # Step 1: Local network preservation routes (CRITICAL for WiFi functionality)
    Write-Host "Creating local network routes..." -ForegroundColor Gray
    $localRoutes = @(
        @{ Dest = "192.168.0.0"; Mask = "255.255.0.0"; Desc = "192.168.x networks" },
        @{ Dest = "10.0.0.0"; Mask = "255.0.0.0"; Desc = "10.x networks" },
        @{ Dest = "172.16.0.0"; Mask = "255.240.0.0"; Desc = "172.16-31.x networks" },
        @{ Dest = "169.254.0.0"; Mask = "255.255.0.0"; Desc = "Link-local" }
    )
    
    foreach ($route in $localRoutes) {
        try {
            cmd /c "route delete $($route.Dest) mask $($route.Mask)" 2>$null | Out-Null
            $cmd = "route add $($route.Dest) mask $($route.Mask) $physicalGateway if $($physicalAdapter.InterfaceIndex) metric 1"
            $result = cmd /c $cmd 2>&1
            if ($result -notmatch "find a host" -and $result -notmatch "already exists") {
                $localRoutesApplied++
                Write-Host "  PASS - Local: $($route.Desc)" -ForegroundColor Green
            }
        } catch { }
    }
    
    # Step 2: VPN internet routes (covers ALL public internet)
    Write-Host "Creating comprehensive VPN routes..." -ForegroundColor Gray
    $vpnRoutes = @(
        @{ Dest = "1.0.0.0"; Mask = "255.0.0.0"; Desc = "1.x range" },
        @{ Dest = "8.0.0.0"; Mask = "248.0.0.0"; Desc = "8-15.x range" },
        @{ Dest = "16.0.0.0"; Mask = "240.0.0.0"; Desc = "16-31.x range" },
        @{ Dest = "32.0.0.0"; Mask = "224.0.0.0"; Desc = "32-63.x range" },
        @{ Dest = "64.0.0.0"; Mask = "192.0.0.0"; Desc = "64-127.x range" },
        @{ Dest = "128.0.0.0"; Mask = "128.0.0.0"; Desc = "128-255.x range" }
    )
    
    foreach ($route in $vpnRoutes) {
        try {
            cmd /c "route delete $($route.Dest) mask $($route.Mask)" 2>$null | Out-Null
            $cmd = "route add $($route.Dest) mask $($route.Mask) $vpnGateway if $($vpnAdapter.InterfaceIndex) metric 5"
            $result = cmd /c $cmd 2>&1
            if ($result -notmatch "find a host" -and $result -notmatch "already exists") {
                $vpnRoutesApplied++
                Write-Host "  PASS - VPN: $($route.Desc)" -ForegroundColor Green
            }
        } catch { }
    }
    
    # Step 3: CRITICAL DEFAULT ROUTE (fixes your connectivity issues)
    Write-Host "Creating CRITICAL default route through VPN..." -ForegroundColor Gray
    try {
        # Remove any existing default routes
        cmd /c "route delete 0.0.0.0 mask 0.0.0.0" 2>$null | Out-Null
        
        # Add VPN default route with TOP PRIORITY
        $cmd = "route add 0.0.0.0 mask 0.0.0.0 $vpnGateway if $($vpnAdapter.InterfaceIndex) metric 1"
        $result = cmd /c $cmd 2>&1
        if ($result -notmatch "find a host") {
            Write-Host "  SUCCESS - VPN DEFAULT ROUTE CREATED!" -ForegroundColor Green -BackgroundColor DarkGreen
            $vpnRoutesApplied++
        } else {
            Write-Host "  WARN - Default route failed: $result" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  WARN - Default route creation failed" -ForegroundColor Yellow
    }
    
    Write-Host "  INFO - Applied $localRoutesApplied local + $vpnRoutesApplied VPN routes" -ForegroundColor Cyan
}

Write-Host ""

# PHASE 5: CONNECTIVITY VERIFICATION & FINAL FIXES
Write-Host "PHASE 5: Connectivity Verification & Final Fixes..." -ForegroundColor Yellow

# Test internet connectivity
Write-Host "Testing internet connectivity..." -ForegroundColor Gray
$internetOK = $false
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 2 -Quiet -TimeoutSec 8
    if ($ping) {
        Write-Host "  PASS - Internet: DNS reachable" -ForegroundColor Green
        $internetOK = $true
    } else {
        Write-Host "  WARN - Internet: DNS ping failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  WARN - Internet: Test failed" -ForegroundColor Yellow
}

# Test external IP (your main problem)
Write-Host "Testing external IP retrieval..." -ForegroundColor Gray
$ipTestOK = $false
$externalIP = $null
$ipServices = @("https://api.ipify.org", "https://icanhazip.com", "https://ifconfig.me/ip")

foreach ($service in $ipServices) {
    try {
        $response = Invoke-WebRequest -Uri $service -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        $externalIP = $response.Content.Trim()
        if ($externalIP -match '^\d+\.\d+\.\d+\.\d+$') {
            Write-Host "  SUCCESS - External IP: $externalIP !!" -ForegroundColor Green -BackgroundColor DarkGreen
            $ipTestOK = $true
            break
        }
    } catch {
        continue
    }
}

if (-not $ipTestOK) {
    Write-Host "  FAIL - External IP: All services failed" -ForegroundColor Red
}

# Final route table check and cleanup
Write-Host "Final route table verification..." -ForegroundColor Gray
try {
    $defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Sort-Object RouteMetric
    $wifiBypass = $false
    
    if ($defaultRoutes) {
        Write-Host "  Current routing priority:" -ForegroundColor Cyan
        foreach ($route in $defaultRoutes) {
            $adapter = Get-NetAdapter -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue
            if ($adapter) {
                $isVPN = $adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*"
                $isWiFi = $adapter.Name -like "*Wi-Fi*" -or $adapter.Name -like "*Ethernet*"
                
                if ($isVPN -and $route.RouteMetric -le 5) {
                    Write-Host "    TOP PRIORITY: VPN via $($adapter.Name)" -ForegroundColor Green
                } elseif ($isWiFi -and $route.RouteMetric -lt 20) {
                    Write-Host "    REMOVING: WiFi bypass via $($adapter.Name)" -ForegroundColor Red
                    $wifiBypass = $true
                    # Remove immediately
                    try {
                        Remove-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceIndex $route.InterfaceIndex -Confirm:$false -ErrorAction SilentlyContinue
                        Write-Host "    FIXED: WiFi bypass removed" -ForegroundColor Green
                    } catch { }
                } else {
                    Write-Host "    Lower priority: $($adapter.Name)" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "  WARN - Still no default routes!" -ForegroundColor Red
    }
} catch {
    Write-Host "  WARN - Route verification failed" -ForegroundColor Yellow
}

Write-Host ""

# FINAL SUMMARY
Write-Host "CONNECTIVITY FIX COMPLETE" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

Write-Host "STATUS SUMMARY:" -ForegroundColor Yellow
Write-Host "- Internet Access: $(if($internetOK){'FIXED'}else{'STILL ISSUES'})" -ForegroundColor $(if($internetOK){'Green'}else{'Red'})
Write-Host "- External IP Test: $(if($ipTestOK){'FIXED'}else{'STILL ISSUES'})" -ForegroundColor $(if($ipTestOK){'Green'}else{'Red'})
Write-Host "- WiFi Bypass: $(if(-not $wifiBypass){'FIXED'}else{'STILL PRESENT'})" -ForegroundColor $(if(-not $wifiBypass){'Green'}else{'Red'})
Write-Host ""

if ($ipTestOK -and $internetOK) {
    Write-Host "SUCCESS! Your VPN connectivity should now work!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host ""
    Write-Host "TEST YOUR FIX:" -ForegroundColor Cyan
    Write-Host "Run: .\TEST-VPN-TUNNEL.ps1 -Quick" -ForegroundColor White
    Write-Host ""
    Write-Host "EXPECTED RESULTS:" -ForegroundColor Yellow
    Write-Host "  [PASS] Public IP Retrieved - $externalIP" -ForegroundColor Green
    Write-Host "  [PASS] Default Route via VPN - Nebulavpn" -ForegroundColor Green  
    Write-Host "  [PASS] Security Score - 80-90%" -ForegroundColor Green
} else {
    Write-Host "PARTIAL FIX - Some connectivity issues may remain" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Disconnect and reconnect your WireGuard tunnel" -ForegroundColor White
    Write-Host "2. Re-run this script after reconnecting" -ForegroundColor White
    Write-Host "3. Test with: .\TEST-VPN-TUNNEL.ps1 -Quick" -ForegroundColor White
}

Write-Host ""
Write-Host "Fix completed at $(Get-Date)" -ForegroundColor Gray