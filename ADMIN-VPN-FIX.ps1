# ADMIN VPN FIX - Complete route cleanup and proper VPN setup
# Run this as Administrator: Right-click PowerShell -> "Run as administrator"

Write-Host "🔧 NEBULA VPN - COMPLETE ADMIN FIX" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Yellow
    Write-Host "1. Close this PowerShell" -ForegroundColor White
    Write-Host "2. Right-click PowerShell icon" -ForegroundColor White  
    Write-Host "3. Choose 'Run as administrator'" -ForegroundColor White
    Write-Host "4. Navigate back to: cd 'd:\Development\nebula-vpn-client'" -ForegroundColor White
    Write-Host "5. Run: .\ADMIN-VPN-FIX.ps1" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# PHASE 1: Clean up problematic routes
Write-Host "PHASE 1: Cleaning up problematic routes..." -ForegroundColor Yellow
Write-Host "Removing aggressive VPN routes that broke connectivity..." -ForegroundColor Gray

$routes_removed = 0
try {
    $result1 = cmd /c "route delete 0.0.0.0 mask 128.0.0.0 2>&1"
    if ($result1 -notmatch "not found" -and $result1 -notmatch "find") {
        $routes_removed++
        Write-Host "  ✓ Removed route: 0.0.0.0/1" -ForegroundColor Green
    }
} catch { }

try {
    $result2 = cmd /c "route delete 128.0.0.0 mask 128.0.0.0 2>&1" 
    if ($result2 -notmatch "not found" -and $result2 -notmatch "find") {
        $routes_removed++
        Write-Host "  ✓ Removed route: 128.0.0.0/1" -ForegroundColor Green
    }
} catch { }

if ($routes_removed -eq 0) {
    Write-Host "  ℹ️ No problematic routes found (already cleaned)" -ForegroundColor Cyan
}

Write-Host ""

# PHASE 2: Test basic connectivity  
Write-Host "PHASE 2: Testing basic connectivity..." -ForegroundColor Yellow

Write-Host "Testing ping to 8.8.8.8..." -ForegroundColor Gray
try {
    $ping_result = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 8
    if ($ping_result) {
        Write-Host "  ✅ Ping works!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Ping failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️ Ping test error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "Testing external IP..." -ForegroundColor Gray
try {
    $external_ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content.Trim()
    Write-Host "  ✅ External IP: $external_ip" -ForegroundColor Green
    
    if ($external_ip -match "^10\.|^172\.|^192\.") {
        Write-Host "  ✅ IP appears to be VPN (private range)" -ForegroundColor Green
        $vpn_working = $true
    } else {
        Write-Host "  ⚠️ IP appears to be real (not VPN) - IP leak detected" -ForegroundColor Yellow
        $vpn_working = $false
    }
} catch {
    Write-Host "  ❌ External IP check failed: $($_.Exception.Message)" -ForegroundColor Red
    $vpn_working = $false
}

Write-Host ""

# PHASE 3: Check VPN status
Write-Host "PHASE 3: Checking VPN tunnel status..." -ForegroundColor Yellow

Write-Host "Checking WireGuard service..." -ForegroundColor Gray
$wg_service = Get-Service -Name "WireGuardTunnel*" -ErrorAction SilentlyContinue
if ($wg_service -and $wg_service.Status -eq "Running") {
    Write-Host "  ✅ WireGuard service running: $($wg_service.Name)" -ForegroundColor Green
} else {
    Write-Host "  ❌ WireGuard service not running" -ForegroundColor Red
}

Write-Host "Checking VPN network adapter..." -ForegroundColor Gray
$vpn_adapter = Get-NetAdapter | Where-Object { $_.Name -match "nebula|vpn|wireguard" -and $_.Status -eq "Up" }
if ($vpn_adapter) {
    Write-Host "  ✅ VPN adapter found: $($vpn_adapter.Name)" -ForegroundColor Green
    
    # Get VPN adapter IP
    $vpn_ip = Get-NetIPAddress -InterfaceAlias $vpn_adapter.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue
    if ($vpn_ip) {
        Write-Host "  ✅ VPN IP: $($vpn_ip.IPAddress)" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ VPN adapter not found or down" -ForegroundColor Red
}

Write-Host ""

# PHASE 4: Apply gentle VPN routing (if VPN is connected but leaking)
if ($wg_service.Status -eq "Running" -and $vpn_adapter -and -not $vpn_working) {
    Write-Host "PHASE 4: Applying gentle VPN routing..." -ForegroundColor Yellow
    Write-Host "VPN is connected but IP is leaking - applying gentle fix..." -ForegroundColor Gray
    
    try {
        # Get the VPN adapter index
        $vpn_if_index = $vpn_adapter.InterfaceIndex
        
        # Add specific routes for critical external services through VPN 
        Write-Host "Adding selective VPN routes..." -ForegroundColor Gray
        
        # Route Google DNS through VPN
        cmd /c "route add 8.8.8.8 mask 255.255.255.255 10.8.0.1 if $vpn_if_index metric 1" 2>$null
        cmd /c "route add 8.8.4.4 mask 255.255.255.255 10.8.0.1 if $vpn_if_index metric 1" 2>$null
        
        # Route IP check services through VPN
        $ip_check_ips = @("208.67.222.222", "208.67.220.220")  # OpenDNS
        foreach ($ip in $ip_check_ips) {
            cmd /c "route add $ip mask 255.255.255.255 10.8.0.1 if $vpn_if_index metric 1" 2>$null
        }
        
        Write-Host "  ✓ Added selective VPN routes" -ForegroundColor Green
        
        # Test again
        Start-Sleep 3
        Write-Host "Re-testing external IP..." -ForegroundColor Gray
        try {
            $new_ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 10).Content.Trim()
            Write-Host "  ✅ New external IP: $new_ip" -ForegroundColor Green
            
            if ($new_ip -ne $external_ip) {
                Write-Host "  🎉 SUCCESS: IP changed! VPN routing working!" -ForegroundColor Green -BackgroundColor DarkGreen
            }
        } catch {
            Write-Host "  ❌ IP recheck failed" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "  ❌ Gentle routing failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 ADMIN FIX COMPLETE" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

if ($ping_result -and $external_ip) {
    if ($vpn_working) {
        Write-Host "STATUS: ✅ VPN working properly" -ForegroundColor Green
    } else {
        Write-Host "STATUS: ⚠️ Internet works, but VPN may need additional config" -ForegroundColor Yellow
    }
} else {
    Write-Host "STATUS: ❌ Connectivity issues remain" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test browsing a website" -ForegroundColor White
Write-Host "2. Check IP at: https://whatismyipaddress.com/" -ForegroundColor White
Write-Host "3. If still leaking, try: .\GENTLE-ROUTE-FIX.ps1" -ForegroundColor White
Write-Host ""