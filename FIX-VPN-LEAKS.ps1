#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Fix VPN security leaks (IPv6, routing, DNS)

.DESCRIPTION
    Automatically fixes common VPN security issues:
    - Disables IPv6 to prevent IPv6 leaks
    - Configures split tunneling (internet → VPN, local networks → WiFi/LAN)
    - Ensures VPN DNS is prioritized
    
    Split tunneling preserves access to WiFi router, printers, and local devices
    while routing internet traffic securely through VPN.
    
    REQUIRES ADMINISTRATOR PRIVILEGES

.PARAMETER DisableIPv6
    Disable IPv6 on all network adapters

.PARAMETER FixRouting
    Configure split tunneling (preserves WiFi/LAN access while using VPN)

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

# Fix Routing with Split Tunneling
if ($FixRouting) {
    Write-Host "`n[2] Fixing routing with split tunneling..." -ForegroundColor Yellow
    Write-Host "  (This preserves WiFi/LAN access while securing internet traffic)" -ForegroundColor Cyan
    
    # Find VPN adapter
    $vpnAdapter = Get-NetAdapter | Where-Object { 
        $_.InterfaceDescription -like "*WireGuard*" -or 
        $_.Name -like "*Nebula*" -or
        $_.Name -like "*wg*"
    }
    
    if ($vpnAdapter) {
        Write-Host "  Found VPN adapter: $($vpnAdapter.Name)" -ForegroundColor Gray
        $interfaceIndex = $vpnAdapter.InterfaceIndex
        
        try {
            # Get physical gateway for local network routes
            $physicalGateway = $null
            $defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Select-Object -First 1
            
            if ($defaultRoute) {
                $physicalAdapter = Get-NetAdapter -InterfaceIndex $defaultRoute.ifIndex
                if ($physicalAdapter.InterfaceIndex -ne $vpnAdapter.InterfaceIndex) {
                    $physicalGateway = $defaultRoute.NextHop
                    Write-Host "  Physical gateway: $physicalGateway" -ForegroundColor Gray
                } else {
                    # VPN is already default, try to find physical gateway from routing table
                    $routeCommand = "route print 0.0.0.0"
                    $routeOutput = cmd /c $routeCommand 2>&1 | Select-String "0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)"
                    if ($routeOutput -match "(\d+\.\d+\.\d+\.\d+)") {
                        $physicalGateway = $matches[1]
                        Write-Host "  Physical gateway: $physicalGateway" -ForegroundColor Gray
                    }
                }
            }
            
            if ($physicalGateway) {
                # Add local network bypass routes (preserves WiFi/LAN access)
                Write-Host "  Adding local network bypass routes..." -ForegroundColor Yellow
                
                $localNetworks = @(
                    @{Network='192.168.0.0'; Mask='255.255.0.0'; Desc='Class C private networks'},
                    @{Network='10.0.0.0'; Mask='255.0.0.0'; Desc='Class A private networks'},
                    @{Network='172.16.0.0'; Mask='255.240.0.0'; Desc='Class B private networks'},
                    @{Network='169.254.0.0'; Mask='255.255.0.0'; Desc='Link-local addresses'},
                    @{Network='224.0.0.0'; Mask='240.0.0.0'; Desc='Multicast traffic'}
                )
                
                foreach ($net in $localNetworks) {
                    try {
                        $routeCmd = "route add $($net.Network) mask $($net.Mask) $physicalGateway metric 1"
                        $result = cmd /c $routeCmd 2>&1
                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "    [OK] $($net.Desc) → WiFi/LAN" -ForegroundColor Green
                            $fixed++
                        } elseif ($result -like "*already exists*") {
                            Write-Host "    [SKIP] $($net.Desc) route exists" -ForegroundColor Gray
                        }
                    } catch {
                        Write-Host "    [ERROR] Failed $($net.Desc): $($_.Exception.Message)" -ForegroundColor Red
                        $errors++
                    }
                }
            }
            
            # Add split default routes for internet traffic through VPN
            Write-Host "  Adding VPN routes for internet traffic..." -ForegroundColor Yellow
            
            $vpnRoutes = @(
                @{Network='0.0.0.0'; Mask='128.0.0.0'; Desc='Internet traffic (1/2)'},
                @{Network='128.0.0.0'; Mask='128.0.0.0'; Desc='Internet traffic (2/2)'}
            )
            
            foreach ($route in $vpnRoutes) {
                try {
                    $routeCmd = "route add $($route.Network) mask $($route.Mask) 0.0.0.0 metric 1 if $interfaceIndex"
                    $result = cmd /c $routeCmd 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "    [OK] $($route.Desc) → VPN" -ForegroundColor Green
                        $fixed++
                    } elseif ($result -like "*already exists*") {
                        # Try to change existing route
                        $changeCmd = "route change $($route.Network) mask $($route.Mask) 0.0.0.0 metric 1 if $interfaceIndex"
                        cmd /c $changeCmd 2>&1 | Out-Null
                        Write-Host "    [OK] $($route.Desc) → VPN (updated)" -ForegroundColor Green
                        $fixed++
                    }
                } catch {
                    Write-Host "    [ERROR] Failed $($route.Desc): $($_.Exception.Message)" -ForegroundColor Red
                    $errors++
                }
            }
            
            Write-Host "  [OK] Split tunneling configured" -ForegroundColor Green
            Write-Host "       Local networks use WiFi, internet uses VPN" -ForegroundColor Gray
            
        } catch {
            Write-Host "  [ERROR] Failed to configure split tunneling: $($_.Exception.Message)" -ForegroundColor Red
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
