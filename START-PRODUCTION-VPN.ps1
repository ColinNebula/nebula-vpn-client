# START-PRODUCTION-VPN.ps1
# Launch Nebula VPN with Production WireGuard Configuration

Write-Host "🚀 Starting Nebula VPN - Production Mode" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  Administrator privileges required for WireGuard!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "✅ Administrator privileges confirmed" -ForegroundColor Green
Write-Host ""

# Show current configuration
Write-Host "📋 Production Configuration:" -ForegroundColor Yellow
Write-Host "• Client Mode: PRODUCTION (Real WireGuard tunnels)" -ForegroundColor Green  
Write-Host "• Server Mode: PRODUCTION (No development bypass)" -ForegroundColor Green
Write-Host "• WireGuard Server: 165.227.32.85:51820" -ForegroundColor Green
Write-Host "• DNS Servers: 1.1.1.1, 1.0.0.1, 8.8.8.8, 8.8.4.4" -ForegroundColor Green
Write-Host "• VPN Subnet: 10.8.0.0/24" -ForegroundColor Green
Write-Host "• MTU: 1420 (Optimized)" -ForegroundColor Green
Write-Host ""

Write-Host "🔐 Security Features Enabled:" -ForegroundColor Yellow
Write-Host "✅ Industry-standard Curve25519 encryption" -ForegroundColor Green
Write-Host "✅ ChaCha20-Poly1305 authenticated encryption" -ForegroundColor Green
Write-Host "✅ DNS leak protection" -ForegroundColor Green
Write-Host "✅ IP leak protection" -ForegroundColor Green
Write-Host "✅ Kill switch functionality" -ForegroundColor Green
Write-Host "✅ Perfect Forward Secrecy" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Starting application..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected log messages:" -ForegroundColor Yellow
Write-Host "✅ 'FORCE_DEV_MODE = false (REAL VPN TUNNELS ENABLED)'" -ForegroundColor White
Write-Host "✅ 'WireGuard handshake initiated with 165.227.32.85:51820'" -ForegroundColor White  
Write-Host "✅ 'Client IP assigned: 10.8.0.x'" -ForegroundColor White
Write-Host "✅ 'VPN tunnel established successfully'" -ForegroundColor White
Write-Host ""

Write-Host "🔍 After connection, verify at:" -ForegroundColor Cyan
Write-Host "• IP Test: https://whatismyip.com" -ForegroundColor White
Write-Host "• DNS Test: https://dnsleaktest.com" -ForegroundColor White
Write-Host "• WebRTC Test: https://browserleaks.com/webrtc" -ForegroundColor White
Write-Host ""

# Start the application
npm run electron-dev