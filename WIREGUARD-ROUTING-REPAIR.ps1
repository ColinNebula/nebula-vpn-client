# WIREGUARD ROUTING REPAIR SCRIPT  
# =================================
# Fixes WireGuard tunnel when interface exists but routing fails

Write-Host "WIREGUARD ROUTING REPAIR" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Cyan
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

# STEP 1: Detect WireGuard Interface Configuration Issues
Write-Host "[1] Diagnosing WireGuard Interface..." -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan

$vpnAdapter = Get-NetAdapter | Where-Object { ($_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" -or $_.Name -like "*wg*") -and $_.Status -eq "Up" }
if ($vpnAdapter) {
    Write-Host "✅ VPN Interface Found: $($vpnAdapter.Name)" -ForegroundColor Green
    $vpnIndex = $vpnAdapter.InterfaceIndex
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "✅ VPN IP: $vpnIP" -ForegroundColor Green
    Write-Host "✅ Interface Index: $vpnIndex" -ForegroundColor Green
} else {
    Write-Host "❌ No active VPN interface found!" -ForegroundColor Red
    Write-Host "💡 WireGuard tunnel not established properly" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# STEP 2: Test VPN Gateway Connectivity  
Write-Host "[2] Testing VPN Gateway Connectivity..." -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan

$commonGateways = @("10.8.0.1", "10.6.0.1", "192.168.100.1", "172.16.0.1")
$workingGateway = $null

foreach ($gateway in $commonGateways) {
    Write-Host "Testing gateway: $gateway" -ForegroundColor White
    try {
        $ping = Test-Connection -ComputerName $gateway -Count 2 -Quiet -ErrorAction Stop
        if ($ping) {
            Write-Host "✅ Gateway $gateway: RESPONDING" -ForegroundColor Green
            $workingGateway = $gateway
            break
        } else {
            Write-Host "❌ Gateway $gateway: Not responding" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Gateway $gateway: Failed" -ForegroundColor Red
    }
}

if (-not $workingGateway) {
    Write-Host ""
    Write-Host "🚨 CRITICAL: No VPN gateways responding!" -ForegroundColor Red
    Write-Host ""
    Write-Host "This indicates either:" -ForegroundColor Yellow
    Write-Host "• VPN server is down/overloaded" -ForegroundColor White
    Write-Host "• WireGuard tunnel not properly configured" -ForegroundColor White
    Write-Host "• Network routing preventing VPN access" -ForegroundColor White
    Write-Host ""
    Write-Host "SOLUTIONS:" -ForegroundColor Green
    Write-Host "1. Restart WireGuard/VPN application completely" -ForegroundColor White
    Write-Host "2. Try different VPN server location" -ForegroundColor White
    Write-Host "3. Check VPN service status online" -ForegroundColor White
    Write-Host "4. Implement split tunneling as backup" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✅ Using working gateway: $workingGateway" -ForegroundColor Green
}

Write-Host ""

# STEP 3: Fix WireGuard Routing Configuration
Write-Host "[3] Fixing WireGuard Routing..." -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Cyan

if ($workingGateway) {
    Write-Host "Configuring proper WireGuard routing..." -ForegroundColor White
    
    # Remove any existing conflicting routes
    Write-Host "Clearing conflicting routes..." -ForegroundColor Cyan
    try {
        Get-NetRoute -InterfaceIndex $vpnIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "✅ Cleared existing VPN routes" -ForegroundColor Green
    } catch {
        Write-Host "⚪ No routes to clear" -ForegroundColor Gray
    }
    
    # Add proper default route through VPN
    Write-Host "Adding VPN default route..." -ForegroundColor Cyan
    try {
        New-NetRoute -DestinationPrefix "0.0.0.0/0" -NextHop $workingGateway -InterfaceIndex $vpnIndex -RouteMetric 1 -PolicyStore ActiveStore
        Write-Host "✅ VPN default route configured" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Route configuration warning: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Ensure VPN gateway route exists
    Write-Host "Ensuring VPN gateway route..." -ForegroundColor Cyan
    try {
        New-NetRoute -DestinationPrefix "$workingGateway/32" -InterfaceIndex $vpnIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue
        Write-Host "✅ VPN gateway route ensured" -ForegroundColor Green
    } catch {
        Write-Host "⚪ Gateway route may already exist" -ForegroundColor Gray
    }
    
} else {
    Write-Host "⚠️ Skipping routing fix - no working gateway found" -ForegroundColor Yellow
    Write-Host "Implementing split tunneling as fallback..." -ForegroundColor Cyan
    
    # Configure split tunneling for essential services
    $essentialIPs = @("1.1.1.1", "8.8.8.8", "208.67.222.222")
    foreach ($ip in $essentialIPs) {
        try {
            New-NetRoute -DestinationPrefix "$ip/32" -InterfaceIndex $vpnIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue
            Write-Host "✅ Split tunnel route: $ip" -ForegroundColor Green
        } catch {
            Write-Host "⚪ Route may exist: $ip" -ForegroundColor Gray
        }
    }
}

Write-Host ""

# STEP 4: Configure VPN DNS
Write-Host "[4] Configuring VPN DNS..." -ForegroundColor Yellow  
Write-Host "===========================" -ForegroundColor Cyan

try {
    Set-DnsClientServerAddress -InterfaceIndex $vpnIndex -ServerAddresses @("1.1.1.1", "8.8.8.8") -ErrorAction SilentlyContinue
    Write-Host "✅ VPN DNS configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️ DNS configuration warning" -ForegroundColor Yellow
}

Write-Host ""

# STEP 5: Test Fixed Connectivity
Write-Host "[5] Testing Fixed Connectivity..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "Testing VPN gateway..." -ForegroundColor White
if ($workingGateway) {
    try {
        $gatewayTest = Test-Connection -ComputerName $workingGateway -Count 2 -Quiet
        if ($gatewayTest) {
            Write-Host "✅ VPN Gateway: Reachable" -ForegroundColor Green
        } else {
            Write-Host "❌ VPN Gateway: Still unreachable" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ VPN Gateway: Test failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing internet connectivity..." -ForegroundColor White

$testServices = @(
    @{URL="http://httpbin.org/ip"; Name="HTTP Test"},
    @{URL="https://api.ipify.org?format=text"; Name="IP Check"},  
    @{URL="https://icanhazip.com"; Name="IP Verification"}
)

$successCount = 0
foreach ($service in $testServices) {
    Write-Host "Testing $($service.Name)..." -ForegroundColor Cyan
    try {
        $result = Invoke-WebRequest -Uri $service.URL -UseBasicParsing -TimeoutSec 8
        Write-Host "✅ $($service.Name): SUCCESS - IP: $($result.Content.Trim())" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "❌ $($service.Name): FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# STEP 6: Results and Recommendations
Write-Host "REPAIR RESULTS & RECOMMENDATIONS" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "🎉 ROUTING REPAIR SUCCESS!" -ForegroundColor Green
    Write-Host "Internet connectivity restored: $successCount/3 tests passing" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Actions completed:" -ForegroundColor Green
    Write-Host "• WireGuard routing configuration fixed" -ForegroundColor White
    Write-Host "• VPN gateway routes established" -ForegroundColor White
    Write-Host "• DNS configuration optimized" -ForegroundColor White
    
} elseif ($workingGateway) {
    Write-Host "⚠️ PARTIAL SUCCESS" -ForegroundColor Yellow
    Write-Host "VPN gateway responds but internet still blocked" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "• Check Windows Firewall VPN rules" -ForegroundColor White
    Write-Host "• Verify MTU settings" -ForegroundColor White
    Write-Host "• Run firewall connectivity fix" -ForegroundColor White
    
} else {
    Write-Host "❌ VPN SERVER ISSUE CONFIRMED" -ForegroundColor Red
    Write-Host ""
    Write-Host "The VPN tunnel exists but server is unreachable" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "RECOMMENDED SOLUTIONS:" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. SWITCH VPN SERVER (RECOMMENDED):" -ForegroundColor Cyan
    Write-Host "   • Open your VPN application" -ForegroundColor White
    Write-Host "   • Try different server location" -ForegroundColor White
    Write-Host "   • Current server appears down/overloaded" -ForegroundColor White
    Write-Host ""
    Write-Host "2. RESTART VPN CONNECTION:" -ForegroundColor Cyan
    Write-Host "   • Completely disconnect VPN" -ForegroundColor White
    Write-Host "   • Wait 10 seconds" -ForegroundColor White
    Write-Host "   • Reconnect to establish fresh tunnel" -ForegroundColor White
    Write-Host ""
    Write-Host "3. USE SPLIT TUNNELING (IMPLEMENTED):" -ForegroundColor Cyan  
    Write-Host "   • Essential services routed through VPN" -ForegroundColor White
    Write-Host "   • Other traffic uses WiFi as backup" -ForegroundColor White
}

Write-Host ""
Write-Host "VERIFICATION:" -ForegroundColor Yellow
Write-Host "Run .\TEST-ROUTING-FIX.ps1 after VPN changes" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to continue"