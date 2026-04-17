# OPTIMAL WIREGUARD CONFIGURATION GENERATOR
# =========================================
# Based on industry best practices for reliable VPN routing

Write-Host "OPTIMAL WIREGUARD CONFIGURATION GENERATOR" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generating configurations based on WireGuard best practices..." -ForegroundColor White
Write-Host ""

# Configuration Templates
Write-Host "[TEMPLATE 1] Resilient Split Tunnel (RECOMMENDED)" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# WireGuard Client Configuration - Split Tunnel" -ForegroundColor Green
Write-Host "[Interface]" -ForegroundColor Cyan
Write-Host "PrivateKey = YOUR_PRIVATE_KEY_HERE" -ForegroundColor White
Write-Host "Address = 10.8.0.2/24" -ForegroundColor White
Write-Host "DNS = 1.1.1.1, 8.8.8.8" -ForegroundColor White
Write-Host "MTU = 1280" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "[Peer]" -ForegroundColor Cyan
Write-Host "PublicKey = SERVER_PUBLIC_KEY_HERE" -ForegroundColor White
Write-Host "Endpoint = SERVER_IP_ADDRESS:51820" -ForegroundColor White
Write-Host "AllowedIPs = 1.1.1.1/32, 8.8.8.8/32, 208.67.222.222/32" -ForegroundColor White
Write-Host "PersistentKeepalive = 25" -ForegroundColor White
Write-Host ""
Write-Host "Benefits:" -ForegroundColor Green
Write-Host "• DNS privacy through VPN" -ForegroundColor White
Write-Host "• Internet continues working if VPN server fails" -ForegroundColor White
Write-Host "• Local network access preserved" -ForegroundColor White
Write-Host "• Better performance for general browsing" -ForegroundColor White

Write-Host ""

Write-Host "[TEMPLATE 2] DNS-Only Privacy Mode" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# WireGuard Client Configuration - DNS Only" -ForegroundColor Green
Write-Host "[Interface]" -ForegroundColor Cyan
Write-Host "PrivateKey = YOUR_PRIVATE_KEY_HERE" -ForegroundColor White
Write-Host "Address = 10.8.0.2/24" -ForegroundColor White
Write-Host "DNS = 10.8.0.1" -ForegroundColor White
Write-Host "MTU = 1280" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "[Peer]" -ForegroundColor Cyan
Write-Host "PublicKey = SERVER_PUBLIC_KEY_HERE" -ForegroundColor White
Write-Host "Endpoint = SERVER_IP_ADDRESS:51820" -ForegroundColor White
Write-Host "AllowedIPs = 10.8.0.1/32" -ForegroundColor White
Write-Host "PersistentKeepalive = 25" -ForegroundColor White
Write-Host ""
Write-Host "Benefits:" -ForegroundColor Green
Write-Host "• Minimal VPN overhead" -ForegroundColor White
Write-Host "• DNS queries secured and private" -ForegroundColor White
Write-Host "• Maximum reliability (no routing conflicts)" -ForegroundColor White
Write-Host "• Fastest performance" -ForegroundColor White

Write-Host ""

Write-Host "[TEMPLATE 3] Application-Specific Routing" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Routes for specific applications/services" -ForegroundColor Green
Write-Host "[Interface]" -ForegroundColor Cyan
Write-Host "PrivateKey = YOUR_PRIVATE_KEY_HERE" -ForegroundColor White
Write-Host "Address = 10.8.0.2/24" -ForegroundColor White
Write-Host "DNS = 1.1.1.1" -ForegroundColor White
Write-Host "MTU = 1280" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "[Peer]" -ForegroundColor Cyan
Write-Host "PublicKey = SERVER_PUBLIC_KEY_HERE" -ForegroundColor White
Write-Host "Endpoint = SERVER_IP_ADDRESS:51820" -ForegroundColor White
Write-Host "# Route specific services through VPN:" -ForegroundColor Green
Write-Host "AllowedIPs = 104.16.0.0/12, 172.217.0.0/16, 31.13.24.0/21" -ForegroundColor White
Write-Host "PersistentKeepalive = 25" -ForegroundColor White
Write-Host ""
Write-Host "Services routed through VPN:" -ForegroundColor Green
Write-Host "• Social media platforms" -ForegroundColor White
Write-Host "• Streaming services" -ForegroundColor White
Write-Host "• Specific websites requiring geo-unblocking" -ForegroundColor White

Write-Host ""

# Implementation Script
Write-Host "[IMPLEMENTATION] PowerShell Configuration Script" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Here's a PowerShell script to implement split tunneling:" -ForegroundColor White
Write-Host ""

$configScript = @'
# PowerShell script for resilient VPN routing
Write-Host "Implementing optimal WireGuard routing..." -ForegroundColor Green

# Get VPN interface
$vpnInterface = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -and $_.Status -eq "Up" }
if (-not $vpnInterface) {
    Write-Host "VPN not connected - connect first" -ForegroundColor Red
    exit 1
}

# Remove aggressive full tunnel routes
Get-NetRoute -InterfaceIndex $vpnInterface.InterfaceIndex -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Remove-NetRoute -Confirm:$false

# Add selective routes for privacy
$dnsServers = @("1.1.1.1/32", "8.8.8.8/32", "208.67.222.222/32")
foreach ($dns in $dnsServers) {
    New-NetRoute -DestinationPrefix $dns -NextHop "10.8.0.1" -InterfaceIndex $vpnInterface.InterfaceIndex -RouteMetric 1 -PolicyStore ActiveStore
}

# Configure DNS for privacy
Set-DnsClientServerAddress -InterfaceIndex $vpnInterface.InterfaceIndex -ServerAddresses @("1.1.1.1", "8.8.8.8")

Write-Host "Resilient routing configured!" -ForegroundColor Green
'@

Write-Host $configScript -ForegroundColor Gray

Write-Host ""

# Troubleshooting Guide
Write-Host "[TROUBLESHOOTING] Common WireGuard Issues & Solutions" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ISSUE 1: Gateway Unreachable (your current problem)" -ForegroundColor Red
Write-Host "SOLUTION: Switch VPN servers in client app" -ForegroundColor Green
Write-Host "• Root cause: Server down/overloaded (not configuration)" -ForegroundColor White
Write-Host "• Test different geographic locations" -ForegroundColor White
Write-Host "• Verify with: ping NEW_GATEWAY_IP" -ForegroundColor White
Write-Host ""

Write-Host "ISSUE 2: Slow Performance" -ForegroundColor Yellow
Write-Host "SOLUTION: Optimize MTU and routing" -ForegroundColor Green
Write-Host "• Set MTU to 1280 bytes" -ForegroundColor White
Write-Host "• Use split tunneling instead of full tunnel" -ForegroundColor White
Write-Host "• Choose geographically closer servers" -ForegroundColor White
Write-Host ""

Write-Host "ISSUE 3: DNS Leaks" -ForegroundColor Yellow
Write-Host "SOLUTION: Proper DNS configuration" -ForegroundColor Green
Write-Host "• Set DNS servers in WireGuard interface config" -ForegroundColor White
Write-Host "• Use VPN provider's DNS or secure public DNS" -ForegroundColor White
Write-Host "• Test with: nslookup google.com" -ForegroundColor White

Write-Host ""

Write-Host "🎯 RECOMMENDED NEXT STEPS:" -ForegroundColor Green
Write-Host "1. Switch VPN server (immediate fix for your issue)" -ForegroundColor Yellow
Write-Host "2. Implement split tunneling for resilience" -ForegroundColor Yellow
Write-Host "3. Test connectivity: .\TEST-ROUTING-FIX.ps1" -ForegroundColor Yellow
Write-Host "4. Monitor performance and adjust as needed" -ForegroundColor Yellow

Write-Host ""
Read-Host "Press Enter to continue"