#!/usr/bin/env pwsh
# Simple VPN Route Fix - Run as Administrator before connecting

$ErrorActionPreference = "Continue"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  SIMPLE VPN ROUTE FIX" -ForegroundColor Cyan  
Write-Host "===========================================" -ForegroundColor Cyan

if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[X] This script must be run as Administrator!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n[1] Detecting physical gateway..." -ForegroundColor Yellow
$gateway = $null

# Method 1: PowerShell route detection
try {
    $route = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Sort-Object RouteMetric | Select-Object -First 1
    if ($route) {
        $gateway = $route.NextHop
        Write-Host "  [OK] Gateway via PowerShell: $gateway" -ForegroundColor Green
    }
} catch { }

# Method 2: Route table parsing if PowerShell failed
if (-not $gateway -or $gateway -eq "0.0.0.0") {
    try {
        $routeOutput = route print | Select-String "0\.0\.0\.0.*0\.0\.0\.0"
        if ($routeOutput) {
            $parts = $routeOutput.Line -split '\s+' | Where-Object { $_ -ne '' }
            $gateway = $parts[2] 
            Write-Host "  [OK] Gateway via route table: $gateway" -ForegroundColor Green
        }
    } catch { }
}

# Method 3: Common gateway test
if (-not $gateway -or $gateway -eq "0.0.0.0") {
    $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "172.16.0.1")
    foreach ($testGW in $commonGateways) {
        if (Test-NetConnection -ComputerName $testGW -Port 80 -InformationLevel Quiet -WarningAction SilentlyContinue) {
            $gateway = $testGW
            Write-Host "  [OK] Gateway via ping test: $gateway" -ForegroundColor Green
            break
        }
    }
}

if (-not $gateway -or $gateway -eq "0.0.0.0") {
    Write-Host "  [X] Could not detect gateway - manual entry required" -ForegroundColor Red
    $gateway = Read-Host "Enter your router IP (usually 192.168.1.1)"
}

Write-Host "`n[2] Preparing local network routes..." -ForegroundColor Yellow

# Get WiFi interface
$wifiAdapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.interfaceDescription -like "*wireless*"} | Select-Object -First 1
if (-not $wifiAdapter) {
    $wifiAdapter = Get-NetAdapter | Where-Object {$_.Status -eq "Up" -and $_.Name -eq "Wi-Fi"} | Select-Object -First 1
}

if ($wifiAdapter) {
    Write-Host "  [OK] WiFi interface: $($wifiAdapter.Name)" -ForegroundColor Green
    
    # Pre-configure essential local routes
    $localNetworks = @(
        "$($gateway -replace '\.\d+$', '.0')/24",  # Local subnet
        "169.254.0.0/16",    # Link-local
        "224.0.0.0/4"        # Multicast
    )
    
    foreach ($network in $localNetworks) {
        try {
            $existingRoute = Get-NetRoute -DestinationPrefix $network -ErrorAction SilentlyContinue
            if (-not $existingRoute) {
                New-NetRoute -DestinationPrefix $network -NextHop $gateway -InterfaceAlias $wifiAdapter.Name -PolicyStore ActiveStore -ErrorAction SilentlyContinue | Out-Null
                Write-Host "  [+] Added route: $network via $gateway" -ForegroundColor Green
            } else {
                Write-Host "  [*] Route exists: $network" -ForegroundColor Gray
            }
        } catch {
            Write-Host "  [~] Could not add route: $network" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  [X] No WiFi adapter found" -ForegroundColor Red
}

Write-Host "`n[3] System optimization..." -ForegroundColor Yellow

# Flush DNS cache
ipconfig /flushdns | Out-Null
Write-Host "  [+] DNS cache flushed" -ForegroundColor Green

# Reset network stack
netsh int ip reset | Out-Null
Write-Host "  [+] IP stack reset" -ForegroundColor Green

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Route preparation complete!" -ForegroundColor Green
Write-Host "Now try connecting to VPN in the app." -ForegroundColor White 
Write-Host "===========================================" -ForegroundColor Cyan