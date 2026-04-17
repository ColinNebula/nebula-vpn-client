# FORCE-FULL-TUNNEL-VPN.ps1
# Forces VPN to route ALL traffic (full tunnel mode)
# Run as Administrator AFTER VPN is connected

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: Run as Administrator!" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  FORCE FULL TUNNEL MODE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Find VPN adapter
$vpnAdapter = Get-NetAdapter | Where-Object {
    ($_.Name -like "*Nebula*") -and ($_.Status -eq "Up")
}

if (-not $vpnAdapter) {
    Write-Host "[!] VPN adapter not found or not connected!" -ForegroundColor Red
    exit 1
}

$vpnIndex = $vpnAdapter.InterfaceIndex
$vpnIP = Get-NetIPAddress -InterfaceIndex $vpnIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue

if (-not $vpnIP) {
    Write-Host "[!] VPN has no IP address!" -ForegroundColor Red
    exit 1
}

Write-Host "[+] VPN Adapter: $($vpnAdapter.Name)" -ForegroundColor Green
Write-Host "[+] VPN IP: $($vpnIP.IPAddress)" -ForegroundColor Green

# Check current routing
Write-Host "`n>> Checking current routing..." -ForegroundColor Cyan
$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | 
    Sort-Object -Property RouteMetric | Select-Object -First 1

if ($defaultRoute) {
    $currentAdapter = Get-NetAdapter -InterfaceIndex $defaultRoute.InterfaceIndex
    Write-Host "[i] Current default gateway: $($currentAdapter.Name) (metric: $($defaultRoute.RouteMetric))" -ForegroundColor Yellow
}

# Check if VPN already has default route
$vpnDefaultRoute = Get-NetRoute -InterfaceIndex $vpnIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue

if ($vpnDefaultRoute) {
    Write-Host "[+] VPN already has default route" -ForegroundColor Green
    Write-Host "[i] VPN may be in split-tunnel mode due to WireGuard config" -ForegroundColor Yellow
} else {
    Write-Host "[!] VPN has NO default route - traffic will not go through VPN!" -ForegroundColor Red
}

Write-Host "`n==========================================" -ForegroundColor Yellow
Write-Host "  APPLYING FULL TUNNEL FIX" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# Get VPN gateway
$vpnGateway = Get-NetRoute -InterfaceIndex $vpnIndex | 
    Where-Object { $_.DestinationPrefix -ne "255.255.255.255/32" -and $_.NextHop -ne "0.0.0.0" } |
    Select-Object -First 1 -ExpandProperty NextHop

if (-not $vpnGateway -or $vpnGateway -eq "0.0.0.0") {
    # For WireGuard, gateway is typically 0.0.0.0 (uses peer endpoint)
    $vpnGateway = "0.0.0.0"
    Write-Host "[i] Using WireGuard-style routing (gateway: 0.0.0.0)" -ForegroundColor Cyan
}

Write-Host "[i] VPN Gateway: $vpnGateway" -ForegroundColor Cyan

# Method 1: Add default route with lower metric
Write-Host "`n>> Method 1: Adding default route through VPN..." -ForegroundColor Cyan
try {
    # Remove existing VPN default route if present
    Get-NetRoute -InterfaceIndex $vpnIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
    
    # Add new default route with metric 1 (highest priority)
    New-NetRoute -InterfaceIndex $vpnIndex -DestinationPrefix "0.0.0.0/0" -NextHop $vpnGateway -RouteMetric 1 -ErrorAction Stop | Out-Null
    Write-Host "[+] Added default route through VPN (metric: 1)" -ForegroundColor Green
} catch {
    Write-Host "[!] Failed to add route: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[i] This is normal for WireGuard - trying Method 2..." -ForegroundColor Yellow
}

# Method 2: Lower Wi-Fi metric and raise VPN priority
Write-Host "`n>> Method 2: Adjusting interface metrics..." -ForegroundColor Cyan
try {
    # Set VPN metric to 1 (highest priority)
    Set-NetIPInterface -InterfaceIndex $vpnIndex -InterfaceMetric 1 -ErrorAction Stop
    Write-Host "[+] Set VPN interface metric to 1" -ForegroundColor Green
    
    # Set Wi-Fi metric to 100 (low priority)
    $otherInterfaces = Get-NetAdapter | Where-Object {
        $_.InterfaceIndex -ne $vpnIndex -and $_.Status -eq "Up"
    }
    
    foreach ($iface in $otherInterfaces) {
        Set-NetIPInterface -InterfaceIndex $iface.InterfaceIndex -InterfaceMetric 100 -ErrorAction Stop
        Write-Host "[+] Set $($iface.Name) metric to 100" -ForegroundColor Green
    }
} catch {
    Write-Host "[!] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 3: Add split routes (Google, Cloudflare, common DNS)
Write-Host "`n>> Method 3: Adding specific routes through VPN..." -ForegroundColor Cyan
$testIPs = @("1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4")
foreach ($ip in $testIPs) {
    try {
        Get-NetRoute -DestinationPrefix "$ip/32" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
        New-NetRoute -InterfaceIndex $vpnIndex -DestinationPrefix "$ip/32" -NextHop $vpnGateway -RouteMetric 1 -ErrorAction Stop | Out-Null
        Write-Host "[+] Routed $ip through VPN" -ForegroundColor Green
    } catch {
        Write-Host "[!] Could not route $ip" -ForegroundColor Yellow
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  TESTING CONNECTIVITY" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Start-Sleep -Seconds 2

# Test ping
Write-Host "`n>> Testing ping to 1.1.1.1..." -ForegroundColor Cyan
$ping = Test-Connection -ComputerName 1.1.1.1 -Count 2 -Quiet
if ($ping) {
    Write-Host "[+] Ping successful!" -ForegroundColor Green
} else {
    Write-Host "[!] Ping failed!" -ForegroundColor Red
}

# Try to get public IP
Write-Host "`n>> Checking public IP address..." -ForegroundColor Cyan
try {
    $publicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    Write-Host "[+] Your public IP: $publicIP" -ForegroundColor Green
    Write-Host "[i] Verify this is your VPN server's IP, not your home IP" -ForegroundColor Yellow
} catch {
    Write-Host "[!] Could not fetch public IP" -ForegroundColor Red
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  IMPORTANT: WireGuard Config Issue" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If traffic still goes through Wi-Fi, your WireGuard config" -ForegroundColor Yellow
Write-Host "needs to be updated with:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [Interface]" -ForegroundColor White
Write-Host "  ..." -ForegroundColor Gray
Write-Host ""
Write-Host "  [Peer]" -ForegroundColor White
Write-Host "  AllowedIPs = 0.0.0.0/0, ::/0" -ForegroundColor Green
Write-Host "  ^^^^^^^^^^ This forces ALL traffic through VPN" -ForegroundColor Gray
Write-Host ""
Write-Host "Location: C:\Program Files\WireGuard\Data\Configurations\" -ForegroundColor Cyan
Write-Host "File: Nebulavpn.conf" -ForegroundColor Cyan
Write-Host ""
Write-Host "[i] After editing, disconnect and reconnect VPN" -ForegroundColor Yellow

Write-Host "`nDone!" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
