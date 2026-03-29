#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fix VPN security leaks (IPv6, routing, DNS)

.DESCRIPTION
    Automatically fixes common VPN security issues:
    - Disables IPv6 to prevent IPv6 leaks
    - Forces default route through VPN
    - Ensures VPN DNS is prioritized
    
    REQUIRES ADMINISTRATOR PRIVILEGES

.PARAMETER DisableIPv6
    Disable IPv6 on all network adapters

.PARAMETER FixRouting
    Force all traffic through VPN tunnel

.PARAMETER RevertIPv6
    Re-enable IPv6 (undo DisableIPv6)

.EXAMPLE
    .\FIX-VPN-LEAKS.ps1 -DisableIPv6
    .\FIX-VPN-LEAKS.ps1 -FixRouting
    .\FIX-VPN-LEAKS.ps1 -DisableIPv6 -FixRouting
    .\FIX-VPN-LEAKS.ps1 -RevertIPv6
#>

param(
    [switch]$DisableIPv6,
    [switch]$FixRouting,
    [switch]$RevertIPv6
)

# Check for administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`nERROR: This script requires administrator privileges" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run:" -ForegroundColor Yellow
    Write-Host "  cd '$PWD'" -ForegroundColor Gray
    Write-Host "  .\FIX-VPN-LEAKS.ps1 $(if ($DisableIPv6) {'-DisableIPv6'}) $(if ($FixRouting) {'-FixRouting'}) $(if ($RevertIPv6) {'-RevertIPv6'})" -ForegroundColor Gray
    Write-Host ""
    
    # Offer to restart as admin
    $restart = Read-Host "Restart this script as administrator? (Y/N)"
    if ($restart -eq 'Y' -or $restart -eq 'y') {
        $arguments = ""
        if ($DisableIPv6) { $arguments += " -DisableIPv6" }
        if ($FixRouting) { $arguments += " -FixRouting" }
        if ($RevertIPv6) { $arguments += " -RevertIPv6" }
        
        Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`"$arguments"
    }
    exit 1
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  VPN SECURITY LEAK FIX" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

$fixed = 0
$errors = 0

# Fix IPv6 Leaks
if ($DisableIPv6) {
    Write-Host "[1] Disabling IPv6 on all adapters..." -ForegroundColor Yellow
    
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    
    foreach ($adapter in $adapters) {
        try {
            $binding = Get-NetAdapterBinding -Name $adapter.Name -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
            
            if ($binding -and $binding.Enabled) {
                Disable-NetAdapterBinding -Name $adapter.Name -ComponentID ms_tcpip6 -Confirm:$false
                Write-Host "  [OK] Disabled IPv6 on: $($adapter.Name)" -ForegroundColor Green
                $fixed++
            } else {
                Write-Host "  [SKIP] IPv6 already disabled: $($adapter.Name)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "  [ERROR] Failed on $($adapter.Name): $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    }
    
    Write-Host "  IPv6 disabled on $fixed adapter(s)" -ForegroundColor Green
}

# Re-enable IPv6
if ($RevertIPv6) {
    Write-Host "[1] Re-enabling IPv6 on all adapters..." -ForegroundColor Yellow
    
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
    
    foreach ($adapter in $adapters) {
        try {
            $binding = Get-NetAdapterBinding -Name $adapter.Name -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
            
            if ($binding -and -not $binding.Enabled) {
                Enable-NetAdapterBinding -Name $adapter.Name -ComponentID ms_tcpip6 -Confirm:$false
                Write-Host "  [OK] Enabled IPv6 on: $($adapter.Name)" -ForegroundColor Green
                $fixed++
            } else {
                Write-Host "  [SKIP] IPv6 already enabled: $($adapter.Name)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "  [ERROR] Failed on $($adapter.Name): $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    }
    
    Write-Host "  IPv6 enabled on $fixed adapter(s)" -ForegroundColor Green
}

# Fix Routing
if ($FixRouting) {
    Write-Host "`n[2] Fixing default route..." -ForegroundColor Yellow
    
    # Find VPN adapter
    $vpnAdapter = Get-NetAdapter | Where-Object { 
        $_.InterfaceDescription -like "*WireGuard*" -or 
        $_.Name -like "*Nebula*" -or
        $_.Name -like "*wg*"
    }
    
    if ($vpnAdapter) {
        Write-Host "  Found VPN adapter: $($vpnAdapter.Name)" -ForegroundColor Gray
        
        try {
            # Get current default route
            $defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
            
            if ($defaultRoute) {
                $currentAdapter = Get-NetAdapter -InterfaceIndex $defaultRoute.ifIndex
                Write-Host "  Current default route via: $($currentAdapter.Name)" -ForegroundColor Gray
                
                # If not already through VPN, change it
                if ($defaultRoute.ifIndex -ne $vpnAdapter.InterfaceIndex) {
                    # Lower metric of VPN route to prioritize it
                    $vpnRoutes = Get-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex
                    foreach ($route in $vpnRoutes) {
                        if ($route.RouteMetric -gt 1) {
                            Set-NetRoute -InterfaceIndex $vpnAdapter.InterfaceIndex `
                                        -DestinationPrefix $route.DestinationPrefix `
                                        -RouteMetric 1 `
                                        -ErrorAction SilentlyContinue
                        }
                    }
                    
                    Write-Host "  [OK] VPN routes prioritized" -ForegroundColor Green
                    $fixed++
                } else {
                    Write-Host "  [SKIP] Default route already via VPN" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "  [ERROR] Failed to modify routes: $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "  [ERROR] No VPN adapter found" -ForegroundColor Red
        $errors++
    }
}

# Summary
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Fixed:  $fixed" -ForegroundColor Green
Write-Host "  Errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Gray" })
Write-Host "`n  Recommendation:" -ForegroundColor Yellow
Write-Host "  Run .\TEST-VPN-TUNNEL.ps1 to verify fixes" -ForegroundColor Gray
Write-Host "================================================================`n" -ForegroundColor Cyan

if ($errors -eq 0 -and $fixed -gt 0) {
    exit 0
} else {
    exit 1
}
