#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fix WiFi blocking caused by broken VPN connections

.DESCRIPTION
    Detects and fixes the common issue where VPN interfaces exist 
    but have fallback IP addresses (169.254.x.x), causing WiFi blocking.
    
    This happens when VPN tunnel fails to connect to server but 
    interface remains active with APIPA address.
#>

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  WIFI BLOCKING DIAGNOSTIC AND FIX" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# Check for broken VPN interfaces
$brokenVpnInterfaces = Get-NetAdapter | Where-Object {
    $_.Name -like "*Nebula*" -or 
    $_.InterfaceDescription -like "*WireGuard*"
} | ForEach-Object {
    $adapter = $_
    $ip = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($ip -and $ip.IPAddress -like "169.254.*") {
        return @{
            Name = $adapter.Name
            Index = $adapter.InterfaceIndex  
            IP = $ip.IPAddress
            Status = $adapter.Status
        }
    }
}

if ($brokenVpnInterfaces) {
    Write-Host "[ISSUE DETECTED] Broken VPN interfaces with fallback IPs:" -ForegroundColor Red
    foreach ($iface in $brokenVpnInterfaces) {
        Write-Host "  - $($iface.Name) ($($iface.IP)) - Status: $($iface.Status)" -ForegroundColor Yellow
    }
    
    Write-Host "`n[CAUSE] VPN tunnel failed to connect to server" -ForegroundColor Yellow
    Write-Host "Interface exists but has APIPA fallback IP instead of VPN IP" -ForegroundColor Yellow
    Write-Host "This can cause WiFi blocking and connectivity issues" -ForegroundColor Yellow
    
    Write-Host "`n[SOLUTION] Disconnect the broken VPN connection:" -ForegroundColor Green
    Write-Host "1. Open your VPN application" -ForegroundColor Gray  
    Write-Host "2. Click 'Disconnect' or turn off the connection" -ForegroundColor Gray
    Write-Host "3. Wait for interface to be removed" -ForegroundColor Gray
    Write-Host "4. Test: ping 10.0.0.1 (should work after disconnect)" -ForegroundColor Gray
    
    Write-Host "`n[PREVENTION] To avoid this issue:" -ForegroundColor Cyan
    Write-Host "• Contact your VPN provider about server issues" -ForegroundColor Gray
    Write-Host "• Try different VPN server locations" -ForegroundColor Gray  
    Write-Host "• Use split tunneling configurations" -ForegroundColor Gray
    
} else {
    Write-Host "[STATUS] No broken VPN interfaces detected" -ForegroundColor Green
    
    # Check for any active VPN interfaces
    $activeVpnInterfaces = Get-NetAdapter | Where-Object {
        ($_.Name -like "*Nebula*" -or $_.InterfaceDescription -like "*WireGuard*") -and
        $_.Status -eq "Up"
    }
    
    if ($activeVpnInterfaces) {
        Write-Host "[INFO] Active VPN interfaces found:" -ForegroundColor Yellow
        foreach ($iface in $activeVpnInterfaces) {
            $ip = Get-NetIPAddress -InterfaceIndex $iface.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
            Write-Host "  - $($iface.Name): $($ip.IPAddress)" -ForegroundColor Gray
        }
    } else {
        Write-Host "[STATUS] No VPN interfaces active" -ForegroundColor Gray
    }
}

# Test connectivity
Write-Host "`n================================================================" -ForegroundColor Cyan  
Write-Host "  CONNECTIVITY TEST" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

Write-Host "`nTesting WiFi access:"
$wifiTest = Test-Connection 10.0.0.1 -Count 1 -Quiet -ErrorAction SilentlyContinue
if (-not $wifiTest) {
    # Try other common router IPs
    $commonRouters = @("192.168.1.1", "192.168.0.1", "172.16.0.1")
    foreach ($router in $commonRouters) {
        $routerTest = Test-Connection $router -Count 1 -Quiet -ErrorAction SilentlyContinue
        if ($routerTest) {
            Write-Host "  ✅ WiFi router accessible ($router)" -ForegroundColor Green
            $wifiTest = $true
            break
        }
    }
}

if ($wifiTest) {
    Write-Host "  ✅ WiFi router accessible" -ForegroundColor Green
} else {
    Write-Host "  ❌ WiFi router not accessible - may be blocked" -ForegroundColor Red
    
    # Enhanced diagnostics for WiFi blocking
    Write-Host "`n  [DIAGNOSIS] Checking routing table..." -ForegroundColor Yellow
    $defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
    foreach ($route in $defaultRoutes) {
        $adapter = Get-NetAdapter -InterfaceIndex $route.ifIndex -ErrorAction SilentlyContinue
        if ($adapter) {
            $metric = $route.RouteMetric
            $isVPN = $adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*"
            $status = if ($isVPN) { "[VPN]" } else { "[Physical]" }
            Write-Host "    $status $($adapter.Name): $($route.NextHop) (metric: $metric)" -ForegroundColor Gray
        }
    }
}

Write-Host "`nTesting internet access:"  
$internetTest = Test-Connection 8.8.8.8 -Count 1 -Quiet
if ($internetTest) {
    Write-Host "  ✅ Internet accessible (8.8.8.8)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Internet not accessible - may be blocked" -ForegroundColor Red
}

Write-Host "`n================================================================" -ForegroundColor Cyan
if ($wifiTest -and $internetTest) {
    Write-Host "  RESULT: Connectivity is working normally" -ForegroundColor Green
} elseif ($brokenVpnInterfaces) {
    Write-Host "  RESULT: WiFi blocking detected - disconnect VPN to fix" -ForegroundColor Red
} else {
    Write-Host "  RESULT: Connectivity issues detected" -ForegroundColor Yellow
    
    # Offer to run route fix if detected issues
    if (-not $wifiTest -and $internetTest) {
        Write-Host "`n[AUTO-FIX AVAILABLE] WiFi blocked but internet works" -ForegroundColor Cyan
        Write-Host "This suggests routing issues. Would you like to:" -ForegroundColor Yellow
        Write-Host "  1. Run automatic route fix (recommended)" -ForegroundColor White
        Write-Host "  2. Manual troubleshooting" -ForegroundColor White
        
        $choice = Read-Host "`nEnter choice (1 or 2)"
        if ($choice -eq "1") {
            Write-Host "`n[AUTO-FIX] Running route fix..." -ForegroundColor Green
            try {
                # Check if we're running as admin
                $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
                
                if ($isAdmin) {
                    # Run the route fix script
                    & "$PSScriptRoot\FIX-VPN-ROUTES-NOW.ps1"
                } else {
                    Write-Host "[INFO] Route fix requires administrator privileges" -ForegroundColor Yellow
                    Write-Host "Starting elevated PowerShell to run fix..." -ForegroundColor Gray
                    
                    $scriptPath = Join-Path $PSScriptRoot "FIX-VPN-ROUTES-NOW.ps1"
                    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`""
                    Write-Host "Check the new PowerShell window for results." -ForegroundColor Green
                }
            } catch {
                Write-Host "[ERROR] Failed to run route fix: $_" -ForegroundColor Red
                Write-Host "Please run manually: .\FIX-VPN-ROUTES-NOW.ps1" -ForegroundColor Yellow
            }
        }
    }
}
Write-Host "================================================================`n" -ForegroundColor Cyan