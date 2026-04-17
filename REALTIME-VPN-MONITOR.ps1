#!/usr/bin/env pwsh
# Real-Time VPN Connection Monitor - Watch for Actual Interface Creation

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  REAL-TIME VPN CONNECTION MONITOR" -ForegroundColor Cyan  
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Go to http://localhost:3000 and click 'Connect'" -ForegroundColor Yellow
Write-Host "Watching for REAL VPN interface creation..." -ForegroundColor White

$startTime = Get-Date
$maxDuration = 120  # 2 minutes
$checkInterval = 1  # Check every second

do {
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
    Write-Host "`r[$([int]$elapsed)s] Checking..." -NoNewline
    
    # Check for actual WireGuard interfaces
    $vpnInterface = Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*WireGuard*" -and $_.Status -eq "Up"}
    
    if ($vpnInterface) {
        Write-Host "`n`n[SUCCESS] VPN Interface Created!" -ForegroundColor Green
        $vpnInterface | Format-Table Name,InterfaceDescription,Status
        
        # Get IP configuration
        Write-Host "Getting IP configuration..." -ForegroundColor Yellow
        Start-Sleep 2
        netsh interface ipv4 show addresses $vpnInterface.Name
        
        # Test connectivity through VPN
        Write-Host "`nTesting connectivity..." -ForegroundColor Yellow
        try {
            $newIP = (Invoke-RestMethod -Uri "http://httpbin.org/ip" -TimeoutSec 10).origin
            Write-Host "New Public IP: $newIP" -ForegroundColor Green
            
            if ($newIP -ne "99.247.207.59") {
                Write-Host "[SUCCESS] IP changed - VPN is working!" -ForegroundColor Green
                Write-Host "`nRun .\TEST-VPN-TUNNEL.ps1 -Quick to verify full security" -ForegroundColor White
            } else {
                Write-Host "[WARNING] IP unchanged - traffic may not be routing through VPN" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[ISSUE] Connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        break
    }
    
    # Check for tunnel services
    $tunnelService = Get-Service | Where-Object {$_.Name -like "*tunnel*" -and $_.Status -eq "Running"}
    if ($tunnelService) {
        Write-Host " [Service: $($tunnelService.Name)]" -NoNewline -ForegroundColor Cyan
    }
    
    Start-Sleep $checkInterval
    
} while ($elapsed -lt $maxDuration)

if ($elapsed -ge $maxDuration) {
    Write-Host "`n`n[TIMEOUT] No VPN interface detected after 2 minutes" -ForegroundColor Red
    Write-Host "Connection may have failed. Check the VPN app for error messages." -ForegroundColor Yellow
}

Write-Host "`n=================================================" -ForegroundColor Cyan