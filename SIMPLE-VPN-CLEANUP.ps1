# SIMPLE VPN CLEANUP (No Admin Required)
# =====================================
# Basic cleanup that can run without Administrator privileges

Write-Host "🧹 SIMPLE VPN CLEANUP" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script performs basic cleanup without requiring Administrator privileges" -ForegroundColor Gray
Write-Host "For full cleanup (routes, firewall, registry), use CLEANUP-ADVANCED-VPN.ps1 as Admin" -ForegroundColor Yellow
Write-Host ""

$itemsCleaned = 0

# CLEANUP 1: Remove monitoring files
Write-Host "[1] Removing monitoring files..." -ForegroundColor Yellow
$monitorFiles = @("VPN-LEAK-MONITOR.ps1", "ROUTING-TEST-RESULTS.txt", "vpn-status.log")

foreach ($file in $monitorFiles) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "  ✓ Removed: $file" -ForegroundColor Green
            $itemsCleaned++
        } catch {
            Write-Host "  ⚠️ Failed to remove: $file" -ForegroundColor Yellow
        }
    }
}

if ($itemsCleaned -eq 0) {
    Write-Host "  ℹ️ No monitoring files found" -ForegroundColor Cyan
}

Write-Host ""

# CLEANUP 2: Flush DNS cache (available to all users)
Write-Host "[2] Flushing DNS cache..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "  ✅ DNS cache flushed" -ForegroundColor Green
    $itemsCleaned++
} catch {
    Write-Host "  ⚠️ DNS flush failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# CLEANUP 3: Reset environment variables
Write-Host "[3] Resetting development environment variables..." -ForegroundColor Yellow
try {
    [System.Environment]::SetEnvironmentVariable('NODE_ENV', $null, [System.EnvironmentVariableTarget]::User)
    [System.Environment]::SetEnvironmentVariable('FORCE_DEV_MODE', $null, [System.EnvironmentVariableTarget]::User)
    Write-Host "  ✅ Environment variables reset" -ForegroundColor Green
    $itemsCleaned++
} catch {
    Write-Host "  ⚠️ Environment reset failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# CLEANUP 4: Basic connectivity test
Write-Host "[4] Testing basic connectivity..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "  ✅ Internet connectivity: WORKING" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Internet connectivity: FAILED" -ForegroundColor Red
        Write-Host "     You may need to run admin cleanup or restart network adapter" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Connectivity test failed" -ForegroundColor Red
}

# Check external IP
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "  ✅ External IP: $externalIP" -ForegroundColor Green
    
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
        Write-Host "  ℹ️ IP appears to be VPN (if VPN is connected, this is good)" -ForegroundColor Cyan
    } else {
        Write-Host "  ℹ️ IP appears to be normal ISP (VPN disconnected or cleaned up)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ External IP check failed" -ForegroundColor Red
}

Write-Host ""

# RESULTS
Write-Host "🧹 SIMPLE CLEANUP COMPLETE" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host "Items cleaned: $itemsCleaned" -ForegroundColor White
Write-Host ""

if ($ping) {
    Write-Host "✅ Basic internet connectivity is working" -ForegroundColor Green
    Write-Host "✅ Simple cleanup completed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Internet connectivity issues detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "FOR FULL CLEANUP (requires admin):" -ForegroundColor Cyan
    Write-Host "1. Right-click PowerShell -> 'Run as administrator'" -ForegroundColor White
    Write-Host "2. cd 'd:\Development\nebula-vpn-client'" -ForegroundColor White
    Write-Host "3. .\CLEANUP-ADVANCED-VPN.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "OR try emergency fix:" -ForegroundColor Yellow
    Write-Host ".\EMERGENCY-VPN-FIX.ps1  (as admin)" -ForegroundColor White
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "• If internet works: Basic cleanup sufficient" -ForegroundColor Gray
Write-Host "• If no internet: Run admin cleanup or emergency fix" -ForegroundColor Gray
Write-Host "• To re-setup VPN: .\MICROSOFT-ADVANCED-VPN-SETUP.ps1 (as admin)" -ForegroundColor Gray
Write-Host ""