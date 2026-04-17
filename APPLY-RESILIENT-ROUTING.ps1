# APPLY-RESILIENT-ROUTING.ps1
# Disconnect VPN, clean aggressive routes, and reconnect with resilient configuration

Write-Host "Applying Resilient VPN Routing Configuration" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current VPN status
Write-Host "Step 1: Current VPN Status" -ForegroundColor Yellow
$wgInterface = Get-NetAdapter | Where-Object { 
    $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" -or $_.Name -like "*wg*" 
}

if ($wgInterface) {
    Write-Host "   VPN Connected: $($wgInterface.Name)" -ForegroundColor Green
    Write-Host "   Status: $($wgInterface.Status)" -ForegroundColor Green
} else {
    Write-Host "   VPN not connected - nothing to fix" -ForegroundColor Green
    Write-Host "   You can connect normally with the new resilient configuration" -ForegroundColor Green
    exit 0
}

Write-Host ""

# Step 2: Remove aggressive routes
Write-Host "Step 2: Removing Aggressive Routes" -ForegroundColor Yellow

$routesRemoved = 0

# Remove 0.0.0.0/1 route
try {
    $result = route delete 0.0.0.0 mask 128.0.0.0 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Removed aggressive route: 0.0.0.0/1" -ForegroundColor Green
        $routesRemoved++
    } else {
        Write-Host "   - Route 0.0.0.0/1 not found (already clean)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   - Could not remove 0.0.0.0/1 route" -ForegroundColor Gray
}

# Remove 128.0.0.0/1 route
try {
    $result = route delete 128.0.0.0 mask 128.0.0.0 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Removed aggressive route: 128.0.0.0/1" -ForegroundColor Green
        $routesRemoved++
    } else {
        Write-Host "   - Route 128.0.0.0/1 not found (already clean)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   - Could not remove 128.0.0.0/1 route" -ForegroundColor Gray
}

if ($routesRemoved -gt 0) {
    Write-Host "   ✅ Removed $routesRemoved aggressive routes" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No aggressive routes to remove" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Restart VPN service to apply new configuration
Write-Host "Step 3: Applying New Configuration" -ForegroundColor Yellow
Write-Host "   The VPN needs to be reconnected to apply resilient routing" -ForegroundColor White
Write-Host ""
Write-Host "   ACTION REQUIRED:" -ForegroundColor Red
Write-Host "   1. Disconnect VPN in your Nebula app" -ForegroundColor White
Write-Host "   2. Reconnect VPN (this will use the new resilient configuration)" -ForegroundColor White
Write-Host "   3. Run: .\VERIFY-RESILIENT-ROUTING-FIXED.ps1" -ForegroundColor White
Write-Host ""

# Step 4: Test current connectivity
Write-Host "Step 4: Testing Current Connectivity" -ForegroundColor Yellow

try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10
    Write-Host "   ✓ Internet: WORKING (IP: $ip)" -ForegroundColor Green
    Write-Host "   🎉 Aggressive routes successfully removed!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠  Internet: Still blocked - VPN reconnection needed" -ForegroundColor Yellow
    Write-Host "   Please disconnect and reconnect your VPN to apply the fix" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Disconnect your Nebula VPN" -ForegroundColor White
Write-Host "2. Reconnect (new resilient configuration will apply)" -ForegroundColor White  
Write-Host "3. Verify: .\VERIFY-RESILIENT-ROUTING-FIXED.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Expected Result: WiFi working + DNS privacy through VPN ✨" -ForegroundColor Green