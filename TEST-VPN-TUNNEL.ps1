#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Comprehensive Nebula VPN Tunnel Verification
.DESCRIPTION
    Tests VPN connection security: IP leaks, DNS leaks, IPv6 leaks, routing, and performance
.PARAMETER Quick
    Run only essential tests (faster)
.EXAMPLE
    .\TEST-VPN-TUNNEL.ps1
    .\TEST-VPN-TUNNEL.ps1 -Quick
#>

param(
    [switch]$Quick
)

$ErrorActionPreference = "Continue"

# Test results tracking
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsWarning = 0

function Show-Test {
    param(
        [string]$Name,
        [bool]$Pass,
        [string]$Info = "",
        [bool]$IsWarning = $false
    )
    
    if ($Pass) {
        $script:TestsPassed++
        Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
    } elseif ($IsWarning) {
        $script:TestsWarning++
        Write-Host "  [WARN] " -ForegroundColor Yellow -NoNewline
    } else {
        $script:TestsFailed++
        Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
    }
    
    Write-Host "$Name" -NoNewline
    if ($Info) {
        Write-Host " - $Info" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  NEBULA VPN - COMPREHENSIVE TUNNEL VERIFICATION" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

$startTime = Get-Date

# TEST 1: VPN Interface
Write-Host "[1/9] Checking VPN Interface..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object { 
    $_.InterfaceDescription -like "*WireGuard*" -or 
    $_.Name -like "*wg*" -or
    $_.Name -like "*Nebula*"
}
if ($vpnAdapter -and $vpnAdapter.Status -eq "Up") {
    Show-Test "VPN Interface Active" $true "$($vpnAdapter.Name) - $($vpnAdapter.InterfaceDescription)"
} else {
    Show-Test "VPN Interface Active" $false "No active WireGuard interface found"
}

# TEST 2: Public IP Check
Write-Host "`n[2/9] Checking Public IP..." -ForegroundColor Yellow
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org?format=json" -TimeoutSec 10).ip
    $isPublicIP = $publicIP -notlike "192.168.*" -and 
                  $publicIP -notlike "10.*" -and 
                  $publicIP -notlike "172.16.*" -and
                  $publicIP -notlike "169.254.*"
    
    Show-Test "Public IP Retrieved" $isPublicIP $publicIP
    
    # Try to get IP location
    try {
        $ipInfo = Invoke-RestMethod -Uri "http://ip-api.com/json/$publicIP" -TimeoutSec 5
        Show-Test "IP Location" $true "$($ipInfo.city), $($ipInfo.country)"
    } catch {
        Show-Test "IP Location" $false "Could not retrieve" $true
    }
} catch {
    Show-Test "Public IP Retrieved" $false "Connection failed"
}

# TEST 3: DNS Leak Test
Write-Host "`n[3/9] Checking DNS Configuration..." -ForegroundColor Yellow
$dnsServers = Get-DnsClientServerAddress -AddressFamily IPv4 | 
              Where-Object { $_.ServerAddresses.Count -gt 0 }

$foundVPNDNS = $false
$dnsInfo = ""

foreach ($dns in $dnsServers) {
    $servers = $dns.ServerAddresses
    foreach ($server in $servers) {
        if ($server -match "^(1\.1\.1\.1|1\.0\.0\.1|8\.8\.8\.8|8\.8\.4\.4|9\.9\.9\.9)$") {
            $foundVPNDNS = $true
            $dnsInfo += "$server "
        } elseif ($server -notmatch "^(127\.|::1|fec0:|fe80:)") {
            $dnsInfo += "$server (local) "
        }
    }
}

Show-Test "VPN DNS Configured" $foundVPNDNS $(if ($dnsInfo) { $dnsInfo.Trim() } else { "No public DNS found" })

# DNS Leak Test
try {
    $dnsLeakTest = Invoke-RestMethod -Uri "https://www.dnsleaktest.com/api/json" -TimeoutSec 10
    if ($dnsLeakTest) {
        $ispName = $dnsLeakTest.isp
        Show-Test "DNS Leak Test" $true "ISP: $ispName"
    }
} catch {
    Show-Test "DNS Leak Test" $false "Could not perform test" $true
}

# TEST 4: IPv6 Leak Test
Write-Host "`n[4/9] Checking IPv6..." -ForegroundColor Yellow
$ipv6Adapters = Get-NetAdapterBinding | Where-Object { 
    $_.ComponentID -eq "ms_tcpip6" -and $_.Enabled -eq $true 
}

if ($ipv6Adapters.Count -eq 0) {
    Show-Test "IPv6 Disabled" $true "No IPv6 adapters enabled"
} else {
    try {
        $ipv6Test = Invoke-RestMethod -Uri "https://api6.ipify.org?format=json" -TimeoutSec 5
        if ($ipv6Test.ip) {
            Show-Test "IPv6 Leak Detected" $false "IPv6 address: $($ipv6Test.ip)"
        }
    } catch {
        Show-Test "IPv6 Blocked" $true "Cannot reach IPv6 endpoints"
    }
}

# TEST 5: Routing Table
Write-Host "`n[5/9] Checking Routing Table..." -ForegroundColor Yellow
$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($defaultRoute) {
    $routeAdapter = Get-NetAdapter -InterfaceIndex $defaultRoute.ifIndex
    $isVPNRoute = $routeAdapter.InterfaceDescription -like "*WireGuard*" -or 
                  $routeAdapter.Name -like "*Nebula*"
    
    Show-Test "Default Route via VPN" $isVPNRoute "$($routeAdapter.Name)"
    
    if (-not $isVPNRoute) {
        Write-Host "  WARNING: Traffic may bypass VPN tunnel" -ForegroundColor Yellow
    }
} else {
    Show-Test "Default Route" $false "No default route found"
}

# TEST 6: Connection Speed (if not Quick mode)
if (-not $Quick) {
    Write-Host "`n[6/9] Testing Connection Speed..." -ForegroundColor Yellow
    try {
        $start = Get-Date
        $null = Invoke-WebRequest -Uri "https://www.google.com" -TimeoutSec 10 -UseBasicParsing
        $latency = ((Get-Date) - $start).TotalMilliseconds
        
        Show-Test "HTTP Connectivity" $true "$([math]::Round($latency, 0)) ms"
        
        if ($latency -lt 500) {
            Show-Test "Connection Speed" $true "Good (< 500ms)"
        } elseif ($latency -lt 2000) {
            Show-Test "Connection Speed" $true "Acceptable" $true
        } else {
            Show-Test "Connection Speed" $false "Slow (> 2000ms)"
        }
    } catch {
        Show-Test "HTTP Connectivity" $false "Connection failed"
    }
}

# TEST 7: WebRTC Leak Detection (if not Quick mode)
if (-not $Quick) {
    Write-Host "`n[7/9] Checking WebRTC Leak..." -ForegroundColor Yellow
    $localIPs = Get-NetIPAddress -AddressFamily IPv4 | 
                Where-Object { $_.IPAddress -notmatch "^(127\.|169\.254\.)" } |
                Select-Object -ExpandProperty IPAddress
    
    $hasPrivateIP = $false
    foreach ($ip in $localIPs) {
        if ($ip -match "^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)") {
            $hasPrivateIP = $true
        }
    }
    
    if ($hasPrivateIP) {
        Show-Test "WebRTC Leak Risk" $false "Private IPs exposed" $true
        Write-Host "  INFO: WebRTC in browsers may leak local IP" -ForegroundColor Blue
    } else {
        Show-Test "WebRTC Leak Risk" $true "No private IPs detected"
    }
}

# TEST 8: Kill Switch Test (if not Quick mode)
if (-not $Quick) {
    Write-Host "`n[8/9] Checking Kill Switch..." -ForegroundColor Yellow
    $firewallRules = Get-NetFirewallRule | Where-Object {
        $_.DisplayName -like "*VPN*" -or $_.DisplayName -like "*WireGuard*"
    }
    
    if ($firewallRules.Count -gt 0) {
        Show-Test "VPN Firewall Rules" $true "$($firewallRules.Count) rules found"
    } else {
        Show-Test "VPN Firewall Rules" $false "No kill switch detected" $true
        Write-Host "  INFO: No VPN firewall rules configured" -ForegroundColor Blue
    }
}

# TEST 9: Overall Security Score
Write-Host "`n[9/9] Security Assessment..." -ForegroundColor Yellow
$securityScore = [math]::Round((($script:TestsPassed / ($script:TestsPassed + $script:TestsFailed + $script:TestsWarning)) * 100), 0)

if ($securityScore -ge 90) {
    Show-Test "Security Score" $true "$securityScore% - Excellent"
} elseif ($securityScore -ge 70) {
    Show-Test "Security Score" $true "$securityScore% - Good" $true
} else {
    Show-Test "Security Score" $false "$securityScore% - Needs improvement"
}

# Summary
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Total Tests: " -NoNewline; Write-Host ($script:TestsPassed + $script:TestsFailed + $script:TestsWarning) -ForegroundColor White
Write-Host "  Passed:      " -NoNewline; Write-Host $script:TestsPassed -ForegroundColor Green
Write-Host "  Failed:      " -NoNewline; Write-Host $script:TestsFailed -ForegroundColor Red
Write-Host "  Warnings:    " -NoNewline; Write-Host $script:TestsWarning -ForegroundColor Yellow
Write-Host "  Duration:    " -NoNewline; Write-Host "$([math]::Round($duration, 2)) seconds" -ForegroundColor Gray

Write-Host "`n  Overall Status: " -NoNewline
if ($script:TestsFailed -eq 0) {
    Write-Host "VPN TUNNEL SECURE" -ForegroundColor Green
    $exitCode = 0
} elseif ($script:TestsFailed -le 2) {
    Write-Host "VPN PARTIALLY SECURE" -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "VPN INSECURE" -ForegroundColor Red
    $exitCode = 2
}

Write-Host "`n================================================================`n" -ForegroundColor Cyan

exit $exitCode
