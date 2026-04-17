# VPN Connection Diagnostics
# Run this script to see why the VPN isn't connecting

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   NEBULA VPN - CONNECTION DIAGNOSTICS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Host "[1] Administrator Status: $(if($isAdmin){'YES [OK]' }else{'NO [ERROR]'})" -ForegroundColor $(if($isAdmin){'Green'}else{'Red'})

# Check if WireGuard is installed
$wgPath = "C:\Program Files\WireGuard\wireguard.exe"
$wgInstalled = Test-Path $wgPath
Write-Host "[2] WireGuard Installed: $(if($wgInstalled){'YES [OK]'}else{'NO [ERROR]'})" -ForegroundColor $(if($wgInstalled){'Green'}else{'Red'})
if (-not $wgInstalled) {
    Write-Host "    Download from: https://www.wireguard.com/install/" -ForegroundColor Yellow
}

# Check if Nebula VPN app is running
$nebulaProc = Get-Process -Name "Nebula VPN" -ErrorAction SilentlyContinue
Write-Host "[3] Nebula VPN App Running: $(if($nebulaProc){'YES [OK]'}else{'NO [ERROR]'})" -ForegroundColor $(if($nebulaProc){'Green'}else{'Red'})

# Check for WireGuard service
$wgService = Get-Service -Name "WireGuardTunnel`$Nebulavpn" -ErrorAction SilentlyContinue
Write-Host "[4] WireGuard Service Status: $(if($wgService){$wgService.Status}else{'NOT FOUND [ERROR]'})" -ForegroundColor $(if($wgService -and $wgService.Status -eq 'Running'){'Green'}else{'Red'})

# Check for VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*WireGuard*" -or $_.Name -like "*Nebula*" }
Write-Host "[5] VPN Network Adapter: $(if($vpnAdapter){'EXISTS [OK]'}else{'NOT FOUND [ERROR]'})" -ForegroundColor $(if($vpnAdapter){'Green'}else{'Red'})
if ($vpnAdapter) {
    Write-Host "    Interface: $($vpnAdapter.Name), Status: $($vpnAdapter.Status)" -ForegroundColor Cyan
}

# Check for config file
$configPath = "C:\ProgramData\WireGuard\Nebulavpn.conf"
$configExists = Test-Path $configPath
Write-Host "[6] WireGuard Config: $(if($configExists){'EXISTS [OK]'}else{'NOT FOUND [ERROR]'})" -ForegroundColor $(if($configExists){'Green'}else{'Red'})

# Check external IP
Write-Host "`n[7] External IP Check:" -ForegroundColor Yellow
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
    Write-Host "    Your IP: $externalIP" -ForegroundColor Cyan
    
    # Check if it's a private IP (shouldn't happen)
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.)") {
        Write-Host "    Status: Private IP (unusual)" -ForegroundColor Yellow
    } else {
        Write-Host "    Status: Public IP $(if($vpnAdapter){'[WARNING - Should be VPN IP]'}else{'[EXPECTED - No VPN]'})" -ForegroundColor $(if($vpnAdapter){'Yellow'}else{'Cyan'})
    }
} catch {
    Write-Host "    [ERROR] Could not check IP" -ForegroundColor Red
}

# Summary and recommendations
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   DIAGNOSIS" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

if (-not $wgInstalled) {
    Write-Host "[CRITICAL] WireGuard is not installed!" -ForegroundColor Red
    Write-Host "Download and install from: https://www.wireguard.com/install/`n" -ForegroundColor Yellow
}
elseif (-not $isAdmin) {
    Write-Host "[CRITICAL] App is NOT running as Administrator!" -ForegroundColor Red
    Write-Host "The VPN cannot create tunnels without admin privileges.`n" -ForegroundColor Yellow
    Write-Host "To fix:" -ForegroundColor Green
    Write-Host "  1. Close the Nebula VPN app completely" -ForegroundColor White
    Write-Host "  2. Right-click on the app executable or shortcut" -ForegroundColor White
    Write-Host "  3. Select 'Run as administrator'" -ForegroundColor White
    Write-Host "  4. Then click 'Connect' in the app`n" -ForegroundColor White
}
elseif (-not $nebulaProc) {
    Write-Host "[ERROR] Nebula VPN app is not running!" -ForegroundColor Red
    Write-Host "Start the app and try connecting.`n" -ForegroundColor Yellow
}
elseif (-not $wgService) {
    Write-Host "[ISSUE] WireGuard service not created!" -ForegroundColor Yellow
    Write-Host "This means either:" -ForegroundColor Cyan
    Write-Host "  1. You haven't clicked 'Connect' in the app yet" -ForegroundColor White
    Write-Host "  2. The connection attempt failed" -ForegroundColor White
    Write-Host "  3. The app doesn't have permission to create the service`n" -ForegroundColor White
    Write-Host "Try this:" -ForegroundColor Green
    Write-Host "  1. In the Nebula VPN app, click 'Connect'" -ForegroundColor White
    Write-Host "  2. Check for any error messages" -ForegroundColor White
    Write-Host "  3. Run this diagnostic again`n" -ForegroundColor White
}
elseif ($wgService.Status -ne 'Running') {
    Write-Host "[ISSUE] WireGuard service exists but is not running!" -ForegroundColor Yellow
    Write-Host "Service status: $($wgService.Status)`n" -ForegroundColor Cyan
    Write-Host "Try starting it:" -ForegroundColor Green
    Write-Host "  Start-Service -Name 'WireGuardTunnel`$Nebulavpn'`n" -ForegroundColor White
}
else {
    Write-Host "[SUCCESS] VPN tunnel is connected!" -ForegroundColor Green
    Write-Host "If your IP is still leaking, the routing is not configured properly.`n" -ForegroundColor Yellow
    Write-Host "Run the route fix script:" -ForegroundColor Green
    Write-Host "  .\FIX-VPN-ROUTES-NOW.ps1`n" -ForegroundColor White
}

Write-Host "============================================`n" -ForegroundColor Cyan
