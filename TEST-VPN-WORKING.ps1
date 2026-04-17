# Quick tunnel verification script
Write-Host "Testing if VPN tunnel is now working..." -ForegroundColor Green

$beforeIP = "99.247.207.59"
try {
    $currentIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-Host "Current IP: $currentIP" -ForegroundColor Cyan
    
    if ($currentIP -eq $beforeIP) {
        Write-Host "❌ Still using ISP connection - VPN not active" -ForegroundColor Red
    } else {
        Write-Host "✅ SUCCESS! VPN tunnel is working" -ForegroundColor Green
        Write-Host "Your traffic is now going through VPN server" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Internet test failed" -ForegroundColor Red
}

# Test VPN server connectivity
Write-Host ""
Write-Host "Testing VPN server connectivity..." -ForegroundColor Cyan
$result = Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet
if ($result) {
    Write-Host "✅ VPN server 10.0.0.1 is reachable" -ForegroundColor Green
} else {
    Write-Host "❌ Cannot reach VPN server" -ForegroundColor Red
}