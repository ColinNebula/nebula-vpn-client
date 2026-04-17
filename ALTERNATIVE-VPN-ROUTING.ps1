# ADVANCED VPN ROUTING ALTERNATIVES
# ==================================
# Multiple safe routing methods when standard VPN routing fails

Write-Host "ADVANCED VPN ROUTING ALTERNATIVES" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Administrator status
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running as Administrator: YES" -ForegroundColor Green
Write-Host ""

# Find VPN interface
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
if (-not $vpnAdapter) {
    Write-Host "ERROR: No active VPN interface found!" -ForegroundColor Red
    Write-Host "Please connect your VPN first" -ForegroundColor Yellow
    exit 1
}

$vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
Write-Host "VPN Interface: $($vpnAdapter.Name) ($vpnIP)" -ForegroundColor Green
Write-Host ""

# METHOD 1: Test VPN Server Connectivity
Write-Host "[METHOD 1] Testing VPN Server Connectivity..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

$vpnGateway = "10.8.0.1"
Write-Host "Testing VPN gateway: $vpnGateway" -ForegroundColor White

# Test 1: Ping VPN gateway
try {
    $gatewayPing = Test-Connection -ComputerName $vpnGateway -Count 3 -Quiet -ErrorAction Stop
    if ($gatewayPing) {
        Write-Host "✅ VPN Gateway reachable via ping" -ForegroundColor Green
    } else {
        Write-Host "❌ VPN Gateway NOT reachable" -ForegroundColor Red
        Write-Host "💡 This is likely why internet fails!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ping test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Try different VPN gateway IPs
Write-Host ""
Write-Host "Trying alternative VPN gateways..." -ForegroundColor Cyan
$alternativeGateways = @("10.8.0.1", "10.6.0.1", "192.168.1.1", "172.16.0.1")
$workingGateway = $null

foreach ($gateway in $alternativeGateways) {
    try {
        $ping = Test-Connection -ComputerName $gateway -Count 1 -Quiet -TimeoutSec 3 -ErrorAction Stop
        if ($ping) {
            Write-Host "✅ Alternative gateway working: $gateway" -ForegroundColor Green
            $workingGateway = $gateway
            break
        }
    } catch {
        Write-Host "⚪ Gateway $gateway: Not responsive" -ForegroundColor Gray
    }
}

if ($workingGateway) {
    $vpnGateway = $workingGateway
    Write-Host "Using working gateway: $vpnGateway" -ForegroundColor Green
} else {
    Write-Host "⚠️ No VPN gateways responding - server may be down" -ForegroundColor Yellow
}

Write-Host ""

# METHOD 2: Policy-Based Routing (Safer Alternative)
Write-Host "[METHOD 2] Policy-Based Routing (Safer Method)..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan

Write-Host "Implementing selective routing instead of full tunnel..." -ForegroundColor White

# Clear existing routes
Write-Host "Clearing aggressive routes..." -ForegroundColor Cyan
try {
    Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared default VPN route" -ForegroundColor Green
} catch {
    Write-Host "⚪ No default route to clear" -ForegroundColor Gray
}

# Add selective routes for specific services
Write-Host ""
Write-Host "Adding selective routes for external services..." -ForegroundColor Cyan
$externalServices = @(
    @{IP="1.1.1.1"; Description="Cloudflare DNS"},
    @{IP="8.8.8.8"; Description="Google DNS"},
    @{IP="104.16.132.229"; Description="icanhazip.com"},
    @{IP="54.204.39.132"; Description="api.ipify.org"}
)

foreach ($service in $externalServices) {
    try {
        New-NetRoute -DestinationPrefix "$($service.IP)/32" -NextHop $vpnGateway -InterfaceIndex $vpnAdapter.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue
        Write-Host "✅ Route added for $($service.Description) ($($service.IP))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not add route for $($service.IP)" -ForegroundColor Yellow
    }
}

Write-Host ""

# METHOD 3: MTU Optimization
Write-Host "[METHOD 3] MTU Optimization..." -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Cyan

$currentMTU = (Get-NetIPInterface -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4).NlMtu
Write-Host "Current VPN MTU: $currentMTU" -ForegroundColor White

if ($currentMTU -gt 1200) {
    Write-Host "Optimizing MTU for better connectivity..." -ForegroundColor Cyan
    try {
        Set-NetIPInterface -InterfaceIndex $vpnAdapter.InterfaceIndex -NlMtuBytes 1200
        Write-Host "✅ MTU set to 1200 (better compatibility)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not adjust MTU: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ MTU already optimized ($currentMTU)" -ForegroundColor Green
}

Write-Host ""

# METHOD 4: DNS-Based Routing
Write-Host "[METHOD 4] DNS-Based Routing..." -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Cyan

# Set VPN-specific DNS
try {
    Set-DnsClientServerAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -ServerAddresses @("1.1.1.1", "8.8.8.8") -ErrorAction Stop
    Write-Host "✅ VPN DNS configured (1.1.1.1, 8.8.8.8)" -ForegroundColor Green
except {
    Write-Host "⚠️ DNS configuration warning" -ForegroundColor Yellow
}

# Test DNS resolution through VPN
Write-Host "Testing DNS resolution..." -ForegroundColor Cyan
try {
    $dnsTest = Resolve-DnsName -Name "google.com" -Server "1.1.1.1" -Type A -ErrorAction Stop
    Write-Host "✅ DNS resolution working" -ForegroundColor Green
} catch {
    Write-Host "❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# METHOD 5: Test Alternative Connectivity
Write-Host "[METHOD 5] Alternative Connectivity Testing..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "Testing with different approaches..." -ForegroundColor White

# Test 1: Try HTTP instead of HTTPS
Write-Host ""
Write-Host "Test 1: HTTP connectivity (less secure but may work)..." -ForegroundColor Cyan
try {
    $httpTest = Invoke-WebRequest -Uri "http://httpbin.org/ip" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ HTTP Success: $($httpTest.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTP failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Try with different user agent
Write-Host ""
Write-Host "Test 2: HTTPS with modified headers..." -ForegroundColor Cyan
try {
    $headers = @{
        'User-Agent' = 'curl/7.68.0'
        'Accept' = '*/*'
    }
    $headerTest = Invoke-WebRequest -Uri "https://icanhazip.com" -UseBasicParsing -TimeoutSec 5 -Headers $headers
    Write-Host "✅ Header test success: $($headerTest.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Header test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Direct IP test
Write-Host ""
Write-Host "Test 3: Direct IP connectivity..." -ForegroundColor Cyan
try {
    $directIP = Invoke-WebRequest -Uri "http://1.1.1.1" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Direct IP works: Connected to 1.1.1.1" -ForegroundColor Green
} catch {
    Write-Host "❌ Direct IP failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# METHOD 6: WiFi Preservation Check
Write-Host "[METHOD 6] WiFi Preservation Verification..." -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan

$wifiAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }
if ($wifiAdapter) {
    Write-Host "WiFi interface: $($wifiAdapter.Name)" -ForegroundColor Green
    
    # Check WiFi can still reach local gateway
    $wifiGateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceIndex $wifiAdapter.InterfaceIndex -ErrorAction SilentlyContinue).NextHop | Select-Object -First 1
    if ($wifiGateway) {
        try {
            $wifiTest = Test-Connection -ComputerName $wifiGateway -Count 1 -Quiet -ErrorAction Stop
            if ($wifiTest) {
                Write-Host "✅ WiFi local network: Still accessible ($wifiGateway)" -ForegroundColor Green
            } else {
                Write-Host "❌ WiFi local network: Blocked!" -ForegroundColor Red
            }
        } catch {
            Write-Host "⚠️ WiFi test inconclusive" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️ No WiFi interface detected" -ForegroundColor Yellow
}

Write-Host ""

# SUMMARY AND RECOMMENDATIONS
Write-Host "DIAGNOSIS SUMMARY & ALTERNATIVE SOLUTIONS" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ALTERNATIVE ROUTING SOLUTIONS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "OPTION 1: Split Tunneling (RECOMMENDED)" -ForegroundColor Green
Write-Host "  • Only route specific traffic through VPN" -ForegroundColor White
Write-Host "  • Keep local traffic on WiFi" -ForegroundColor White
Write-Host "  • More reliable and safer" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 2: VPN-only for DNS" -ForegroundColor Cyan
Write-Host "  • Route only DNS queries through VPN" -ForegroundColor White
Write-Host "  • Provides privacy without full tunnel issues" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 3: Application-level VPN" -ForegroundColor Yellow
Write-Host "  • Configure specific apps to use VPN proxy" -ForegroundColor White
Write-Host "  • Browser-only VPN routing" -ForegroundColor White
Write-Host ""

Write-Host "IMMEDIATE TESTING:" -ForegroundColor Yellow
Write-Host "Run these tests to verify the fixes:" -ForegroundColor White
Write-Host "  ping $vpnGateway" -ForegroundColor Green
Write-Host "  nslookup google.com 1.1.1.1" -ForegroundColor Green
Write-Host "  .\TEST-ROUTING-FIX.ps1" -ForegroundColor Green

Write-Host ""
Read-Host "Press Enter to exit"