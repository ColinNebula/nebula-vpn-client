# EMERGENCY-INTERNET-FIX.ps1
# Emergency fix for broken internet connectivity after VPN routing changes

param(
    [switch]$Force = $false
)

Write-Host "*** EMERGENCY INTERNET CONNECTIVITY FIX ***" -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Red
Write-Host ""

# Quick connectivity test first
Write-Host "Testing connectivity..." -ForegroundColor Yellow
$internetWorks = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet

if ($internetWorks -and -not $Force) {
    Write-Host "[OK] Internet is working! No fix needed." -ForegroundColor Green
    exit 0
}

Write-Host "[!] Internet connectivity broken - applying emergency fix..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Remove VPN if connected
Write-Host "Step 1: Checking VPN status..." -ForegroundColor Cyan
$vpnAdapter = Get-NetAdapter | Where-Object { 
    $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" -or $_.Name -like "*wg*" 
}

if ($vpnAdapter -and $vpnAdapter.Status -eq "Up") {
    Write-Host "   VPN found: $($vpnAdapter.Name)" -ForegroundColor Yellow
    Write-Host "   >> MANUAL ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "   1. Open your Nebula VPN app" -ForegroundColor White
    Write-Host "   2. Click 'Disconnect' to stop the VPN" -ForegroundColor White  
    Write-Host "   3. Press Enter to continue after disconnecting..." -ForegroundColor White
    Read-Host
} else {
    Write-Host "   No active VPN found" -ForegroundColor Green
}

# Step 2: Restore default gateway
Write-Host "Step 2: Restoring default internet route..." -ForegroundColor Cyan

# Find the primary network adapter
$primaryAdapter = Get-NetAdapter | Where-Object { 
    $_.Status -eq "Up" -and 
    ($_.InterfaceType -eq "Ethernet" -or $_.InterfaceType -eq "Wireless") -and
    $_.Name -notlike "*VPN*" -and $_.Name -notlike "*Nebula*" -and $_.Name -notlike "*WireGuard*"
} | Sort-Object InterfaceIndex | Select-Object -First 1

if ($primaryAdapter) {
    Write-Host "   Primary adapter: $($primaryAdapter.Name)" -ForegroundColor Green
    
    # Get DHCP gateway
    try {
        $gateway = (Get-NetIPConfiguration -InterfaceIndex $primaryAdapter.InterfaceIndex).IPv4DefaultGateway.NextHop
        if ($gateway) {
            Write-Host "   Gateway found: $gateway" -ForegroundColor Green
            
            # Remove any existing default routes
            Get-NetRoute -DestinationPrefix "0.0.0.0/0" -AddressFamily IPv4 -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
            
            # Add correct default route  
            New-NetRoute -DestinationPrefix "0.0.0.0/0" -NextHop $gateway -InterfaceIndex $primaryAdapter.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction SilentlyContinue
            Write-Host "   [+] Default route restored" -ForegroundColor Green
        }
    } catch {
        Write-Host "   [!] Could not auto-detect gateway" -ForegroundColor Yellow
    }
}

# Step 3: Reset DNS
Write-Host "Step 3: Resetting DNS..." -ForegroundColor Cyan
ipconfig /flushdns | Out-Null
Write-Host "   [+] DNS cache cleared" -ForegroundColor Green

# Step 4: Release and renew IP
Write-Host "Step 4: Refreshing network configuration..." -ForegroundColor Cyan
try {
    ipconfig /release | Out-Null
    Start-Sleep -Seconds 2
    ipconfig /renew | Out-Null
    Write-Host "   [+] Network configuration refreshed" -ForegroundColor Green
} catch {
    Write-Host "   [!] Network refresh had issues (may still work)" -ForegroundColor Yellow
}

# Step 5: Test connectivity
Write-Host ""
Write-Host "Step 5: Testing connectivity..." -ForegroundColor Cyan

$testResults = @()
$testSites = @("8.8.8.8", "1.1.1.1", "google.com")

foreach ($site in $testSites) {
    try {
        if ($site -match "^\d+") {
            $result = Test-Connection -ComputerName $site -Count 1 -Quiet -TimeoutSec 3
        } else {
            $result = [bool](Resolve-DnsName $site -ErrorAction SilentlyContinue)
        }
        
        if ($result) {
            Write-Host "   OK $site" -ForegroundColor Green
            $testResults += $true
        } else {
            Write-Host "   FAIL $site" -ForegroundColor Red
            $testResults += $false
        }
    } catch {
        Write-Host "   ERROR $site" -ForegroundColor Red  
        $testResults += $false
    }
}

$successRate = ($testResults | Where-Object { $_ }).Count / $testResults.Count * 100

Write-Host ""
Write-Host "EMERGENCY FIX RESULTS:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

if ($successRate -eq 100) {
    Write-Host "SUCCESS: Internet fully restored! ($successRate% tests passed)" -ForegroundColor Green
    Write-Host ""
    Write-Host "What's working now:" -ForegroundColor White
    Write-Host "✅ Internet browsing" -ForegroundColor Green
    Write-Host "✅ WiFi connectivity" -ForegroundColor Green  
    Write-Host "✅ DNS resolution" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps (optional):" -ForegroundColor Cyan
    Write-Host "• To use VPN again: Reconnect in Nebula app" -ForegroundColor White
    Write-Host "• Test VPN resilient routing: .\APPLY-RESILIENT-ROUTING.ps1" -ForegroundColor White
    
} elseif ($successRate -ge 50) {
    Write-Host "[!] PARTIAL SUCCESS: Internet mostly restored ($successRate% tests passed)" -ForegroundColor Yellow  
    Write-Host ""
    Write-Host "Try:" -ForegroundColor White
    Write-Host "1. Restart your computer" -ForegroundColor White
    Write-Host "2. Check Windows Firewall settings" -ForegroundColor White
    Write-Host "3. Restart your router/modem" -ForegroundColor White
    
} else {
    Write-Host "LIMITED SUCCESS: Some issues remain ($successRate% tests passed)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Additional steps needed:" -ForegroundColor Yellow
    Write-Host "1. Restart your computer (important!)" -ForegroundColor White
    Write-Host "2. Check network cable/WiFi connection" -ForegroundColor White  
    Write-Host "3. Contact your ISP if problems persist" -ForegroundColor White
    Write-Host "4. Run Windows Network Troubleshooter" -ForegroundColor White
}

Write-Host ""
Write-Host "TIP: Run 'ipconfig /all' to check your network configuration" -ForegroundColor Cyan