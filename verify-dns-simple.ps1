#!/usr/bin/env pwsh
# Nebula VPN - DNS Enforcement Verification (Simple Edition)
# Run this to verify DNS is properly enforced through the VPN

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "     NEBULA VPN - DNS ENFORCEMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Check Administrator Privileges
Write-Host "[1] Checking Administrator Privileges..." -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "    [OK] Running as Administrator" -ForegroundColor Green
} else {
    Write-Host "    [FAIL] NOT running as Administrator" -ForegroundColor Red
    Write-Host "    Rerun with 'Run as Administrator' for full diagnostics`n" -ForegroundColor Yellow
}

# 2. Check VPN Adapter
Write-Host "`n[2] Checking VPN Adapter Status..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter -Name "Nebulavpn" -ErrorAction SilentlyContinue

if ($vpnAdapter -and $vpnAdapter.Status -eq "Up") {
    Write-Host "    [OK] VPN adapter 'Nebulavpn' is UP" -ForegroundColor Green
    $vpnConnected = $true
} else {
    Write-Host "    [FAIL] VPN adapter 'Nebulavpn' is NOT connected" -ForegroundColor Red
    Write-Host "    Please connect to the VPN first`n" -ForegroundColor Yellow
    $vpnConnected = $false
    exit 1
}

# 3. Check VPN IP Address
Write-Host "`n[3] Checking VPN IP Address..." -ForegroundColor Yellow
$vpnIP = Get-NetIPAddress -InterfaceAlias "Nebulavpn" -AddressFamily IPv4 -ErrorAction SilentlyContinue

if ($vpnIP -and $vpnIP.IPAddress -like "10.8.*") {
    Write-Host "    [OK] VPN IP assigned: $($vpnIP.IPAddress)" -ForegroundColor Green
    $hasVpnIP = $true
} elseif ($vpnIP -and $vpnIP.IPAddress -like "169.254.*") {
    Write-Host "    [FAIL] APIPA address: $($vpnIP.IPAddress)" -ForegroundColor Red
    Write-Host "    VPN tunnel is not fully established" -ForegroundColor Yellow
    $hasVpnIP = $false
} else {
    Write-Host "    [FAIL] No valid VPN IP address" -ForegroundColor Red
    $hasVpnIP = $false
}

# 4. Check DNS Configuration on VPN Adapter
Write-Host "`n[4] Checking DNS on VPN Adapter..." -ForegroundColor Yellow
$vpnDNS = Get-DnsClientServerAddress -InterfaceAlias "Nebulavpn" -AddressFamily IPv4 -ErrorAction SilentlyContinue

if ($vpnDNS.ServerAddresses -and $vpnDNS.ServerAddresses.Count -gt 0) {
    Write-Host "    [OK] IPv4 DNS servers: $($vpnDNS.ServerAddresses -join ', ')" -ForegroundColor Green
    $hasDNS = $true
} else {
    Write-Host "    [FAIL] NO IPv4 DNS servers configured!" -ForegroundColor Red
    Write-Host "    DNS will leak through other interfaces!" -ForegroundColor Yellow
    Write-Host "    -> Restart Nebula VPN as Administrator" -ForegroundColor Yellow
    $hasDNS = $false
}

# 5. Test Actual DNS Resolution
if ($hasDNS) {
    Write-Host "`n[5] Testing Actual DNS Resolution..." -ForegroundColor Yellow
    $nslookupOutput = nslookup google.com 2>&1 | Out-String
    
    if ($nslookupOutput -match "Server:\s+(.+)") {
        $dnsServerUsed = $matches[1].Trim()
        Write-Host "    DNS Server Used: $dnsServerUsed" -ForegroundColor Cyan
        
        $isUsingVpnDNS = $false
        foreach ($dnsServer in $vpnDNS.ServerAddresses) {
            if ($dnsServerUsed -match $dnsServer -or $nslookupOutput -match $dnsServer) {
                $isUsingVpnDNS = $true
                break
            }
        }
        
        if ($isUsingVpnDNS) {
            Write-Host "    [OK] Using VPN DNS server!" -ForegroundColor Green
            $dnsWorking = $true
        } else {
            Write-Host "    [FAIL] NOT using VPN DNS server!" -ForegroundColor Red
            Write-Host "    DNS is leaking through non-VPN interface" -ForegroundColor Yellow
            $dnsWorking = $false
        }
    }
}

# 6. Check for DNS on Other Adapters
Write-Host "`n[6] Checking for DNS Leaks on Other Adapters..." -ForegroundColor Yellow
$allDNS = Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { 
    $_.ServerAddresses.Count -gt 0 -and $_.InterfaceAlias -ne "Nebulavpn" 
}

if ($allDNS.Count -gt 0) {
    Write-Host "    [WARN] Other adapters have DNS servers:" -ForegroundColor Yellow
    foreach ($dns in $allDNS) {
        Write-Host "           - $($dns.InterfaceAlias): $($dns.ServerAddresses -join ', ')" -ForegroundColor Gray
    }
} else {
    Write-Host "    [OK] No DNS on other adapters" -ForegroundColor Green
}

# Summary
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "                    SUMMARY" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$allChecks = @(
    @{Name="Admin Privileges"; Pass=$isAdmin},
    @{Name="VPN Connected"; Pass=$vpnConnected},
    @{Name="VPN IP Assigned"; Pass=$hasVpnIP},
    @{Name="DNS Configured"; Pass=$hasDNS},
    @{Name="DNS Working"; Pass=$dnsWorking}
)

foreach ($check in $allChecks) {
    $status = if ($check.Pass) { "[PASS]" } else { "[FAIL]" }
    $color = if ($check.Pass) { "Green" } else { "Red" }
    Write-Host "  $status $($check.Name)" -ForegroundColor $color
}

$passed = ($allChecks | Where-Object { $_.Pass }).Count
$total = $allChecks.Count

Write-Host "`n  Score: $passed/$total checks passed" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

if ($isAdmin -and $vpnConnected -and $hasVpnIP -and $hasDNS -and $dnsWorking) {
    Write-Host "`n  [SUCCESS] DNS enforcement is working correctly!" -ForegroundColor Green
    Write-Host "  All DNS queries are going through the VPN`n" -ForegroundColor Green
} else {
    Write-Host "`n  [ISSUES DETECTED] DNS enforcement has problems`n" -ForegroundColor Red
    
    if (-not $isAdmin) {
        Write-Host "  -> Run Nebula VPN as Administrator" -ForegroundColor Yellow
        Write-Host "     Use: start-vpn-admin.ps1`n" -ForegroundColor Gray
    }
    
    if (-not $hasDNS) {
        Write-Host "  -> DNS not set on VPN adapter (requires admin)" -ForegroundColor Yellow
        Write-Host "     Restart app with elevation`n" -ForegroundColor Gray
    }
}

Write-Host ""
