# WG-STATUS.ps1
Write-Host "WireGuard Configuration Check" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Client Configuration:" -ForegroundColor Yellow

$vpnFile = "electron\vpn-tunnel.js"
if (Test-Path $vpnFile) {
    $content = Get-Content $vpnFile -Raw
    if ($content -match 'FORCE_DEV_MODE\s*=\s*false') {
        Write-Host "  Production Mode: ON (Real WireGuard)" -ForegroundColor Green
    } else {
        Write-Host "  Development Mode: ON (Bypass WireGuard)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  vpn-tunnel.js: NOT FOUND" -ForegroundColor Red
}

Write-Host ""
Write-Host "Server Configuration:" -ForegroundColor Yellow

$envFile = "server\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    
    foreach ($line in $envContent) {
        if ($line -match '^ALLOW_INSECURE_WG_DEV=false') {
            Write-Host "  Production Mode: ON" -ForegroundColor Green
        }
        if ($line -match '^WG_SERVER_ENDPOINT=(.+)') {
            Write-Host "  Server: $($matches[1])" -ForegroundColor Green
        }
        if ($line -match '^WG_SERVER_PUBLIC_KEY=(.{20})') {
            Write-Host "  Key: $($matches[1])..." -ForegroundColor Green
        }
    }
} else {
    Write-Host "  .env: NOT FOUND" -ForegroundColor Red
}

Write-Host ""
Write-Host "Network Test:" -ForegroundColor Yellow

try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5
    Write-Host "  Current IP: $ip" -ForegroundColor Green
} catch {
    Write-Host "  Network: FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "Ready to test VPN connection!" -ForegroundColor Cyan