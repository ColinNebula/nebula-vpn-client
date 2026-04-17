# VPN SERVER CONNECTIVITY DIAGNOSIS
# =================================
# Diagnoses VPN server connectivity issues after routing is correctly configured

Write-Host "VPN SERVER CONNECTIVITY DIAGNOSIS" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check Administrator status
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running as Administrator: YES" -ForegroundColor Green
Write-Host ""

# STEP 1: Verify VPN tunnel configuration
Write-Host "[1] VPN Tunnel Status Check..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
if ($vpnAdapter) {
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "VPN Interface: $($vpnAdapter.Name) - Active" -ForegroundColor Green
    Write-Host "VPN IP: $vpnIP" -ForegroundColor Green
    Write-Host "Interface Index: $($vpnAdapter.InterfaceIndex)" -ForegroundColor Green
} else {
    Write-Host "ERROR: VPN interface not active!" -ForegroundColor Red
    exit 1
}

# STEP 2: Test VPN Gateway Connectivity  
Write-Host ""
Write-Host "[2] VPN Gateway Connectivity Test..." -ForegroundColor Yellow
$vpnGateway = "10.8.0.1"
Write-Host "Testing VPN gateway: $vpnGateway" -ForegroundColor Cyan

try {
    $gatewayPing = Test-Connection -ComputerName $vpnGateway -Count 3 -Quiet -ErrorAction Stop
    if ($gatewayPing) {
        Write-Host "SUCCESS: VPN gateway is reachable" -ForegroundColor Green
    } else {
        Write-Host "CRITICAL: VPN gateway is NOT reachable" -ForegroundColor Red
        Write-Host "This explains why internet traffic fails!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "CRITICAL: VPN gateway test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# STEP 3: Check WireGuard Configuration
Write-Host ""
Write-Host "[3] WireGuard Configuration Analysis..." -ForegroundColor Yellow

# Check for WireGuard config file
$configPath = "C:\Program Files\WireGuard\Data\Configurations\Nebulavpn.conf.dpapi"
if (Test-Path $configPath) {
    Write-Host "WireGuard config file found: YES" -ForegroundColor Green
} else {
    Write-Host "WireGuard config file: Missing or different location" -ForegroundColor Yellow
}

# Check WireGuard service status
$wgService = Get-Service -Name "WireGuardTunnel`$Nebulavpn" -ErrorAction SilentlyContinue
if ($wgService) {
    Write-Host "WireGuard service status: $($wgService.Status)" -ForegroundColor Green
} else {
    Write-Host "WireGuard service: Not found" -ForegroundColor Red
}

# STEP 4: DNS Resolution Test
Write-Host ""
Write-Host "[4] DNS Resolution Test..." -ForegroundColor Yellow
try {
    $dnsTest = Resolve-DnsName -Name "google.com" -Server "1.1.1.1" -Type A -ErrorAction Stop
    Write-Host "DNS resolution: Working" -ForegroundColor Green
} catch {
    Write-Host "DNS resolution: Failed - $($_.Exception.Message)" -ForegroundColor Red
}

# STEP 5: Firewall Analysis
Write-Host ""
Write-Host "[5] Windows Firewall Analysis..." -ForegroundColor Yellow
try {
    $firewallProfiles = Get-NetFirewallProfile
    $blockingProfiles = @()
    
    foreach ($profile in $firewallProfiles) {
        if ($profile.Enabled -eq $true) {
            Write-Host "Firewall $($profile.Name): ENABLED" -ForegroundColor Yellow
            $blockingProfiles += $profile.Name
        }
    }
    
    if ($blockingProfiles.Count -gt 0) {
        Write-Host ""
        Write-Host "POTENTIAL ISSUE: Active firewall profiles may be blocking VPN traffic" -ForegroundColor Yellow
        Write-Host "Blocking profiles: $($blockingProfiles -join ', ')" -ForegroundColor White
    }
} catch {
    Write-Host "Firewall check: Failed to analyze" -ForegroundColor Yellow
}

# STEP 6: MTU Size Check
Write-Host ""
Write-Host "[6] MTU Configuration Check..." -ForegroundColor Yellow
$vpnMTU = (Get-NetIPInterface -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4).NlMtu
Write-Host "VPN interface MTU: $vpnMTU" -ForegroundColor White
if ($vpnMTU -gt 1280) {
    Write-Host "MTU size: Normal ($vpnMTU)" -ForegroundColor Green
} else {
    Write-Host "MTU size: May be too small ($vpnMTU)" -ForegroundColor Yellow
}

# STEP 7: Alternative Connectivity Test
Write-Host ""
Write-Host "[7] Alternative Connectivity Tests..." -ForegroundColor Yellow

# Test basic ICMP to known servers
Write-Host "Testing ICMP to Google DNS (8.8.8.8)..." -ForegroundColor Cyan
try {
    $icmpTest = Test-Connection -ComputerName "8.8.8.8" -Count 2 -Quiet -ErrorAction Stop
    if ($icmpTest) {
        Write-Host "ICMP to 8.8.8.8: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "ICMP to 8.8.8.8: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "ICMP test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test with shorter timeout
Write-Host ""
Write-Host "Testing HTTP with reduced timeout..." -ForegroundColor Cyan
try {
    $quickTest = Invoke-WebRequest -Uri "https://httpbin.org/ip" -UseBasicParsing -TimeoutSec 5
    Write-Host "Quick HTTP test: SUCCESS" -ForegroundColor Green
    Write-Host "Response: $($quickTest.Content)" -ForegroundColor White
} catch {
    Write-Host "Quick HTTP test: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# STEP 8: Recommended Fixes
Write-Host ""
Write-Host "DIAGNOSIS SUMMARY & FIXES" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PRIORITY FIXES (try in order):" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. FIREWALL FIX - Temporarily disable Windows Firewall" -ForegroundColor Cyan
Write-Host "   Run as Administrator:" -ForegroundColor White
Write-Host "   Set-NetFirewallProfile -All -Enabled False" -ForegroundColor Green
Write-Host "   Test internet, then re-enable if it works" -ForegroundColor White
Write-Host ""

Write-Host "2. VPN SERVER RECONNECTION" -ForegroundColor Cyan
Write-Host "   • Disconnect VPN completely" -ForegroundColor White
Write-Host "   • Wait 30 seconds" -ForegroundColor White
Write-Host "   • Try different VPN server location" -ForegroundColor White
Write-Host "   • Reconnect VPN" -ForegroundColor White
Write-Host ""

Write-Host "3. MTU OPTIMIZATION" -ForegroundColor Cyan
Write-Host "   Run as Administrator:" -ForegroundColor White
Write-Host "   Set-NetIPInterface -InterfaceIndex $($vpnAdapter.InterfaceIndex) -NlMtuBytes 1200" -ForegroundColor Green
Write-Host ""

Write-Host "4. ROUTE REFRESH" -ForegroundColor Cyan
Write-Host "   Run: .\COMPLETE-VPN-FIX.ps1 again" -ForegroundColor Green
Write-Host ""

Write-Host "IMMEDIATE TEST COMMANDS:" -ForegroundColor Yellow
Write-Host "After trying each fix, test with:" -ForegroundColor White
Write-Host "  ping 8.8.8.8" -ForegroundColor Green
Write-Host "  .\TEST-ROUTING-FIX.ps1" -ForegroundColor Green

Write-Host ""
Read-Host "Press Enter to exit"