#!/usr/bin/env powershell

# COMPREHENSIVE WIREGUARD TUNNEL DIAGNOSTIC
# Identifies why WireGuard tunnel has no connectivity

Write-Host "🔍 COMPREHENSIVE WIREGUARD TUNNEL DIAGNOSTIC" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

# Function to run commands with timeout
function Invoke-WithTimeout {
    param(
        [ScriptBlock]$ScriptBlock,
        [int]$TimeoutSeconds = 5
    )
    try {
        $job = Start-Job -ScriptBlock $ScriptBlock
        Wait-Job $job -Timeout $TimeoutSeconds | Out-Null
        if ($job.State -eq "Completed") {
            return Receive-Job $job
        } else {
            Stop-Job $job
            Remove-Job $job
            return "TIMEOUT"
        }
    } catch {
        return "ERROR: $($_.Exception.Message)"
    }
}

Write-Host "[1] CHECKING WIREGUARD SERVICE STATUS" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Yellow
try {
    $wgService = Get-Service -Name "*WireGuard*" -ErrorAction SilentlyContinue
    if ($wgService) {
        Write-Host "✅ WireGuard Service Found: $($wgService.Name)" -ForegroundColor Green
        Write-Host "   Status: $($wgService.Status)" -ForegroundColor White
    } else {
        Write-Host "❌ No WireGuard service found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking services: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "[2] CHECKING NETWORK INTERFACES" -ForegroundColor Green  
Write-Host "===============================" -ForegroundColor Yellow
try {
    $adapters = Invoke-WithTimeout { Get-NetAdapter | Select-Object Name, InterfaceDescription, Status, LinkSpeed }
    if ($adapters -ne "TIMEOUT" -and $adapters -ne "ERROR") {
        $vpnAdapters = $adapters | Where-Object { 
            $_.Name -match "Nebula|wg|WireGuard|VPN" -or 
            $_.InterfaceDescription -match "WireGuard|VPN|Tunnel"
        }
        
        if ($vpnAdapters) {
            Write-Host "✅ VPN/WireGuard Interfaces Found:" -ForegroundColor Green
            $vpnAdapters | Format-Table Name, InterfaceDescription, Status, LinkSpeed -AutoSize
        } else {
            Write-Host "❌ No VPN/WireGuard interfaces found" -ForegroundColor Red
            Write-Host "📋 All available network adapters:" -ForegroundColor Cyan
            $adapters | Format-Table Name, Status -AutoSize | Out-String -Width 120
        }
    } else {
        Write-Host "❌ Could not retrieve network adapter information" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking network interfaces: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "[3] CHECKING IP CONFIGURATION" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Yellow
try {
    $ipConfig = Invoke-WithTimeout { Get-NetIPAddress | Where-Object { $_.AddressFamily -eq "IPv4" -and $_.IPAddress -notmatch "127\.|169\.254\." } }
    if ($ipConfig -ne "TIMEOUT" -and $ipConfig -ne "ERROR") {
        Write-Host "📋 Current IPv4 Addresses:" -ForegroundColor Cyan
        $ipConfig | Select-Object InterfaceAlias, IPAddress, PrefixLength | Format-Table -AutoSize
        
        $vpnIPs = $ipConfig | Where-Object { $_.IPAddress -match "10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\." -and $_.InterfaceAlias -match "Nebula|wg|WireGuard" }
        if ($vpnIPs) {
            Write-Host "✅ VPN IP addresses found:" -ForegroundColor Green
            $vpnIPs | Format-Table InterfaceAlias, IPAddress, PrefixLength -AutoSize
        } else {
            Write-Host "❌ No VPN IP addresses detected" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Could not retrieve IP configuration" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking IP configuration: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "[4] TESTING VPN GATEWAY CONNECTIVITY" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow
$commonVpnGateways = @("10.8.0.1", "10.0.0.1", "192.168.100.1", "172.16.0.1")
foreach ($gateway in $commonVpnGateways) {
    Write-Host "Testing $gateway..." -ForegroundColor Yellow
    try {
        $pingResult = Test-Connection -ComputerName $gateway -Count 1 -Quiet -ErrorAction SilentlyContinue
        if ($pingResult) {
            Write-Host "✅ $gateway is reachable" -ForegroundColor Green
        } else {
            Write-Host "❌ $gateway is NOT reachable" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $gateway - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "[5] CHECKING ROUTING TABLE" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Yellow  
try {
    $routes = Invoke-WithTimeout { Get-NetRoute -AddressFamily IPv4 | Where-Object { $_.NextHop -ne "0.0.0.0" -and $_.DestinationPrefix -match "^0\.|^10\.|^192\.168\." } }
    if ($routes -ne "TIMEOUT" -and $routes -ne "ERROR") {
        Write-Host "📋 Key Routes (VPN and Default):" -ForegroundColor Cyan
        $routes | Select-Object DestinationPrefix, NextHop, InterfaceAlias, RouteMetric | Format-Table -AutoSize | Out-String -Width 150
    } else {
        Write-Host "❌ Could not retrieve routing table" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking routes: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "[6] PROCESS CHECK" -ForegroundColor Green
Write-Host "================" -ForegroundColor Yellow
try {
    $vpnProcesses = Get-Process | Where-Object { $_.ProcessName -match "nebula|wireguard|wg|vpn" -or $_.MainWindowTitle -match "nebula|vpn" }
    if ($vpnProcesses) {
        Write-Host "✅ VPN-related processes found:" -ForegroundColor Green
        $vpnProcesses | Select-Object ProcessName, Id, MainWindowTitle | Format-Table -AutoSize
    } else {
        Write-Host "❌ No VPN-related processes running" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking processes: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "[7] INTERNET CONNECTIVITY STATUS" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Yellow
Write-Host "Testing current internet access..." -ForegroundColor Cyan
try {
    $currentIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-Host "✅ Current External IP: $currentIP" -ForegroundColor Green
    
    if ($currentIP -match "10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.") {
        Write-Host "⚠️  This appears to be a VPN IP address" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  This appears to be your ISP IP (not VPN)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Internet connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎯 DIAGNOSTIC SUMMARY" -ForegroundColor Blue
Write-Host "=====================" -ForegroundColor Yellow
Write-Host "1. Check if WireGuard service is installed and running" -ForegroundColor White
Write-Host "2. Verify VPN interface exists and has valid IP" -ForegroundColor White  
Write-Host "3. Test gateway connectivity" -ForegroundColor White
Write-Host "4. Check if Nebula VPN app is running" -ForegroundColor White
Write-Host "5. Verify routing configuration" -ForegroundColor White
Write-Host ""
Write-Host "If tunnel exists but has no connectivity:" -ForegroundColor Cyan
Write-Host "- Gateway may be down/unreachable" -ForegroundColor White
Write-Host "- Routing may be misconfigured" -ForegroundColor White  
Write-Host "- Firewall may be blocking traffic" -ForegroundColor White
Write-Host "- VPN server may be overloaded" -ForegroundColor White
Write-Host ""