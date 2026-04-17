#!/usr/bin/env pwsh
# Monitor VPN Connection Attempt - Run this while clicking Connect in the app

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  VPN CONNECTION MONITOR" -ForegroundColor Cyan  
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Click 'Connect' in the app now and watch for changes..." -ForegroundColor Yellow

$previousAdapters = @()
$previousServices = @()
$interval = 2  # Check every 2 seconds
$maxChecks = 30  # Monitor for 1 minute

for ($i = 1; $i -le $maxChecks; $i++) {
    Write-Host "`n[$i/$maxChecks] Checking at $(Get-Date -Format 'HH:mm:ss')..."
    
    # Check for new network adapters
    $currentAdapters = Get-NetAdapter | Where-Object {$_.Name -like "*wireguard*" -or $_.Name -like "*nebula*" -or $_.InterfaceDescription -like "*wireguard*"}
    if ($currentAdapters -and $currentAdapters.Count -ne $previousAdapters.Count) {
        Write-Host "  [CHANGE] New VPN adapter detected:" -ForegroundColor Green
        $currentAdapters | Format-Table Name,Status,InterfaceDescription
    }
    $previousAdapters = $currentAdapters
    
    # Check for new services  
    $currentServices = Get-Service | Where-Object {$_.Name -like "*tunnel*" -or $_.Name -like "*wireguard*"}
    $newServices = $currentServices | Where-Object {$_.Status -eq "Running" -and $_.Name -notin $previousServices.Name}
    if ($newServices) {
        Write-Host "  [CHANGE] New VPN service started:" -ForegroundColor Green
        $newServices | Format-Table Name,Status,DisplayName
    }
    $previousServices = $currentServices
    
    # Quick connectivity test
    if ($i % 5 -eq 0) {  # Every 10 seconds
        try {
            $ip = (Invoke-RestMethod -Uri "http://httpbin.org/ip" -TimeoutSec 3).origin
            Write-Host "  [IP] Current public IP: $ip" -ForegroundColor Cyan
        } catch {
            Write-Host "  [IP] Connection test failed" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds $interval
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "Monitoring complete. Run .\QUICK-VPN-STATUS-CHECK.ps1 to verify final state." -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan