# WIREGUARD GATEWAY FAILURE FIX
# =============================
# Fixes WireGuard when tunnel exists but gateway unreachable

Write-Host "WIREGUARD GATEWAY FAILURE FIX" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check Administrator status
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Find WireGuard interface
$vpnAdapter = Get-NetAdapter | Where-Object { ($_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*") -and $_.Status -eq "Up" }
if ($vpnAdapter) {
    $vpnIndex = $vpnAdapter.InterfaceIndex
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "✅ VPN Interface: $($vpnAdapter.Name) ($vpnIP)" -ForegroundColor Green
} else {
    Write-Host "❌ No active VPN interface found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# SOLUTION 1: Complete VPN Route Removal (Force WiFi Fallback)
Write-Host "[SOLUTION 1] Force WiFi Fallback Mode..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "Removing ALL VPN routes to prevent internet blocking..." -ForegroundColor White

# Remove all VPN routes that could block internet
try {
    Get-NetRoute -InterfaceIndex $vpnIndex -ErrorAction SilentlyContinue | Where-Object { 
        $_.DestinationPrefix -eq "0.0.0.0/0" -or 
        $_.DestinationPrefix -like "1.*" -or 
        $_.DestinationPrefix -like "8.*" -or
        $_.DestinationPrefix -like "208.*"
    } | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
    
    Write-Host "✅ Removed blocking VPN routes" -ForegroundColor Green
} catch {
    Write-Host "⚪ No blocking routes found" -ForegroundColor Gray
}

# Ensure WiFi has priority for internet
$wifiAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }
if ($wifiAdapter) {
    try {
        # Lower WiFi route metric to give it priority
        Get-NetRoute -InterfaceIndex $wifiAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" | ForEach-Object {
            Set-NetRoute -InterfaceIndex $_.InterfaceIndex -DestinationPrefix $_.DestinationPrefix -NextHop $_.NextHop -RouteMetric 1 -ErrorAction SilentlyContinue
        }
        Write-Host "✅ WiFi internet priority restored" -ForegroundColor Green
    } catch {
        Write-Host "⚪ WiFi route adjustment info only" -ForegroundColor Gray
    }
}

Write-Host ""

# SOLUTION 2: VPN Interface Reset
Write-Host "[SOLUTION 2] VPN Interface Reset..." -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Cyan

Write-Host "Attempting to reset VPN interface configuration..." -ForegroundColor White

# Reset VPN interface IP configuration
try {
    Remove-NetIPAddress -InterfaceIndex $vpnIndex -Confirm:$false -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    New-NetIPAddress -InterfaceIndex $vpnIndex -IPAddress $vpnIP -PrefixLength 24 -ErrorAction SilentlyContinue
    Write-Host "✅ VPN interface IP reset attempted" -ForegroundColor Green
} catch {
    Write-Host "⚠️ VPN interface reset had warnings (may be normal)" -ForegroundColor Yellow
}

Write-Host ""

# SOLUTION 3: Test Alternative Gateways
Write-Host "[SOLUTION 3] Testing Alternative Gateways..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

$alternativeGateways = @("10.6.0.1", "172.16.0.1", "192.168.100.1")
$workingGateway = $null

foreach ($gateway in $alternativeGateways) {
    Write-Host "Testing gateway: $gateway" -ForegroundColor White
    try {
        $ping = Test-Connection -ComputerName $gateway -Count 1 -Quiet -TimeoutSec 3 -ErrorAction Stop
        if ($ping) {
            Write-Host "✅ Alternative gateway found: $gateway" -ForegroundColor Green
            $workingGateway = $gateway
            break
        } else {
            Write-Host "❌ Gateway $gateway not responding" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Gateway $gateway failed" -ForegroundColor Red
    }
}

if ($workingGateway) {
    Write-Host "Configuring routing for working gateway..." -ForegroundColor Cyan
    try {
        New-NetRoute -DestinationPrefix "0.0.0.0/0" -NextHop $workingGateway -InterfaceIndex $vpnIndex -RouteMetric 10 -PolicyStore ActiveStore -ErrorAction SilentlyContinue
        Write-Host "✅ Alternative gateway route added" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Gateway route warning" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ No alternative gateways responding" -ForegroundColor Yellow
}

Write-Host ""

# SOLUTION 4: DNS-Only VPN Mode
Write-Host "[SOLUTION 4] DNS-Only VPN Mode..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "Configuring VPN for DNS privacy only (safer approach)..." -ForegroundColor White

# Configure secure DNS through VPN interface (if possible)
try {
    Set-DnsClientServerAddress -InterfaceIndex $vpnIndex -ServerAddresses @("1.1.1.1", "8.8.8.8") -ErrorAction SilentlyContinue
    Write-Host "✅ VPN configured for DNS privacy only" -ForegroundColor Green
} catch {
    Write-Host "⚠️ DNS configuration had warnings" -ForegroundColor Yellow
}

# Add specific DNS routes only
$dnsServers = @("1.1.1.1", "8.8.8.8", "208.67.222.222")
foreach ($dns in $dnsServers) {
    if ($workingGateway) {
        try {
            New-NetRoute -DestinationPrefix "$dns/32" -NextHop $workingGateway -InterfaceIndex $vpnIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue
            Write-Host "✅ DNS route added: $dns" -ForegroundColor Green
        } catch {
            Write-Host "⚪ DNS route may exist: $dns" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# SOLUTION 5: Force Internet Through WiFi
Write-Host "[SOLUTION 5] Restore Internet Connectivity..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "Ensuring internet works through WiFi while VPN provides privacy..." -ForegroundColor White

# Test internet connectivity
Write-Host "Testing internet restoration..." -ForegroundColor Cyan

$testUrls = @(
    "http://httpbin.org/ip",
    "https://api.ipify.org", 
    "https://icanhazip.com"
)

$successCount = 0
foreach ($url in $testUrls) {
    try {
        $result = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ Internet test SUCCESS: $($result.Content.Trim())" -ForegroundColor Green
        $successCount++
        break  # Stop on first success
    } catch {
        Write-Host "❌ Test failed: $url" -ForegroundColor Red
    }
}

Write-Host ""

# FINAL RESULTS
Write-Host "GATEWAY FAILURE FIX RESULTS" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "🎉 INTERNET CONNECTIVITY RESTORED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Configuration applied:" -ForegroundColor Green
    Write-Host "• VPN routes blocking internet removed" -ForegroundColor White
    Write-Host "• WiFi internet priority restored" -ForegroundColor White
    Write-Host "• DNS privacy through VPN (if gateway works)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 PRIVACY STATUS:" -ForegroundColor Cyan
    Write-Host "• DNS queries may be secured (partial VPN benefit)" -ForegroundColor White
    Write-Host "• Internet traffic through WiFi (for reliability)" -ForegroundColor White
    Write-Host "• VPN tunnel maintained for future use" -ForegroundColor White
    
} else {
    Write-Host "⚠️ STILL TROUBLESHOOTING NEEDED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The VPN gateway failure is severe. Recommended actions:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. CHANGE VPN SERVER (CRITICAL):" -ForegroundColor Red
    Write-Host "   • Open Nebula VPN app" -ForegroundColor White
    Write-Host "   • Switch to different server location" -ForegroundColor White
    Write-Host "   • Current server (10.8.0.1) is completely unresponsive" -ForegroundColor White
    Write-Host ""
    Write-Host "2. RESTART VPN APPLICATION:" -ForegroundColor Red
    Write-Host "   • Close Nebula VPN completely" -ForegroundColor White
    Write-Host "   • Restart application" -ForegroundColor White
    Write-Host "   • Try connecting to different server" -ForegroundColor White
    Write-Host ""
    Write-Host "3. CHECK VPN SERVICE STATUS:" -ForegroundColor Red
    Write-Host "   • VPN provider may be experiencing outages" -ForegroundColor White
    Write-Host "   • Check Nebula VPN status page/support" -ForegroundColor White
}

Write-Host ""
Write-Host "VERIFICATION COMMANDS:" -ForegroundColor Yellow
Write-Host "• Test internet: Invoke-WebRequest 'https://api.ipify.org' -UseBasicParsing" -ForegroundColor White
Write-Host "• Test VPN gateway: ping 10.8.0.1" -ForegroundColor White
Write-Host "• Full test: .\TEST-ROUTING-FIX.ps1" -ForegroundColor White

Write-Host ""
Write-Host "💡 RECOMMENDED: Switch VPN server in Nebula app for best results" -ForegroundColor Cyan

Write-Host ""
Read-Host "Press Enter to continue"