# QUICK-WIREGUARD-CHECK.ps1
# Simple WireGuard configuration checker

Write-Host "🔍 WireGuard Configuration Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check vpn-tunnel.js configuration
Write-Host ""
Write-Host "📱 Checking Client Configuration..." -ForegroundColor Yellow

$vpnTunnelPath = ".\electron\vpn-tunnel.js"
if (Test-Path $vpnTunnelPath) {
    $content = Get-Content $vpnTunnelPath -Raw
    
    if ($content -match 'this\.FORCE_DEV_MODE\s*=\s*false') {
        Write-Host "✅ FORCE_DEV_MODE: false (PRODUCTION MODE)" -ForegroundColor Green
    } elseif ($content -match 'this\.FORCE_DEV_MODE\s*=.*NODE_ENV.*development') {
        Write-Host "⚠️  FORCE_DEV_MODE: Development bypass mode" -ForegroundColor Yellow
        Write-Host "   Need to set: this.FORCE_DEV_MODE = false;" -ForegroundColor White
    } else {
        Write-Host "❓ Could not determine FORCE_DEV_MODE setting" -ForegroundColor Red
    }
} else {
    Write-Host "❌ vpn-tunnel.js not found!" -ForegroundColor Red
}

# Check server .env configuration
Write-Host ""
Write-Host "🖥️  Checking Server Configuration..." -ForegroundColor Yellow

$envPath = ".\server\.env"
if (Test-Path $envPath) {
    $envLines = Get-Content $envPath
    
    foreach ($line in $envLines) {
        if ($line -match '^ALLOW_INSECURE_WG_DEV=(.*)$') {
            if ($matches[1] -eq 'false') {
                Write-Host "✅ ALLOW_INSECURE_WG_DEV: false (Production)" -ForegroundColor Green
            } else {
                Write-Host "⚠️  ALLOW_INSECURE_WG_DEV: true (Development)" -ForegroundColor Yellow
            }
        }
        if ($line -match '^WG_SERVER_PUBLIC_KEY=(.+)$') {
            $key = $matches[1]
            $shortKey = $key.Substring(0, [Math]::Min(20, $key.Length)) + "..."
            Write-Host "✅ WG_SERVER_PUBLIC_KEY: $shortKey" -ForegroundColor Green
        }
        if ($line -match '^WG_SERVER_ENDPOINT=(.+)$') {
            Write-Host "✅ WG_SERVER_ENDPOINT: $($matches[1])" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ server/.env not found!" -ForegroundColor Red
}

# Check network connectivity
Write-Host ""
Write-Host "🌐 Testing Network..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://httpbin.org/ip" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $ipInfo = $response.Content | ConvertFrom-Json
        Write-Host "✅ Current Public IP: $($ipInfo.origin)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not check public IP" -ForegroundColor Yellow
}

# Show next steps
Write-Host ""
Write-Host "🚀 Quick Actions:" -ForegroundColor Cyan
Write-Host "1. Setup Production WireGuard: .\SETUP-PRODUCTION-WIREGUARD.ps1" -ForegroundColor White
Write-Host "2. Start App: npm run electron-dev" -ForegroundColor White
Write-Host "3. Test IP: Visit https://whatismyip.com" -ForegroundColor White
Write-Host ""