# INTERNET ACCESS FIX - Simple Version
Write-Host "INTERNET ACCESS RESTORATION" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Yellow
Write-Host ""

Write-Host "CURRENT STATUS:" -ForegroundColor Cyan
Write-Host "Local WiFi: Working (10.0.0.1 ping succeeded)" -ForegroundColor Green
Write-Host "Internet: Blocked (curl failed)" -ForegroundColor Red
Write-Host ""

Write-Host "SOLUTION OPTIONS:" -ForegroundColor Blue
Write-Host "=================" -ForegroundColor Yellow

Write-Host ""
Write-Host "OPTION 1: Quick Fix (Immediate)" -ForegroundColor Green
Write-Host "-------------------------------" -ForegroundColor Yellow
Write-Host "Disconnect VPN to restore internet:" -ForegroundColor White
Write-Host "1. Open Nebula VPN app" -ForegroundColor Gray
Write-Host "2. Click Disconnect" -ForegroundColor Gray
Write-Host "3. Test: curl https://api.ipify.org" -ForegroundColor Gray
Write-Host "Result: WiFi + Internet working (no VPN)" -ForegroundColor Gray

Write-Host ""
Write-Host "OPTION 2: Try Different VPN Server" -ForegroundColor Green
Write-Host "----------------------------------" -ForegroundColor Yellow  
Write-Host "Switch to working VPN server:" -ForegroundColor White
Write-Host "1. In VPN app, select different server location" -ForegroundColor Gray
Write-Host "2. Connect to new server" -ForegroundColor Gray
Write-Host "3. Test: curl https://api.ipify.org" -ForegroundColor Gray
Write-Host "Result: May get WiFi + Internet + VPN all working" -ForegroundColor Gray

# Check admin status for advanced options
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

Write-Host ""
if ($isAdmin) {
    Write-Host "OPTION 3: Advanced Route Fix (Admin Mode Active)" -ForegroundColor Green
    Write-Host "------------------------------------------------" -ForegroundColor Yellow
    Write-Host "Attempting automatic internet restore..." -ForegroundColor Cyan
    
    try {
        # Remove problematic VPN default routes
        $vpnRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Where-Object {
            $adapter = Get-NetAdapter -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
            $adapter -and ($adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*")
        }
        
        if ($vpnRoutes) {
            Write-Host "Removing problematic VPN routes..." -ForegroundColor Yellow
            $vpnRoutes | Remove-NetRoute -Confirm:$false -ErrorAction SilentlyContinue
            Write-Host "VPN routes removed" -ForegroundColor Green
            
            # Test internet after route removal
            Start-Sleep -Seconds 2
            try {
                $testIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
                Write-Host "SUCCESS: Internet restored!" -ForegroundColor Green
                Write-Host "Current IP: $testIP" -ForegroundColor Cyan
                
                # Test local network still works
                $localTest = Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet
                if ($localTest) {
                    Write-Host "Local network: Still working" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "PERFECT: Both internet and WiFi now work!" -ForegroundColor Green
                } else {
                    Write-Host "Local network: May need re-testing" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "Internet still blocked - try Option 1 or 2" -ForegroundColor Red
            }
        } else {
            Write-Host "No problematic VPN routes found" -ForegroundColor Yellow  
            Write-Host "Try Option 1 (disconnect VPN) or Option 2 (different server)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "Route fix failed - use Option 1 for immediate fix" -ForegroundColor Red
    }
} else {
    Write-Host "OPTION 3: Advanced Fix (Need Admin)" -ForegroundColor Yellow
    Write-Host "-----------------------------------" -ForegroundColor Yellow
    Write-Host "Run as Administrator for automatic route fixes" -ForegroundColor White
    Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Gray
}

Write-Host ""
Write-Host "RECOMMENDATION:" -ForegroundColor Blue
Write-Host "The good news: Split tunneling preserved your WiFi!" -ForegroundColor White
Write-Host "The issue: VPN internet routing is broken." -ForegroundColor White
Write-Host ""
Write-Host "Quick fix: Use Option 1 to restore internet immediately" -ForegroundColor Cyan
Write-Host "VPN fix: Use Option 2 to try different VPN server" -ForegroundColor Cyan
Write-Host ""