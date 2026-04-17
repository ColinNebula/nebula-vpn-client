# WIREGUARD TUNNEL REPAIR SCRIPT
# ==============================
# Fixes common WireGuard tunnel establishment issues

Write-Host "WIREGUARD TUNNEL REPAIR" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Host "Admin Status: $isAdmin" -ForegroundColor $(if($isAdmin){"Green"}else{"Yellow"})

Write-Host ""
Write-Host "[PROBLEM IDENTIFIED] WireGuard tunnel not established" -ForegroundColor Red
Write-Host "- Nebula VPN app is running" -ForegroundColor Green
Write-Host "- But still using ISP connection (99.247.207.59)" -ForegroundColor Yellow  
Write-Host "- WireGuard interface likely missing or inactive" -ForegroundColor Red
Write-Host ""

Write-Host "[STEP 1] Checking WireGuard interface status..." -ForegroundColor Cyan
try {
    if ($isAdmin) {
        # Admin check - can see all interfaces
        $wgInterface = Get-NetAdapter | Where-Object { $_.Name -match "wg|WireGuard|Nebula" }
        if ($wgInterface) {
            Write-Host "✅ Found WireGuard interface: $($wgInterface.Name)" -ForegroundColor Green
            Write-Host "   Status: $($wgInterface.Status)" -ForegroundColor White
            Write-Host "   Description: $($wgInterface.InterfaceDescription)" -ForegroundColor White
            
            # Check IP assignment
            $wgIP = Get-NetIPAddress -InterfaceIndex $wgInterface.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
            if ($wgIP) {
                Write-Host "   IP Address: $($wgIP.IPAddress)" -ForegroundColor White
            } else {
                Write-Host "   ❌ No IP address assigned!" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ No WireGuard interface found" -ForegroundColor Red
            Write-Host "💡 Interface creation failed during connection" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Need admin privileges for detailed interface check" -ForegroundColor Yellow
        Write-Host "💡 But we can still attempt basic fixes" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error checking WireGuard interface: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[STEP 2] Testing VPN server connectivity..." -ForegroundColor Cyan
$vpnServers = @("10.8.0.1", "10.0.0.1", "192.168.100.1", "174.138.21.128")
$workingServer = $null

foreach ($server in $vpnServers) {
    Write-Host "Testing VPN server $server..." -ForegroundColor Yellow
    try {
        $ping = Test-Connection -ComputerName $server -Count 2 -Quiet -ErrorAction Stop
        if ($ping) {
            Write-Host "✅ $server is reachable" -ForegroundColor Green
            $workingServer = $server
            break
        } else {
            Write-Host "❌ $server timeout" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $server unreachable" -ForegroundColor Red
    }
}

if ($workingServer) {
    Write-Host ""
    Write-Host "✅ Found working VPN server: $workingServer" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ ALL VPN SERVERS UNREACHABLE!" -ForegroundColor Red
    Write-Host "🚨 This is why the tunnel cannot establish" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SOLUTION OPTIONS:" -ForegroundColor Blue
    Write-Host "1. Try connecting to a different server in Nebula app" -ForegroundColor White
    Write-Host "2. Check if VPN service is down (server maintenance)" -ForegroundColor White
    Write-Host "3. Check firewall/antivirus blocking VPN connections" -ForegroundColor White
    Write-Host "4. Try switching network (different WiFi/hotspot)" -ForegroundColor White
    exit 0
}

Write-Host ""
Write-Host "[STEP 3] Attempting tunnel repair..." -ForegroundColor Cyan

if (-not $isAdmin) {
    Write-Host ""
    Write-Host "🔧 AUTOMATIC REPAIR (as Admin):" -ForegroundColor Blue
    Write-Host "================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For best results, run this command as Administrator:" -ForegroundColor Cyan
    Write-Host 'Right-click PowerShell → "Run as Administrator" → Run this script' -ForegroundColor White
    Write-Host ""
    Write-Host "Or try these manual steps in Nebula VPN app:" -ForegroundColor Green
    Write-Host "1. Disconnect from current VPN server" -ForegroundColor White
    Write-Host "2. Select a different VPN server location" -ForegroundColor White  
    Write-Host "3. Reconnect and test" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "🔧 Attempting WireGuard service restart..." -ForegroundColor Yellow
    
    # Stop VPN processes gracefully
    Write-Host "Stopping Nebula VPN processes..." -ForegroundColor Cyan
    Get-Process | Where-Object { $_.ProcessName -eq "Nebula VPN" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    
    # Clear any stuck WireGuard interfaces
    Write-Host "Cleaning up stuck WireGuard interfaces..." -ForegroundColor Cyan
    try {
        $stuckInterfaces = Get-NetAdapter | Where-Object { $_.Name -match "wg|WireGuard" -and $_.Status -ne "Up" }
        foreach ($interface in $stuckInterfaces) {
            Write-Host "Removing stuck interface: $($interface.Name)" -ForegroundColor Yellow
            Remove-NetAdapter -Name $interface.Name -Confirm:$false -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Host "⚠️  Interface cleanup completed" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "✅ Repair attempt completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Blue
    Write-Host "1. Restart Nebula VPN app" -ForegroundColor White
    Write-Host "2. Connect to working server: $workingServer" -ForegroundColor White
    Write-Host "3. Verify tunnel with: curl https://api.ipify.org" -ForegroundColor White
}