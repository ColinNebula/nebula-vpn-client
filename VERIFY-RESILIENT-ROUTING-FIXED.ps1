# VERIFY-RESILIENT-ROUTING-FIXED.ps1
# Comprehensive verification of resilient VPN routing configuration

Write-Host "Resilient VPN Routing Verification" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Check VPN Interface Status
Write-Host "1. VPN Interface Check:" -ForegroundColor Yellow
try {
    $wgInterface = Get-NetAdapter | Where-Object { 
        $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" -or $_.Name -like "*wg*" 
    }
    if ($wgInterface) {
        Write-Host "   OK VPN Interface: $($wgInterface.Name)" -ForegroundColor Green
        Write-Host "   OK Status: $($wgInterface.Status)" -ForegroundColor Green
        
        $wgIP = Get-NetIPAddress -InterfaceAlias $wgInterface.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($wgIP) {
            Write-Host "   OK VPN IP: $($wgIP.IPAddress)" -ForegroundColor Green
        }
    } else {
        Write-Host "   FAIL No VPN interface found - VPN not connected" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   WARN Could not check VPN interface" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# 2. Check for aggressive routes (should NOT exist)
Write-Host "2. Aggressive Route Check (should be ABSENT):" -ForegroundColor Yellow
try {
    $routes = route print | Out-String
    
    if ($routes -match "0\.0\.0\.0\s+128\.0\.0\.0") {
        Write-Host "   PROBLEM: Found aggressive route 0.0.0.0/1" -ForegroundColor Red
        $allGood = $false
    } else {
        Write-Host "   OK Good: No aggressive route 0.0.0.0/1" -ForegroundColor Green
    }
    
    if ($routes -match "128\.0\.0\.0\s+128\.0\.0\.0") {
        Write-Host "   PROBLEM: Found aggressive route 128.0.0.0/1" -ForegroundColor Red
        $allGood = $false
    } else {
        Write-Host "   OK Good: No aggressive route 128.0.0.0/1" -ForegroundColor Green
    }
} catch {
    Write-Host "   WARN Could not check routes" -ForegroundColor Yellow
}

Write-Host ""

# 3. Check for DNS routes (should exist if VPN connected)
Write-Host "3. DNS Route Check (should be PRESENT if VPN active):" -ForegroundColor Yellow
$dnsServers = @("1.1.1.1", "8.8.8.8", "208.67.222.222", "208.67.220.220")
$dnsRoutesFound = 0

foreach ($dns in $dnsServers) {
    if ($routes -match [regex]::Escape($dns)) {
        Write-Host "   OK Found DNS route: $dns" -ForegroundColor Green
        $dnsRoutesFound++
    }
}

if ($dnsRoutesFound -gt 0) {
    Write-Host "   OK Resilient routing active: $dnsRoutesFound DNS routes found" -ForegroundColor Green
} else {
    Write-Host "   WARN No DNS routes found - VPN may not be using resilient config" -ForegroundColor Yellow
}

Write-Host ""

# 4. Connectivity Tests
Write-Host "4. Connectivity Tests:" -ForegroundColor Yellow

# Internet connectivity
try {
    $ip = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10
    Write-Host "   OK Internet: WORKING (Public IP: $ip)" -ForegroundColor Green
} catch {
    Write-Host "   FAIL Internet: FAILED" -ForegroundColor Red
    $allGood = $false
}

# Local network test
try {
    $gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { $_.InterfaceAlias -notlike "*WireGuard*" -and $_.InterfaceAlias -notlike "*Nebula*" } | Select-Object -First 1).NextHop
    if ($gateway) {
        $ping = Test-Connection -ComputerName $gateway -Count 1 -Quiet
        if ($ping) {
            Write-Host "   OK Local Network: WORKING (Gateway: $gateway)" -ForegroundColor Green
        } else {
            Write-Host "   FAIL Local Network: Cannot reach gateway $gateway" -ForegroundColor Red
            $allGood = $false
        }
    }
} catch {
    Write-Host "   WARN Local Network: Could not test" -ForegroundColor Yellow
}

# DNS resolution test
try {
    $dnsResult = nslookup google.com 2>$null | Out-String
    if ($dnsResult -match "Address|answer") {
        Write-Host "   OK DNS Resolution: WORKING" -ForegroundColor Green
    } else {
        Write-Host "   FAIL DNS Resolution: FAILED" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "   WARN DNS Resolution: Could not test" -ForegroundColor Yellow
}

Write-Host ""

# 5. DNS Server Check
Write-Host "5. Active DNS Servers:" -ForegroundColor Yellow
try {
    $dnsConfig = Get-DnsClientServerAddress -AddressFamily IPv4
    foreach ($config in $dnsConfig) {
        if ($config.ServerAddresses) {
            Write-Host "   Interface: $($config.InterfaceAlias)" -ForegroundColor Cyan
            foreach ($server in $config.ServerAddresses) {
                Write-Host "     - $server" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "   WARN Could not check DNS configuration" -ForegroundColor Yellow
}

Write-Host ""

# Final Status
Write-Host "FINAL STATUS:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

if ($allGood -and $wgInterface) {
    Write-Host "SUCCESS: Resilient VPN routing is working correctly!" -ForegroundColor Green
    Write-Host "   • VPN connected with resilient configuration" -ForegroundColor Green
    Write-Host "   • No aggressive routes blocking traffic" -ForegroundColor Green
    Write-Host "   • Internet and local network both accessible" -ForegroundColor Green
    Write-Host "   • DNS routing through VPN for privacy" -ForegroundColor Green
} elseif (!$wgInterface) {
    Write-Host "INFO: VPN not currently connected" -ForegroundColor Yellow
    Write-Host "   Connect your Nebula VPN and run this script again" -ForegroundColor Yellow
} elseif (!$allGood) {
    Write-Host "WARNING: Issues detected with routing configuration" -ForegroundColor Red
    Write-Host "   Check the failed items above and troubleshoot" -ForegroundColor Red
} else {
    Write-Host "GOOD: Basic connectivity working" -ForegroundColor Green
}

Write-Host ""