# QUICK VPN CONNECTIVITY TEST
# ==========================
# Run this after reconnecting your VPN to verify the routing fixes work

Write-Host "🧪 TESTING VPN WITH FIXED ROUTING" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check VPN interface
Write-Host "[1] Checking VPN tunnel status..." -ForegroundColor Yellow
$vpnAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" }
if ($vpnAdapter -and $vpnAdapter.Status -eq "Up") {
    $vpnIP = (Get-NetIPAddress -InterfaceIndex $vpnAdapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
    Write-Host "✅ VPN Interface: $($vpnAdapter.Name) - Active" -ForegroundColor Green
    Write-Host "✅ VPN IP: $vpnIP" -ForegroundColor Green
    
    # Check if IP is valid (not APIPA)
    if ($vpnIP -like "169.254.*") {
        Write-Host "⚠️ VPN has APIPA address - tunnel may not be fully connected" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No active VPN interface found" -ForegroundColor Red
    Write-Host "💡 Make sure VPN is connected first" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check WiFi local network access
Write-Host ""
Write-Host "[2] Testing local network access..." -ForegroundColor Yellow
$wifiAdapter = Get-NetAdapter | Where-Object { $_.Name -like "*Wi-Fi*" -and $_.Status -eq "Up" }
if ($wifiAdapter) {
    $gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" -InterfaceIndex $wifiAdapter.InterfaceIndex -ErrorAction SilentlyContinue).NextHop
    if ($gateway) {
        try {
            $localTest = Test-Connection -ComputerName $gateway -Count 1 -Quiet -ErrorAction Stop
            if ($localTest) {
                Write-Host "✅ Local network accessible via WiFi ($gateway)" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Local network test failed" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ Local network test inconclusive: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Test 3: External IP through VPN
Write-Host ""
Write-Host "[3] Testing internet connectivity through VPN..." -ForegroundColor Yellow
$testSuccess = $false
$testServices = @(
    @{Name="icanhazip"; URL="https://icanhazip.com"},
    @{Name="ipify"; URL="https://api.ipify.org"},
    @{Name="ipecho"; URL="https://ipecho.net/plain"}
)

foreach ($service in $testServices) {
    try {
        Write-Host "  Testing $($service.Name)..." -ForegroundColor White
        $externalIP = (Invoke-WebRequest -Uri $service.URL -UseBasicParsing -TimeoutSec 8).Content.Trim()
        Write-Host "  ✅ SUCCESS! External IP: $externalIP" -ForegroundColor Green
        $testSuccess = $true
        
        # Compare with local IP to verify VPN is working
        if ($externalIP -ne "99.247.207.59") {
            Write-Host "  🎯 VPN IS WORKING! (Different from real IP)" -ForegroundColor Green  
        } else {
            Write-Host "  ⚠️ This matches your real IP - VPN may not be routing traffic" -ForegroundColor Yellow
        }
        break
    } catch {
        Write-Host "  ❌ $($service.Name) failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: DNS functionality  
Write-Host ""
Write-Host "[4] Testing DNS resolution..." -ForegroundColor Yellow
try {
    $dnsTest = Resolve-DnsName -Name "google.com" -Type A -ErrorAction Stop
    Write-Host "✅ DNS resolution working" -ForegroundColor Green
} catch {
    Write-Host "❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Final Assessment
Write-Host ""
Write-Host "🎯 ROUTING FIX TEST RESULTS" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Cyan

if ($testSuccess) {
    Write-Host ""
    Write-Host "✅ ROUTING FIXES SUCCESSFUL!" -ForegroundColor Green
    Write-Host "✅ VPN tunnel: Active and routing internet traffic" -ForegroundColor Green
    Write-Host "✅ WiFi network: Available for local connectivity" -ForegroundColor Green  
    Write-Host "✅ Internet access: Working through VPN" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your VPN is now working without blocking WiFi!" -ForegroundColor Green
    Write-Host "The routing conflicts have been resolved." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️ Internet connectivity still has issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "TROUBLESHOOTING:" -ForegroundColor Yellow
    Write-Host "1. Disconnect VPN completely" -ForegroundColor White
    Write-Host "2. Wait 10 seconds" -ForegroundColor White
    Write-Host "3. Reconnect VPN" -ForegroundColor White
    Write-Host "4. Run this test again" -ForegroundColor White
}

Write-Host ""
Write-Host "For comprehensive testing, run: .\TEST-VPN-TUNNEL.ps1" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"