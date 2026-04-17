#!/usr/bin/env pwsh
# Quick VPN Status Check - Run this after connecting to verify tunnel

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  QUICK VPN STATUS CHECK" -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan

# Check VPN Interface
Write-Host "`n[1] Checking VPN Interface..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*nebula*"}
if ($vpnAdapter) {
    Write-Host "  [PASS] VPN Interface: $($vpnAdapter.Name) - $($vpnAdapter.Status)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] No VPN interface found" -ForegroundColor Red
}

# Check Public IP quickly
Write-Host "`n[2] Checking Public IP..." -ForegroundColor Yellow
try {
    $ip = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    Write-Host "  [INFO] Current IP: $ip" -ForegroundColor Cyan
    
    # Check if this looks like a VPN IP (different from 99.247.207.59)
    if ($ip -ne "99.247.207.59") {
        Write-Host "  [PASS] IP has changed from original - likely using VPN" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Still showing original IP - VPN may not be routing traffic" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAIL] Could not retrieve IP: $($_.Exception.Message)" -ForegroundColor Red
}

# Check VPN Routes
Write-Host "`n[3] Checking Default Route..." -ForegroundColor Yellow
$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object -First 1
if ($defaultRoute.InterfaceAlias -like "*nebula*" -or $defaultRoute.InterfaceAlias -like "*wireguard*") {
    Write-Host "  [PASS] Default route via VPN: $($defaultRoute.InterfaceAlias)" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Default route via: $($defaultRoute.InterfaceAlias)" -ForegroundColor Yellow
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Run .\TEST-VPN-TUNNEL.ps1 -Quick for full test" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan