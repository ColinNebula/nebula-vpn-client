# FIX-VPN-ROUTING-NOW.ps1
# Quick script to make VPN the default gateway after connection
# Run as Administrator AFTER VPN is connected

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  VPN ROUTING FIX" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object {
    ($_.Name -like "*Nebula*") -and ($_.Status -eq "Up")
}

if (-not $vpnAdapter) {
    Write-Host "[!] VPN adapter not found or not connected!" -ForegroundColor Red
    Write-Host "[i] Please connect to VPN first, then run this script" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$vpnIndex = $vpnAdapter.InterfaceIndex
Write-Host "[+] Found VPN: $($vpnAdapter.Name)" -ForegroundColor Green

# Set VPN interface metric to 5 (highest priority)
try {
    Set-NetIPInterface -InterfaceIndex $vpnIndex -InterfaceMetric 5 -ErrorAction Stop
    Write-Host "[+] Set VPN metric to 5 (highest priority)" -ForegroundColor Green
} catch {
    Write-Host "[!] Failed to set VPN metric: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Set all other interfaces to metric 50
$otherInterfaces = Get-NetAdapter | Where-Object {
    $_.InterfaceIndex -ne $vpnIndex -and $_.Status -eq "Up"
}

foreach ($iface in $otherInterfaces) {
    try {
        Set-NetIPInterface -InterfaceIndex $iface.InterfaceIndex -InterfaceMetric 50 -ErrorAction Stop
        Write-Host "[+] Set $($iface.Name) metric to 50" -ForegroundColor Green
    } catch {
        Write-Host "[!] Could not adjust $($iface.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  ROUTING FIX COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Verify default route
Start-Sleep -Seconds 1
$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | 
    Sort-Object -Property RouteMetric | Select-Object -First 1

if ($defaultRoute.InterfaceIndex -eq $vpnIndex) {
    Write-Host "[+] VPN is now the default gateway!" -ForegroundColor Green
} else {
    $actualInterface = Get-NetAdapter -InterfaceIndex $defaultRoute.InterfaceIndex
    Write-Host "[!] Default gateway is still: $($actualInterface.Name)" -ForegroundColor Yellow
    Write-Host "[i] You may need to disconnect/reconnect VPN" -ForegroundColor Cyan
}

# Test connectivity
Write-Host "`n>> Testing connectivity..." -ForegroundColor Cyan
$ping = Test-Connection -ComputerName 1.1.1.1 -Count 2 -Quiet

if ($ping) {
    Write-Host "[+] Internet is working!" -ForegroundColor Green
    Write-Host "[i] Test in browser or run: curl ifconfig.me" -ForegroundColor Cyan
} else {
    Write-Host "[!] No internet connectivity" -ForegroundColor Red
    Write-Host "[i] Try these steps:" -ForegroundColor Yellow
    Write-Host "    1. Disconnect and reconnect VPN" -ForegroundColor Gray
    Write-Host "    2. Check WireGuard config file" -ForegroundColor Gray
    Write-Host "    3. Verify server is online" -ForegroundColor Gray
}

Write-Host "`nDone!" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
