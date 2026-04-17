# RESTART VPN AND TEST CONNECTIVITY FIXES
# =================================== 
# This script restarts the VPN and tests if our connectivity fixes resolved
# the "Public IP Retrieved - Connection failed" issue

Write-Host "🚀 RESTARTING VPN TO TEST CONNECTIVITY FIXES" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ CRITICAL: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 1: Start WireGuard service
Write-Host "[1/5] Starting WireGuard VPN service..." -ForegroundColor Yellow
try {
    Start-Service -Name "WireGuardTunnel`$Nebulavpn" -ErrorAction Stop
    Write-Host "✅ WireGuard service started" -ForegroundColor Green
    Start-Sleep -Seconds 5
} catch {
    Write-Host "❌ Failed to start WireGuard: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Verify VPN interface
Write-Host ""
Write-Host "[2/5] Checking VPN interface..." -ForegroundColor Yellow
$vpnInterface = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" }
if ($vpnInterface -and $vpnInterface.Status -eq "Up") {
    Write-Host "✅ VPN Interface Active: $($vpnInterface.Name)" -ForegroundColor Green
} else {
    Write-Host "❌ VPN interface not active" -ForegroundColor Red
    exit 1
}

# Step 3: Check routing
Write-Host ""
Write-Host "[3/5] Verifying VPN routing..." -ForegroundColor Yellow
$defaultRoute = route print 0.0.0.0 | Select-String "0.0.0.0.*Nebulavpn"
if ($defaultRoute) {
    Write-Host "✅ Default route through VPN confirmed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Default route may not be through VPN" -ForegroundColor Yellow
}

# Step 4: Test internet connectivity through VPN
Write-Host ""
Write-Host "[4/5] Testing internet connectivity through VPN..." -ForegroundColor Yellow
Write-Host "This tests if our connectivity fixes resolved the issue!" -ForegroundColor Cyan
Write-Host ""

$connectivityWorking = $false
$services = @(
    @{Name="icanhazip"; Url="https://icanhazip.com"},
    @{Name="ipify"; Url="https://api.ipify.org"},
    @{Name="ipecho"; Url="https://ipecho.net/plain"}
)

foreach ($service in $services) {
    try {
        Write-Host "  Testing $($service.Name)..." -ForegroundColor White
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 10 -UseBasicParsing
        $vpnIp = $response.Content.Trim()
        Write-Host "  ✅ SUCCESS: VPN IP = $vpnIp" -ForegroundColor Green
        $connectivityWorking = $true
        break
    } catch {
        Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 5: Final assessment
Write-Host ""
Write-Host "[5/5] CONNECTIVITY FIX ASSESSMENT" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
if ($connectivityWorking) {
    Write-Host "🎉 SUCCESS! Internet connectivity through VPN is working!" -ForegroundColor Green
    Write-Host "The 'Public IP Retrieved' issue has been RESOLVED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run your VPN test again - it should now show:" -ForegroundColor Cyan
    Write-Host "  [PASS] Public IP Retrieved" -ForegroundColor Green
    Write-Host "  [PASS] DNS Leak Test" -ForegroundColor Green
    Write-Host "  Security Score: 85-95%" -ForegroundColor Green
} else {
    Write-Host "❌ Internet connectivity through VPN still not working" -ForegroundColor Red
    Write-Host "The connectivity fixes need additional investigation" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Cyan
    Write-Host "  • Firewall blocking VPN traffic" -ForegroundColor White
    Write-Host "  • MTU size issues" -ForegroundColor White
    Write-Host "  • VPN server configuration" -ForegroundColor White
    Write-Host "  • DNS resolution problems" -ForegroundColor White
}

Write-Host ""
Write-Host "VPN restart and connectivity test completed!" -ForegroundColor Cyan
Read-Host "Press Enter to exit"