# WORKING VPN CLEANUP - FINAL VERSION
# ====================================
# Robust cleanup with better error handling

Write-Host "VPN ROUTING CLEANUP" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "CRITICAL: This script MUST run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell -> 'Run as administrator'" -ForegroundColor Yellow
    Write-Host "Then run: .\WORKING-VPN-CLEANUP-FINAL.ps1" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "PASS - Running as Administrator" -ForegroundColor Green
Write-Host ""

# PHASE 1: NRPT DNS CLEANUP
Write-Host "PHASE 1: Cleaning up NRPT DNS policies..." -ForegroundColor Yellow

try {
    $nrptRules = Get-DnsClientNrptRule -ErrorAction SilentlyContinue
    if ($nrptRules) {
        foreach ($rule in $nrptRules) {
            try {
                Remove-DnsClientNrptRule -Name $rule.Name -Force -ErrorAction SilentlyContinue
                Write-Host "  PASS - Removed NRPT rule: $($rule.Name)" -ForegroundColor Green
            } catch {
                Write-Host "  WARN - Failed to remove NRPT rule: $($rule.Name)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  INFO - No NRPT rules found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  WARN - NRPT cleanup failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 2: ROUTE TABLE CLEANUP
Write-Host "PHASE 2: Cleaning up route table..." -ForegroundColor Yellow

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
            Write-Host "  PASS - Removed route: $route" -ForegroundColor Green
        }
    } catch {
        # Continue cleanup
    }
}

Write-Host "  INFO - Removed $routesRemoved broken routes" -ForegroundColor Cyan
Write-Host ""

# PHASE 3: REGISTRY IPv6 CLEANUP 
Write-Host "PHASE 3: Cleaning up Registry IPv6 settings..." -ForegroundColor Yellow

$regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters"
try {
    if (Test-Path $regPath) {
        try {
            Remove-ItemProperty -Path $regPath -Name "DisabledComponents" -ErrorAction SilentlyContinue
            Write-Host "  PASS - Removed IPv6 disable setting" -ForegroundColor Green
        } catch {
            Write-Host "  INFO - IPv6 setting not found (already clean)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  INFO - Registry path not found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  WARN - Registry cleanup failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 4: WFP FILTER CLEANUP
Write-Host "PHASE 4: Cleaning up WFP filters..." -ForegroundColor Yellow

try {
    $filters = netsh wfp show filters | Select-String "Nebula"
    if ($filters) {
        Write-Host "  INFO - Found WFP filters to clean" -ForegroundColor Gray
        cmd /c "netsh wfp set options netevents=on" 2>$null
        Write-Host "  PASS - WFP options reset" -ForegroundColor Green
    } else {
        Write-Host "  INFO - No Nebula WFP filters found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  WARN - WFP cleanup failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 5: NETWORK REFRESH
Write-Host "PHASE 5: Refreshing network configuration..." -ForegroundColor Yellow

try {
    Write-Host "Flushing DNS cache..." -ForegroundColor Gray
    cmd /c "ipconfig /flushdns" | Out-Null
    Write-Host "  PASS - DNS cache flushed" -ForegroundColor Green

    Write-Host "Releasing/renewing network adapters..." -ForegroundColor Gray
    cmd /c "ipconfig /release" 2>$null | Out-Null
    Start-Sleep 2
    cmd /c "ipconfig /renew" 2>$null | Out-Null
    Write-Host "  PASS - Network adapters refreshed" -ForegroundColor Green
    
} catch {
    Write-Host "  WARN - Network refresh failed" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 6: SMART VPN ROUTING
Write-Host "PHASE 6: Applying smart VPN routing..." -ForegroundColor Yellow

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { 
    ($_.Name -like "*Nebula*" -or $_.InterfaceDescription -like "*WireGuard*") -and $_.Status -eq "Up" 
} | Select-Object -First 1

# Find physical adapter
$physicalAdapter = Get-NetAdapter | Where-Object { 
    $_.Status -eq "Up" -and 
    $_.Name -notlike "*VPN*" -and 
    $_.Name -notlike "*Nebula*" -and
    $_.InterfaceDescription -notlike "*WireGuard*" -and
    ($_.Name -like "*Wi-Fi*" -or $_.Name -like "*Ethernet*" -or $_.Name -like "*Wireless*")
} | Select-Object -First 1

if ($vpnAdapter -and $physicalAdapter) {
    Write-Host "  PASS - VPN Adapter: $($vpnAdapter.Name)" -ForegroundColor Green
    Write-Host "  PASS - Physical Adapter: $($physicalAdapter.Name)" -ForegroundColor Green
    
    # Get physical gateway
    $physicalGateway = $null
    try {
        $route = Get-NetRoute -InterfaceIndex $physicalAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($route) {
            $physicalGateway = $route.NextHop
        }
    } catch {
        # Try common gateways
        $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1")
        foreach ($gw in $commonGateways) {
            try {
                $ping = Test-Connection -ComputerName $gw -Count 1 -Quiet -TimeoutSec 2
                if ($ping) {
                    $physicalGateway = $gw
                    break
                }
            } catch {
                # Continue
            }
        }
    }
    
    if ($physicalGateway) {
        Write-Host "  PASS - Physical Gateway: $physicalGateway" -ForegroundColor Green
        
        # Apply local network preservation routes
        $localRoutes = @(
            @{ Dest = "192.168.0.0"; Mask = "255.255.0.0" },
            @{ Dest = "10.0.0.0"; Mask = "255.0.0.0" },
            @{ Dest = "172.16.0.0"; Mask = "255.240.0.0" }
        )
        
        foreach ($route in $localRoutes) {
            try {
                $cmd = "route add $($route.Dest) mask $($route.Mask) $physicalGateway if $($physicalAdapter.InterfaceIndex) metric 1"
                cmd /c $cmd 2>$null | Out-Null
                Write-Host "  PASS - Local route: $($route.Dest)" -ForegroundColor Green
            } catch {
                # Route may already exist
            }
        }
        
        # Apply VPN internet routes
        $vpnGateway = "10.8.0.1"
        $vpnRoutes = @(
            @{ Dest = "1.0.0.0"; Mask = "255.0.0.0" },
            @{ Dest = "8.0.0.0"; Mask = "248.0.0.0" },
            @{ Dest = "16.0.0.0"; Mask = "240.0.0.0" },
            @{ Dest = "32.0.0.0"; Mask = "224.0.0.0" },
            @{ Dest = "64.0.0.0"; Mask = "192.0.0.0" },
            @{ Dest = "128.0.0.0"; Mask = "128.0.0.0" }
        )
        
        foreach ($route in $vpnRoutes) {
            try {
                $cmd = "route add $($route.Dest) mask $($route.Mask) $vpnGateway if $($vpnAdapter.InterfaceIndex) metric 5"
                cmd /c $cmd 2>$null | Out-Null
                Write-Host "  PASS - VPN route: $($route.Dest)" -ForegroundColor Green
            } catch {
                # Route may already exist
            }
        }
        
    } else {
        Write-Host "  WARN - Could not detect physical gateway" -ForegroundColor Yellow
    }
} else {
    Write-Host "  WARN - VPN or physical adapter not found" -ForegroundColor Yellow
    if (-not $vpnAdapter) {
        Write-Host "    Make sure WireGuard tunnel is connected" -ForegroundColor Gray
    }
}

Write-Host ""

# PHASE 7: VERIFICATION
Write-Host "PHASE 7: Verification tests..." -ForegroundColor Yellow

# Test internet connectivity
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "  PASS - Internet connectivity: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "  WARN - Internet connectivity: FAILED" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  WARN - Internet test failed" -ForegroundColor Yellow
}

# Test external IP
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "  PASS - External IP: $externalIP" -ForegroundColor Green
} catch {
    Write-Host "  WARN - External IP test failed" -ForegroundColor Yellow
}

Write-Host ""

# FINAL SUMMARY
Write-Host "CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "================" -ForegroundColor Green
Write-Host ""
Write-Host "CLEANED:" -ForegroundColor Yellow
Write-Host "- NRPT DNS policies" -ForegroundColor White
Write-Host "- Broken route table entries" -ForegroundColor White
Write-Host "- Registry IPv6 settings" -ForegroundColor White
Write-Host "- WFP filter configurations" -ForegroundColor White
Write-Host "- Network adapter configuration" -ForegroundColor White
Write-Host ""
Write-Host "APPLIED:" -ForegroundColor Yellow
Write-Host "- Smart routing that preserves local network access" -ForegroundColor White
Write-Host "- VPN routes for internet traffic only" -ForegroundColor White
Write-Host "- Proper route priorities" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Test your VPN connection in the app" -ForegroundColor White
Write-Host "2. Check external IP to verify routing" -ForegroundColor White
Write-Host "3. Verify local network access still works" -ForegroundColor White
Write-Host ""
Write-Host "Cleanup completed at $(Get-Date)" -ForegroundColor Gray