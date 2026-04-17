# Quick VPN Gateway Diagnostic (No Admin Required)
# This helps identify your physical gateway before setting up split tunneling

Write-Host "`n=== QUICK VPN GATEWAY DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host "Detecting your physical gateway for split tunneling setup...`n" -ForegroundColor Gray

# Method 1: Get all network routes 
Write-Host "[1] Checking network routes..." -ForegroundColor Yellow
$routes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
if ($routes) {
    foreach ($route in $routes) {
        $adapter = Get-NetAdapter -InterfaceIndex $route.ifIndex -ErrorAction SilentlyContinue
        if ($adapter) {
            $isVPN = $adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*"
            $status = if ($isVPN) { "[VPN]" } else { "[Physical]" }
            Write-Host "  $status $($adapter.Name): $($route.NextHop) (metric: $($route.RouteMetric))" -ForegroundColor Gray
            
            if (-not $isVPN -and $route.NextHop -ne "0.0.0.0") {
                $recommendedGateway = $route.NextHop
            }
        }
    }
} else {
    Write-Host "  No routes found" -ForegroundColor Red
}

# Method 2: Check WiFi adapter
Write-Host "`n[2] Checking WiFi adapter..." -ForegroundColor Yellow
$wifiAdapter = Get-NetAdapter | Where-Object {
    $_.Status -eq "Up" -and 
    ($_.Name -like "*WiFi*" -or $_.InterfaceDescription -like "*Wireless*")
} | Select-Object -First 1

if ($wifiAdapter) {
    $wifiConfig = Get-NetIPConfiguration -InterfaceIndex $wifiAdapter.InterfaceIndex -ErrorAction SilentlyContinue
    if ($wifiConfig.IPv4DefaultGateway) {
        $wifiGateway = $wifiConfig.IPv4DefaultGateway.NextHop
        Write-Host "  WiFi Gateway: $wifiGateway" -ForegroundColor Green
        $recommendedGateway = $wifiGateway
    } else {
        Write-Host "  No WiFi gateway found" -ForegroundColor Red
    }
} else {
    Write-Host "  No active WiFi adapter found" -ForegroundColor Yellow
}

# Method 3: Test common gateways
Write-Host "`n[3] Testing common router IPs..." -ForegroundColor Yellow
$commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "172.16.0.1")
$workingGateways = @()

foreach ($gw in $commonGateways) {
    $result = Test-Connection -ComputerName $gw -Count 1 -Quiet -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($result) {
        Write-Host "  $gw - REACHABLE" -ForegroundColor Green
        $workingGateways += $gw
    } else {
        Write-Host "  $gw - Not reachable" -ForegroundColor Gray
    }
}

# Summary and recommendation
Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan

if ($recommendedGateway) {
    Write-Host "RECOMMENDED GATEWAY: $recommendedGateway" -ForegroundColor Green
    Write-Host "This should be used for split tunneling setup." -ForegroundColor White
} elseif ($workingGateways.Count -gt 0) {
    Write-Host "POTENTIAL GATEWAYS: $($workingGateways -join ', ')" -ForegroundColor Yellow
    Write-Host "Try the first one: $($workingGateways[0])" -ForegroundColor White
} else {
    Write-Host "NO GATEWAY DETECTED!" -ForegroundColor Red
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "  1. Check your network connection" -ForegroundColor Gray
    Write-Host "  2. Manually find your router's IP address" -ForegroundColor Gray
    Write-Host "  3. Check Windows network settings" -ForegroundColor Gray
}

Write-Host "`nNext step: Run SETUP-SPLIT-TUNNELING-FIXED.ps1 as Administrator" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan