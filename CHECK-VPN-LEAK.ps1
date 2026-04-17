#!/usr/bin/env pwsh
# Nebula VPN - Leak Detection Script
# Checks if VPN is properly protecting your IP address

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   NEBULA VPN - LEAK DETECTION CHECK" -ForegroundColor Cyan  
Write-Host "===============================================`n" -ForegroundColor Cyan

# 1. Check Administrator Privileges
Write-Host "[1] Administrator Privileges Check" -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "    [OK] Running as Administrator" -ForegroundColor Green
} else {
    Write-Host "    [ERROR] NOT running as Administrator" -ForegroundColor Red
    Write-Host "    [WARNING] VPN CANNOT protect your IP without admin privileges!" -ForegroundColor Red
}

# 2. Check WireGuard Tunnel Status
Write-Host "`n[2] WireGuard Tunnel Status" -ForegroundColor Yellow
try {
    $wgOutput = wg show 2>&1
    if ($LASTEXITCODE -eq 0 -and $wgOutput -match "interface:") {
        Write-Host "    [OK] WireGuard tunnel is active" -ForegroundColor Green
        Write-Host "    $($wgOutput | Select-Object -First 3 | Out-String)"
    } else {
        Write-Host "    [ERROR] WireGuard tunnel is NOT running" -ForegroundColor Red
    }
}
catch {
    Write-Host "    [ERROR] WireGuard not found or not running" -ForegroundColor Red
}

# 3. Check Default Route (is VPN the default gateway?)
Write-Host "`n[3] Default Route Check" -ForegroundColor Yellow
try {
    $routes = route print 0.0.0.0 | Select-String "0.0.0.0.*0.0.0.0"
    $vpnRoute = $routes | Select-String "Nebulavpn|WireGuard|10\.8\.0\."
    
    if ($vpnRoute) {
        Write-Host "    [OK] VPN tunnel is the default gateway" -ForegroundColor Green
    } else {
        Write-Host "    [ERROR] VPN is NOT the default gateway" -ForegroundColor Red
        Write-Host "    [WARNING] Your traffic is NOT going through the VPN!" -ForegroundColor Red
    }
    
    Write-Host "    Default routes:" -ForegroundColor Gray
    $routes | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
}
catch {
    Write-Host "    [ERROR] Could not check routes" -ForegroundColor Red
}

# 4. Check DNS Settings
Write-Host "`n[4] DNS Settings Check" -ForegroundColor Yellow
try {
    $dnsServers = Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 } | Select-Object -First 3 InterfaceAlias, ServerAddresses
    
    $vpnDns = $dnsServers | Where-Object { $_.InterfaceAlias -like "*WireGuard*" -or $_.InterfaceAlias -like "*Nebulavpn*" }
    
    if ($vpnDns) {
        Write-Host "    OK VPN DNS configured on: $($vpnDns.InterfaceAlias)" -ForegroundColor Green
        Write-Host "       DNS Servers: $($vpnDns.ServerAddresses -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "    WARNING No VPN DNS configuration found" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "    ERROR Could not check DNS settings" -ForegroundColor Red
}

# 5. Check External IP (THE BIG TEST)
Write-Host "`n[5] External IP Address Check" -ForegroundColor Yellow
Write-Host "    Checking your public IP address..." -ForegroundColor Gray
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content
    Write-Host "    Your current external IP: $externalIP" -ForegroundColor Cyan
    
    # Check if it's a private IP
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)") {
        Write-Host "    WARNING This appears to be a private IP (unexpected)" -ForegroundColor Yellow
    } else {
        Write-Host "    INFO Go to https://whatsmyip.com to verify your location" -ForegroundColor Cyan
        Write-Host "    INFO If it shows your REAL location, your IP is LEAKING!" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "    ERROR Could not check external IP: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Final Verdict
Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   DIAGNOSIS AND RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

if (-not $isAdmin) {
    Write-Host "[ERROR] CRITICAL: You are NOT running as Administrator" -ForegroundColor Red
    Write-Host "" 
    Write-Host "YOUR IP IS LEAKING because:" -ForegroundColor Red
    Write-Host "  - The VPN cannot modify routing tables without admin privileges" -ForegroundColor Yellow
    Write-Host "  - Traffic is going through your ISP instead of the VPN tunnel" -ForegroundColor Yellow  
    Write-Host "  - DNS queries may be leaking your location" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[FIX] HOW TO FIX:" -ForegroundColor Green
    Write-Host "  1. Close Nebula VPN completely" -ForegroundColor White
    Write-Host "  2. Right-click on 'dist\win-unpacked\Nebula VPN.exe'" -ForegroundColor White
    Write-Host "  3. Select 'Run as administrator'" -ForegroundColor White
    Write-Host "  4. Click 'Yes' when Windows asks for permission" -ForegroundColor White
    Write-Host "  5. Reconnect to the VPN" -ForegroundColor White
    Write-Host "  6. Run this script again to verify the fix" -ForegroundColor White
}
else {
    Write-Host "[OK] Running as Administrator - routing should work correctly" -ForegroundColor Green
    Write-Host ""
    Write-Host "If your IP is still leaking:" -ForegroundColor Yellow
    Write-Host "  1. Disconnect from VPN" -ForegroundColor White
    Write-Host "  2. Reconnect to VPN" -ForegroundColor White
    Write-Host "  3. Check that WireGuard tunnel is active (see above)" -ForegroundColor White
    Write-Host "  4. Verify the default route points to the VPN" -ForegroundColor White
}

Write-Host "`n===============================================`n" -ForegroundColor Cyan
