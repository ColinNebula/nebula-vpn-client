Write-Host "SIMPLE INTERNET CONNECTIVITY TEST" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing internet connectivity after VPN routing removal..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Quick IP check
Write-Host "[1] Current IP Address Test:" -ForegroundColor Cyan
try {
    $currentIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-Host "✅ SUCCESS: Your current IP is $currentIP" -ForegroundColor Green
    
    if ($currentIP -eq "99.247.207.59") {
        Write-Host "✅ Using your real IP (VPN bypassed successfully)" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ Using different IP (may be VPN or changed ISP IP)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ FAILED: Cannot reach internet - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: DNS resolution  
Write-Host "[2] DNS Resolution Test:" -ForegroundColor Cyan
try {
    $dnsTest = Resolve-DnsName -Name "google.com" -Type A -ErrorAction Stop
    Write-Host "✅ SUCCESS: DNS working (google.com → $($dnsTest.IPAddress[0]))" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED: DNS resolution failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Website access
Write-Host "[3] Website Access Test:" -ForegroundColor Cyan
try {
    $webTest = Invoke-WebRequest -Uri "https://www.google.com" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ SUCCESS: Can access websites (Google responded)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED: Cannot access websites - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Network interfaces status
Write-Host "[4] Network Interfaces Status:" -ForegroundColor Cyan
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
foreach ($adapter in $adapters) {
    if ($adapter.Name -like "*Wi-Fi*") {
        Write-Host "✅ WiFi: $($adapter.Name) - Active" -ForegroundColor Green
    } elseif ($adapter.Name -like "*Nebula*") {
        Write-Host "🔗 VPN: $($adapter.Name) - Active (but bypassed)" -ForegroundColor Yellow
    } else {
        Write-Host "📡 Other: $($adapter.Name) - Active" -ForegroundColor Cyan
    }
}

Write-Host ""

# Show current routing
Write-Host "[5] Current Internet Routing:" -ForegroundColor Cyan
$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Sort-Object RouteMetric | Select-Object -First 1
if ($defaultRoute) {
    $routeInterface = (Get-NetAdapter -InterfaceIndex $defaultRoute.InterfaceIndex).Name
    Write-Host "✅ Internet traffic via: $routeInterface ($($defaultRoute.NextHop))" -ForegroundColor Green
} else {
    Write-Host "❌ No default route found" -ForegroundColor Red
}

Write-Host ""
Write-Host "SUMMARY:" -ForegroundColor Yellow
Write-Host "If all tests above show SUCCESS, your internet is working!" -ForegroundColor Green
Write-Host "If any tests FAILED, the restoration script needs to finish running." -ForegroundColor Yellow