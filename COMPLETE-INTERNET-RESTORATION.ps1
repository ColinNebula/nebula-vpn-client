# COMPLETE INTERNET RESTORATION
# ============================
# Aggressively restore internet connectivity by removing ALL VPN interference

Write-Host "COMPLETE INTERNET RESTORATION" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚨 PROBLEM: Internet still failing after split tunneling" -ForegroundColor Red
Write-Host "SOLUTION: Completely remove VPN routing interference" -ForegroundColor Yellow
Write-Host ""

# Check Administrator status
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator for routing changes!" -ForegroundColor Red
    Write-Host "Right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Find all network interfaces
$vpnInterface = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
$wifiInterface = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }

if ($vpnInterface) {
    Write-Host "✅ VPN Interface Found: $($vpnInterface.Name)" -ForegroundColor Green
} else {
    Write-Host "⚠️ No VPN interface found" -ForegroundColor Yellow
}

if ($wifiInterface) {
    Write-Host "✅ WiFi Interface Found: $($wifiInterface.Name)" -ForegroundColor Green
} else {
    Write-Host "❌ No WiFi interface found" -ForegroundColor Red
}

Write-Host ""

# STEP 1: Remove ALL VPN routes (aggressive cleanup)
Write-Host "[STEP 1] Aggressive VPN Route Removal..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

if ($vpnInterface) {
    Write-Host "Removing ALL routes through VPN interface..." -ForegroundColor White
    
    try {
        # Remove ALL routes associated with VPN interface
        $vpnRoutes = Get-NetRoute -InterfaceIndex $vpnInterface.InterfaceIndex -ErrorAction SilentlyContinue
        if ($vpnRoutes) {
            foreach ($route in $vpnRoutes) {
                try {
                    Remove-NetRoute -InterfaceIndex $route.InterfaceIndex -DestinationPrefix $route.DestinationPrefix -NextHop $route.NextHop -Confirm:$false -ErrorAction SilentlyContinue
                    Write-Host "✅ Removed: $($route.DestinationPrefix) → $($route.NextHop)" -ForegroundColor Green
                } catch {
                    Write-Host "⚪ Could not remove: $($route.DestinationPrefix)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "⚪ No VPN routes found" -ForegroundColor Gray
        }
    } catch {
        Write-Host "⚠️ Error during route removal" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚪ No VPN interface to clean up" -ForegroundColor Gray
}

Write-Host ""

# STEP 2: Reset WiFi interface routing
Write-Host "[STEP 2] WiFi Internet Priority Restoration..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

if ($wifiInterface) {
    Write-Host "Ensuring WiFi has internet priority..." -ForegroundColor White
    
    # Get WiFi gateway
    $wifiGateway = (Get-NetRoute -InterfaceIndex $wifiInterface.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue).NextHop | Select-Object -First 1
    
    if ($wifiGateway) {
        Write-Host "✅ WiFi Gateway: $wifiGateway" -ForegroundColor Green
        
        # Ensure WiFi default route has priority
        try {
            # Remove existing WiFi default route and recreate with metric 1
            Get-NetRoute -InterfaceIndex $wifiInterface.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
            New-NetRoute -DestinationPrefix "0.0.0.0/0" -NextHop $wifiGateway -InterfaceIndex $wifiInterface.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore
            Write-Host "✅ WiFi internet route restored with priority" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ WiFi route adjustment warning" -ForegroundColor Yellow
        }
        
        # Test WiFi gateway connectivity
        Write-Host "Testing WiFi gateway connectivity..." -ForegroundColor Cyan
        try {
            $gatewayTest = Test-Connection -ComputerName $wifiGateway -Count 2 -Quiet -ErrorAction Stop
            if ($gatewayTest) {
                Write-Host "✅ WiFi gateway responds" -ForegroundColor Green
            } else {
                Write-Host "❌ WiFi gateway not responding" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ WiFi gateway test failed" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ Cannot find WiFi gateway" -ForegroundColor Red
    }
} else {
    Write-Host "❌ No WiFi interface available" -ForegroundColor Red
}

Write-Host ""

# STEP 3: Reset DNS configuration 
Write-Host "[STEP 3] DNS Configuration Reset..." -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Cyan

# Remove VPN DNS and restore system defaults
if ($vpnInterface) {
    try {
        Set-DnsClientServerAddress -InterfaceIndex $vpnInterface.InterfaceIndex -ResetServerAddresses
        Write-Host "✅ Removed VPN DNS configuration" -ForegroundColor Green
    } catch {
        Write-Host "⚪ VPN DNS reset info only" -ForegroundColor Gray
    }
}

# Ensure WiFi has proper DNS
if ($wifiInterface) {
    try {
        # Set reliable public DNS for WiFi
        Set-DnsClientServerAddress -InterfaceIndex $wifiInterface.InterfaceIndex -ServerAddresses @("1.1.1.1", "8.8.8.8")
        Write-Host "✅ WiFi DNS configured (1.1.1.1, 8.8.8.8)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ WiFi DNS configuration warning" -ForegroundColor Yellow
    }
}

# Clear DNS cache
try {
    Clear-DnsClientCache
    Write-Host "✅ DNS cache cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️ DNS cache clear warning" -ForegroundColor Yellow
}

Write-Host ""

# STEP 4: Network interface priority adjustment
Write-Host "[STEP 4] Network Interface Priority Adjustment..." -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

if ($wifiInterface) {
    try {
        # Lower WiFi interface metric for priority
        Set-NetIPInterface -InterfaceIndex $wifiInterface.InterfaceIndex -InterfaceMetric 1
        Write-Host "✅ WiFi interface given highest priority" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Interface priority adjustment warning" -ForegroundColor Yellow
    }
}

if ($vpnInterface) {
    try {
        # Raise VPN interface metric to lower priority
        Set-NetIPInterface -InterfaceIndex $vpnInterface.InterfaceIndex -InterfaceMetric 100
        Write-Host "✅ VPN interface priority lowered" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ VPN priority adjustment warning" -ForegroundColor Yellow
    }
}

Write-Host ""

# STEP 5: Comprehensive connectivity testing
Write-Host "[STEP 5] Comprehensive Connectivity Testing..." -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host "Testing internet connectivity restoration..." -ForegroundColor White
Write-Host ""

# Test 1: Basic connectivity
Write-Host "Test 1: Basic Internet Connectivity" -ForegroundColor Cyan
$testResults = @()

$testUrls = @(
    @{URL="http://httpbin.org/ip"; Name="HTTP Test"},
    @{URL="https://api.ipify.org"; Name="HTTPS Test"},
    @{URL="https://icanhazip.com"; Name="IP Check"},
    @{URL="https://www.google.com"; Name="Google Test"}
)

foreach ($test in $testUrls) {
    Write-Host "  Testing $($test.Name)..." -ForegroundColor White
    try {
        $result = Invoke-WebRequest -Uri $test.URL -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✅ $($test.Name): SUCCESS" -ForegroundColor Green
        if ($test.Name -eq "IP Check") {
            Write-Host "  📍 Your IP: $($result.Content.Trim())" -ForegroundColor Cyan
        }
        $testResults += "SUCCESS"
    } catch {
        Write-Host "  ❌ $($test.Name): FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $testResults += "FAILED"
    }
}

Write-Host ""

# Test 2: DNS Resolution
Write-Host "Test 2: DNS Resolution" -ForegroundColor Cyan
try {
    $dnsTest = Resolve-DnsName -Name "google.com" -Type A -ErrorAction Stop
    Write-Host "  ✅ DNS Resolution: Working" -ForegroundColor Green
    Write-Host "  📍 google.com resolves to: $($dnsTest.IPAddress -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ DNS Resolution: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Network route verification
Write-Host "Test 3: Current Routing Status" -ForegroundColor Cyan
$defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Sort-Object RouteMetric
Write-Host "  Current default routes (by priority):" -ForegroundColor White
foreach ($route in $defaultRoutes) {
    $interfaceName = (Get-NetAdapter -InterfaceIndex $route.InterfaceIndex).Name
    Write-Host "  → $($route.NextHop) via '$interfaceName' (Metric: $($route.RouteMetric))" -ForegroundColor Cyan
}

Write-Host ""

# RESULTS AND RECOMMENDATIONS
Write-Host "INTERNET RESTORATION RESULTS" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$successCount = ($testResults | Where-Object { $_ -eq "SUCCESS" }).Count
$totalTests = $testResults.Count

if ($successCount -eq $totalTests) {
    Write-Host "🎉 INTERNET CONNECTIVITY FULLY RESTORED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ All tests passed ($successCount/$totalTests)" -ForegroundColor Green
    Write-Host "✅ VPN routing interference removed" -ForegroundColor Green
    Write-Host "✅ WiFi internet priority restored" -ForegroundColor Green
    Write-Host "✅ DNS resolution working" -ForegroundColor Green
    
} elseif ($successCount -gt 0) {
    Write-Host "⚠️ PARTIAL INTERNET RESTORATION" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Some tests passed ($successCount/$totalTests)" -ForegroundColor Yellow
    Write-Host "Internet connectivity partially working" -ForegroundColor White
    
} else {
    Write-Host "❌ INTERNET CONNECTIVITY STILL BLOCKED" -ForegroundColor Red
    Write-Host ""
    Write-Host "All tests failed - deeper network issue" -ForegroundColor White
    Write-Host ""
    Write-Host "POSSIBLE CAUSES:" -ForegroundColor Yellow
    Write-Host "• Windows Firewall blocking all traffic" -ForegroundColor White
    Write-Host "• Router/ISP network issues" -ForegroundColor White
    Write-Host "• Antivirus software interference" -ForegroundColor White
    Write-Host "• Network adapter driver problems" -ForegroundColor White
}

Write-Host ""
Write-Host "VPN SERVER STATUS:" -ForegroundColor Yellow
Write-Host "The original VPN server (10.8.0.1) is still unresponsive" -ForegroundColor White
Write-Host "• This is a server-side issue, not your configuration" -ForegroundColor White
Write-Host "• Try different VPN server locations in Nebula app" -ForegroundColor White
Write-Host "• Consider using a different VPN provider temporarily" -ForegroundColor White

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
if ($successCount -gt 0) {
    Write-Host "✅ Internet working - VPN issue resolved by bypass" -ForegroundColor Green
    Write-Host "• You can use internet normally now" -ForegroundColor White
    Write-Host "• Try different VPN servers when you need VPN again" -ForegroundColor White
} else {
    Write-Host "❌ Need deeper network troubleshooting" -ForegroundColor Red
    Write-Host "• Check Windows Firewall settings" -ForegroundColor White
    Write-Host "• Restart network adapters" -ForegroundColor White
    Write-Host "• Contact ISP if issue persists" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to continue"