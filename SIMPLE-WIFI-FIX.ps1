# WiFi Unblock Fix - Simple Version
Write-Host "WiFi Unblock Diagnostic" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Yellow

# Check for VPN processes
$vpnProcesses = Get-Process | Where-Object { $_.ProcessName -match "nebula" -or $_.ProcessName -match "wireguard" }
if ($vpnProcesses) {
    Write-Host ""
    Write-Host "VPN processes found:" -ForegroundColor Green
    $vpnProcesses | Select-Object ProcessName, Id | Format-Table
} else {
    Write-Host "No VPN processes running" -ForegroundColor Yellow
}

# Test connectivity
Write-Host ""
Write-Host "Testing connectivity..." -ForegroundColor Cyan

# Test internet
try {
    $internet = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet
    if ($internet) {
        Write-Host "Internet: OK" -ForegroundColor Green
    } else {
        Write-Host "Internet: BLOCKED" -ForegroundColor Red
    }
} catch {
    Write-Host "Internet: FAILED" -ForegroundColor Red
}

# Test local gateway
$gateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1")
$gatewayWorking = $false
foreach ($gw in $gateways) {
    try {
        $result = Test-Connection -ComputerName $gw -Count 1 -Quiet
        if ($result) {
            Write-Host "Local gateway $gw works" -ForegroundColor Green
            $gatewayWorking = $true
            break
        }
    } catch { }
}

if (-not $gatewayWorking) {
    Write-Host "Local network: BLOCKED" -ForegroundColor Red
}

Write-Host ""
Write-Host "SOLUTIONS:" -ForegroundColor Blue
Write-Host "=========" -ForegroundColor Yellow

if ($vpnProcesses -and -not $gatewayWorking) {
    Write-Host ""
    Write-Host "ISSUE: VPN is blocking WiFi access" -ForegroundColor Red
    Write-Host ""
    Write-Host "IMMEDIATE FIX:" -ForegroundColor Green  
    Write-Host "1. Open Nebula VPN app" -ForegroundColor White
    Write-Host "2. Click Disconnect" -ForegroundColor White
    Write-Host "3. Wait 10 seconds" -ForegroundColor White
    Write-Host "4. Test: ping 8.8.8.8" -ForegroundColor White
    Write-Host ""
    Write-Host "PERMANENT SOLUTION:" -ForegroundColor Green
    Write-Host "Before reconnecting VPN:" -ForegroundColor Yellow
    Write-Host "1. Run as Admin: .\SETUP-SPLIT-TUNNELING.ps1" -ForegroundColor White
    Write-Host "2. Then reconnect VPN" -ForegroundColor White
    Write-Host "3. VPN + WiFi will both work" -ForegroundColor White
} else {
    Write-Host "WiFi appears to be working normally" -ForegroundColor Green
    Write-Host "To prevent future blocking, run split tunneling setup" -ForegroundColor Yellow
}

Write-Host ""