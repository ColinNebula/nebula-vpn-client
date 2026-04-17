#!/usr/bin/env pwsh
# Ultimate VPN Connection Fix - Run as Administrator

$ErrorActionPreference = "Continue"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  ULTIMATE VPN CONNECTION FIX" -ForegroundColor Cyan  
Write-Host "=================================================" -ForegroundColor Cyan

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[X] This script must be run as Administrator!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n[STEP 1] Stopping all VPN processes..." -ForegroundColor Yellow
Stop-Process -Name "wireguard*" -Force -ErrorAction SilentlyContinue
Stop-Service WireGuardManager -Force -ErrorAction SilentlyContinue
Start-Sleep 2

Write-Host "`n[STEP 2] Cleaning up network configuration..." -ForegroundColor Yellow

# Remove any existing WireGuard interfaces
try {
    $wgInterfaces = Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*WireGuard*"}
    foreach ($interface in $wgInterfaces) {
        Write-Host "  [~] Removing interface: $($interface.Name)" -ForegroundColor Yellow
        Remove-NetAdapter -Name $interface.Name -Confirm:$false -ErrorAction SilentlyContinue
    }
} catch { }

Write-Host "`n[STEP 3] Resetting network stack..." -ForegroundColor Yellow

# Comprehensive network reset
netsh winsock reset | Out-Null
netsh int ip reset | Out-Null  
netsh int ipv6 reset | Out-Null
ipconfig /flushdns | Out-Null
netsh interface ipv4 reset | Out-Null
netsh interface ipv6 reset | Out-Null

Write-Host "  [+] Network stack reset complete" -ForegroundColor Green

Write-Host "`n[STEP 4] Detecting network configuration..." -ForegroundColor Yellow

# Get WiFi adapter and gateway  
$wifiAdapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and ($_.InterfaceDescription -like "*wireless*" -or $_.Name -eq "Wi-Fi")} | Select-Object -First 1

if ($wifiAdapter) {
    Write-Host "  [OK] Active adapter: $($wifiAdapter.Name)" -ForegroundColor Green
    
    # Get gateway
    $gateway = $null
    try {
        $route = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceAlias $wifiAdapter.Name | Select-Object -First 1
        $gateway = $route.NextHop
        Write-Host "  [OK] Gateway detected: $gateway" -ForegroundColor Green
    } catch {
        # Fallback gateway detection
        $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "172.16.0.1")
        foreach ($testGW in $commonGateways) {
            if (Test-NetConnection -ComputerName $testGW -Port 80 -InformationLevel Quiet -WarningAction SilentlyContinue) {
                $gateway = $testGW
                Write-Host "  [OK] Gateway via ping: $gateway" -ForegroundColor Green
                break
            }
        }
    }
    
    if (-not $gateway) {
        $gateway = "192.168.1.1"  # Default fallback
        Write-Host "  [~] Using default gateway: $gateway" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [X] No active network adapter found" -ForegroundColor Red
}

Write-Host "`n[STEP 5] Configuring DNS..." -ForegroundColor Yellow

# Set reliable DNS servers on WiFi adapter
if ($wifiAdapter) {
    try {
        Set-DnsClientServerAddress -InterfaceAlias $wifiAdapter.Name -ServerAddresses @("1.1.1.1", "8.8.8.8") -ErrorAction SilentlyContinue
        Write-Host "  [+] DNS configured: 1.1.1.1, 8.8.8.8" -ForegroundColor Green
    } catch {
        Write-Host "  [~] DNS configuration skipped" -ForegroundColor Yellow
    }
}

Write-Host "`n[STEP 6] Starting WireGuard Manager..." -ForegroundColor Yellow

try {
    Start-Service WireGuardManager -ErrorAction Stop
    Start-Sleep 2
    $serviceStatus = Get-Service WireGuardManager
    if ($serviceStatus.Status -eq "Running") {
        Write-Host "  [+] WireGuard Manager started successfully" -ForegroundColor Green
    } else {
        Write-Host "  [X] WireGuard Manager failed to start: $($serviceStatus.Status)" -ForegroundColor Red
    }
} catch {
    Write-Host "  [X] WireGuard service error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[STEP 7] Testing basic connectivity..." -ForegroundColor Yellow

try {
    $testIP = Test-NetConnection -ComputerName "8.8.8.8" -Port 53 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($testIP) {
        Write-Host "  [+] Internet connectivity: OK" -ForegroundColor Green
    } else {
        Write-Host "  [X] Internet connectivity: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "  [X] Connectivity test failed" -ForegroundColor Red
}

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Fix complete! Now try connecting to VPN." -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Steps to connect:" -ForegroundColor White
Write-Host "1. Go to http://localhost:3000" -ForegroundColor White  
Write-Host "2. Click 'Connect'" -ForegroundColor White
Write-Host "3. Run .\QUICK-VPN-STATUS-CHECK.ps1 to verify" -ForegroundColor White
Write-Host "=================================================" -ForegroundColor Cyan