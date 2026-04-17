#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start VPN with Split Tunneling - Prevents WiFi blocking

.DESCRIPTION  
    Starts WireGuard VPN and immediately applies split tunneling configuration
    to preserve WiFi/LAN access while routing internet through VPN.
    
    REQUIRES ADMINISTRATOR PRIVILEGES
#>

# Check for administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`nERROR: This script requires administrator privileges" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  START VPN WITH SPLIT TUNNELING" -ForegroundColor Cyan
Write-Host "  (Prevents WiFi blocking while securing internet traffic)" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# Step 1: Check VPN configuration
Write-Host "[1] Checking VPN configuration..." -ForegroundColor Yellow
if (-not (Test-Path "C:\ProgramData\WireGuard\Nebulavpn.conf")) {
    Write-Host "  [ERROR] VPN configuration file not found" -ForegroundColor Red
    Write-Host "  Expected: C:\ProgramData\WireGuard\Nebulavpn.conf" -ForegroundColor Gray
    pause
    exit 1
}

$config = Get-Content "C:\ProgramData\WireGuard\Nebulavpn.conf" -Raw
if ($config -match "AllowedIPs\s*=\s*0\.0\.0\.0/0") {
    Write-Host "  [WARN] Configuration uses aggressive routing (0.0.0.0/0)" -ForegroundColor Yellow
    Write-Host "        This will block WiFi access without routing fixes" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] Configuration appears to use split tunneling" -ForegroundColor Green
}

# Step 2: Test VPN server connectivity  
Write-Host "`n[2] Testing VPN server connectivity..." -ForegroundColor Yellow
$configContent = Get-Content "C:\ProgramData\WireGuard\Nebulavpn.conf"
$endpoint = ($configContent | Select-String "Endpoint\s*=\s*(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }).Trim()

if ($endpoint) {
    $serverIP = $endpoint.Split(':')[0]
    $serverPort = $endpoint.Split(':')[1]
    Write-Host "  Testing server: $endpoint" -ForegroundColor Gray
    
    $ping = Test-Connection -ComputerName $serverIP -Count 1 -Quiet
    if ($ping) {
        Write-Host "  [OK] VPN server is reachable" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] VPN server is not responding to ping" -ForegroundColor Yellow
        Write-Host "        This may cause connection issues" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [ERROR] Could not find server endpoint in configuration" -ForegroundColor Red
}

# Step 3: Start VPN service
Write-Host "`n[3] Starting VPN service..." -ForegroundColor Yellow
try {
    $service = Get-Service "WireGuardTunnel`$Nebulavpn" -ErrorAction Stop
    if ($service.Status -eq "Running") {
        Write-Host "  [INFO] VPN service is already running" -ForegroundColor Green
    } else {
        Write-Host "  Starting WireGuard service..." -ForegroundColor Gray
        Start-Service "WireGuardTunnel`$Nebulavpn" -ErrorAction Stop
        Start-Sleep -Seconds 3
        
        $newStatus = Get-Service "WireGuardTunnel`$Nebulavpn" -ErrorAction Stop
        if ($newStatus.Status -eq "Running") {
            Write-Host "  [OK] VPN service started successfully" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] VPN service failed to start (Status: $($newStatus.Status))" -ForegroundColor Red
            pause
            exit 1
        }
    }
} catch {
    Write-Host "  [ERROR] Failed to start VPN service: $($_.Exception.Message)" -ForegroundColor Red
    pause
    exit 1
}

# Step 4: Wait for interface to be created
Write-Host "`n[4] Waiting for VPN interface..." -ForegroundColor Yellow
$maxWait = 10
$waited = 0
$vpnAdapter = $null

while ($waited -lt $maxWait) {
    $vpnAdapter = Get-NetAdapter | Where-Object { 
        $_.InterfaceDescription -like "*WireGuard*" -or 
        $_.Name -like "*Nebula*" -or 
        $_.Name -like "*wg*"
    }
    
    if ($vpnAdapter) {
        Write-Host "  [OK] VPN interface created: $($vpnAdapter.Name)" -ForegroundColor Green
        break
    }
    
    Start-Sleep -Seconds 1
    $waited++
    Write-Host "." -NoNewline -ForegroundColor Gray
}

if (-not $vpnAdapter) {
    Write-Host "`n  [ERROR] VPN interface was not created within $maxWait seconds" -ForegroundColor Red
    Write-Host "         The VPN service started but no network adapter appeared" -ForegroundColor Red
    Write-Host "         This may indicate a configuration or server connectivity issue" -ForegroundColor Red
    pause
    exit 1
}

# Step 5: Apply split tunneling fix
Write-Host "`n[5] Applying split tunneling configuration..." -ForegroundColor Yellow
try {
    & "$PSScriptRoot\FIX-VPN-LEAKS.ps1" -DisableIPv6 -FixRouting
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Split tunneling applied successfully" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Split tunneling script completed with warnings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Failed to apply split tunneling: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Test connectivity
Write-Host "`n[6] Testing connectivity..." -ForegroundColor Yellow

Write-Host "  WiFi access test: " -NoNewline
if (Test-Connection 10.0.0.1 -Count 1 -Quiet) {
    Write-Host "✅ SUCCESS" -ForegroundColor Green
} else {
    Write-Host "❌ FAILED - WiFi access blocked!" -ForegroundColor Red
}

Write-Host "  Internet test: " -NoNewline  
if (Test-Connection 8.8.8.8 -Count 1 -Quiet) {
    Write-Host "✅ SUCCESS" -ForegroundColor Green
} else {
    Write-Host "❌ FAILED - Internet access blocked!" -ForegroundColor Red
}

Write-Host "  VPN tunnel test: " -NoNewline
& "C:\Program Files\WireGuard\wg.exe" show | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ACTIVE" -ForegroundColor Green
} else {
    Write-Host "❌ INACTIVE" -ForegroundColor Red
}

# Step 7: Final status check
Write-Host "`n[7] Final VPN status..." -ForegroundColor Yellow
try {
    & "$PSScriptRoot\TEST-VPN-QUICK.ps1"
} catch {
    Write-Host "  Could not run VPN status check" -ForegroundColor Yellow
}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  VPN STARTUP COMPLETE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  If WiFi access shows SUCCESS above, the fix worked!" -ForegroundColor Green
Write-Host "  You should now have both WiFi access AND VPN protection." -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Green

Write-Host "Press any key to exit..." -ForegroundColor Gray
pause