#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Proactive Split Tunneling Setup for Nebula VPN
    
.DESCRIPTION
    Sets up split tunneling BEFORE connecting VPN to prevent WiFi blocking.
    This script detects your physical gateway and configures local network 
    routes to prevent WiFi/LAN access loss when WireGuard connects.
    
    CRITICAL: Run this BEFORE connecting your VPN!
    
.PARAMETER PrepareOnly
    Only detect gateway and prepare routes, don't apply them yet
    
.PARAMETER Monitor
    Stay running and monitor for VPN connection, auto-apply fixes
    
.EXAMPLE
    .\SETUP-SPLIT-TUNNELING-FIXED.ps1
    .\SETUP-SPLIT-TUNNELING-FIXED.ps1 -PrepareOnly
    .\SETUP-SPLIT-TUNNELING-FIXED.ps1 -Monitor
#>

param(
    [switch]$PrepareOnly,
    [switch]$Monitor
)

# Requires Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`nERROR: Administrator privileges required" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator', then:" -ForegroundColor Yellow
    Write-Host "  cd '$PWD'" -ForegroundColor Gray
    Write-Host "  .\SETUP-SPLIT-TUNNELING-FIXED.ps1" -ForegroundColor Gray
    
    $restart = Read-Host "`nRestart as administrator? (Y/N)"
    if ($restart -eq 'Y' -or $restart -eq 'y') {
        $arguments = ""
        if ($PrepareOnly) { $arguments += " -PrepareOnly" }
        if ($Monitor) { $arguments += " -Monitor" }
        Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`"$arguments"
    }
    exit 1
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  PROACTIVE SPLIT TUNNELING SETUP" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

Write-Host "STEP 1: Detecting Physical Gateway (before VPN connects)..." -ForegroundColor Yellow

# Enhanced Gateway Detection
function Get-PhysicalGateway {
    $detectionMethods = @()
    $physicalGateway = $null
    
    # Method 1: PowerShell NetRoute (most reliable)
    try {
        Write-Host "  * Trying PowerShell NetRoute method..." -ForegroundColor Gray
        
        $nonVpnRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Where-Object {
            $adapter = Get-NetAdapter -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
            $adapter -and 
            $adapter.InterfaceDescription -notlike "*WireGuard*" -and 
            $adapter.Name -notlike "*Nebula*" -and
            $adapter.Name -notlike "*wg*"
        } | Sort-Object RouteMetric | Select-Object -First 1
        
        if ($nonVpnRoutes -and $nonVpnRoutes.NextHop -ne "0.0.0.0") {
            $physicalGateway = $nonVpnRoutes.NextHop
            $detectionMethods += "PowerShell NetRoute"
            Write-Host "    SUCCESS: Found via PowerShell: $physicalGateway" -ForegroundColor Green
        }
    } catch {
        Write-Host "    FAILED: PowerShell method failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Method 2: Route table parsing
    if (-not $physicalGateway) {
        try {
            Write-Host "  * Trying route table parsing..." -ForegroundColor Gray
            
            $routeOutput = cmd /c "route print 0.0.0.0" 2>&1
            $routeLines = $routeOutput | Where-Object { $_ -match "^\s*0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)" }
            
            foreach ($line in $routeLines) {
                if ($line -match "(\d+\.\d+\.\d+\.\d+)\s+(\d+)\s*$") {
                    $gw = $matches[1]
                    $metric = [int]$matches[2]
                    
                    if ($gw -ne "0.0.0.0" -and $metric -lt 100) {
                        $physicalGateway = $gw
                        $detectionMethods += "Route Table"
                        Write-Host "    SUCCESS: Found via route table: $physicalGateway (metric: $metric)" -ForegroundColor Green
                        break
                    }
                }
            }
        } catch {
            Write-Host "    FAILED: Route table method failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Method 3: WiFi adapter specific lookup
    if (-not $physicalGateway) {
        try {
            Write-Host "  * Trying WiFi adapter method..." -ForegroundColor Gray
            
            $wifiAdapter = Get-NetAdapter | Where-Object {
                $_.Status -eq "Up" -and (
                    $_.Name -like "*WiFi*" -or 
                    $_.Name -like "*Wireless*" -or 
                    $_.InterfaceDescription -like "*Wireless*" -or
                    $_.InterfaceDescription -like "*Wi-Fi*"
                )
            } | Select-Object -First 1
            
            if ($wifiAdapter) {
                $wifiConfig = Get-NetIPConfiguration -InterfaceIndex $wifiAdapter.InterfaceIndex -ErrorAction SilentlyContinue
                if ($wifiConfig -and $wifiConfig.IPv4DefaultGateway) {
                    $physicalGateway = $wifiConfig.IPv4DefaultGateway.NextHop
                    $detectionMethods += "WiFi Adapter"
                    Write-Host "    SUCCESS: Found via WiFi adapter: $physicalGateway" -ForegroundColor Green
                }
            }
        } catch {
            Write-Host "    FAILED: WiFi adapter method failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Method 4: Ping test common gateways
    if (-not $physicalGateway) {
        Write-Host "  * Trying ping test method..." -ForegroundColor Gray
        $commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "172.16.0.1")
        
        foreach ($gw in $commonGateways) {
            try {
                $null = Test-Connection -ComputerName $gw -Count 1 -Quiet -TimeoutSec 2
                $physicalGateway = $gw
                $detectionMethods += "Ping Test"
                Write-Host "    SUCCESS: Found via ping test: $physicalGateway" -ForegroundColor Green
                break
            } catch {
                # Continue to next gateway
            }
        }
    }
    
    return @{
        Gateway = $physicalGateway
        Methods = $detectionMethods
    }
}

$gatewayResult = Get-PhysicalGateway

if ($gatewayResult.Gateway) {
    Write-Host "`nSUCCESS: Physical gateway detected!" -ForegroundColor Green
    Write-Host "   Gateway: $($gatewayResult.Gateway)" -ForegroundColor White
    Write-Host "   Methods: $($gatewayResult.Methods -join ', ')" -ForegroundColor Gray
    
    $physicalGateway = $gatewayResult.Gateway
} else {
    Write-Host "`nCRITICAL: Could not detect physical gateway!" -ForegroundColor Red
    Write-Host "This means WiFi will likely be blocked when VPN connects." -ForegroundColor Yellow
    
    Write-Host "`nMANUAL DETECTION:" -ForegroundColor Cyan
    Write-Host "Find your router IP manually and enter it below." -ForegroundColor Gray
    Write-Host "Common values: 192.168.1.1, 192.168.0.1, 10.0.0.1" -ForegroundColor Gray
    
    do {
        $manualGateway = Read-Host "`nEnter your router IP (or 'exit' to abort)"
        if ($manualGateway -eq 'exit') {
            Write-Host "Exiting without setup. VPN may block WiFi when connected." -ForegroundColor Yellow
            exit 1
        }
        
        $isValidIP = $manualGateway -match "^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$"
        if (-not $isValidIP) {
            Write-Host "Invalid IP format. Please try again." -ForegroundColor Red
            continue
        }
        
        # Test the manual gateway
        $testResult = Test-Connection -ComputerName $manualGateway -Count 1 -Quiet -TimeoutSec 3
        if ($testResult) {
            $physicalGateway = $manualGateway
            Write-Host "Gateway confirmed: $physicalGateway" -ForegroundColor Green
            break
        } else {
            Write-Host "Gateway not reachable. Please verify the IP." -ForegroundColor Red
        }
    } while ($true)
}

if ($PrepareOnly) {
    Write-Host "`nPREPARATION COMPLETE" -ForegroundColor Green
    Write-Host "Physical gateway saved: $physicalGateway" -ForegroundColor White
    Write-Host "Ready for VPN connection. Run again without -PrepareOnly to apply routes." -ForegroundColor Gray
    exit 0
}

Write-Host "`nSTEP 2: Preparing Split Tunneling Routes..." -ForegroundColor Yellow

$localNetworks = @(
    @{Network='192.168.0.0'; Mask='255.255.0.0'; Desc='Class C private networks'},
    @{Network='10.0.0.0'; Mask='255.0.0.0'; Desc='Class A private networks'},
    @{Network='172.16.0.0'; Mask='255.240.0.0'; Desc='Class B private networks'},
    @{Network='169.254.0.0'; Mask='255.255.0.0'; Desc='Link-local addresses'},
    @{Network='224.0.0.0'; Mask='240.0.0.0'; Desc='Multicast traffic'}
)

Write-Host "Adding local network bypass routes..." -ForegroundColor Gray
$routesAdded = 0
foreach ($net in $localNetworks) {
    try {
        $routeCmd = "route add $($net.Network) mask $($net.Mask) $physicalGateway metric 1"
        $result = cmd /c $routeCmd 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: $($net.Desc) -> WiFi/LAN" -ForegroundColor Green
            $routesAdded++
        } elseif ($result -like "*already exists*") {
            Write-Host "  INFO: $($net.Desc) route already exists" -ForegroundColor Gray
        } else {
            Write-Host "  FAILED: $($net.Desc) - $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "  FAILED: $($net.Desc) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# NEW: Automatically apply VPN routes if VPN is already connected
Write-Host "`nSTEP 3: Checking for active VPN connection..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object {
    $_.Status -eq "Up" -and (
        $_.InterfaceDescription -like "*WireGuard*" -or 
        $_.Name -like "*Nebula*" -or 
        $_.Name -like "*wg*"
    )
}

if ($vpnAdapter) {
    Write-Host "VPN interface detected: $($vpnAdapter.Name)" -ForegroundColor Green
    Write-Host "Automatically applying VPN routes..." -ForegroundColor Yellow
    
    # Verify VPN has valid IP (not APIPA)
    $vpnIP = Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($vpnIP -and $vpnIP.IPAddress -notlike "169.254.*") {
        Write-Host "  VPN has valid IP: $($vpnIP.IPAddress)" -ForegroundColor Green
        
        # Apply VPN routes immediately
        $interfaceIndex = $vpnAdapter.InterfaceIndex
        
        # Clean existing routes first
        try {
            cmd /c "route delete 0.0.0.0 mask 128.0.0.0" 2>&1 | Out-Null
            cmd /c "route delete 128.0.0.0 mask 128.0.0.0" 2>&1 | Out-Null
        } catch {
            # Ignore errors
        }
        
        # Add VPN routes
        $route1 = "route add 0.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"
        $route2 = "route add 128.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"
        
        $r1Result = cmd /c $route1 2>&1
        $r2Result = cmd /c $route2 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: VPN routes applied automatically" -ForegroundColor Green
            Write-Host "  [SUCCESS] Split tunneling is now ACTIVE!" -ForegroundColor Cyan
        } else {
            Write-Host "  WARN: VPN route application had issues" -ForegroundColor Yellow
            Write-Host "       Run: .\\FIX-VPN-ROUTES-NOW.ps1 if needed" -ForegroundColor Gray
        }
        
    } else {
        $ipDisplay = if ($vpnIP) { $vpnIP.IPAddress } else { 'None' }
        Write-Host "  WARN: VPN has invalid IP ($ipDisplay)" -ForegroundColor Yellow
        Write-Host "        VPN tunnel may not be properly established" -ForegroundColor Gray
    }
} else {
    Write-Host "No active VPN connection detected" -ForegroundColor Gray
    Write-Host "VPN routes will be applied when you connect" -ForegroundColor Gray
}

Write-Host "`nSETUP COMPLETE!" -ForegroundColor Green
Write-Host "Split tunneling routes are now prepared." -ForegroundColor White
Write-Host "* Local networks (WiFi/LAN) will use: $physicalGateway" -ForegroundColor Gray
Write-Host "* Internet traffic will use: VPN tunnel (when connected)" -ForegroundColor Gray

if ($Monitor) {
    Write-Host "`nMONITOR MODE: Watching for VPN connection..." -ForegroundColor Cyan
    Write-Host "Will automatically apply VPN routes when WireGuard interface is detected." -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop monitoring.`n" -ForegroundColor Yellow
    
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Check if VPN interface exists
        $vpnAdapter = Get-NetAdapter | Where-Object {
            $_.Status -eq "Up" -and (
                $_.InterfaceDescription -like "*WireGuard*" -or 
                $_.Name -like "*Nebula*" -or 
                $_.Name -like "*wg*"
            )
        }
        
        if ($vpnAdapter) {
            Write-Host "VPN interface detected: $($vpnAdapter.Name)" -ForegroundColor Green
            Write-Host "Applying VPN default routes..." -ForegroundColor Yellow
            
            # Get interface index
            $interfaceIndex = $vpnAdapter.InterfaceIndex
            
            # Verify VPN tunnel health first
            $vpnIP = Get-NetIPAddress -InterfaceIndex $interfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
            if ($vpnIP -and $vpnIP.IPAddress -like "169.254.*") {
                Write-Host "  WARN: VPN has APIPA address - tunnel not established" -ForegroundColor Yellow
                Write-Host "        Waiting for proper VPN connection..." -ForegroundColor Gray
                continue
            }
            
            # Clean existing routes first
            try {
                cmd /c "route delete 0.0.0.0 mask 128.0.0.0" 2>&1 | Out-Null
                cmd /c "route delete 128.0.0.0 mask 128.0.0.0" 2>&1 | Out-Null
            } catch {
                # Ignore cleanup errors
            }
            
            # Apply split default routes
            $route1 = "route add 0.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"
            $route2 = "route add 128.0.0.0 mask 128.0.0.0 0.0.0.0 metric 1 if $interfaceIndex"
            
            $r1Success = $false
            $r2Success = $false
            
            try {
                $result1 = cmd /c $route1 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  SUCCESS: Added route: 0.0.0.0/1 via VPN" -ForegroundColor Green
                    $r1Success = $true
                } else {
                    Write-Host "  WARN: Route 1 issue: $result1" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "  ERROR: Route 1 failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            try {
                $result2 = cmd /c $route2 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  SUCCESS: Added route: 128.0.0.0/1 via VPN" -ForegroundColor Green
                    $r2Success = $true
                } else {
                    Write-Host "  WARN: Route 2 issue: $result2" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "  ERROR: Route 2 failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            if ($r1Success -and $r2Success) {
                Write-Host "`n[SUCCESS] VPN ROUTES APPLIED SUCCESSFULLY!" -ForegroundColor Green
                Write-Host "Split tunneling is now active. Testing connectivity..." -ForegroundColor White
                
                # Quick connectivity test
                Start-Sleep -Seconds 3
                try {
                    $testIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content
                    Write-Host "[OK] External IP: $testIP" -ForegroundColor Cyan
                    Write-Host "🚀 VPN tunnel is working! Monitoring will continue..." -ForegroundColor Green
                } catch {
                    Write-Host "[WARN] Connectivity test failed - may need manual intervention" -ForegroundColor Yellow
                    Write-Host "    Run: .\\TEST-VPN-TUNNEL.ps1 to diagnose" -ForegroundColor Gray
                }
            } else {
                Write-Host "`n[WARN] VPN route application incomplete" -ForegroundColor Yellow
                Write-Host "   Run manually: .\\FIX-VPN-ROUTES-NOW.ps1" -ForegroundColor Gray
            }
            
            # Wait for VPN to disconnect before continuing to monitor
            do {
                Start-Sleep -Seconds 5
                $vpnCheck = Get-NetAdapter | Where-Object {
                    $_.Status -eq "Up" -and (
                        $_.InterfaceDescription -like "*WireGuard*" -or 
                        $_.Name -like "*Nebula*" -or 
                        $_.Name -like "*wg*"
                    )
                }
            } while ($vpnCheck)
            
            Write-Host "`nVPN disconnected. Resuming monitor mode..." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "  SETUP COMPLETE - NEXT STEPS" -ForegroundColor Cyan  
    Write-Host "================================================================" -ForegroundColor Cyan
    
    if ($vpnAdapter) {
        Write-Host "`n[SUCCESS] VPN is connected and configured!" -ForegroundColor Green
        Write-Host "   Split tunneling is active" -ForegroundColor Gray
        Write-Host "`n[VERIFICATION]:" -ForegroundColor Yellow
        Write-Host "   Run: .\\TEST-VPN-TUNNEL.ps1" -ForegroundColor White
        Write-Host "   Expected: All tests should pass" -ForegroundColor Gray
        
    } else {
        Write-Host "`n[READY] FOR VPN CONNECTION:" -ForegroundColor Green
        Write-Host "   1. [CONNECT] Connect your Nebula VPN" -ForegroundColor White
        Write-Host "   2. [TEST] Test: .\\TEST-VPN-TUNNEL.ps1" -ForegroundColor White
        Write-Host "   3. [FIX] If issues: .\\FIX-VPN-ROUTES-NOW.ps1" -ForegroundColor White
        Write-Host "`n[LOCAL NETWORK] ACCESS:" -ForegroundColor Cyan
        Write-Host "   [OK] WiFi/LAN devices: Will work normally" -ForegroundColor Gray
        Write-Host "   [OK] Router access: Preserved ($physicalGateway)" -ForegroundColor Gray
        Write-Host "   [INFO] Internet traffic: Will route through VPN" -ForegroundColor Gray
    }
    
    Write-Host "`nTROUBLESHOOTING COMMANDS:" -ForegroundColor Yellow
    Write-Host "   .\\FIX-WIFI-BLOCKING.ps1    - Fix WiFi connectivity issues" -ForegroundColor White
    Write-Host "   .\\FIX-VPN-ROUTES-NOW.ps1   - Fix VPN routing immediately" -ForegroundColor White
    Write-Host "   .\\TEST-VPN-TUNNEL.ps1      - Comprehensive VPN testing" -ForegroundColor White
}

Write-Host "`n================================================================`n" -ForegroundColor Cyan