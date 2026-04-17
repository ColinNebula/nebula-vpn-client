# IMMEDIATE WIFI UNBLOCK + VPN FIX
# =================================
# Fixes WiFi blocking caused by WireGuard routing conflicts

Write-Host "🚨 IMMEDIATE WIFI UNBLOCK + VPN FIX" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1] DIAGNOSING WIFI BLOCKING ISSUE..." -ForegroundColor Green
Write-Host "Checking for VPN interfaces blocking WiFi..." -ForegroundColor Yellow

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Host "Admin Status: $isAdmin" -ForegroundColor $(if($isAdmin){"Green"}else{"Yellow"})
Write-Host ""

# Step 1: Detect problematic VPN interfaces
$vpnInterfaces = @()
try {
    $allAdapters = Get-NetAdapter -ErrorAction SilentlyContinue
    foreach ($adapter in $allAdapters) {
        if ($adapter.Name -match "Nebula|wg|WireGuard" -or $adapter.InterfaceDescription -match "WireGuard") {
            $ip = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
            $vpnInterfaces += @{
                Name = $adapter.Name
                Index = $adapter.InterfaceIndex
                Status = $adapter.Status
                IP = if ($ip) { $ip.IPAddress } else { "No IP" }
            }
        }
    }
} catch {
    Write-Host "❌ Cannot check network adapters - limited permissions" -ForegroundColor Red
}

if ($vpnInterfaces) {
    Write-Host "✅ Found VPN interfaces:" -ForegroundColor Green
    foreach ($iface in $vpnInterfaces) {
        $color = if ($iface.Status -eq "Up") { "Yellow" } else { "Gray" }
        Write-Host "   $($iface.Name) - $($iface.Status) - IP: $($iface.IP)" -ForegroundColor $color
    }
    
    # Check for problematic interfaces
    $blockingInterfaces = $vpnInterfaces | Where-Object { 
        $_.Status -eq "Up" -and ($_.IP -eq "No IP" -or $_.IP -match "169\.254\.")
    }
    
    if ($blockingInterfaces) {
        Write-Host ""
        Write-Host "🚨 PROBLEM IDENTIFIED: Active VPN interface with no proper IP" -ForegroundColor Red
        Write-Host "This is blocking WiFi connectivity!" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "⚠️  No VPN interfaces detected - checking routing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2] TESTING CONNECTIVITY..." -ForegroundColor Green
# Test basic connectivity
try {
    $pingResult = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -ErrorAction Stop
    if ($pingResult) {
        Write-Host "✅ Internet connectivity: WORKING" -ForegroundColor Green
    } else {
        Write-Host "❌ Internet connectivity: BLOCKED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Internet connectivity: FAILED" -ForegroundColor Red
}

# Test local gateway
Write-Host ""
Write-Host "Testing local network gateway..." -ForegroundColor Cyan
$commonGateways = @("192.168.1.1", "192.168.0.1", "10.0.0.1", "172.16.0.1")
$workingGateway = $null

foreach ($gateway in $commonGateways) {
    try {
        $gatewayPing = Test-Connection -ComputerName $gateway -Count 1 -Quiet -ErrorAction Stop
        if ($gatewayPing) {
            Write-Host "✅ Local gateway $gateway: REACHABLE" -ForegroundColor Green
            $workingGateway = $gateway
            break
        }
    } catch { }
}

if (-not $workingGateway) {
    Write-Host "❌ Local gateway: NOT REACHABLE" -ForegroundColor Red
    Write-Host "🚨 WiFi/local network is blocked!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3] IMMEDIATE FIX OPTIONS..." -ForegroundColor Blue
Write-Host "==============================" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔧 OPTION 1: Quick VPN Disconnect (Immediate)" -ForegroundColor Green
Write-Host "1. Open Nebula VPN app" -ForegroundColor White
Write-Host "2. Click 'Disconnect' or turn off VPN" -ForegroundColor White  
Write-Host "3. Wait 10 seconds for interface cleanup" -ForegroundColor White
Write-Host "4. Test WiFi: ping 8.8.8.8" -ForegroundColor White
Write-Host "   ↳ This should immediately restore WiFi access" -ForegroundColor Gray

Write-Host ""
Write-Host "🔧 OPTION 2: Smart VPN Reconnect (Preferred)" -ForegroundColor Green  
Write-Host "1. Disconnect VPN completely" -ForegroundColor White
Write-Host "2. Run: .\SETUP-SPLIT-TUNNELING.ps1 -PrepareOnly" -ForegroundColor White
Write-Host "3. Reconnect VPN (will use split tunneling)" -ForegroundColor White
Write-Host "4. Keep both VPN AND WiFi working!" -ForegroundColor White
Write-Host "   ↳ This prevents future WiFi blocking" -ForegroundColor Gray

if ($isAdmin) {
    Write-Host ""
    Write-Host "🔧 OPTION 3: Advanced Route Fix (Admin)" -ForegroundColor Green
    Write-Host "Attempting automatic route fix..." -ForegroundColor Yellow
    
    # Try to detect physical gateway for route preservation
    try {
        $physicalRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Where-Object {
            $adapter = Get-NetAdapter -InterfaceIndex $_.ifIndex -ErrorAction SilentlyContinue
            $adapter -and $adapter.InterfaceDescription -notlike "*WireGuard*"
        } | Sort-Object RouteMetric | Select-Object -First 1
        
        if ($physicalRoutes -and $physicalRoutes.NextHop -ne "0.0.0.0") {
            $physicalGW = $physicalRoutes.NextHop
            Write-Host "✅ Detected physical gateway: $physicalGW" -ForegroundColor Green
            
            # Add local network preservation route
            try {
                $localNetwork = $physicalGW -replace "\.\d+$", ".0"
                New-NetRoute -DestinationPrefix "$localNetwork/24" -NextHop $physicalGW -RouteMetric 1 -ErrorAction SilentlyContinue
                Write-Host "✅ Added local network preservation route" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Route may already exist" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Could not detect physical gateway for route fix" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Route fix failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 RECOMMENDATION:" -ForegroundColor Blue
if ($blockingInterfaces -or -not $workingGateway) {
    Write-Host "Your WiFi is currently blocked by VPN routing." -ForegroundColor Yellow
    Write-Host "→ Use OPTION 1 for immediate WiFi restore" -ForegroundColor Cyan
    Write-Host "→ Then use OPTION 2 to prevent future blocking" -ForegroundColor Cyan
} else {
    Write-Host "WiFi appears to be working. Use OPTION 2 proactively" -ForegroundColor Green
    Write-Host "to prevent VPN from blocking WiFi in the future." -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Blue
Write-Host "1. Fix immediate connectivity (disconnect VPN if needed)" -ForegroundColor White
Write-Host "2. Run split tunneling setup before reconnecting" -ForegroundColor White
Write-Host "3. Enjoy VPN + WiFi working together!" -ForegroundColor White
Write-Host ""