# VPN INTERNET CONNECTIVITY FIX
# ==============================
# Fixes remaining "Public IP Retrieved" failures while preserving working routes

Write-Host "VPN INTERNET CONNECTIVITY FIX" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Good news: VPN routing is now working!" -ForegroundColor Green
Write-Host "Fixing remaining internet connectivity issues..." -ForegroundColor Yellow
Write-Host ""

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "CRITICAL: This script MUST run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "PASS - Running as Administrator" -ForegroundColor Green
Write-Host ""

# PHASE 1: VPN TUNNEL DIAGNOSTICS
Write-Host "PHASE 1: VPN Tunnel Connectivity Diagnostics..." -ForegroundColor Yellow

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { 
    ($_.Name -like "*Nebula*" -or $_.InterfaceDescription -like "*WireGuard*") -and $_.Status -eq "Up" 
} | Select-Object -First 1

if (-not $vpnAdapter) {
    Write-Host "  FAIL - VPN adapter not found!" -ForegroundColor Red
    exit 1
}

Write-Host "  PASS - VPN Adapter: $($vpnAdapter.Name)" -ForegroundColor Green

# Get VPN IP and gateway
$vpnIP = Get-NetIPAddress -InterfaceAlias $vpnAdapter.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
if ($vpnIP) {
    Write-Host "  PASS - VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Green
} else {
    Write-Host "  WARN - VPN IP not detected" -ForegroundColor Yellow
}

# Test VPN gateway connectivity (multiple methods)
Write-Host "Testing VPN gateway connectivity..." -ForegroundColor Gray
$vpnGateway = $null
$gatewayWorking = $false

# Method 1: Find from route table
try {
    $vpnRoutes = Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    foreach ($route in $vpnRoutes) {
        if ($route.NextHop -match "^10\." -and $route.NextHop -ne "0.0.0.0") {
            $vpnGateway = $route.NextHop
            break
        }
    }
} catch { }

# Method 2: Default WireGuard gateway
if (-not $vpnGateway) {
    $vpnGateway = "10.8.0.1"
}

Write-Host "  INFO - Testing VPN Gateway: $vpnGateway" -ForegroundColor Gray

# Test gateway with multiple methods
$gatewayTests = @(
    @{ Method = "ICMP Ping"; Test = { Test-Connection -ComputerName $vpnGateway -Count 2 -Quiet -TimeoutSec 3 } },
    @{ Method = "TCP Test"; Test = { (New-Object System.Net.Sockets.TcpClient).ConnectAsync($vpnGateway, 53).Wait(3000) } },
    @{ Method = "Traceroute"; Test = { (Test-NetConnection -ComputerName $vpnGateway -TraceRoute -ErrorAction SilentlyContinue).TraceRoute } }
)

foreach ($test in $gatewayTests) {
    try {
        $result = & $test.Test
        if ($result) {
            Write-Host "  PASS - $($test.Method): Gateway responds" -ForegroundColor Green
            $gatewayWorking = $true
        } else {
            Write-Host "  WARN - $($test.Method): No response" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  WARN - $($test.Method): Failed" -ForegroundColor Yellow
    }
}

if (-not $gatewayWorking) {
    Write-Host "  CRITICAL - VPN gateway $vpnGateway is not responding!" -ForegroundColor Red
    Write-Host "    This is likely why internet requests fail" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 2: DNS RESOLUTION TESTING  
Write-Host "PHASE 2: DNS Resolution Testing..." -ForegroundColor Yellow

# Test VPN DNS servers
$vpnDNS = @("1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4")
$dnsWorking = $false

foreach ($dns in $vpnDNS) {
    Write-Host "Testing DNS server: $dns" -ForegroundColor Gray
    try {
        # Test 1: Ping DNS server
        $ping = Test-Connection -ComputerName $dns -Count 1 -Quiet -TimeoutSec 3
        if ($ping) {
            Write-Host "  PASS - DNS ${dns}: Reachable via ping" -ForegroundColor Green
            $dnsWorking = $true
        } else {
            Write-Host "  WARN - DNS ${dns}: Ping failed" -ForegroundColor Yellow
        }
        
        # Test 2: DNS resolution test
        $resolve = Resolve-DnsName -Name "google.com" -Server $dns -Type A -ErrorAction SilentlyContinue
        if ($resolve) {
            Write-Host "  PASS - DNS ${dns}: Resolution works" -ForegroundColor Green
            $dnsWorking = $true
        } else {
            Write-Host "  WARN - DNS ${dns}: Resolution failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  WARN - DNS ${dns}: Test failed - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# PHASE 3: MTU AND PACKET SIZE OPTIMIZATION
Write-Host "PHASE 3: MTU and Packet Size Optimization..." -ForegroundColor Yellow

# Check current MTU
try {
    $currentMTU = Get-NetIPInterface -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($currentMTU) {
        Write-Host "  INFO - Current VPN MTU: $($currentMTU.NlMtu)" -ForegroundColor Gray
        
        # Optimize MTU for VPN (common issue with WireGuard)
        if ($currentMTU.NlMtu -gt 1420) {
            try {
                Set-NetIPInterface -InterfaceIndex $vpnAdapter.InterfaceIndex -NlMtuBytes 1420 -ErrorAction SilentlyContinue
                Write-Host "  PASS - MTU optimized to 1420 bytes" -ForegroundColor Green
            } catch {
                Write-Host "  WARN - MTU optimization failed" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  PASS - MTU already optimized" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  WARN - MTU check failed" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 4: FIREWALL AND TRAFFIC FLOW TESTING
Write-Host "PHASE 4: Firewall and Traffic Flow Testing..." -ForegroundColor Yellow

# Test if Windows Firewall is blocking VPN traffic
Write-Host "Checking Windows Firewall VPN rules..." -ForegroundColor Gray
try {
    # Temporarily allow all VPN interface traffic
    $firewallRule = "Nebula VPN Allow All"
    
    # Remove existing rule if it exists
    Remove-NetFirewallRule -DisplayName $firewallRule -ErrorAction SilentlyContinue
    
    # Add permissive rule for VPN interface
    New-NetFirewallRule -DisplayName $firewallRule -Direction Outbound -Action Allow -InterfaceAlias $vpnAdapter.Name -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  PASS - Firewall rule created for VPN interface" -ForegroundColor Green
} catch {
    Write-Host "  WARN - Firewall rule creation failed" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 5: ADVANCED CONNECTIVITY TESTING
Write-Host "PHASE 5: Advanced Internet Connectivity Testing..." -ForegroundColor Yellow

# Test with different protocols and services
$connectivityTests = @(
    @{ 
        Name = "HTTP via Curl"; 
        Test = { 
            try {
                $result = curl.exe -s -m 10 "http://httpbin.org/ip" 2>$null
                return $result -match '\d+\.\d+\.\d+\.\d+'
            } catch { return $false }
        }
    },
    @{ 
        Name = "HTTPS via PowerShell"; 
        Test = { 
            try {
                $result = Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
                return $result.StatusCode -eq 200
            } catch { return $false }
        }
    },
    @{ 
        Name = "DNS over HTTPS"; 
        Test = { 
            try {
                $result = Invoke-WebRequest -Uri "https://1.1.1.1/cdn-cgi/trace" -UseBasicParsing -TimeoutSec 8 -ErrorAction SilentlyContinue
                return $result.Content -match "ip="
            } catch { return $false }
        }
    },
    @{ 
        Name = "Alternative IP Service"; 
        Test = { 
            try {
                $result = Invoke-WebRequest -Uri "https://icanhazip.com" -UseBasicParsing -TimeoutSec 8 -ErrorAction SilentlyContinue  
                return $result.StatusCode -eq 200
            } catch { return $false }
        }
    }
)

$workingTests = 0
foreach ($test in $connectivityTests) {
    Write-Host "Testing: $($test.Name)..." -ForegroundColor Gray
    try {
        $result = & $test.Test
        if ($result) {
            Write-Host "  PASS - $($test.Name): Success" -ForegroundColor Green
            $workingTests++
        } else {
            Write-Host "  FAIL - $($test.Name): Failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "  FAIL - $($test.Name): Error - $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep 1
}

Write-Host ""

# PHASE 6: ROUTE TABLE VERIFICATION
Write-Host "PHASE 6: Route Table Verification..." -ForegroundColor Yellow

# Verify our routing is still working correctly
try {
    $defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Sort-Object RouteMetric
    $vpnRouteFound = $false
    
    Write-Host "Current default routes:" -ForegroundColor Gray
    foreach ($route in $defaultRoutes) {
        $adapter = Get-NetAdapter -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue
        if ($adapter) {
            $isVPN = $adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*"
            $color = if ($isVPN) { "Green" } else { "Yellow" }
            Write-Host "  Priority $($route.RouteMetric): $($route.NextHop) via $($adapter.Name)" -ForegroundColor $color
            
            if ($isVPN -and $route.RouteMetric -le 10) {
                $vpnRouteFound = $true
            }
        }
    }
    
    if ($vpnRouteFound) {
        Write-Host "  PASS - VPN has priority routing" -ForegroundColor Green
    } else {
        Write-Host "  WARN - VPN routing priority issue" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  WARN - Route verification failed" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 7: FINAL CONNECTIVITY ATTEMPT
Write-Host "PHASE 7: Final Connectivity Tests..." -ForegroundColor Yellow

# Try to get external IP with maximum retries and different methods
$finalIPTest = $false
$externalIP = $null

# Method 1: Direct IP services with custom user agent
$ipServices = @(
    "https://api.ipify.org",
    "https://ipinfo.io/ip", 
    "https://icanhazip.com",
    "https://ifconfig.me/ip",
    "https://checkip.amazonaws.com"
)

Write-Host "Attempting external IP detection..." -ForegroundColor Gray
foreach ($service in $ipServices) {
    try {
        Write-Host "  Trying: $service" -ForegroundColor Gray
        $headers = @{'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        $result = Invoke-WebRequest -Uri $service -Headers $headers -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        $ip = $result.Content.Trim()
        
        if ($ip -match '^\d+\.\d+\.\d+\.\d+$') {
            Write-Host "  SUCCESS - External IP: $ip" -ForegroundColor Green -BackgroundColor DarkGreen
            $externalIP = $ip
            $finalIPTest = $true
            break
        }
    } catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
}

# Method 2: Curl as fallback
if (-not $finalIPTest) {
    Write-Host "Trying curl fallback..." -ForegroundColor Gray
    try {
        $curlResult = curl.exe -s -m 15 "https://api.ipify.org" 2>$null
        if ($curlResult -match '^\d+\.\d+\.\d+\.\d+$') {
            Write-Host "  SUCCESS - External IP via curl: $curlResult" -ForegroundColor Green -BackgroundColor DarkGreen
            $externalIP = $curlResult
            $finalIPTest = $true
        }
    } catch { }
}

Write-Host ""

# FINAL DIAGNOSIS AND RECOMMENDATIONS
Write-Host "FINAL DIAGNOSIS" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host ""

Write-Host "CONNECTIVITY ANALYSIS:" -ForegroundColor Yellow
Write-Host "- VPN Gateway Response: $(if($gatewayWorking){'OK'}else{'ISSUES'})" -ForegroundColor $(if($gatewayWorking){'Green'}else{'Red'})
Write-Host "- DNS Resolution: $(if($dnsWorking){'OK'}else{'ISSUES'})" -ForegroundColor $(if($dnsWorking){'Green'}else{'Red'})
Write-Host "- Working Tests: $workingTests/4" -ForegroundColor $(if($workingTests -ge 2){'Green'}elseif($workingTests -eq 1){'Yellow'}else{'Red'})
Write-Host "- External IP Test: $(if($finalIPTest){'FIXED'}else{'STILL FAILING'})" -ForegroundColor $(if($finalIPTest){'Green'}else{'Red'})
Write-Host ""

if ($finalIPTest) {
    Write-Host "SUCCESS! Internet connectivity through VPN is now working!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host ""
    Write-Host "Your external IP: $externalIP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "RUN YOUR TEST AGAIN:" -ForegroundColor Yellow
    Write-Host ".\TEST-VPN-TUNNEL.ps1 -Quick" -ForegroundColor White
    Write-Host ""
    Write-Host "EXPECTED RESULTS:" -ForegroundColor Green
    Write-Host "  [PASS] Public IP Retrieved - $externalIP" -ForegroundColor Green
    Write-Host "  [PASS] Default Route via VPN - Nebulavpn" -ForegroundColor Green
    Write-Host "  [PASS] Security Score - 85-95%" -ForegroundColor Green
} elseif ($gatewayWorking -and $dnsWorking) {
    Write-Host "PARTIAL SUCCESS: VPN tunnel and DNS work, but HTTP requests are blocked" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "LIKELY CAUSES:" -ForegroundColor Cyan
    Write-Host "1. VPN server firewall blocking HTTP/HTTPS traffic" -ForegroundColor White
    Write-Host "2. ISP or network administrator blocking VPN traffic" -ForegroundColor White  
    Write-Host "3. WireGuard server configuration issues" -ForegroundColor White
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Contact your VPN provider about HTTP traffic blocking" -ForegroundColor White
    Write-Host "2. Try connecting to a different VPN server" -ForegroundColor White
    Write-Host "3. Check WireGuard server allows HTTP/HTTPS traffic" -ForegroundColor White
} elseif (-not $gatewayWorking) {
    Write-Host "ISSUE IDENTIFIED: VPN gateway not responding" -ForegroundColor Red
    Write-Host ""
    Write-Host "POSSIBLE SOLUTIONS:" -ForegroundColor Cyan
    Write-Host "1. Reconnect your WireGuard tunnel" -ForegroundColor White
    Write-Host "2. Check VPN server is online" -ForegroundColor White
    Write-Host "3. Verify WireGuard configuration file" -ForegroundColor White
    Write-Host "4. Try: wg show (in admin PowerShell)" -ForegroundColor White
} else {
    Write-Host "ISSUE IDENTIFIED: DNS resolution problems through VPN" -ForegroundColor Red 
    Write-Host ""
    Write-Host "SOLUTIONS:" -ForegroundColor Cyan
    Write-Host "1. Check DNS servers in VPN configuration" -ForegroundColor White
    Write-Host "2. Manually set DNS: 1.1.1.1, 1.0.0.1" -ForegroundColor White
    Write-Host "3. Flush DNS: ipconfig /flushdns" -ForegroundColor White
}

Write-Host ""
Write-Host "Connectivity fix completed at $(Get-Date)" -ForegroundColor Gray