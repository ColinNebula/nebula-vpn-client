#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Nebula VPN - Unified Management Tool
.DESCRIPTION
    Single script to replace 80+ VPN-related PowerShell scripts
.PARAMETER Action
    Action to perform: diagnose, fix, cleanup, monitor, test, status
.PARAMETER Quick
    Quick mode - faster but less thorough
.PARAMETER Reset
    Force cleanup and reset
.EXAMPLE
    .\nebula-vpn.ps1 -Action diagnose
    .\nebula-vpn.ps1 -Action fix
    .\nebula-vpn.ps1 -Action status -Quick
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('diagnose', 'fix', 'cleanup', 'monitor', 'test', 'status', 'menu')]
    [string]$Action = 'menu',
    
    [Parameter(Mandatory=$false)]
    [switch]$Quick,
    
    [Parameter(Mandatory=$false)]
    [switch]$Reset
)

$ErrorActionPreference = 'Stop'

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-AdminPrivileges {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-VPNAdapter {
    try {
        return Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -or $_.Name -like "*wg*" } | Select-Object -First 1
    } catch {
        return $null
    }
}

# ============================================================================
# DIAGNOSTIC FUNCTIONS
# ============================================================================

function Invoke-VPNDiagnostics {
    param([bool]$QuickMode = $false)
    
    Write-Header "VPN DIAGNOSTICS"
    
    $results = @{
        VPNAdapter = $false
        WireGuardService = $false
        PublicIP = $null
        DNS = $null
        Routing = $false
        Security = 0
    }
    
    # Check VPN adapter
    Write-Host "[1/6] Checking VPN Interface..." -ForegroundColor Yellow
    $adapter = Get-VPNAdapter
    if ($adapter) {
        Write-Host "  [PASS] VPN Interface Active - $($adapter.Name)" -ForegroundColor Green
        $results.VPNAdapter = $true
        
        # Get VPN IP
        $vpnIP = Get-NetIPAddress -InterfaceAlias $adapter.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($vpnIP) {
            Write-Host "  VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  [FAIL] No VPN Interface Found" -ForegroundColor Red
    }
    
    # Check WireGuard
    Write-Host ""
    Write-Host "[2/6] Checking WireGuard Service..." -ForegroundColor Yellow
    try {
        $wgStatus = wg show 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [PASS] WireGuard Active" -ForegroundColor Green
            $results.WireGuardService = $true
        } else {
            Write-Host "  [FAIL] WireGuard Not Active" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [FAIL] WireGuard Not Installed" -ForegroundColor Red
    }
    
    # Check Public IP
    Write-Host ""
    Write-Host "[3/6] Checking Public IP..." -ForegroundColor Yellow
    try {
        $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content
        Write-Host "  Public IP: $publicIP" -ForegroundColor Cyan
        $results.PublicIP = $publicIP
    } catch {
        Write-Host "  [FAIL] Cannot retrieve public IP" -ForegroundColor Red
    }
    
    # Check DNS
    Write-Host ""
    Write-Host "[4/6] Checking DNS Configuration..." -ForegroundColor Yellow
    if ($adapter) {
        $dns = Get-DnsClientServerAddress -InterfaceAlias $adapter.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($dns.ServerAddresses) {
            Write-Host "  [PASS] VPN DNS Configured - $($dns.ServerAddresses -join ', ')" -ForegroundColor Green
            $results.DNS = $dns.ServerAddresses
        }
    }
    
    # Check Routing
    Write-Host ""
    Write-Host "[5/6] Checking Routing Table..." -ForegroundColor Yellow
    $defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($defaultRoute) {
        $routeAdapter = Get-NetAdapter -InterfaceIndex $defaultRoute.InterfaceIndex -ErrorAction SilentlyContinue
        if ($routeAdapter.Name -like "*Nebula*") {
            Write-Host "  [PASS] Default Route via VPN" -ForegroundColor Green
            $results.Routing = $true
        } else {
            Write-Host "  [WARN] Default Route NOT via VPN ($($routeAdapter.Name))" -ForegroundColor Yellow
        }
    }
    
    # Security Score
    Write-Host ""
    Write-Host "[6/6] Security Assessment..." -ForegroundColor Yellow
    $score = 0
    if ($results.VPNAdapter) { $score += 20 }
    if ($results.WireGuardService) { $score += 20 }
    if ($results.PublicIP -and $results.PublicIP -ne "99.247.207.59") { $score += 30 }
    if ($results.DNS) { $score += 15 }
    if ($results.Routing) { $score += 15 }
    
    $results.Security = $score
    
    if ($score -ge 80) {
        Write-Host "  [PASS] Security Score - ${score}% - Excellent" -ForegroundColor Green
    } elseif ($score -ge 60) {
        Write-Host "  [WARN] Security Score - ${score}% - Needs improvement" -ForegroundColor Yellow
    } else {
        Write-Host "  [FAIL] Security Score - ${score}% - Critical issues" -ForegroundColor Red
    }
    
    return $results
}

# ============================================================================
# FIX FUNCTIONS
# ============================================================================

function Invoke-VPNFix {
    Write-Header "VPN FIX"
    
    if (-not (Test-AdminPrivileges)) {
        Write-Host "❌ Administrator privileges required!" -ForegroundColor Red
        Write-Host "   Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Applying comprehensive VPN fixes..." -ForegroundColor Yellow
    Write-Host ""
    
    # Fix 1: Firewall rules
    Write-Host "[1/4] Creating firewall rules..." -ForegroundColor Yellow
    $adapter = Get-VPNAdapter
    if ($adapter) {
        $ruleName = "NebulaVPN-AllowVPNInterface"
        $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        
        if (-not $existingRule) {
            New-NetFirewallRule -DisplayName $ruleName `
                -Direction Outbound `
                -Action Allow `
                -InterfaceAlias $adapter.Name `
                -Profile Any `
                -ErrorAction SilentlyContinue | Out-Null
            Write-Host "  ✓ Firewall rule created" -ForegroundColor Green
        } else {
            Write-Host "  ✓ Firewall rule exists" -ForegroundColor Green
        }
    }
    
    # Fix 2: Adjust interface metrics
    Write-Host ""
    Write-Host "[2/4] Adjusting interface metrics..." -ForegroundColor Yellow
    if ($adapter) {
        Set-NetIPInterface -InterfaceAlias $adapter.Name -InterfaceMetric 5 -ErrorAction SilentlyContinue
        Write-Host "  ✓ VPN metric set to 5" -ForegroundColor Green
        
        # Increase other adapters
        Get-NetAdapter | Where-Object { $_.Name -ne $adapter.Name -and $_.Status -eq "Up" } | ForEach-Object {
            Set-NetIPInterface -InterfaceAlias $_.Name -InterfaceMetric 50 -ErrorAction SilentlyContinue
        }
        Write-Host "  ✓ Other adapters metric set to 50" -ForegroundColor Green
    }
    
    # Fix 3: DNS enforcement
    Write-Host ""
    Write-Host "[3/4] Enforcing VPN DNS..." -ForegroundColor Yellow
    if ($adapter) {
        Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses @("1.1.1.1", "1.0.0.1") -ErrorAction SilentlyContinue
        Write-Host "  ✓ DNS set to 1.1.1.1, 1.0.0.1" -ForegroundColor Green
    }
    
    # Fix 4: IPv6 block
    Write-Host ""
    Write-Host "[4/4] Blocking IPv6 leaks..." -ForegroundColor Yellow
    Get-NetAdapter | Where-Object { $_.Name -ne $adapter.Name } | ForEach-Object {
        Disable-NetAdapterBinding -Name $_.Name -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
    }
    Write-Host "  ✓ IPv6 disabled on non-VPN adapters" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ VPN fixes applied!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test your connection with: .\nebula-vpn.ps1 -Action test" -ForegroundColor Cyan
}

# ============================================================================
# CLEANUP FUNCTIONS
# ============================================================================

function Invoke-VPNCleanup {
    Write-Header "VPN CLEANUP"
    
    if (-not (Test-AdminPrivileges)) {
        Write-Host "❌ Administrator privileges required!" -ForegroundColor Red
        return
    }
    
    Write-Host "Cleaning up VPN configuration..." -ForegroundColor Yellow
    Write-Host ""
    
    # Remove firewall rules
    Write-Host "[1/3] Removing firewall rules..." -ForegroundColor Yellow
    Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Nebula*" } | Remove-NetFirewallRule -ErrorAction SilentlyContinue
    Write-Host "  ✓ Firewall rules removed" -ForegroundColor Green
    
    # Reset DNS
    Write-Host ""
    Write-Host "[2/3] Resetting DNS..." -ForegroundColor Yellow
    Get-NetAdapter | ForEach-Object {
        Set-DnsClientServerAddress -InterfaceAlias $_.Name -ResetServerAddresses -ErrorAction SilentlyContinue
    }
    Write-Host "  ✓ DNS reset to automatic" -ForegroundColor Green
    
    # Re-enable IPv6
    Write-Host ""
    Write-Host "[3/3] Re-enabling IPv6..." -ForegroundColor Yellow
    Get-NetAdapter | ForEach-Object {
        Enable-NetAdapterBinding -Name $_.Name -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
    }
    Write-Host "  ✓ IPv6 re-enabled" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
}

# ============================================================================
# QUICK STATUS
# ============================================================================

function Get-VPNStatus {
    $adapter = Get-VPNAdapter
    
    if ($adapter) {
        Write-Host "VPN Status: " -NoNewline
        Write-Host "CONNECTED" -ForegroundColor Green
        
        $vpnIP = Get-NetIPAddress -InterfaceAlias $adapter.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($vpnIP) {
            Write-Host "VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "VPN Status: " -NoNewline
        Write-Host "DISCONNECTED" -ForegroundColor Red
    }
}

# ============================================================================
# MENU
# ============================================================================

function Show-Menu {
    Write-Header "NEBULA VPN MANAGEMENT"
    
    Write-Host "1. Diagnose VPN" -ForegroundColor White
    Write-Host "2. Fix VPN Issues" -ForegroundColor White
    Write-Host "3. Cleanup VPN" -ForegroundColor White
    Write-Host "4. Quick Status" -ForegroundColor White
    Write-Host "5. Test Connection" -ForegroundColor White
    Write-Host "6. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Select option (1-6)"
    
    switch ($choice) {
        '1' { Invoke-VPNDiagnostics; Pause }
        '2' { Invoke-VPNFix; Pause }
        '3' { Invoke-VPNCleanup; Pause }
        '4' { Get-VPNStatus; Pause }
        '5' { & ".\TEST-VPN-TUNNEL.ps1" -Quick; Pause }
        '6' { return }
        default { Write-Host "Invalid choice" -ForegroundColor Red; Start-Sleep -Seconds 1 }
    }
    
    Show-Menu
}

# ============================================================================
# MAIN
# ============================================================================

switch ($Action) {
    'diagnose' { Invoke-VPNDiagnostics -QuickMode $Quick }
    'fix' { Invoke-VPNFix }
    'cleanup' { Invoke-VPNCleanup }
    'status' { Get-VPNStatus }
    'test' { & ".\TEST-VPN-TUNNEL.ps1" -Quick:$Quick }
    'menu' { Show-Menu }
}
