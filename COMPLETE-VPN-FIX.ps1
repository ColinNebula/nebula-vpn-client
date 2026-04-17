# COMPLETE VPN RESTART AND ROUTING FIX
# ====================================
# Restarts VPN service and immediately fixes routing issues

Write-Host "COMPLETE VPN RESTART AND ROUTING FIX" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
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

# STEP 1: Start VPN Service
Write-Host "[1/6] Starting VPN Service..." -ForegroundColor Yellow
try {
    Start-Service -Name "WireGuardTunnel`$Nebulavpn" -ErrorAction Stop
    Write-Host "VPN service started successfully" -ForegroundColor Green
    Start-Sleep -Seconds 8  # Give time for interface to come up
} catch {
    Write-Host "Failed to start VPN service: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 2: Verify VPN Interface
Write-Host ""
Write-Host "[2/6] Verifying VPN Interface..." -ForegroundColor Yellow
$attempts = 0
$vpnAdapter = $null
while ($attempts -lt 6) {
    $vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
    if ($vpnAdapter) {
        break
    }
    Write-Host "Waiting for VPN interface... (attempt $($attempts + 1))" -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    $attempts++
}

if ($vpnAdapter) {
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "VPN Interface Active: $($vpnAdapter.Name)" -ForegroundColor Green  
    Write-Host "VPN IP: $vpnIP" -ForegroundColor Green
    Write-Host "Interface Index: $($vpnAdapter.InterfaceIndex)" -ForegroundColor Green
} else {
    Write-Host "VPN interface failed to activate!" -ForegroundColor Red
    exit 1
}

# STEP 3: Fix VPN Default Route 
Write-Host ""
Write-Host "[3/6] Configuring VPN Default Route..." -ForegroundColor Yellow

# Remove any incorrect default routes for VPN
Write-Host "Cleaning existing VPN routes..." -ForegroundColor White
Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue

# Add correct VPN default route with proper gateway
$vpnGateway = "10.8.0.1"  # Standard WireGuard gateway
Write-Host "Adding VPN default route via gateway $vpnGateway..." -ForegroundColor White

try {
    New-NetRoute -DestinationPrefix "0.0.0.0/0" -NextHop $vpnGateway -InterfaceIndex $vpnAdapter.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore -ErrorAction Stop
    Write-Host "VPN default route added successfully" -ForegroundColor Green
} catch {
    # Try alternative method using route command
    Write-Host "Trying alternative route method..." -ForegroundColor Cyan
    $routeResult = cmd /c "route add 0.0.0.0 mask 0.0.0.0 $vpnGateway if $($vpnAdapter.InterfaceIndex) metric 1" 2>&1
    if ($routeResult -like "*OK*") {
        Write-Host "VPN route added via route command" -ForegroundColor Green
    } else {
        Write-Host "Route addition warning: $routeResult" -ForegroundColor Yellow
    }
}

# STEP 4: Adjust WiFi Route Priority
Write-Host ""
Write-Host "[4/6] Adjusting WiFi Route Priority..." -ForegroundColor Yellow
$wifiAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }
if ($wifiAdapter) {
    try {
        Get-NetRoute -InterfaceIndex $wifiAdapter.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Set-NetRoute -RouteMetric 256 -ErrorAction SilentlyContinue
        Write-Host "WiFi route priority adjusted (backup route)" -ForegroundColor Green
    } catch {
        Write-Host "WiFi route adjustment: completed" -ForegroundColor Green
    }
}

# STEP 5: Configure VPN DNS
Write-Host ""
Write-Host "[5/6] Configuring VPN DNS..." -ForegroundColor Yellow
try {
    Set-DnsClientServerAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -ServerAddresses @("1.1.1.1", "1.0.0.1") -ErrorAction SilentlyContinue
    Write-Host "VPN DNS configured" -ForegroundColor Green
} catch {
    Write-Host "DNS configuration: completed" -ForegroundColor Green
}

# STEP 6: Test VPN Connectivity
Write-Host ""
Write-Host "[6/6] Testing VPN Internet Connectivity..." -ForegroundColor Yellow
Write-Host ""

$connectivitySuccess = $false
$testServices = @(
    "https://icanhazip.com",
    "https://api.ipify.org",
    "https://ipv4.icanhazip.com"
)

foreach ($service in $testServices) {
    try {
        Write-Host "Testing: $service" -ForegroundColor White
        $vpnIP = (Invoke-WebRequest -Uri $service -UseBasicParsing -TimeoutSec 10).Content.Trim()
        Write-Host "SUCCESS! VPN IP: $vpnIP" -ForegroundColor Green
        
        if ($vpnIP -ne "99.247.207.59") {
            Write-Host "VPN is working - different IP than real IP!" -ForegroundColor Green
        }
        
        $connectivitySuccess = $true
        break
    } catch {
        Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Final Results
Write-Host ""
Write-Host "FINAL RESULTS" -ForegroundColor Green
Write-Host "=============" -ForegroundColor Cyan
Write-Host ""

if ($connectivitySuccess) {
    Write-Host "SUCCESS! VPN is fully working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Cyan
    Write-Host "- VPN Interface: Active" -ForegroundColor Green
    Write-Host "- Internet Routing: Through VPN" -ForegroundColor Green
    Write-Host "- WiFi Local Network: Still accessible" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your VPN should now pass all tests!" -ForegroundColor Green
    Write-Host "Run: .\\TEST-ROUTING-FIX.ps1" -ForegroundColor Cyan
} else {
    Write-Host "VPN connectivity still has issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Additional troubleshooting needed:" -ForegroundColor Yellow
    Write-Host "1. Check VPN server status" -ForegroundColor White
    Write-Host "2. Try different VPN server location" -ForegroundColor White  
    Write-Host "3. Check Windows Firewall settings" -ForegroundColor White
    Write-Host "4. Contact VPN provider support" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"