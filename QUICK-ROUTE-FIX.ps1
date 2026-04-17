# Nebula VPN - Quick Route Fix
# Forces all internet traffic through VPN tunnel to stop IP leaks

Write-Host "=== NEBULA VPN - QUICK ROUTE FIX ===" -ForegroundColor Green
Write-Host "Forcing all internet traffic through VPN tunnel..." -ForegroundColor Yellow

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell → 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { 
    $_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*Nebula*" 
} | Where-Object { $_.Status -eq "Up" }

if (-not $vpnAdapter) {
    Write-Host "[ERROR] No active VPN adapter found!" -ForegroundColor Red
    Write-Host "Make sure VPN is connected first." -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] VPN Adapter: $($vpnAdapter.Name)" -ForegroundColor Green
$interfaceIndex = $vpnAdapter.InterfaceIndex

# Get VPN IP
$vpnIP = Get-NetIPAddress -InterfaceIndex $interfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
if ($vpnIP) {
    Write-Host "[OK] VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] No IP assigned to VPN adapter" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Adding VPN routes to force traffic through tunnel..." -ForegroundColor Yellow

# Remove any existing conflicting routes
Write-Host "  Removing old routes..." -ForegroundColor Gray
cmd /c "route delete 0.0.0.0 mask 128.0.0.0" 2>$null
cmd /c "route delete 128.0.0.0 mask 128.0.0.0" 2>$null

# Add split default routes (covers all internet traffic)
Write-Host "  Adding 0.0.0.0/1 route..." -ForegroundColor Gray
$result1 = cmd /c "route add 0.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex" 2>&1

Write-Host "  Adding 128.0.0.0/1 route..." -ForegroundColor Gray  
$result2 = cmd /c "route add 128.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex" 2>&1

# Check results
if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] VPN routes added!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Route issues may exist:" -ForegroundColor Yellow
    Write-Host "  Result 1: $result1" -ForegroundColor Gray
    Write-Host "  Result 2: $result2" -ForegroundColor Gray
}

# Flush DNS to clear cached lookups
Write-Host "  Flushing DNS cache..." -ForegroundColor Gray
cmd /c "ipconfig /flushdns" >$null

Write-Host ""
Write-Host "=== TESTING VPN TUNNEL ===" -ForegroundColor Cyan

# Wait for routes to take effect
Start-Sleep -Seconds 2

# Test external IP
Write-Host "Checking if IP leak is fixed..." -ForegroundColor Yellow
try {
    $newIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "[RESULT] External IP: $newIP" -ForegroundColor Cyan
    
    # Try to get location
    try {
        $location = Invoke-RestMethod -Uri "http://ip-api.com/json/$newIP" -TimeoutSec 5
        Write-Host "[LOCATION] $($location.city), $($location.region), $($location.country)" -ForegroundColor Cyan
        Write-Host "[ISP] $($location.isp)" -ForegroundColor Cyan
    } catch {
        Write-Host "[LOCATION] Could not determine location" -ForegroundColor Gray
    }
    
    Write-Host ""
    if ($newIP -ne "99.247.207.59") {
        Write-Host "🎉 SUCCESS! IP leak fixed - you're now using VPN IP!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: Still showing original IP - routes may need time" -ForegroundColor Yellow
        Write-Host "Try disconnecting and reconnecting VPN if issue persists" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "[ERROR] Could not check external IP: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This may indicate DNS or connectivity issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== VERIFICATION COMMANDS ===" -ForegroundColor Cyan
Write-Host "Run these to verify routing:" -ForegroundColor White
Write-Host "  route print 0.0.0.0" -ForegroundColor Gray
Write-Host "  .\TEST-VPN-TUNNEL.ps1" -ForegroundColor Gray

Write-Host ""
Write-Host "Route fix complete! ✅" -ForegroundColor Green