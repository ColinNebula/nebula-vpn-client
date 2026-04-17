# FORCE-RESILIENT-ROUTING.ps1 
# Force remove aggressive routes and apply resilient configuration

Write-Host "Force Applying Resilient VPN Configuration" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove aggressive routes immediately
Write-Host "Step 1: Force Removing Aggressive Routes" -ForegroundColor Yellow

# Remove 0.0.0.0/1 route (first half of internet)
$removed1 = $false
try {
    route delete 0.0.0.0 mask 128.0.0.0 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Removed aggressive route: 0.0.0.0/1" -ForegroundColor Green
        $removed1 = $true
    }
} catch {
    Write-Host "   WARN Could not remove 0.0.0.0/1" -ForegroundColor Yellow
}

# Remove 128.0.0.0/1 route (second half of internet) 
$removed2 = $false
try {
    route delete 128.0.0.0 mask 128.0.0.0 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK Removed aggressive route: 128.0.0.0/1" -ForegroundColor Green
        $removed2 = $true
    }
} catch {
    Write-Host "   WARN Could not remove 128.0.0.0/1" -ForegroundColor Yellow
}

if ($removed1 -or $removed2) {
    Write-Host "   SUCCESS: Aggressive routes removed!" -ForegroundColor Green
} else {
    Write-Host "   INFO: No aggressive routes found to remove" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Test connectivity immediately
Write-Host "Step 2: Testing Connectivity After Route Removal" -ForegroundColor Yellow

try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 15
    Write-Host "   SUCCESS: Internet restored! (IP: $ip)" -ForegroundColor Green
    $internetFixed = $true
} catch {
    Write-Host "   WARNING: Internet still blocked" -ForegroundColor Red
    $internetFixed = $false
}

Write-Host ""

# Step 3: Check current routing status
Write-Host "Step 3: Current Routing Status" -ForegroundColor Yellow

$routes = route print | Out-String

if ($routes -match "0\.0\.0\.0\s+128\.0\.0\.0") {
    Write-Host "   PROBLEM: Aggressive route 0.0.0.0/1 still present" -ForegroundColor Red
} else {
    Write-Host "   OK: No aggressive route 0.0.0.0/1" -ForegroundColor Green
}

if ($routes -match "128\.0\.0\.0\s+128\.0\.0\.0") {
    Write-Host "   PROBLEM: Aggressive route 128.0.0.0/1 still present" -ForegroundColor Red
} else {
    Write-Host "   OK: No aggressive route 128.0.0.0/1" -ForegroundColor Green
}

Write-Host ""

# Step 4: Provide next steps
Write-Host "NEXT STEPS:" -ForegroundColor Cyan

if ($internetFixed) {
    Write-Host "SUCCESS: Internet connectivity restored!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To apply permanent resilient configuration:" -ForegroundColor White
    Write-Host "1. Disconnect VPN completely" -ForegroundColor White
    Write-Host "2. Reconnect VPN (will use new DNS-only configuration)" -ForegroundColor White
    Write-Host "3. Verify: .\VERIFY-RESILIENT-ROUTING-FIXED.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Expected: WiFi working + DNS privacy + no aggressive routes" -ForegroundColor Green
} else {
    Write-Host "VPN reconnection required:" -ForegroundColor Red
    Write-Host "1. Completely disconnect VPN" -ForegroundColor White
    Write-Host "2. Wait 5 seconds" -ForegroundColor White  
    Write-Host "3. Reconnect VPN" -ForegroundColor White
    Write-Host "4. Run this script again if needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: New configuration uses DNS-only routing (no more aggressive routes)" -ForegroundColor Yellow
}

Write-Host ""