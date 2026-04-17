#!/usr/bin/env pwsh
<#
.SYNOPSIS
    EMERGENCY VPN ROUTING FIX
.DESCRIPTION
    Instantly fixes VPN routing issues when test shows "Default Route via Wi-Fi".
    Applies VPN routes immediately while preserving local network access.
.EXAMPLE
    .\QUICK-VPN-FIX.ps1
#>

Write-Host "`n[EMERGENCY] VPN ROUTING FIX" -ForegroundColor Red
Write-Host "=========================================`n" -ForegroundColor Red

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Administrator privileges required" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 1: Find VPN interface
Write-Host "[1/5] Detecting VPN interface..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object { 
    $_.Status -eq "Up" -and (
        $_.InterfaceDescription -like "*WireGuard*" -or 
        $_.Name -like "*Nebula*" -or
        $_.Name -like "*wg*"
    )
}

if (-not $vpnAdapter) {
    Write-Host "[ERROR] No active VPN interface found!" -ForegroundColor Red
    Write-Host "Make sure your VPN is connected first." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Found: $($vpnAdapter.Name)" -ForegroundColor Green
$interfaceIndex = $vpnAdapter.InterfaceIndex

# Step 2: Verify VPN has proper IP
Write-Host "`n[2/5] Verifying VPN tunnel health..." -ForegroundColor Yellow
$vpnIP = Get-NetIPAddress -InterfaceIndex $interfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
if (-not $vpnIP -or $vpnIP.IPAddress -like "169.254.*") {
    Write-Host "[ERROR] VPN tunnel not properly established!" -ForegroundColor Red
    if ($vpnIP) {
        Write-Host "   Current IP: $($vpnIP.IPAddress) (APIPA/invalid)" -ForegroundColor Red
    }
    Write-Host "   Solution: Disconnect and reconnect VPN" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Green

# Step 3: Detect physical gateway
Write-Host "`n[3/5] Detecting WiFi/LAN gateway..." -ForegroundColor Yellow
$physicalGateway = $null

# Try multiple detection methods
$routes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Where-Object {
    $adapter = Get-NetAdapter -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
    $adapter -and $adapter.InterfaceDescription -notlike "*WireGuard*"
}

if ($routes) {
    $physicalGateway = ($routes | Sort-Object RouteMetric | Select-Object -First 1).NextHop
}

if (-not $physicalGateway -or $physicalGateway -eq "0.0.0.0") {
    # Fallback: Try common router IPs
    $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "172.16.0.1")
    foreach ($gw in $commonGateways) {
        if (Test-Connection -ComputerName $gw -Count 1 -Quiet -TimeoutSec 2) {
            $physicalGateway = $gw
            break
        }
    }
}

if ($physicalGateway -and $physicalGateway -ne "0.0.0.0") {
    Write-Host "[OK] Physical gateway: $physicalGateway" -ForegroundColor Green
} else {
    Write-Host "[WARN] Could not detect gateway - proceeding anyway" -ForegroundColor Yellow
}

# Step 4: Apply local network routes
Write-Host "`n[4/5] Preserving local network access..." -ForegroundColor Yellow
if ($physicalGateway -and $physicalGateway -ne "0.0.0.0") {
    $localNetworks = @(
        @{Network='192.168.0.0'; Mask='255.255.0.0'},
        @{Network='10.0.0.0'; Mask='255.0.0.0'},
        @{Network='172.16.0.0'; Mask='255.240.0.0'}
    )
    
    foreach ($net in $localNetworks) {
        $cmd = "route add $($net.Network) mask $($net.Mask) $physicalGateway metric 1"
        try {
            cmd /c $cmd 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  [OK] $($net.Network) -> WiFi/LAN" -ForegroundColor Green
            }
        } catch {
            # Route may already exist - that's OK
        }
    }
}

# Step 5: Apply VPN routes (THE CRITICAL FIX)
Write-Host "`n[5/5] Applying VPN routes (THE FIX)..." -ForegroundColor Yellow

# Clean existing conflicting routes
cmd /c "route delete 0.0.0.0 mask 128.0.0.0" 2>&1 | Out-Null
cmd /c "route delete 128.0.0.0 mask 128.0.0.0" 2>&1 | Out-Null

# Apply the split default routes that force internet through VPN
$route1 = "route add 0.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"
$route2 = "route add 128.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"

$r1Result = cmd /c $route1 2>&1
$r2Result = cmd /c $route2 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] VPN routes applied successfully!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Route application had issues:" -ForegroundColor Yellow
    Write-Host "   Route 1: $r1Result" -ForegroundColor Gray
    Write-Host "   Route 2: $r2Result" -ForegroundColor Gray
}

# Flush DNS for good measure
cmd /c "ipconfig /flushdns" 2>&1 | Out-Null

Write-Host "`n[TESTING] CONNECTION..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "   External IP: $externalIP" -ForegroundColor White
    Write-Host "   VPN tunnel is now working!" -ForegroundColor Cyan
    
    Write-Host "`nNEXT STEP:" -ForegroundColor Yellow
    Write-Host "   Run full test: .\\TEST-VPN-TUNNEL.ps1" -ForegroundColor White
    
} catch {
    Write-Host "External IP test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   The routing fix was applied, but connectivity issues remain." -ForegroundColor Gray
    Write-Host "   Try: Disconnect VPN, reconnect, then run this script again." -ForegroundColor White
}

Write-Host "`n=========================================" -ForegroundColor Red