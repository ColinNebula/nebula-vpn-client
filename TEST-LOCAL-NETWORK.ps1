# Test Local Network Access While VPN is Connected
# This verifies that split tunneling is working correctly

Write-Host "`n=== NEBULA VPN - LOCAL NETWORK TEST ===" -ForegroundColor Cyan
Write-Host "Testing if local network access works with VPN connected`n" -ForegroundColor Yellow

# Check if VPN is connected
$vpnAdapter = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*Nebula*" }
if (-not $vpnAdapter) {
    Write-Host "[WARNING] VPN doesn't appear to be connected" -ForegroundColor Yellow
    Write-Host "Connect to VPN first, then run this test`n" -ForegroundColor Cyan
    exit 0
}

Write-Host "[OK] VPN is connected ($($vpnAdapter.Name))`n" -ForegroundColor Green

# Get WiFi/LAN gateway
$physicalGateway = $null
$routeOutput = route print 0.0.0.0 | Select-String "0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)"
if ($routeOutput -match "(\d+\.\d+\.\d+\.\d+)") {
    $physicalGateway = $matches[1]
}

if ($physicalGateway) {
    Write-Host "[Test 1] Pinging local gateway: $physicalGateway" -ForegroundColor Yellow
    $pingResult = Test-Connection -ComputerName $physicalGateway -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "  [PASS] ✅ Can reach local gateway!" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] ❌ Cannot reach local gateway" -ForegroundColor Red
        Write-Host "  Your local network is being blocked by VPN routing" -ForegroundColor Yellow
    }
} else {
    Write-Host "[Test 1] Could not detect local gateway" -ForegroundColor Yellow
}

# Test local network (common router addresses)
Write-Host "`n[Test 2] Testing common router addresses:" -ForegroundColor Yellow
$commonRouters = @('192.168.1.1', '192.168.0.1', '192.168.1.254', '10.0.0.1')
$foundRouter = $false

foreach ($ip in $commonRouters) {
    $pingResult = Test-Connection -ComputerName $ip -Count 1 -Quiet -TimeoutSeconds 1
    if ($pingResult) {
        Write-Host "  [PASS] ✅ Can reach $ip" -ForegroundColor Green
        $foundRouter = $true
        break
    }
}

if (-not $foundRouter) {
    Write-Host "  [INFO] No common routers responded (may not be on your network)" -ForegroundColor Cyan
}

# Check if local network routes exist
Write-Host "`n[Test 3] Checking split tunnel routes:" -ForegroundColor Yellow
$routeTable = route print
$hasLocalRoutes = $false

$localNetworks = @('192.168.0.0', '10.0.0.0', '172.16.0.0')
foreach ($network in $localNetworks) {
    if ($routeTable -like "*$network*") {
        Write-Host "  [PASS] ✅ Found route for $network (local networks bypass VPN)" -ForegroundColor Green
        $hasLocalRoutes = $true
    }
}

if (-not $hasLocalRoutes) {
    Write-Host "  [FAIL] ❌ No local network bypass routes found!" -ForegroundColor Red
    Write-Host "  Run .\FIX-VPN-ROUTES-NOW.ps1 to add them" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
if ($pingResult -and $hasLocalRoutes) {
    Write-Host "✅ Split tunneling is working correctly!" -ForegroundColor Green
    Write-Host "   Your WiFi/LAN access is preserved while VPN is active`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  Issues detected with local network access" -ForegroundColor Yellow
    Write-Host "`nTo fix:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\FIX-VPN-ROUTES-NOW.ps1" -ForegroundColor White
    Write-Host "  2. Reconnect the VPN" -ForegroundColor White
    Write-Host "  3. Run this test again`n" -ForegroundColor White
}
