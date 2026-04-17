# Remove Nebula VPN Network Interface - Complete Cleanup
# Run this script as Administrator to completely remove the VPN interface

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   NEBULA VPN INTERFACE REMOVAL TOOL" -ForegroundColor Cyan  
Write-Host "=========================================" -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Pause
    exit 1
}

Write-Host "[INFO] Running as Administrator - OK" -ForegroundColor Green

# Step 1: Stop WireGuard service if running  
Write-Host "`n[1] Stopping WireGuard service..." -ForegroundColor Yellow
try {
    $wgService = Get-Service -Name "WireGuardTunnel`$Nebulavpn" -ErrorAction SilentlyContinue
    if ($wgService) {
        Write-Host "    Found WireGuard service: $($wgService.Status)" -ForegroundColor White
        if ($wgService.Status -eq 'Running') {
            Stop-Service -Name "WireGuardTunnel`$Nebulavpn" -Force
            Write-Host "    [OK] Service stopped" -ForegroundColor Green
        }
    } else {
        Write-Host "    [OK] No WireGuard service found" -ForegroundColor Green
    }
} catch {
    Write-Host "    [WARNING] Could not stop service: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 2: Remove WireGuard tunnel using wireguard.exe
Write-Host "`n[2] Removing WireGuard tunnel..." -ForegroundColor Yellow
$wgPath = "C:\Program Files\WireGuard\wireguard.exe"
if (Test-Path $wgPath) {
    try {
        & "$wgPath" /uninstalltunnelservice Nebulavpn
        Write-Host "    [OK] WireGuard tunnel 'Nebulavpn' removed" -ForegroundColor Green
    } catch {
        Write-Host "    [WARNING] Could not remove tunnel: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "    [OK] WireGuard not installed" -ForegroundColor Green
}

# Step 3: Check for any remaining VPN network adapters
Write-Host "`n[3] Checking for VPN network adapters..." -ForegroundColor Yellow  
$vpnAdapters = Get-NetAdapter | Where-Object { 
    $_.InterfaceDescription -like "*WireGuard*" -or 
    $_.Name -like "*Nebula*" -or 
    $_.InterfaceDescription -like "*Nebula*" -or
    $_.Name -like "*Nebulavpn*"
}

if ($vpnAdapters) {
    Write-Host "    Found VPN adapters to remove:" -ForegroundColor White
    foreach ($adapter in $vpnAdapters) {
        Write-Host "      - $($adapter.Name) ($($adapter.InterfaceDescription)) - Status: $($adapter.Status)" -ForegroundColor White
        try {
            Remove-NetAdapter -Name $adapter.Name -Confirm:$false
            Write-Host "        [OK] Removed adapter: $($adapter.Name)" -ForegroundColor Green
        } catch {
            Write-Host "        [ERROR] Could not remove adapter: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "    [OK] No VPN adapters found" -ForegroundColor Green
}

# Step 4: Clean up any VPN routes  
Write-Host "`n[4] Cleaning up VPN routes..." -ForegroundColor Yellow
try {
    # Remove common VPN routes
    route delete 0.0.0.0/1 2>$null
    route delete 128.0.0.0/1 2>$null
    Write-Host "    [OK] VPN routes cleaned" -ForegroundColor Green
} catch {
    Write-Host "    [OK] No VPN routes to clean" -ForegroundColor Green  
}

# Step 5: Reset network stack (optional but recommended)
Write-Host "`n[5] Resetting network stack..." -ForegroundColor Yellow
try {
    netsh winsock reset 2>$null
    netsh int ip reset 2>$null  
    Write-Host "    [OK] Network stack reset (restart may be required)" -ForegroundColor Green
} catch {
    Write-Host "    [WARNING] Could not reset network stack" -ForegroundColor Yellow
}

# Step 6: Check final status
Write-Host "`n[6] Final network adapter status:" -ForegroundColor Yellow
Get-NetAdapter | Format-Table Name, InterfaceDescription, Status -AutoSize

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "   VPN INTERFACE CLEANUP COMPLETE" -ForegroundColor Green  
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Your WiFi should now work normally." -ForegroundColor White
Write-Host "If you still have issues, restart your computer." -ForegroundColor Yellow

# Check if WiFi is working
Write-Host "`n[7] Testing WiFi connectivity..." -ForegroundColor Yellow
$wifiAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }
if ($wifiAdapter) {
    Write-Host "    [OK] WiFi adapter is active: $($wifiAdapter.Name)" -ForegroundColor Green
} else {
    Write-Host "    [WARNING] WiFi adapter may need to be re-enabled" -ForegroundColor Yellow  
    Write-Host "    Try: Right-click WiFi adapter in Network Connections -> Enable" -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")