# Simple VPN Route Fix Script
# Fixes routing issues to ensure internet traffic goes through VPN tunnel

Write-Host "=== NEBULA VPN - SIMPLE ROUTE FIX ===" -ForegroundColor Cyan

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*Nebula*" }
if (-not $vpnAdapter) {
    Write-Host "[ERROR] No VPN adapter found. Is VPN connected?" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] VPN adapter: $($vpnAdapter.Name)" -ForegroundColor Green
$interfaceIndex = $vpnAdapter.InterfaceIndex

# Add split default routes to force traffic through VPN
Write-Host "[FIX] Adding VPN routes..." -ForegroundColor Yellow

# Remove any existing routes first
cmd /c "route delete 0.0.0.0 mask 128.0.0.0" 2>$null
cmd /c "route delete 128.0.0.0 mask 128.0.0.0" 2>$null

# Add split routes (0.0.0.0/1 + 128.0.0.0/1 = full internet)
$route1 = cmd /c "route add 0.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex" 2>&1
$route2 = cmd /c "route add 128.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] VPN routes added successfully" -ForegroundColor Green
} else {
    Write-Host "[WARN] Route issues: $route1 $route2" -ForegroundColor Yellow
}

# Flush DNS
cmd /c "ipconfig /flushdns" >$null

# Quick connectivity test
Write-Host "[TEST] Checking VPN connectivity..." -ForegroundColor Yellow
try {
    $newIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content
    Write-Host "[SUCCESS] VPN is working! External IP: $newIP" -ForegroundColor Green
    
    # Test a few common sites
    $sites = @("google.com", "cloudflare.com", "github.com")
    foreach ($site in $sites) {
        try {
            $test = Test-NetConnection $site -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($test) {
                Write-Host "  ✅ $site reachable" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $site unreachable" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ⚠️ $site test failed" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[ERROR] VPN connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n[DONE] Route fix complete!" -ForegroundColor Cyan
Write-Host "Test your VPN with: .\TEST-VPN-TUNNEL.ps1" -ForegroundColor White