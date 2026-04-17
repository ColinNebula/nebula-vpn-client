# VPN ROUTING DIAGNOSIS - SIMPLIFIED
# ==================================
# Diagnoses VPN routing issues without character encoding problems

Write-Host "VPN ROUTING DIAGNOSIS" -ForegroundColor Red
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Find VPN interface
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
if ($vpnAdapter) {
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "VPN Interface: $($vpnAdapter.Name)" -ForegroundColor Green
    Write-Host "VPN IP: $vpnIP" -ForegroundColor Green
    Write-Host "Interface Index: $($vpnAdapter.InterfaceIndex)" -ForegroundColor Green
} else {
    Write-Host "ERROR: No active VPN interface found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "ROUTING TABLE ANALYSIS" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Cyan

# Check default routes
Write-Host ""
Write-Host "All default routes (0.0.0.0/0):" -ForegroundColor White
Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object DestinationPrefix, NextHop, InterfaceAlias, RouteMetric | Format-Table -AutoSize

Write-Host "VPN interface specific routes:" -ForegroundColor White  
Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex | Select-Object DestinationPrefix, NextHop, RouteMetric | Format-Table -AutoSize

# Find VPN gateway
Write-Host ""
Write-Host "VPN GATEWAY DETECTION" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Cyan

$vpnDefaultRoute = Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
if ($vpnDefaultRoute) {
    $vpnGateway = $vpnDefaultRoute.NextHop
    Write-Host "VPN Gateway found: $vpnGateway" -ForegroundColor Green
    Write-Host "Route Metric: $($vpnDefaultRoute.RouteMetric)" -ForegroundColor Green
} else {
    Write-Host "ERROR: No default route found for VPN interface!" -ForegroundColor Red
    Write-Host "This is why internet traffic cannot route through VPN!" -ForegroundColor Yellow
    $vpnGateway = $null
}

# Test VPN gateway connectivity
if ($vpnGateway -and $vpnGateway -ne "0.0.0.0") {
    Write-Host ""
    Write-Host "Testing VPN gateway connectivity..." -ForegroundColor White
    try {
        $gatewayTest = Test-Connection -ComputerName $vpnGateway -Count 1 -Quiet -ErrorAction Stop
        if ($gatewayTest) {
            Write-Host "VPN Gateway is reachable: YES" -ForegroundColor Green
        } else {
            Write-Host "VPN Gateway is reachable: NO" -ForegroundColor Red
        }
    } catch {
        Write-Host "VPN Gateway test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "DIAGNOSIS RESULTS" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

if (-not $vpnDefaultRoute) {
    Write-Host "PROBLEM IDENTIFIED: Missing VPN default route!" -ForegroundColor Red
    Write-Host ""  
    Write-Host "SOLUTION: Add VPN default route" -ForegroundColor Green
    Write-Host "Run as Administrator:" -ForegroundColor Yellow
    Write-Host "route add 0.0.0.0 mask 0.0.0.0 10.8.0.1 if $($vpnAdapter.InterfaceIndex) metric 1" -ForegroundColor White
    Write-Host ""
} elseif ($vpnGateway -eq "0.0.0.0") {
    Write-Host "PROBLEM IDENTIFIED: Invalid VPN gateway (0.0.0.0)!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Fix VPN gateway" -ForegroundColor Green  
    Write-Host "Run as Administrator:" -ForegroundColor Yellow
    Write-Host "route delete 0.0.0.0 mask 0.0.0.0" -ForegroundColor White
    Write-Host "route add 0.0.0.0 mask 0.0.0.0 10.8.0.1 if $($vpnAdapter.InterfaceIndex) metric 1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "VPN routing appears configured correctly" -ForegroundColor Green
    Write-Host "Internet connectivity issues may be:" -ForegroundColor Yellow
    Write-Host "  - VPN server problems" -ForegroundColor White
    Write-Host "  - Firewall blocking VPN traffic" -ForegroundColor White  
    Write-Host "  - DNS resolution issues" -ForegroundColor White
    Write-Host ""
}

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Apply the suggested route command if shown above" -ForegroundColor White
Write-Host "2. Test internet connectivity again" -ForegroundColor White
Write-Host "3. If still failing, disconnect/reconnect VPN" -ForegroundColor White

Read-Host "Press Enter to exit"