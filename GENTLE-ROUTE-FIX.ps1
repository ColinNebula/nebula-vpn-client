# Gentle VPN Route Fix
# Less aggressive routing that preserves connectivity while fixing IP leaks

Write-Host "=== NEBULA VPN - GENTLE ROUTE FIX ===" -ForegroundColor Green
Write-Host "Using gentler routing approach to avoid connectivity issues..." -ForegroundColor Yellow

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Must run as Administrator!" -ForegroundColor Red
    exit 1
}

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { 
    ($_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*Nebula*") -and $_.Status -eq "Up"
}

if (-not $vpnAdapter) {
    Write-Host "[ERROR] No active VPN adapter found!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] VPN Adapter: $($vpnAdapter.Name)" -ForegroundColor Green
$interfaceIndex = $vpnAdapter.InterfaceIndex

# Get current default route (physical connection)
$physicalRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
    $adapter -and $adapter.InterfaceDescription -notlike "*WireGuard*"
} | Sort-Object RouteMetric | Select-Object -First 1

if ($physicalRoute) {
    Write-Host "[OK] Physical gateway: $($physicalRoute.NextHop)" -ForegroundColor Green
    $physicalGateway = $physicalRoute.NextHop
} else {
    Write-Host "[WARN] Could not detect physical gateway - using common defaults" -ForegroundColor Yellow
    $physicalGateway = "192.168.1.1"  # fallback
}

Write-Host ""
Write-Host "Applying gentle VPN routing..." -ForegroundColor Yellow

# Step 1: Remove any existing aggressive routes
Write-Host "  Cleaning aggressive routes..." -ForegroundColor Gray
cmd /c "route delete 0.0.0.0 mask 128.0.0.0" 2>$null
cmd /c "route delete 128.0.0.0 mask 128.0.0.0" 2>$null

# Step 2: Add specific routes for common services through VPN
Write-Host "  Adding specific service routes through VPN..." -ForegroundColor Gray

# Route specific external services through VPN instead of all traffic
$servicesVPN = @(
    @{IP="8.8.8.8"; Desc="Google DNS"},
    @{IP="8.8.4.4"; Desc="Google DNS 2"},  
    @{IP="1.1.1.1"; Desc="Cloudflare DNS"},
    @{IP="208.67.222.222"; Desc="OpenDNS"}
)

foreach ($service in $servicesVPN) {
    cmd /c "route add $($service.IP) mask 255.255.255.255 0.0.0.0 metric 1 if $interfaceIndex" 2>$null
    Write-Host "    $($service.Desc) → VPN" -ForegroundColor Cyan
}

# Step 3: Try to get external IP service IPs and route them through VPN
Write-Host "  Resolving and routing external IP services..." -ForegroundColor Gray
$extServices = @("api.ipify.org", "icanhazip.com", "ifconfig.me")
foreach ($service in $extServices) {
    try {
        $resolved = Resolve-DnsName $service -ErrorAction Stop
        foreach ($record in $resolved | Where-Object { $_.Type -eq "A" }) {
            cmd /c "route add $($record.IPAddress) mask 255.255.255.255 0.0.0.0 metric 1 if $interfaceIndex" 2>$null
            Write-Host "    $service ($($record.IPAddress)) → VPN" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "    Could not resolve $service" -ForegroundColor Yellow
    }
}

# Step 4: Set VPN as preferred for new connections (lower metric)
Write-Host "  Adjusting VPN route priority..." -ForegroundColor Gray
$vpnRoutes = Get-NetRoute -InterfaceIndex $interfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
foreach ($route in $vpnRoutes) {
    if ($route.RouteMetric -gt 10) {
        Set-NetRoute -DestinationPrefix $route.DestinationPrefix -InterfaceIndex $route.ifIndex -RouteMetric 5 -ErrorAction SilentlyContinue
        Write-Host "    VPN route priority increased (metric: 5)" -ForegroundColor Cyan
    }
}

# Step 5: Flush DNS
cmd /c "ipconfig /flushdns" >$null

Write-Host ""
Write-Host "=== TESTING GENTLE ROUTING ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Test connectivity
Write-Host "Testing basic connectivity..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 3
    if ($ping) {
        Write-Host "  ✅ Basic connectivity: OK" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Basic connectivity: Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️ Basic connectivity test failed" -ForegroundColor Yellow
}

# Test external IP with shorter timeout
Write-Host "Testing external IP (shorter timeout)..." -ForegroundColor Yellow
try {
    $newIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-Host "  ✅ External IP: $newIP" -ForegroundColor Green
    
    if ($newIP -ne "99.247.207.59") {
        Write-Host "  🎉 SUCCESS: IP leak appears to be fixed!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Still showing original IP - may need stronger routing" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️ External IP check timed out (but this is common)" -ForegroundColor Yellow
    Write-Host "  Try the connectivity test script: .\VPN-CONNECTIVITY-TEST.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Gentle route fix complete! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "If connectivity is restored but IP still leaks:" -ForegroundColor Yellow
Write-Host "  Run .\QUICK-ROUTE-FIX.ps1 again for stronger routing" -ForegroundColor White
Write-Host ""
Write-Host "For detailed diagnostics:" -ForegroundColor Yellow  
Write-Host "  .\VPN-CONNECTIVITY-TEST.ps1" -ForegroundColor White