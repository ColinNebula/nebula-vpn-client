Write-Host "QUICK VPN VERIFICATION TEST" -ForegroundColor Green
Write-Host "After switching VPN servers, run this:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Test 1 - VPN Gateway:" -ForegroundColor Cyan
ping 10.8.0.1 -n 2

Write-Host ""
Write-Host "Test 2 - Check Your IP:" -ForegroundColor Cyan
try {
    $currentIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
    Write-Host "Your current IP: $currentIP" -ForegroundColor White
    
    if ($currentIP -eq "99.247.207.59") {
        Write-Host "❌ STILL USING REAL IP - Try different VPN server!" -ForegroundColor Red
    } else {
        Write-Host "✅ VPN IP DETECTED - Server switch worked!" -ForegroundColor Green
        Write-Host "Now run: .\TEST-ROUTING-FIX.ps1" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Internet test failed - try different server" -ForegroundColor Red
}

Write-Host ""
Write-Host "Expected after successful server switch:" -ForegroundColor Yellow
Write-Host "• Gateway ping should respond (may be different IP like 10.6.0.1)" -ForegroundColor White
Write-Host "• Your IP should change from 99.247.207.59" -ForegroundColor White