# CLEANUP-AGGRESSIVE-ROUTES.ps1
# Clean up aggressive WireGuard routes and restart with resilient configuration

Write-Host "🔧 Cleaning Up Aggressive WireGuard Routes" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check for Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  Administrator privileges required!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "✅ Administrator privileges confirmed" -ForegroundColor Green
Write-Host ""

# Remove aggressive full tunnel routes
Write-Host "🗑️  Removing aggressive routing..." -ForegroundColor Yellow

$aggressiveRoutes = @(
    "0.0.0.0 mask 128.0.0.0",
    "128.0.0.0 mask 128.0.0.0"
)

foreach ($route in $aggressiveRoutes) {
    try {
        $result = route delete $route 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Removed: $route" -ForegroundColor Green
        } else {
            Write-Host "  ➖ Not found: $route" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ➖ Not found: $route" -ForegroundColor Gray
    }
}

Write-Host ""

# Show current WireGuard interface status
Write-Host "📊 Current VPN Status:" -ForegroundColor Yellow

try {
    $wgInterface = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" }
    if ($wgInterface) {
        Write-Host "  ✅ VPN Interface: $($wgInterface.Name) (Status: $($wgInterface.Status))" -ForegroundColor Green
        
        # Get IP address
        $wgIP = Get-NetIPAddress -InterfaceAlias $wgInterface.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($wgIP) {
            Write-Host "  📍 VPN IP: $($wgIP.IPAddress)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  ❌ No WireGuard interface found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  Could not check interface status" -ForegroundColor Yellow
}

Write-Host ""

# Test current connectivity
Write-Host "🌐 Testing connectivity..." -ForegroundColor Yellow

try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10
    Write-Host "  ✅ Internet: Working (IP: $ip)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Internet: Failed" -ForegroundColor Red
}

try {
    Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet | Out-Null
    if ($?) {
        Write-Host "  ✅ Local Network: Working" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Local Network: Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  Local Network: Could not test" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. The VPN tunnel code has been updated for resilient routing" -ForegroundColor White
Write-Host "2. Reconnect VPN in the app to apply new routing" -ForegroundColor White
Write-Host "3. New config will preserve WiFi while securing DNS" -ForegroundColor White
Write-Host ""

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "Your VPN will now use resilient split tunneling instead of aggressive full tunneling." -ForegroundColor Cyan