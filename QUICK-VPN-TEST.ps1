# QUICK VPN SERVER TEST
# ====================
# Simple test to identify VPN server connectivity issues (no admin required)

Write-Host "QUICK VPN SERVER CONNECTIVITY TEST" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Find VPN interface
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" } | Select-Object -First 1
if (-not $vpnAdapter) {
    Write-Host "❌ VPN NOT CONNECTED" -ForegroundColor Red
    Write-Host "💡 Connect VPN first, then rerun test" -ForegroundColor Yellow
    exit 1
}

$vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
Write-Host "✅ VPN Connected: $($vpnAdapter.Name) ($vpnIP)" -ForegroundColor Green
Write-Host ""

# Test VPN server connectivity
Write-Host "Testing VPN server connectivity..." -ForegroundColor Yellow
$vpnGateway = "10.8.0.1"

try {
    $ping = Test-Connection -ComputerName $vpnGateway -Count 2 -Quiet -ErrorAction Stop
    if ($ping) {
        Write-Host "✅ VPN Server ($vpnGateway): RESPONDING ✅" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 SERVER IS WORKING - Issue is likely:" -ForegroundColor Cyan
        Write-Host "   • Windows Firewall blocking VPN traffic" -ForegroundColor Yellow
        Write-Host "   • MTU size incompatibility" -ForegroundColor Yellow
        Write-Host "   • DNS configuration issues" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "✅ GOOD NEWS: VPN routing can work!" -ForegroundColor Green
        
        # Test quick connectivity
        Write-Host ""
        Write-Host "Testing basic internet through VPN..." -ForegroundColor Cyan
        try {
            $webTest = Invoke-WebRequest -Uri "http://httpbin.org/ip" -UseBasicParsing -TimeoutSec 3
            Write-Host "🎉 SUCCESS: Internet working through VPN!" -ForegroundColor Green
            Write-Host "Your VPN IP: $($webTest.Content)" -ForegroundColor White
        } catch {
            Write-Host "⚠️ Internet still blocked - but server reachable" -ForegroundColor Yellow
            Write-Host "Need Admin script to fix routing/firewall" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "❌ VPN Server ($vpnGateway): NOT RESPONDING ❌" -ForegroundColor Red
        Write-Host ""
        Write-Host "🚨 ROOT CAUSE IDENTIFIED:" -ForegroundColor Red
        Write-Host "   VPN SERVER IS DOWN OR UNREACHABLE" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 THIS IS WHY YOU GET TIMEOUTS!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "IMMEDIATE SOLUTIONS:" -ForegroundColor Green
        Write-Host "1. Switch to different VPN server in app" -ForegroundColor White
        Write-Host "2. Disconnect and reconnect VPN completely" -ForegroundColor White
        Write-Host "3. Check if VPN service is down" -ForegroundColor White
        Write-Host "4. Use split tunneling instead of full tunnel" -ForegroundColor White
    }
} catch {
    Write-Host "❌ VPN Server Test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🚨 CRITICAL ISSUE: Cannot reach VPN server" -ForegroundColor Red
    Write-Host "This explains all the timeout errors!" -ForegroundColor Yellow
}

Write-Host ""

# Show current routing
Write-Host "Current VPN routing status:" -ForegroundColor Cyan
$defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { $_.InterfaceIndex -eq $vpnAdapter.InterfaceIndex }
if ($defaultRoutes) {
    Write-Host "✅ Full tunnel: Active (all traffic through VPN)" -ForegroundColor Yellow
    Write-Host "   This is why WiFi appears 'blocked' when VPN server fails" -ForegroundColor White
} else {
    Write-Host "⚪ Split tunnel: May be active (partial VPN routing)" -ForegroundColor Green
}

Write-Host ""
Write-Host "SAFER ALTERNATIVE METHODS:" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "1. SPLIT TUNNELING (RECOMMENDED):" -ForegroundColor Cyan
Write-Host "   • Only route specific traffic through VPN" -ForegroundColor White
Write-Host "   • Keep local WiFi working for everything else" -ForegroundColor White
Write-Host "   • Much more reliable and safer" -ForegroundColor White
Write-Host ""
Write-Host "2. DNS-ONLY VPN:" -ForegroundColor Cyan
Write-Host "   • Route only DNS queries through VPN" -ForegroundColor White
Write-Host "   • Provides privacy without connectivity issues" -ForegroundColor White
Write-Host ""
Write-Host "3. BROWSER-LEVEL VPN:" -ForegroundColor Cyan
Write-Host "   • Configure browser to use VPN proxy" -ForegroundColor White
Write-Host "   • System/WiFi unaffected" -ForegroundColor White

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "• Wait for Admin script to finish running" -ForegroundColor White
Write-Host "• Try different VPN server if current one fails" -ForegroundColor White
Write-Host "• Consider split tunneling for better reliability" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to continue"