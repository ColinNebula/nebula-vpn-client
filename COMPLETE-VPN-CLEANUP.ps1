#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete VPN Cleanup - Remove all VPN interference

.DESCRIPTION
    Completely removes all VPN processes, services, and configurations
    that might be interfering with WiFi and local network access.
    
    REQUIRES ADMINISTRATOR PRIVILEGES
#>

# Check for administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`nERROR: This script requires administrator privileges" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run:" -ForegroundColor Yellow
    Write-Host "  cd '$PWD'" -ForegroundColor Gray
    Write-Host "  .\COMPLETE-VPN-CLEANUP.ps1" -ForegroundColor Gray
    pause
    exit 1
}

Write-Host "`n================================================================" -ForegroundColor Red
Write-Host "  COMPLETE VPN CLEANUP - REMOVE ALL VPN INTERFERENCE" -ForegroundColor Red  
Write-Host "================================================================`n" -ForegroundColor Red

$cleaned = 0

# 1. Kill all VPN processes
Write-Host "[1] Terminating VPN processes..." -ForegroundColor Yellow
$vpnProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like "*wire*" -or 
    $_.ProcessName -like "*nebula*" -or 
    $_.ProcessName -like "*vpn*" 
}

foreach ($process in $vpnProcesses) {
    try {
        Write-Host "  Killing: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force
        $cleaned++
    } catch {
        Write-Host "  Failed to kill: $($process.ProcessName)" -ForegroundColor Red
    }
}

# 2. Stop all WireGuard services
Write-Host "`n[2] Stopping WireGuard services..." -ForegroundColor Yellow
$services = Get-Service | Where-Object { 
    $_.Name -like "*wire*" -or 
    $_.DisplayName -like "*wire*" -or 
    $_.Name -like "*vpn*" 
}

foreach ($service in $services) {
    try {
        Write-Host "  Stopping: $($service.DisplayName)" -ForegroundColor Gray
        Stop-Service $service.Name -Force -ErrorAction SilentlyContinue
        $cleaned++
    } catch {
        Write-Host "  Failed to stop: $($service.DisplayName)" -ForegroundColor Red
    }
}

# 3. Remove VPN network adapters
Write-Host "`n[3] Removing VPN network adapters..." -ForegroundColor Yellow
$vpnAdapters = Get-NetAdapter -IncludeHidden | Where-Object { 
    $_.InterfaceDescription -like "*wire*" -or 
    $_.Name -like "*vpn*" -or 
    $_.Name -like "*nebula*" 
}

foreach ($adapter in $vpnAdapters) {
    try {
        Write-Host "  Removing: $($adapter.Name)" -ForegroundColor Gray
        Remove-NetAdapter $adapter.Name -Confirm:$false -ErrorAction SilentlyContinue
        $cleaned++
    } catch {
        Write-Host "  Failed to remove: $($adapter.Name)" -ForegroundColor Red
    }
}

# 4. Clear routing table
Write-Host "`n[4] Cleaning routing table..." -ForegroundColor Yellow
try {
    # Remove any VPN-specific routes
    $routes = Get-NetRoute | Where-Object { $_.NextHop -eq "0.0.0.0" -or $_.DestinationPrefix -like "0.0.0.0/1" -or $_.DestinationPrefix -like "128.0.0.0/1" }
    foreach ($route in $routes) {
        Remove-NetRoute -DestinationPrefix $route.DestinationPrefix -Confirm:$false -ErrorAction SilentlyContinue
        $cleaned++
    }
} catch {
    Write-Host "  Route cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Remove VPN firewall rules
Write-Host "`n[5] Removing VPN firewall rules..." -ForegroundColor Yellow
try {
    $firewallRules = Get-NetFirewallRule | Where-Object { 
        $_.DisplayName -like "*VPN*" -or 
        $_.DisplayName -like "*WireGuard*" -or
        $_.DisplayName -like "*Nebula*"
    }
    
    foreach ($rule in $firewallRules) {
        Write-Host "  Removing: $($rule.DisplayName)" -ForegroundColor Gray
        Remove-NetFirewallRule -Name $rule.Name -ErrorAction SilentlyContinue
        $cleaned++
    }
} catch {
    Write-Host "  Firewall cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Reset network stack
Write-Host "`n[6] Resetting network stack..." -ForegroundColor Yellow
try {
    netsh winsock reset | Out-Null
    netsh int ip reset | Out-Null
    ipconfig /flushdns | Out-Null
    Write-Host "  Network stack reset complete" -ForegroundColor Green
    $cleaned++
} catch {
    Write-Host "  Network reset failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Test connectivity
Write-Host "`n[7] Testing connectivity..." -ForegroundColor Yellow
Write-Host "  WiFi Router: " -NoNewline
$ping = Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet
if ($ping) {
    Write-Host "SUCCESS" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red
}

Write-Host "  Internet: " -NoNewline
$ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet  
if ($ping) {
    Write-Host "SUCCESS" -ForegroundColor Green
} else {
    Write-Host "FAILED" -ForegroundColor Red
}

# Summary
Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Items cleaned: $cleaned" -ForegroundColor Green
Write-Host "  WiFi should now work normally without any VPN interference." -ForegroundColor Green
Write-Host "  You may need to restart your computer for full effect." -ForegroundColor Yellow
Write-Host "================================================================`n" -ForegroundColor Green

Write-Host "Press any key to exit..." -ForegroundColor Gray
pause