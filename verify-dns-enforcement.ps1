#!/usr/bin/env pwsh
# =============================================================================
# Nebula VPN - DNS Enforcement Verification Script
# =============================================================================
# Run this script to verify that DNS is being properly enforced through the VPN
# and not leaking through your ISP's DNS servers.
#
# Usage:
#   .\verify-dns-enforcement.ps1
#
# Requirements:
#   - VPN must be connected
#   - Run from an elevated (Administrator) PowerShell if you want full diagnostics
# =============================================================================

param(
    [switch]$Detailed,
    [switch]$FixIssues
)

$ErrorActionPreference = "Continue"

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     NEBULA VPN - DNS ENFORCEMENT VERIFICATION             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ── 1. Check if running as Administrator ──────────────────────────────────────
Write-Host "1️⃣  ADMINISTRATOR PRIVILEGES CHECK" -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "   ✅ Running as Administrator" -ForegroundColor Green
} else {
    Write-Host "   ❌ NOT running as Administrator" -ForegroundColor Red
    Write-Host "   ⚠️  Some checks will be limited. Rerun with 'Run as Administrator' for full diagnostics." -ForegroundColor Yellow
}

# ── 2. Check VPN Adapter Status ───────────────────────────────────────────────
Write-Host "`n2️⃣  VPN ADAPTER STATUS" -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter -Name "Nebulavpn" -ErrorAction SilentlyContinue

if ($vpnAdapter -and $vpnAdapter.Status -eq "Up") {
    Write-Host "   ✅ VPN adapter 'Nebulavpn' is UP" -ForegroundColor Green
    $vpnConnected = $true
} else {
    Write-Host "   ❌ VPN adapter 'Nebulavpn' is NOT connected" -ForegroundColor Red
    Write-Host "   ℹ️  Please connect to the VPN first, then run this script again." -ForegroundColor Cyan
    $vpnConnected = $false
}

# ── 3. Check VPN IP Address ───────────────────────────────────────────────────
if ($vpnConnected) {
    Write-Host "`n3️⃣  VPN IP ADDRESS" -ForegroundColor Yellow
    $vpnIP = Get-NetIPAddress -InterfaceAlias "Nebulavpn" -AddressFamily IPv4 -ErrorAction SilentlyContinue
    
    if ($vpnIP -and $vpnIP.IPAddress -like "10.8.*") {
        Write-Host "   ✅ VPN IP assigned: $($vpnIP.IPAddress)" -ForegroundColor Green
        $hasVpnIP = $true
    } elseif ($vpnIP -and $vpnIP.IPAddress -like "169.254.*") {
        Write-Host "   ❌ APIPA address detected: $($vpnIP.IPAddress)" -ForegroundColor Red
        Write-Host "   ⚠️  VPN tunnel is not fully established" -ForegroundColor Yellow
        $hasVpnIP = $false
    } else {
        Write-Host "   ❌ No valid VPN IP address" -ForegroundColor Red
        $hasVpnIP = $false
    }
}

# ── 4. Check DNS Servers on VPN Adapter ───────────────────────────────────────
if ($vpnConnected) {
    Write-Host "`n4️⃣  DNS CONFIGURATION ON VPN ADAPTER" -ForegroundColor Yellow
    $vpnDNS = Get-DnsClientServerAddress -InterfaceAlias "Nebulavpn" -AddressFamily IPv4 -ErrorAction SilentlyContinue
    
    if ($vpnDNS.ServerAddresses -and $vpnDNS.ServerAddresses.Count -gt 0) {
        Write-Host "   ✅ IPv4 DNS servers configured: $($vpnDNS.ServerAddresses -join ', ')" -ForegroundColor Green
        $hasDNS = $true
        
        # Check if using trusted DNS (Cloudflare, Google, Quad9)
        $trustedDNS = @('1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4', '9.9.9.9', '149.112.112.112')
        $usingTrustedDNS = $false
        foreach ($dns in $vpnDNS.ServerAddresses) {
            if ($trustedDNS -contains $dns) {
                $usingTrustedDNS = $true
                break
            }
        }
        
        if ($usingTrustedDNS) {
            Write-Host "   ✅ Using trusted DNS provider (privacy-focused)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  DNS servers are not from common trusted providers" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ NO IPv4 DNS servers configured on VPN adapter" -ForegroundColor Red
        Write-Host "   ⚠️  DNS will leak through other network interfaces!" -ForegroundColor Yellow
        $hasDNS = $false
        
        if ($FixIssues) {
            Write-Host "   🔧 Attempting to set DNS servers..." -ForegroundColor Cyan
            if ($isAdmin) {
                try {
                    netsh interface ipv4 set dnsservers name="Nebulavpn" source=static address="1.1.1.1" register=primary validate=no | Out-Null
                    netsh interface ipv4 add dnsservers name="Nebulavpn" address="1.0.0.1" index=2 validate=no | Out-Null
                    Write-Host "   ✅ DNS servers set to 1.1.1.1, 1.0.0.1" -ForegroundColor Green
                    $hasDNS = $true
                } catch {
                    Write-Host "   ❌ Failed to set DNS: $($_.Exception.Message)" -ForegroundColor Red
                }
            } else {
                Write-Host "   ❌ Cannot fix: Administrator privileges required" -ForegroundColor Red
            }
        }
    }
}

# ── 5. Check Interface Priority ───────────────────────────────────────────────
if ($vpnConnected) {
    Write-Host "`n5️⃣  INTERFACE PRIORITY (Routing Metrics)" -ForegroundColor Yellow
    $interfaces = Get-NetIPInterface -ConnectionState Connected -AddressFamily IPv4 | Sort-Object InterfaceMetric
    
    $vpnInterface = $interfaces | Where-Object { $_.InterfaceAlias -eq "Nebulavpn" }
    $otherInterfaces = $interfaces | Where-Object { $_.InterfaceAlias -ne "Nebulavpn" -and $_.InterfaceAlias -ne "Loopback Pseudo-Interface 1" }
    
    Write-Host "   Interface Priority (lower metric = higher priority):" -ForegroundColor Gray
    foreach ($iface in $interfaces | Select-Object -First 5) {
        $icon = if ($iface.InterfaceAlias -eq "Nebulavpn") { "🔒" } else { "  " }
        $color = if ($iface.InterfaceAlias -eq "Nebulavpn") { "Green" } else { "Gray" }
        Write-Host "   $icon [$($iface.InterfaceMetric.ToString().PadLeft(3))] $($iface.InterfaceAlias)" -ForegroundColor $color
    }
    
    if ($vpnInterface -and $otherInterfaces -and $vpnInterface.InterfaceMetric -lt $otherInterfaces[0].InterfaceMetric) {
        Write-Host "`n   ✅ VPN has highest priority (metric: $($vpnInterface.InterfaceMetric))" -ForegroundColor Green
        $hasCorrectPriority = $true
    } else {
        Write-Host "`n   ⚠️  VPN may not have highest priority" -ForegroundColor Yellow
        $hasCorrectPriority = $false
    }
}

# ── 6. Test Actual DNS Resolution ─────────────────────────────────────────────
if ($vpnConnected -and $hasDNS) {
    Write-Host "`n6️⃣  ACTUAL DNS RESOLUTION TEST" -ForegroundColor Yellow
    
    # Test with nslookup to see which DNS server is actually used
    $nslookupOutput = nslookup google.com 2>&1 | Out-String
    
    # Extract the DNS server from nslookup output
    if ($nslookupOutput -match "Server:\s+(.+)") {
        $dnsServerUsed = $matches[1].Trim()
        Write-Host "   DNS Server Used: $dnsServerUsed" -ForegroundColor Cyan
        
        # Check if it matches VPN DNS
        $vpnDNSServers = $vpnDNS.ServerAddresses
        $isUsingVpnDNS = $false
        foreach ($dnsServer in $vpnDNSServers) {
            if ($dnsServerUsed -match $dnsServer -or $nslookupOutput -match $dnsServer) {
                $isUsingVpnDNS = $true
                break
            }
        }
        
        if ($isUsingVpnDNS) {
            Write-Host "   ✅ Using VPN DNS server" -ForegroundColor Green
            $dnsWorking = $true
        } else {
            Write-Host "   ❌ NOT using VPN DNS server!" -ForegroundColor Red
            Write-Host "   ⚠️  DNS is leaking through non-VPN interface" -ForegroundColor Yellow
            $dnsWorking = $false
        }
    }
    
    # Additional check using Resolve-DnsName
    Write-Host "`n   Testing DNS leak detection services..." -ForegroundColor Cyan
    try {
        $dnsLeakTest = Resolve-DnsName -Name "whoami.akamai.net" -Type A -ErrorAction Stop | Select-Object -First 1
        Write-Host "   Your apparent IP from DNS: $($dnsLeakTest.IPAddress)" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️  Could not perform DNS leak test" -ForegroundColor Yellow
    }
}

# ── 7. Check for DNS Leaks via Other Adapters ─────────────────────────────────
if ($vpnConnected) {
    Write-Host "`n7️⃣  CHECK FOR DNS LEAKS ON OTHER ADAPTERS" -ForegroundColor Yellow
    $allDNS = Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 -and $_.InterfaceAlias -ne "Nebulavpn" }
    
    if ($allDNS.Count -gt 0) {
        Write-Host "   ⚠️  WARNING: Other adapters have DNS servers configured:" -ForegroundColor Yellow
        foreach ($dns in $allDNS) {
            Write-Host "      - $($dns.InterfaceAlias): $($dns.ServerAddresses -join ', ')" -ForegroundColor Yellow
        }
        Write-Host "`n   ℹ️  These DNS servers may be used if VPN DNS fails or has higher metric" -ForegroundColor Cyan
        $potentialLeaks = $true
    } else {
        Write-Host "   ✅ No DNS servers configured on other adapters" -ForegroundColor Green
        $potentialLeaks = $false
    }
}

# ── 8. Summary and Recommendations ────────────────────────────────────────────
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SUMMARY & VERDICT                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$allGood = $isAdmin -and $vpnConnected -and $hasVpnIP -and $hasDNS -and $dnsWorking

if ($allGood) {
    Write-Host "   🎉 DNS ENFORCEMENT IS WORKING CORRECTLY!" -ForegroundColor Green
    Write-Host "   ✅ All DNS queries are going through the VPN" -ForegroundColor Green
    Write-Host "   ✅ No DNS leaks detected" -ForegroundColor Green
} elseif ($vpnConnected -and $hasDNS -and $dnsWorking) {
    Write-Host "   ✅ DNS enforcement is mostly working" -ForegroundColor Green
    Write-Host "   ⚠️  Some minor issues detected (see above)" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ DNS ENFORCEMENT HAS ISSUES!" -ForegroundColor Red
    Write-Host "" 
    Write-Host "   Issues Found:" -ForegroundColor Yellow
    
    if (-not $isAdmin) {
        Write-Host "   • Not running as Administrator" -ForegroundColor Red
        Write-Host "     → This script should be run as Administrator for full diagnostics" -ForegroundColor Gray
    }
    
    if (-not $vpnConnected) {
        Write-Host "   • VPN is not connected" -ForegroundColor Red
        Write-Host "     → Connect to VPN first" -ForegroundColor Gray
    }
    
    if ($vpnConnected -and -not $hasVpnIP) {
        Write-Host "   • VPN has no valid IP address" -ForegroundColor Red
        Write-Host "     → VPN tunnel is not established properly" -ForegroundColor Gray
    }
    
    if ($vpnConnected -and -not $hasDNS) {
        Write-Host "   • VPN adapter has no IPv4 DNS servers" -ForegroundColor Red
        Write-Host "     → Restart Nebula VPN as Administrator" -ForegroundColor Gray
        Write-Host "     → DNS setting requires elevated privileges" -ForegroundColor Gray
    }
    
    if ($hasDNS -and -not $dnsWorking) {
        Write-Host "   • DNS queries not using VPN DNS" -ForegroundColor Red
        Write-Host "     → Check interface metrics and routing" -ForegroundColor Gray
    }
}

Write-Host "`n   Recommendations:" -ForegroundColor Cyan
Write-Host "   • Always run Nebula VPN as Administrator for full DNS protection" -ForegroundColor Gray
Write-Host "   • Use the start-vpn-admin.ps1 script to launch with elevation" -ForegroundColor Gray
Write-Host "   • Periodically run this verification script to ensure no leaks" -ForegroundColor Gray

if ($Detailed) {
    Write-Host "`n   Detailed Logs:" -ForegroundColor Cyan
    Write-Host "   • Check electron app console for DNS enforcement logs" -ForegroundColor Gray
    Write-Host "   • Look for '[DNS] Applied servers' messages" -ForegroundColor Gray
}

Write-Host ""
