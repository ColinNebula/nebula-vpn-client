# SIMPLE VPN CLEANUP (No Admin Required)
# =====================================

Write-Host "🧹 SIMPLE VPN CLEANUP" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Basic cleanup without Administrator privileges" -ForegroundColor Gray
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

# CLEANUP 2: Flush DNS cache
Write-Host "[2] Flushing DNS cache..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "  ✅ DNS cache flushed" -ForegroundColor Green
    $itemsCleaned++
} catch {
    Write-Host "  ⚠️ DNS flush failed" -ForegroundColor Yellow
}

Write-Host ""

# CLEANUP 3: Reset environment variables
Write-Host "[3] Resetting environment variables..." -ForegroundColor Yellow
try {
    [System.Environment]::SetEnvironmentVariable('NODE_ENV', $null, [System.EnvironmentVariableTarget]::User)
    [System.Environment]::SetEnvironmentVariable('FORCE_DEV_MODE', $null, [System.EnvironmentVariableTarget]::User)
    Write-Host "  ✅ Environment variables reset" -ForegroundColor Green
    $itemsCleaned++
} catch {
    Write-Host "  ⚠️ Environment reset failed" -ForegroundColor Yellow
}

Write-Host ""

# CLEANUP 4: Test connectivity
Write-Host "[4] Testing connectivity..." -ForegroundColor Yellow

# Test ping
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "  ✅ Internet: WORKING" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Internet: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Internet test error" -ForegroundColor Red
}

# Test external IP
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "  ✅ External IP: $externalIP" -ForegroundColor Green
    
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
        Write-Host "  ℹ️ IP appears to be VPN" -ForegroundColor Cyan
    } else {
        Write-Host "  ℹ️ IP appears to be normal ISP" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ External IP check failed" -ForegroundColor Red
}

Write-Host ""

# RESULTS
Write-Host "🧹 SIMPLE CLEANUP COMPLETE" -ForegroundColor Cyan
Write-Host "Items cleaned: $itemsCleaned" -ForegroundColor White
Write-Host ""

if ($ping) {
    Write-Host "✅ Internet connectivity restored" -ForegroundColor Green
} else {
    Write-Host "❌ Internet issues detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "FOR FULL CLEANUP:" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell -> 'Run as administrator'" -ForegroundColor White
    Write-Host ".\CLEANUP-ADVANCED-VPN.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "OR emergency fix:" -ForegroundColor Yellow
    Write-Host ".\EMERGENCY-VPN-FIX.ps1" -ForegroundColor White
}

Write-Host ""