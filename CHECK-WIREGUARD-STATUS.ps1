# CHECK-WIREGUARD-STATUS.ps1
# Simple WireGuard production configuration checker

Write-Host "🔍 WireGuard Configuration Status" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Client Configuration
Write-Host "📱 Client Configuration (vpn-tunnel.js)" -ForegroundColor Yellow
$vpnTunnelPath = "electron\vpn-tunnel.js"
if (Test-Path $vpnTunnelPath) {
    $content = Get-Content $vpnTunnelPath -Raw
    
    if ($content -match 'FORCE_DEV_MODE\s*=\s*false') {
        Write-Host "✅ PRODUCTION MODE: Real WireGuard tunnels enabled" -ForegroundColor Green
    } elseif ($content -match 'FORCE_DEV_MODE.*development') {
        Write-Host "⚠️  DEVELOPMENT MODE: WireGuard bypassed" -ForegroundColor Yellow
        Write-Host "   To fix: Set FORCE_DEV_MODE = false" -ForegroundColor White
    } else {
        Write-Host "❓ Unknown configuration" -ForegroundColor Red
    }
} else {
    Write-Host "❌ vpn-tunnel.js not found" -ForegroundColor Red
}

Write-Host ""

# Check Server Configuration  
Write-Host "🖥️  Server Configuration (.env)" -ForegroundColor Yellow
$envPath = "server\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    
    foreach ($line in $envContent) {
        if ($line -match '^ALLOW_INSECURE_WG_DEV=(.*)') {
            $value = $matches[1]
            if ($value -eq 'false') {
                Write-Host "✅ ALLOW_INSECURE_WG_DEV: false (Production)" -ForegroundColor Green
            } else {
                Write-Host "⚠️  ALLOW_INSECURE_WG_DEV: true (Development)" -ForegroundColor Yellow
            }
        }
        if ($line -match '^WG_SERVER_PUBLIC_KEY=(.+)') {
            $key = $matches[1]
            if ($key.Length -gt 20) {
                $short = $key.Substring(0, 20) + "..."
            } else {
                $short = $key
            }
            Write-Host "✅ WG_SERVER_PUBLIC_KEY: $short" -ForegroundColor Green
        }
        if ($line -match '^WG_SERVER_ENDPOINT=(.+)') {
            Write-Host "✅ WG_SERVER_ENDPOINT: $($matches[1])" -ForegroundColor Green
        }
        if ($line -match '^WG_DNS=(.+)') {
            Write-Host "✅ WG_DNS: $($matches[1])" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ server/.env not found" -ForegroundColor Red
}

Write-Host ""

# Check Network
Write-Host "🌐 Network Status" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://httpbin.org/ip" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $ipInfo = $response.Content | ConvertFrom-Json
    Write-Host "✅ Current Public IP: $($ipInfo.origin)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not check public IP" -ForegroundColor Yellow
}

Write-Host ""

# Next Steps
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start app: npm run electron-dev" -ForegroundColor White
Write-Host "2. Test connection in the VPN app" -ForegroundColor White
Write-Host "3. Verify IP at whatismyip.com" -ForegroundColor White
Write-Host "4. Test DNS at dnsleaktest.com" -ForegroundColor White
Write-Host ""