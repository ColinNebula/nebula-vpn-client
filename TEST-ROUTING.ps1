# TEST-ROUTING.ps1
# Test current routing and connectivity status

Write-Host "Current Routing Status Check" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check VPN interface
Write-Host "VPN Interface Status:" -ForegroundColor Yellow
try {
    $wgInterface = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" }
    if ($wgInterface) {
        Write-Host "  Interface: $($wgInterface.Name)" -ForegroundColor Green
        Write-Host "  Status: $($wgInterface.Status)" -ForegroundColor Green
        
        # Get IP address
        $wgIP = Get-NetIPAddress -InterfaceAlias $wgInterface.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($wgIP) {
            Write-Host "  VPN IP: $($wgIP.IPAddress)" -ForegroundColor Green
        }
    } else {
        Write-Host "  No VPN interface found" -ForegroundColor Red
    }
} catch {
    Write-Host "  Could not check interface" -ForegroundColor Yellow
}

Write-Host ""

# Check for aggressive routes
Write-Host "Checking for aggressive routes..." -ForegroundColor Yellow
try {
    $routes = route print | Out-String
    if ($routes -match "0\.0\.0\.0\s+128\.0\.0\.0") {
        Write-Host "  FOUND: Aggressive route 0.0.0.0/1" -ForegroundColor Red
    } else {
        Write-Host "  OK: No aggressive route 0.0.0.0/1" -ForegroundColor Green
    }
    
    if ($routes -match "128\.0\.0\.0\s+128\.0\.0\.0") {
        Write-Host "  FOUND: Aggressive route 128.0.0.0/1" -ForegroundColor Red
    } else {
        Write-Host "  OK: No aggressive route 128.0.0.0/1" -ForegroundColor Green
    }
} catch {
    Write-Host "  Could not check routes" -ForegroundColor Yellow
}

Write-Host ""

# Test connectivity
Write-Host "Connectivity Tests:" -ForegroundColor Yellow

# Internet test
try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10
    Write-Host "  Internet: WORKING (IP: $ip)" -ForegroundColor Green
} catch {
    Write-Host "  Internet: FAILED" -ForegroundColor Red
}

# Local network test
try {
    $ping = Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet
    if ($ping) {
        Write-Host "  Local Network: WORKING" -ForegroundColor Green
    } else {
        Write-Host "  Local Network: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "  Local Network: Could not test" -ForegroundColor Yellow
}

Write-Host ""

if (($routes -match "0\.0\.0\.0\s+128\.0\.0\.0") -or ($routes -match "128\.0\.0\.0\s+128\.0\.0\.0")) {
    Write-Host "ACTION NEEDED:" -ForegroundColor Red
    Write-Host "Aggressive routes found. Run as Administrator:" -ForegroundColor Yellow
    Write-Host "  .\CLEANUP-ROUTES.ps1" -ForegroundColor White
} else {
    Write-Host "STATUS: Clean routing configuration" -ForegroundColor Green
}