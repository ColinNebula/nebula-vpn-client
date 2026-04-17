# VPN Connectivity Diagnostic Script
# Troubleshoots VPN routing and connectivity issues

Write-Host "=== VPN CONNECTIVITY DIAGNOSTICS ===" -ForegroundColor Cyan
Write-Host "Investigating why external IP check is timing out..." -ForegroundColor Yellow

# Test 1: Basic connectivity without DNS
Write-Host "`n[TEST 1] Testing basic IP connectivity..." -ForegroundColor Green
$testIPs = @("8.8.8.8", "1.1.1.1", "208.67.222.222")
foreach ($ip in $testIPs) {
    try {
        $ping = Test-Connection -ComputerName $ip -Count 1 -Quiet -TimeoutSec 3
        if ($ping) {
            Write-Host "  ✅ Can reach $ip" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Cannot reach $ip" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ⚠️ $ip test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test 2: DNS Resolution
Write-Host "`n[TEST 2] Testing DNS resolution..." -ForegroundColor Green
$domains = @("google.com", "api.ipify.org", "cloudflare.com")
foreach ($domain in $domains) {
    try {
        $resolved = Resolve-DnsName $domain -ErrorAction Stop -TimeoutSec 3
        Write-Host "  ✅ $domain resolves to $($resolved[0].IPAddress)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Cannot resolve $domain" -ForegroundColor Red
    }
}

# Test 3: Check current routing table
Write-Host "`n[TEST 3] Current routing table..." -ForegroundColor Green
$routes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Sort-Object RouteMetric
Write-Host "Default routes (by priority):" -ForegroundColor Cyan
foreach ($route in $routes) {
    $adapter = Get-NetAdapter -InterfaceIndex $route.ifIndex -ErrorAction SilentlyContinue
    if ($adapter) {
        $type = if ($adapter.InterfaceDescription -like "*WireGuard*") { "VPN" } else { "Physical" }
        Write-Host "  $($route.DestinationPrefix) via $($route.NextHop) [$type: $($adapter.Name)] Metric: $($route.RouteMetric)" -ForegroundColor White
    }
}

# Test 4: VPN adapter details
Write-Host "`n[TEST 4] VPN adapter status..." -ForegroundColor Green
$vpnAdapter = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*Nebula*" }
if ($vpnAdapter) {
    Write-Host "VPN Adapter Details:" -ForegroundColor Cyan
    Write-Host "  Name: $($vpnAdapter.Name)" -ForegroundColor White
    Write-Host "  Status: $($vpnAdapter.Status)" -ForegroundColor White
    Write-Host "  Speed: $($vpnAdapter.LinkSpeed)" -ForegroundColor White
    
    # Get VPN IP and DNS
    $vpnIP = Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($vpnIP) {
        Write-Host "  IP: $($vpnIP.IPAddress)" -ForegroundColor White
    }
    
    $vpnDNS = Get-DnsClientServerAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($vpnDNS -and $vpnDNS.ServerAddresses) {
        Write-Host "  DNS: $($vpnDNS.ServerAddresses -join ', ')" -ForegroundColor White
    }
} else {
    Write-Host "  ❌ No VPN adapter found!" -ForegroundColor Red
}

# Test 5: Try alternative external IP services
Write-Host "`n[TEST 5] Testing external IP services..." -ForegroundColor Green
$services = @(
    @{Name="ipify"; URL="https://api.ipify.org"},
    @{Name="httpbin"; URL="https://httpbin.org/ip"},
    @{Name="icanhazip"; URL="https://icanhazip.com"},
    @{Name="ifconfig.me"; URL="https://ifconfig.me/ip"}
)

foreach ($service in $services) {
    try {
        Write-Host "  Testing $($service.Name)..." -ForegroundColor Gray
        $result = Invoke-WebRequest -Uri $service.URL -UseBasicParsing -TimeoutSec 5
        if ($result.StatusCode -eq 200) {
            $ip = $result.Content.Trim()
            Write-Host "  ✅ $($service.Name): $ip" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ❌ $($service.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== DIAGNOSIS ===" -ForegroundColor Cyan
Write-Host "If all tests fail, the VPN routes may be too restrictive." -ForegroundColor Yellow
Write-Host "If DNS fails but ping works, it's a DNS configuration issue." -ForegroundColor Yellow
Write-Host "If some external IP services work, it's a timeout/server issue." -ForegroundColor Yellow

Write-Host "`n=== QUICK FIXES ===" -ForegroundColor Cyan
Write-Host "1. Remove VPN routes temporarily:" -ForegroundColor White
Write-Host "   route delete 0.0.0.0 mask 128.0.0.0" -ForegroundColor Gray
Write-Host "   route delete 128.0.0.0 mask 128.0.0.0" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test connectivity without routes" -ForegroundColor White  
Write-Host ""
Write-Host "3. Try gentler routing (if needed):" -ForegroundColor White
Write-Host "   .\GENTLE-ROUTE-FIX.ps1" -ForegroundColor Gray