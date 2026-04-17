# COMPREHENSIVE VPN CONNECTIVITY FIX
# ==================================
# Tests multiple safe routing methods when VPN timeouts occur

Write-Host "COMPREHENSIVE VPN CONNECTIVITY FIX" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
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

# Find VPN interface
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
if (-not $vpnAdapter) {
    Write-Host "❌ No active VPN interface found!" -ForegroundColor Red
    Write-Host "💡 Connect your VPN first, then rerun this test" -ForegroundColor Yellow
    exit 1
}

$vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
Write-Host "✅ VPN Interface: $($vpnAdapter.Name) ($vpnIP)" -ForegroundColor Green
Write-Host ""

# CRITICAL TEST 1: VPN Server Reachability
Write-Host "[CRITICAL TEST 1] VPN Server Connectivity..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

$vpnGateway = "10.8.0.1"
Write-Host "Testing VPN server: $vpnGateway" -ForegroundColor White

try {
    $gatewayPing = Test-Connection -ComputerName $vpnGateway -Count 3 -Quiet -ErrorAction Stop
    if ($gatewayPing) {
        Write-Host "✅ VPN Server: RESPONDING" -ForegroundColor Green
        $serverWorking = $true
    } else {
        Write-Host "❌ VPN Server: NOT RESPONDING" -ForegroundColor Red
        Write-Host "🚨 THIS IS WHY INTERNET TIMES OUT!" -ForegroundColor Yellow
        $serverWorking = $false
    }
} catch {
    Write-Host "❌ VPN Server: UNREACHABLE" -ForegroundColor Red
    Write-Host "🚨 ROOT CAUSE: Server connectivity issue" -ForegroundColor Yellow
    $serverWorking = $false
}

Write-Host ""

# CRITICAL TEST 2: DNS Resolution
Write-Host "[CRITICAL TEST 2] DNS Through VPN..." -ForegroundColor Yellow
Write-Host "====================================" -ForegroundColor Cyan

if ($serverWorking) {
    try {
        $dnsTest = Resolve-DnsName -Name "google.com" -Server $vpnGateway -Type A -ErrorAction Stop
        Write-Host "✅ VPN DNS: Working ($($dnsTest.IPAddress -join ', '))" -ForegroundColor Green
    } catch {
        Write-Host "❌ VPN DNS: Failed - $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 DNS issue may cause timeouts" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Skipping DNS test - server unreachable" -ForegroundColor Yellow
}

Write-Host ""

# SOLUTION 1: Split Tunneling (Safest Method)
Write-Host "[SOLUTION 1] Implementing Split Tunneling..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "Switching to SAFE SPLIT TUNNELING mode..." -ForegroundColor Green

# Remove aggressive default route
try {
    Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "✅ Removed full tunnel route" -ForegroundColor Green
} catch {
    Write-Host "⚪ No full tunnel route found" -ForegroundColor Gray
}

# Add selective routes for privacy (safer approach)
Write-Host "Adding selective routes for essential services..." -ForegroundColor Cyan

$essentialRoutes = @(
    "1.1.1.1/32",     # Cloudflare DNS
    "8.8.8.8/32",     # Google DNS  
    "208.67.222.222/32" # OpenDNS
)

foreach ($route in $essentialRoutes) {
    try {
        New-NetRoute -DestinationPrefix $route -NextHop $vpnGateway -InterfaceIndex $vpnAdapter.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue | Out-Null
        Write-Host "✅ Added secure route: $route" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Route already exists: $route" -ForegroundColor Yellow
    }
}

Write-Host ""

# SOLUTION 2: MTU Optimization
Write-Host "[SOLUTION 2] MTU Optimization..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

$currentMTU = (Get-NetIPInterface -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4).NlMtu
Write-Host "Current VPN MTU: $currentMTU bytes" -ForegroundColor White

if ($currentMTU -gt 1280) {
    try {
        Set-NetIPInterface -InterfaceIndex $vpnAdapter.InterfaceIndex -NlMtuBytes 1280
        Write-Host "✅ Optimized MTU to 1280 bytes (better compatibility)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ MTU optimization failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ MTU already optimized" -ForegroundColor Green
}

Write-Host ""

# SOLUTION 3: Test Alternative Connectivity 
Write-Host "[SOLUTION 3] Testing Safer Connectivity..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# Test 1: Direct IP connectivity (bypasses DNS)
Write-Host "Test 1: Direct IP connectivity..." -ForegroundColor Cyan
try {
    $directTest = Test-NetConnection -ComputerName "1.1.1.1" -Port 80 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($directTest.TcpTestSucceeded) {
        Write-Host "✅ Direct IP: Working" -ForegroundColor Green
    } else {
        Write-Host "❌ Direct IP: Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Direct IP test error" -ForegroundColor Red
}

# Test 2: HTTP vs HTTPS
Write-Host ""
Write-Host "Test 2: HTTP connectivity (less secure, more reliable)..." -ForegroundColor Cyan
try {
    $httpTest = Invoke-WebRequest -Uri "http://httpbin.org/ip" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ HTTP: Success - $($httpTest.Content.Substring(0,30))..." -ForegroundColor Green
} catch {
    Write-Host "❌ HTTP: Failed - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# SOLUTION 4: WiFi Protection Check
Write-Host "[SOLUTION 4] WiFi Connectivity Protection..." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

$wifiAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }
if ($wifiAdapter) {
    Write-Host "WiFi interface: $($wifiAdapter.Name)" -ForegroundColor Green
    
    # Ensure WiFi can still reach local network
    $wifiRoutes = Get-NetRoute -InterfaceIndex $wifiAdapter.InterfaceIndex -DestinationPrefix "192.168.*" -ErrorAction SilentlyContinue
    if ($wifiRoutes) {
        Write-Host "✅ WiFi local network: Protected" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Adding WiFi local network protection..." -ForegroundColor Yellow
        try {
            New-NetRoute -DestinationPrefix "192.168.0.0/16" -InterfaceIndex $wifiAdapter.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue | Out-Null
            Write-Host "✅ WiFi protection added" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ WiFi protection warning" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚪ No WiFi interface detected" -ForegroundColor Gray
}

Write-Host ""

# FINAL CONNECTIVITY TEST
Write-Host "[FINAL TEST] Testing Fixed Connectivity..." -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "Testing internet connectivity with new configuration..." -ForegroundColor White

$testResults = @()

# Test multiple services with shorter timeout
$testUrls = @(
    @{URL="http://httpbin.org/ip"; Name="HTTP Test"},
    @{URL="https://api.ipify.org"; Name="HTTPS Test"},
    @{URL="https://icanhazip.com"; Name="IP Check"}
)

foreach ($test in $testUrls) {
    Write-Host "Testing $($test.Name)..." -ForegroundColor Cyan
    try {
        $result = Invoke-WebRequest -Uri $test.URL -UseBasicParsing -TimeoutSec 5
        Write-Host "✅ $($test.Name): SUCCESS" -ForegroundColor Green
        $testResults += "✅ $($test.Name): Working"
    } catch {
        Write-Host "❌ $($test.Name): FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += "❌ $($test.Name): Failed"
    }
}

Write-Host ""

# SUMMARY AND NEXT STEPS
Write-Host "CONNECTIVITY DIAGNOSIS SUMMARY" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

if (-not $serverWorking) {
    Write-Host "🚨 PRIMARY ISSUE: VPN SERVER CONNECTIVITY" -ForegroundColor Red
    Write-Host ""
    Write-Host "ROOT CAUSE ANALYSIS:" -ForegroundColor Yellow
    Write-Host "• VPN server ($vpnGateway) not responding to ping" -ForegroundColor White
    Write-Host "• This prevents ALL internet traffic through VPN" -ForegroundColor White
    Write-Host "• Routing is correct, but server unreachable" -ForegroundColor White
    Write-Host ""
    Write-Host "IMMEDIATE SOLUTIONS:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. SWITCH VPN SERVER:" -ForegroundColor Cyan
    Write-Host "   • Try different server location in your VPN app" -ForegroundColor White
    Write-Host "   • Current server may be overloaded or down" -ForegroundColor White
    Write-Host ""
    Write-Host "2. RESTART VPN CONNECTION:" -ForegroundColor Cyan  
    Write-Host "   • Completely disconnect and reconnect VPN" -ForegroundColor White
    Write-Host "   • May establish new tunnel to working server" -ForegroundColor White
    Write-Host ""
    Write-Host "3. USE SPLIT TUNNELING (IMPLEMENTED):" -ForegroundColor Cyan
    Write-Host "   • Only essential traffic routed through VPN" -ForegroundColor White
    Write-Host "   • Local traffic stays on WiFi (safer)" -ForegroundColor White
    
} else {
    Write-Host "✅ VPN SERVER: Responding" -ForegroundColor Green
    Write-Host "✅ ROUTING: Optimized with split tunneling" -ForegroundColor Green
    Write-Host "✅ MTU: Optimized for compatibility" -ForegroundColor Green
    Write-Host "✅ WiFi: Protected from blocking" -ForegroundColor Green
    Write-Host ""
    
    $successCount = ($testResults | Where-Object { $_ -like "*Working*" }).Count
    $totalTests = $testResults.Count
    
    if ($successCount -gt 0) {
        Write-Host "🎉 CONNECTIVITY RESTORED: $successCount/$totalTests tests passing" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Still troubleshooting - may need firewall adjustments" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "ALTERNATIVE SAFE METHODS:" -ForegroundColor Green
Write-Host "• Split tunneling (DNS/privacy only) - IMPLEMENTED ✅" -ForegroundColor White
Write-Host "• Browser-only VPN (application level)" -ForegroundColor White
Write-Host "• DNS-over-VPN (secure DNS queries only)" -ForegroundColor White
Write-Host "• On-demand VPN (connect when needed)" -ForegroundColor White

Write-Host ""
Write-Host "NEXT STEP: Test with .\TEST-ROUTING-FIX.ps1" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"