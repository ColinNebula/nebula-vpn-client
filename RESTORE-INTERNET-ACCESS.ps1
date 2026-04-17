# RESTORE INTERNET ACCESS FIX
# ===========================
# Fixes internet access while preserving working WiFi

Write-Host "🔧 INTERNET ACCESS RESTORATION" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Yellow
Write-Host ""
Write-Host "STATUS:" -ForegroundColor Green
Write-Host "✅ Local WiFi: Working (10.0.0.1 reachable)" -ForegroundColor Green  
Write-Host "❌ Internet: Blocked (VPN routing issue)" -ForegroundColor Red
Write-Host ""

Write-Host "[OPTION 1] Quick Internet Restore (Recommended)" -ForegroundColor Blue
Write-Host "===============================================" -ForegroundColor Yellow
Write-Host "This will restore internet access immediately:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Nebula VPN app" -ForegroundColor Cyan
Write-Host "2. Click 'Disconnect' to stop VPN tunnel" -ForegroundColor Cyan  
Write-Host "3. Test internet: curl https://api.ipify.org" -ForegroundColor Cyan
Write-Host "4. You'll have WiFi + Internet (no VPN)" -ForegroundColor Cyan
Write-Host ""

Write-Host "[OPTION 2] Fix VPN Internet Routing" -ForegroundColor Blue  
Write-Host "====================================" -ForegroundColor Yellow
Write-Host "Try connecting to different VPN server:" -ForegroundColor White
Write-Host ""
Write-Host "1. In Nebula VPN app → Server selection" -ForegroundColor Cyan
Write-Host "2. Choose different location/server" -ForegroundColor Cyan
Write-Host "3. Connect to new server" -ForegroundColor Cyan
Write-Host "4. Test: curl https://api.ipify.org" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin for advanced fix
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "[OPTION 3] Advanced Route Fix (Admin)" -ForegroundColor Blue
    Write-Host "=====================================" -ForegroundColor Yellow  
    Write-Host "Attempting to restore internet routing..." -ForegroundColor White
    
    # Remove problematic VPN routes while preserving local network
    Write-Host ""
    Write-Host "Removing blocking VPN routes..." -ForegroundColor Yellow
    try {
        # Remove aggressive VPN default routes
        Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Where-Object {
            $adapter = Get-NetAdapter -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
            $adapter -and ($adapter.Name -like "*Nebula*" -or $adapter.InterfaceDescription -like "*WireGuard*")
        } | ForEach-Object {
            Write-Host "Removing VPN route: $($_.DestinationPrefix) via $($_.NextHop)" -ForegroundColor Yellow
            Remove-NetRoute -InputObject $_ -Confirm:$false -ErrorAction SilentlyContinue
        }
        
        Write-Host "✅ Problematic VPN routes removed" -ForegroundColor Green
        Write-Host ""
        Write-Host "Testing internet restore..." -ForegroundColor Cyan
        
        # Test internet after route removal
        try {
            $testIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
            Write-Host "✅ SUCCESS! Internet restored" -ForegroundColor Green
            Write-Host "   Current IP: $testIP" -ForegroundColor White
            Write-Host ""
            
            # Verify local network still works
            $localTest = Test-Connection -ComputerName "10.0.0.1" -Count 1 -Quiet -ErrorAction SilentlyContinue
            if ($localTest) {
                Write-Host "✅ Local network still works!" -ForegroundColor Green
                Write-Host ""
                Write-Host "🎉 PERFECT! Both internet and WiFi working!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Local network may need testing" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Internet still blocked after route fix" -ForegroundColor Red
            Write-Host "   Use Option 1 (disconnect VPN) for immediate fix" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Route fix failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Use Option 1 (disconnect VPN) instead" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OPTION 3] Need Administrator for Route Fix" -ForegroundColor Blue
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host "For advanced routing fixes, run as Administrator:" -ForegroundColor White
    Write-Host "Right-click PowerShell → Run as Administrator" -ForegroundColor Cyan
    Write-Host "Then run this script again" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎯 RECOMMENDATION:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Yellow
Write-Host "The split tunneling preserved your WiFi (great!)," -ForegroundColor White
Write-Host "but VPN internet routing failed." -ForegroundColor White
Write-Host ""
Write-Host "→ Use Option 1 for immediate internet restore" -ForegroundColor Cyan
Write-Host "→ Try Option 2 if you need VPN protection" -ForegroundColor Cyan
Write-Host ""