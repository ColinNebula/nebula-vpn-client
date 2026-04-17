# SIMPLE WIREGUARD TUNNEL STATUS CHECK
# ===================================
# Quick check without admin privileges

Write-Host "🔍 SIMPLE WIREGUARD TUNNEL STATUS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1] Checking for VPN processes..." -ForegroundColor Green
try {
    $vpnProcesses = Get-Process | Where-Object { 
        $_.ProcessName -match "nebula|wireguard|wg" -or $_.MainWindowTitle -match "nebula|vpn"
    }
    if ($vpnProcesses) {
        Write-Host "✅ VPN processes found:" -ForegroundColor Green
        $vpnProcesses | Select-Object ProcessName, Id, WorkingSet | Format-Table -AutoSize
    } else {
        Write-Host "❌ No VPN processes running" -ForegroundColor Red
        Write-Host "Nebula VPN app may not be running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking processes" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2] Network adapter quick check..." -ForegroundColor Green
try {
    # Simple adapter check that usually works
    $allAdapters = netsh interface show interface
    Write-Host "Network interfaces:" -ForegroundColor Cyan
    Write-Host $allAdapters -ForegroundColor White
    
    if ($allAdapters -match "Nebula|WireGuard") {
        Write-Host "✅ Found VPN-related interface" -ForegroundColor Green
    } else {
        Write-Host "❌ No VPN interface detected" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not check network interfaces" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3] Current internet status..." -ForegroundColor Green
try {
    $currentIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "✅ Current external IP: $currentIP" -ForegroundColor Green
    
    # Check if it looks like a VPN IP
    if ($currentIP -match "^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[01])\.") {
        Write-Host "✅ This looks like a VPN IP address" -ForegroundColor Green
    } else {
        Write-Host "⚠️  This looks like your ISP IP (VPN may not be active)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Internet connectivity test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "[4] Basic connectivity test..." -ForegroundColor Green
$testHosts = @("1.1.1.1", "8.8.8.8", "google.com")
foreach ($host in $testHosts) {
    try {
        $result = Test-Connection -ComputerName $host -Count 1 -Quiet -ErrorAction Stop
        if ($result) {
            Write-Host "✅ Can reach $host" -ForegroundColor Green
        } else {
            Write-Host "❌ Cannot reach $host" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error testing $host" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 RECOMMENDATIONS:" -ForegroundColor Blue
Write-Host "==================" -ForegroundColor Yellow

if (-not $vpnProcesses) {
    Write-Host "1. Start the Nebula VPN application" -ForegroundColor White
} else {
    Write-Host "1. VPN app is running - check connection status in app" -ForegroundColor White
}

Write-Host "2. If VPN shows connected but no tunnel traffic:" -ForegroundColor White
Write-Host "   - VPN server may be down" -ForegroundColor Gray
Write-Host "   - Routing configuration issue" -ForegroundColor Gray  
Write-Host "   - Firewall blocking VPN traffic" -ForegroundColor Gray

Write-Host "3. Try connecting to a different VPN server" -ForegroundColor White
Write-Host "4. Check VPN app logs for error messages" -ForegroundColor White
Write-Host ""