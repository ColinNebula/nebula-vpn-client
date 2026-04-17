# CLEANUP-ROUTES.ps1
# Clean up aggressive WireGuard routes and test connectivity

Write-Host "WireGuard Route Cleanup" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Check for Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Administrator privileges required!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "Administrator privileges confirmed" -ForegroundColor Green
Write-Host ""

# Remove aggressive full tunnel routes
Write-Host "Removing aggressive routing..." -ForegroundColor Yellow

$aggressiveRoutes = @(
    "0.0.0.0 mask 128.0.0.0",
    "128.0.0.0 mask 128.0.0.0"
)

foreach ($route in $aggressiveRoutes) {
    try {
        route delete $route 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Removed: $route" -ForegroundColor Green
        } else {
            Write-Host "  Not found: $route" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  Not found: $route" -ForegroundColor Gray
    }
}

Write-Host ""

# Test connectivity
Write-Host "Testing connectivity..." -ForegroundColor Yellow

try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10
    Write-Host "  Internet: Working (IP: $ip)" -ForegroundColor Green
} catch {
    Write-Host "  Internet: Failed" -ForegroundColor Red
}

try {
    Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet | Out-Null
    if ($?) {
        Write-Host "  Local Network: Working" -ForegroundColor Green
    } else {
        Write-Host "  Local Network: Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  Local Network: Could not test" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. VPN code updated for resilient routing" -ForegroundColor White
Write-Host "2. Reconnect VPN to apply new configuration" -ForegroundColor White
Write-Host "3. New setup preserves WiFi + secures DNS" -ForegroundColor White
Write-Host ""