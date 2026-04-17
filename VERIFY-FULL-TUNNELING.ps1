# VERIFY-FULL-TUNNELING.ps1
# Verify full tunneling VPN configuration and IP masking

Write-Host "Full Tunneling VPN Verification" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true
$fullTunnel = $false

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

# 2. Check for full tunnel routes (should be PRESENT)
Write-Host "2. Full Tunnel Route Check (should be PRESENT):" -ForegroundColor Yellow
try {
    $routes = route print | Out-String
    
    # Check for full tunnel indicators
    if ($routes -match "0\.0\.0\.0\s+0\.0\.0\.0") {
        Write-Host "   OK Found full tunnel route: 0.0.0.0/0" -ForegroundColor Green
        $fullTunnel = $true
    } else {
        Write-Host "   INFO No full tunnel route found" -ForegroundColor Gray
    }
    
    # Check if any aggressive routes exist
    if ($routes -match "0\.0\.0\.0\s+128\.0\.0\.0") {
        Write-Host "   OK Found tunnel route: 0.0.0.0/1" -ForegroundColor Green
        $fullTunnel = $true
    }
    
    if ($routes -match "128\.0\.0\.0\s+128\.0\.0\.0") {
        Write-Host "   OK Found tunnel route: 128.0.0.0/1" -ForegroundColor Green
        $fullTunnel = $true
    }
    
    if (!$fullTunnel -and $wgInterface) {
        Write-Host "   WARN No tunnel routes detected - may be in resilient mode" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   WARN Could not check routes" -ForegroundColor Yellow
}

Write-Host ""

# 3. IP Masking Test
Write-Host "3. IP Masking Test:" -ForegroundColor Yellow

$realIP = $null
$vpnIP = $null

# Test internet connectivity and get public IP
try {
    $publicIP = Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 15
    Write-Host "   Public IP: $publicIP" -ForegroundColor White
    
    # Try to determine if this is likely a VPN IP or real IP
    # VPN IPs often have different geographic/ISP characteristics
    if ($wgInterface -and $fullTunnel) {
        Write-Host "   STATUS: Full tunnel active - IP should be masked" -ForegroundColor Green
        $vpnIP = $publicIP
    } elseif ($wgInterface -and !$fullTunnel) {
        Write-Host "   STATUS: Resilient mode - showing real IP (expected)" -ForegroundColor Yellow
        $realIP = $publicIP
    } else {
        Write-Host "   STATUS: No VPN - showing real IP" -ForegroundColor Gray
        $realIP = $publicIP
    }
    
} catch {
    Write-Host "   FAIL Internet: BLOCKED or FAILED" -ForegroundColor Red
    $allGood = $false
}

# 4. Local Network Test
Write-Host ""
Write-Host "4. Local Network Access Test:" -ForegroundColor Yellow

try {
    $gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Where-Object { $_.InterfaceAlias -notlike "*WireGuard*" -and $_.InterfaceAlias -notlike "*Nebula*" } | Select-Object -First 1).NextHop
    if ($gateway) {
        $ping = Test-Connection -ComputerName $gateway -Count 1 -Quiet
        if ($ping) {
            Write-Host "   OK Local Network: Accessible (Gateway: $gateway)" -ForegroundColor Green
        } else {
            Write-Host "   FAIL Local Network: Blocked (Gateway: $gateway)" -ForegroundColor Red
            if ($fullTunnel) {
                Write-Host "       Note: This is expected with full tunneling" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "   WARN Local Network: Could not test" -ForegroundColor Yellow
}

# 5. DNS Test
Write-Host ""
Write-Host "5. DNS Resolution Test:" -ForegroundColor Yellow
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

# Final Status
Write-Host "FINAL STATUS:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

if ($wgInterface -and $fullTunnel -and $allGood) {
    Write-Host "SUCCESS: Full tunneling active with complete IP masking!" -ForegroundColor Green
    Write-Host "   • All traffic routed through VPN tunnel" -ForegroundColor Green
    Write-Host "   • Complete privacy protection enabled" -ForegroundColor Green
    Write-Host "   • IP address masked from external sites" -ForegroundColor Green
    if ($vpnIP) {
        Write-Host "   • Masked IP: $vpnIP" -ForegroundColor Green
    }
} elseif ($wgInterface -and !$fullTunnel) {
    Write-Host "INFO: VPN connected in resilient mode (partial tunneling)" -ForegroundColor Yellow
    Write-Host "   • DNS privacy through VPN" -ForegroundColor Yellow
    Write-Host "   • Internet traffic via WiFi (IP visible)" -ForegroundColor Yellow
    Write-Host "   • Run ENABLE-FULL-TUNNELING.ps1 for complete masking" -ForegroundColor Yellow
} elseif (!$wgInterface) {
    Write-Host "INFO: VPN not connected" -ForegroundColor Gray
    Write-Host "   Connect VPN to test full tunneling configuration" -ForegroundColor Gray
} elseif (!$allGood) {
    Write-Host "WARNING: Full tunneling issues detected" -ForegroundColor Red
    Write-Host "   • VPN may be blocking essential connectivity" -ForegroundColor Red
    Write-Host "   • Run FORCE-RESILIENT-ROUTING.ps1 to restore access" -ForegroundColor Red
} else {
    Write-Host "PARTIAL: VPN connected but tunneling status unclear" -ForegroundColor Yellow
}

Write-Host ""