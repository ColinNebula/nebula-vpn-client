#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick VPN tunnel status check
.DESCRIPTION
    Fast verification of VPN connection status with minimal checks
#>

# Simple color output
function Show-Status {
    param([string]$Test, [bool]$Pass, [string]$Info = "")
    $symbol = if ($Pass) { "PASS" } else { "FAIL" }
    $color = if ($Pass) { "Green" } else { "Red" }
    Write-Host "  [$symbol] " -ForegroundColor $color -NoNewline
    Write-Host "$Test" -NoNewline
    if ($Info) { Write-Host " - $Info" -ForegroundColor Gray } else { Write-Host "" }
}

Write-Host ""
Write-Host "################################################################" -ForegroundColor Cyan
Write-Host "#  NEBULA VPN - QUICK STATUS CHECK                             #" -ForegroundColor Cyan
Write-Host "################################################################" -ForegroundColor Cyan
Write-Host ""

# 1. Check VPN interface
$vpnAdapter = Get-NetAdapter | Where-Object { 
    $_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*wg*" 
}
$vpnUp = $vpnAdapter -and $vpnAdapter.Status -eq "Up"
Show-Status "VPN Interface" $vpnUp $(if ($vpnUp) { $vpnAdapter.Name } else { "Not found" })

# 2. Check public IP
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org?format=json" -TimeoutSec 5).ip
    $isVPN = $publicIP -notlike "192.168.*" -and $publicIP -notlike "10.0.*"
    Show-Status "Public IP" $isVPN $publicIP
} catch {
    Show-Status "Public IP" $false "Could not retrieve"
}

# 3. Check DNS
$dns = Get-DnsClientServerAddress -AddressFamily IPv4 | 
    Where-Object { $_.ServerAddresses.Count -gt 0 } |
    Select-Object -First 1 -ExpandProperty ServerAddresses
$vpnDNS = $dns -contains "1.1.1.1" -or $dns -contains "1.0.0.1" -or $dns -contains "8.8.8.8"
Show-Status "VPN DNS" $vpnDNS $(if ($dns) { $dns[0] } else { "Not configured" })

# 4. Check routing
$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($defaultRoute) {
    $routeInterface = Get-NetAdapter -InterfaceIndex $defaultRoute.ifIndex
    $routedVPN = $routeInterface.InterfaceDescription -like "*WireGuard*"
    Show-Status "Default Route" $routedVPN $routeInterface.Name
} else {
    Show-Status "Default Route" $false "Not found"
}

# Summary
Write-Host ""
if ($vpnUp -and $isVPN -and $vpnDNS -and $routedVPN) {
    Write-Host "  Overall: " -NoNewline
    Write-Host "VPN ACTIVE & SECURE" -ForegroundColor Green
    $exitCode = 0
} elseif ($vpnUp) {
    Write-Host "  Overall: " -NoNewline
    Write-Host "VPN CONNECTED (Issues detected)" -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "  Overall: " -NoNewline
    Write-Host "VPN NOT CONNECTED" -ForegroundColor Red
    $exitCode = 2
}

Write-Host "`n  For detailed testing: .\TEST-VPN-TUNNEL.ps1" -ForegroundColor Gray
Write-Host ""

exit $exitCode
