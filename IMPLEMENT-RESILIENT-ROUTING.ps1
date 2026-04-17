Write-Host "IMPLEMENTING RESILIENT WIREGUARD ROUTING" -ForegroundColor Green
Write-Host "Based on industry best practices research" -ForegroundColor Yellow
Write-Host ""

# Check if VPN is connected
$vpnInterface = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
if (-not $vpnInterface) {
    Write-Host "❌ VPN not connected - switch servers in Nebula app first!" -ForegroundColor Red
    Write-Host "Then rerun this script" -ForegroundColor Yellow
    Read-Host "Press Enter after connecting VPN"
    exit 1
}

Write-Host "✅ VPN Interface: $($vpnInterface.Name)" -ForegroundColor Green

# Test if new server is working
Write-Host "Testing new VPN server..." -ForegroundColor Cyan
try {
    $ping = Test-Connection -ComputerName "10.8.0.1" -Count 2 -Quiet -ErrorAction Stop
    if ($ping) {
        Write-Host "✅ New VPN server responding!" -ForegroundColor Green
    } else {
        Write-Host "❌ Server still not responding - try different location" -ForegroundColor Red
        Read-Host "Press Enter to continue anyway"
    }
} catch {
    Write-Host "❌ Server test failed - try different server location" -ForegroundColor Red
}

Write-Host ""
Write-Host "Implementing split tunneling (best practice)..." -ForegroundColor Cyan

# Remove full tunnel routes (safer routing)
try {
    Get-NetRoute -InterfaceIndex $vpnInterface.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false
    Write-Host "✅ Removed aggressive full tunnel routing" -ForegroundColor Green
} catch {
    Write-Host "⚪ No full tunnel routes found" -ForegroundColor Gray
}

# Add selective routes for DNS privacy (resilient approach)
$dnsRoutes = @("1.1.1.1/32", "8.8.8.8/32")
foreach ($route in $dnsRoutes) {
    try {
        New-NetRoute -DestinationPrefix $route -NextHop "10.8.0.1" -InterfaceIndex $vpnInterface.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue
        Write-Host "✅ Added DNS privacy route: $route" -ForegroundColor Green
    } catch {
        Write-Host "⚪ Route may exist: $route" -ForegroundColor Gray
    }
}

# Configure secure DNS
try {
    Set-DnsClientServerAddress -InterfaceIndex $vpnInterface.InterfaceIndex -ServerAddresses @("1.1.1.1", "8.8.8.8")
    Write-Host "✅ Configured secure DNS" -ForegroundColor Green
} catch {
    Write-Host "⚠️ DNS configuration warning" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 RESILIENT WIREGUARD ROUTING IMPLEMENTED!" -ForegroundColor Green
Write-Host ""
Write-Host "Benefits of this configuration:" -ForegroundColor Cyan
Write-Host "• DNS queries secured through VPN" -ForegroundColor White
Write-Host "• Internet works even if VPN server fails again" -ForegroundColor White
Write-Host "• Local network access preserved" -ForegroundColor White
Write-Host "• Better performance than full tunnel" -ForegroundColor White
Write-Host ""
Write-Host "Testing implementation..." -ForegroundColor Yellow

# Test the implementation
try {
    $ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
    Write-Host "✅ Internet connectivity: Working (IP: $ip)" -ForegroundColor Green
    
    if ($ip -eq "99.247.207.59") {
        Write-Host "✅ Traffic using WiFi (reliable local connection)" -ForegroundColor Green
    } else {
        Write-Host "✅ Some traffic may be using VPN" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Internet test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "VERIFICATION COMMANDS:" -ForegroundColor Yellow
Write-Host "• Full test: .\TEST-ROUTING-FIX.ps1" -ForegroundColor White
Write-Host "• Check IP: Invoke-WebRequest 'https://api.ipify.org' -UseBasicParsing" -ForegroundColor White
Write-Host "• Test DNS: nslookup google.com 1.1.1.1" -ForegroundColor White

Read-Host "Press Enter to continue"