# Simple VPN Status Check
Write-Host "VPN Status Check" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Yellow

# Check for VPN processes
Write-Host ""
Write-Host "Checking VPN processes..." -ForegroundColor Cyan
$vpnProcs = Get-Process | Where-Object { $_.ProcessName -match "nebula" }
if ($vpnProcs) {
    Write-Host "Found VPN processes:" -ForegroundColor Green
    $vpnProcs | Select-Object ProcessName, Id | Format-Table
} else {
    Write-Host "No VPN processes found" -ForegroundColor Red
}

# Check network interfaces
Write-Host ""
Write-Host "Checking network interfaces..." -ForegroundColor Cyan
try {
    $interfaces = netsh interface show interface
    Write-Host "Network interfaces:"
    Write-Host $interfaces
} catch {
    Write-Host "Could not check interfaces" -ForegroundColor Red
}

# Check current IP
Write-Host ""
Write-Host "Checking current IP..." -ForegroundColor Cyan
try {
    $ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-Host "Current IP: $ip" -ForegroundColor Green
} catch {
    Write-Host "Could not get IP" -ForegroundColor Red
}

# Test basic connectivity
Write-Host ""
Write-Host "Testing connectivity..." -ForegroundColor Cyan
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet
    if ($ping) {
        Write-Host "Internet connectivity: OK" -ForegroundColor Green
    } else {
        Write-Host "Internet connectivity: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "Connectivity test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Check complete" -ForegroundColor Blue