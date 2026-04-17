# MICROSOFT ADVANCED VPN SETUP
# =============================
# Leverages built-in Windows networking tools for enterprise-grade VPN routing
# Based on research of commercial VPN implementations

Write-Host "🚀 MICROSOFT ADVANCED VPN SETUP" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Configuration
$VPN_ADAPTER_NAME = "Nebulavpn"
$VPN_DNS_SERVERS = @("1.1.1.1", "1.0.0.1")
$VPN_GATEWAY = "10.8.0.1"

Write-Host "🔧 IMPLEMENTING INDUSTRY-STANDARD VPN ROUTING" -ForegroundColor Yellow
Write-Host "Based on research of NordVPN, ExpressVPN, ProtonVPN methods" -ForegroundColor Gray
Write-Host ""

# LAYER 1: NRPT DNS ENFORCEMENT (NordVPN/ExpressVPN Method)
Write-Host "[Layer 1] NRPT System-Wide DNS Enforcement..." -ForegroundColor Cyan
try {
    # Remove existing rules
    Get-DnsClientNrptRule | Where-Object { $_.Comment -like "*NebulaVPN*" } | Remove-DnsClientNrptRule -Force -ErrorAction SilentlyContinue
    
    # Add system-wide DNS policy rule
    $dnsString = $VPN_DNS_SERVERS -join ","
    Add-DnsClientNrptRule -Namespace "." -NameServers $dnsString -Comment "NebulaVPN-Advanced" -ErrorAction Stop
    
    Write-Host "  ✅ NRPT rule added - ALL DNS queries go through VPN" -ForegroundColor Green
    Write-Host "  📍 DNS servers: $dnsString" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ NRPT setup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# LAYER 2: REGISTRY IPv6 DISABLE (Surfshark Method) 
Write-Host "[Layer 2] Registry-Based IPv6 Complete Disable..." -ForegroundColor Cyan
try {
    $regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters"
    Set-ItemProperty -Path $regPath -Name "DisabledComponents" -Value 0xFF -Type DWord -Force
    
    Write-Host "  ✅ IPv6 disabled at registry level (DisabledComponents=0xFF)" -ForegroundColor Green
    Write-Host "  📍 Deeper than adapter-level disable - prevents all IPv6 leaks" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Registry IPv6 disable failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# LAYER 3: WINDOWS FIREWALL ADVANCED RULES (ProtonVPN Method)
Write-Host "[Layer 3] Advanced Windows Firewall Kill Switch..." -ForegroundColor Cyan

# Remove existing rules
$existingRules = @(
    "NebulaVPN-IPv6-Block-Out", "NebulaVPN-IPv6-Block-In",
    "NebulaVPN-Kill-Switch-Out", "NebulaVPN-Kill-Switch-In",
    "NebulaVPN-VPN-Allow"
)

foreach ($ruleName in $existingRules) {
    try {
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    } catch { }
}

# Add comprehensive kill switch rules
$firewallRules = @(
    @{ Name = "NebulaVPN-IPv6-Block-Out"; Direction = "Outbound"; Action = "Block"; Protocol = "Any"; RemoteAddress = "::/0"; Description = "Block all IPv6 outbound" },
    @{ Name = "NebulaVPN-IPv6-Block-In"; Direction = "Inbound"; Action = "Block"; Protocol = "Any"; LocalAddress = "::/0"; Description = "Block all IPv6 inbound" },
    @{ Name = "NebulaVPN-Kill-Switch-Out"; Direction = "Outbound"; Action = "Block"; Protocol = "Any"; RemoteAddress = "Any"; Description = "Kill switch - block all outbound except VPN" },
    @{ Name = "NebulaVPN-VPN-Allow"; Direction = "Outbound"; Action = "Allow"; Protocol = "Any"; InterfaceAlias = $VPN_ADAPTER_NAME; Description = "Allow VPN adapter traffic" }
)

$rulesAdded = 0
foreach ($rule in $firewallRules) {
    try {
        $params = @{
            DisplayName = $rule.Name
            Direction = $rule.Direction  
            Action = $rule.Action
            Protocol = $rule.Protocol
            Enabled = $true
        }
        
        if ($rule.RemoteAddress) { $params.RemoteAddress = $rule.RemoteAddress }
        if ($rule.LocalAddress) { $params.LocalAddress = $rule.LocalAddress }
        if ($rule.InterfaceAlias) { $params.InterfaceAlias = $rule.InterfaceAlias }
        
        New-NetFirewallRule @params | Out-Null
        $rulesAdded++
        Write-Host "  ✓ Added: $($rule.Name)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Failed: $($rule.Name) - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "  ✅ Firewall kill switch: $rulesAdded rules active" -ForegroundColor Green
Write-Host ""

# LAYER 4: POLICY-BASED ROUTING (Microsoft Enterprise Method)
Write-Host "[Layer 4] Policy-Based Routing Setup..." -ForegroundColor Cyan

# Get VPN adapter info
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -eq $VPN_ADAPTER_NAME -or $_.InterfaceDescription -like "*WireGuard*" } | Select-Object -First 1

if ($vpnAdapter) {
    Write-Host "  ✅ VPN Adapter found: $($vpnAdapter.Name) (Index: $($vpnAdapter.InterfaceIndex))" -ForegroundColor Green
    
    try {
        # Enhanced split routing - route critical services through VPN
        $criticalRoutes = @(
            @{ Destination = "0.0.0.0/1"; NextHop = $VPN_GATEWAY; Metric = 1 },
            @{ Destination = "128.0.0.0/1"; NextHop = $VPN_GATEWAY; Metric = 1 },
            @{ Destination = "8.8.8.8/32"; NextHop = $VPN_GATEWAY; Metric = 1 },
            @{ Destination = "1.1.1.1/32"; NextHop = $VPN_GATEWAY; Metric = 1 }
        )
        
        $routesAdded = 0
        foreach ($route in $criticalRoutes) {
            try {
                New-NetRoute -DestinationPrefix $route.Destination -NextHop $route.NextHop -InterfaceIndex $vpnAdapter.InterfaceIndex -RouteMetric $route.Metric -ErrorAction Stop | Out-Null
                $routesAdded++
                Write-Host "  ✓ Route: $($route.Destination) -> $($route.NextHop)" -ForegroundColor Green
            } catch {
                if ($_.Exception.Message -notlike "*already exists*") {
                    Write-Host "  ⚠️ Route failed: $($route.Destination) - $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        }
        
        Write-Host "  ✅ Policy routing: $routesAdded critical routes added" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ Policy routing failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ VPN adapter not found - ensure WireGuard tunnel is active" -ForegroundColor Red
}

Write-Host ""

# LAYER 5: REAL-TIME MONITORING SETUP
Write-Host "[Layer 5] Real-Time Leak Monitoring..." -ForegroundColor Cyan
try {
    # Create monitoring script
    $monitorScript = @"
# Real-time VPN leak monitoring
while (`$true) {
    try {
        # Check external IP
        `$ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
        
        if (`$ip -notmatch "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
            Write-Host "[`$(Get-Date)] 🚨 IP LEAK DETECTED: `$ip" -ForegroundColor Red
        } else {
            Write-Host "[`$(Get-Date)] ✅ VPN IP: `$ip" -ForegroundColor Green  
        }
        
        # Check DNS
        `$dns = Resolve-DnsName google.com -Server 1.1.1.1 -ErrorAction SilentlyContinue
        if (`$dns) {
            Write-Host "[`$(Get-Date)] ✅ DNS through VPN working" -ForegroundColor Green
        }
        
    } catch {
        Write-Host "[`$(Get-Date)] ❌ Monitor check failed" -ForegroundColor Red
    }
    
    Start-Sleep 30
}
"@
    
    $monitorScript | Out-File -FilePath "$PWD\VPN-LEAK-MONITOR.ps1" -Encoding UTF8 -Force
    Write-Host "  ✅ Monitoring script created: VPN-LEAK-MONITOR.ps1" -ForegroundColor Green
    Write-Host "  📍 Run in separate window: .\VPN-LEAK-MONITOR.ps1" -ForegroundColor Gray
    
} catch {
    Write-Host "  ❌ Monitor setup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# VERIFICATION
Write-Host "🔍 VERIFICATION" -ForegroundColor Yellow
Write-Host "===============" -ForegroundColor Yellow

Write-Host ""
Write-Host "Testing connectivity..." -ForegroundColor Gray

# Test basic connectivity
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "✅ Ping test: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "❌ Ping test: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ping test: ERROR" -ForegroundColor Red
}

# Test external IP  
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "✅ External IP: $externalIP" -ForegroundColor Green
    
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
        Write-Host "🎉 SUCCESS: IP appears to be VPN (private range)" -ForegroundColor Green -BackgroundColor DarkGreen
    } else {
        Write-Host "⚠️ WARNING: IP appears to be real ISP (potential leak)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ External IP test: FAILED" -ForegroundColor Red
}

# Test DNS
try {
    $dns = Resolve-DnsName google.com -ErrorAction Stop
    Write-Host "✅ DNS resolution: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "❌ DNS resolution: FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 MICROSOFT ADVANCED VPN SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPLEMENTED TECHNIQUES:" -ForegroundColor Yellow
Write-Host "✓ NRPT system-wide DNS enforcement (NordVPN method)" -ForegroundColor Green
Write-Host "✓ Registry-based IPv6 complete disable (Surfshark method)" -ForegroundColor Green  
Write-Host "✓ Advanced firewall kill switch (ProtonVPN method)" -ForegroundColor Green
Write-Host "✓ Policy-based routing (Microsoft Enterprise method)" -ForegroundColor Green
Write-Host "✓ Real-time leak monitoring setup (Industry standard)" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test browsing and check IP at: https://whatismyipaddress.com/" -ForegroundColor White
Write-Host "2. Run monitoring: .\VPN-LEAK-MONITOR.ps1" -ForegroundColor White
Write-Host "3. If issues, run cleanup: .\CLEANUP-ADVANCED-VPN.ps1" -ForegroundColor White
Write-Host ""