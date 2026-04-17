# QUICK FIREWALL FIX FOR VPN CONNECTIVITY
# =======================================
# Temporarily disables Windows Firewall to test VPN connectivity

Write-Host "QUICK FIREWALL FIX FOR VPN CONNECTIVITY" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check Administrator status
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running as Administrator: YES" -ForegroundColor Green
Write-Host ""

Write-Host "IMPORTANT: This will temporarily disable Windows Firewall for testing" -ForegroundColor Yellow
Write-Host "We'll re-enable it afterwards if this fixes the issue" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Continue with firewall test? (Y/N)"
if ($continue -ne "Y" -and $continue -ne "y") {
    Write-Host "Firewall test cancelled" -ForegroundColor Yellow
    exit 0
}

# STEP 1: Check current firewall status
Write-Host ""
Write-Host "[1] Current Firewall Status..." -ForegroundColor Yellow
try {
    $firewallProfiles = Get-NetFirewallProfile
    Write-Host ""
    foreach ($profile in $firewallProfiles) {
        $status = if ($profile.Enabled) { "ENABLED" } else { "DISABLED" }
        $color = if ($profile.Enabled) { "Yellow" } else { "Green" }
        Write-Host "  $($profile.Name): $status" -ForegroundColor $color
    }
} catch {
    Write-Host "Could not check firewall status" -ForegroundColor Red
}

# STEP 2: Disable Windows Firewall temporarily
Write-Host ""
Write-Host "[2] Temporarily Disabling Windows Firewall..." -ForegroundColor Yellow
try {
    Set-NetFirewallProfile -All -Enabled False
    Write-Host "Windows Firewall disabled for all profiles" -ForegroundColor Green
    Write-Host "This is TEMPORARY for VPN testing only!" -ForegroundColor Yellow
} catch {
    Write-Host "Failed to disable firewall: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 3: Test VPN connectivity immediately
Write-Host ""
Write-Host "[3] Testing VPN Connectivity with Firewall Disabled..." -ForegroundColor Yellow
Write-Host ""

$testSuccess = $false
$testServices = @(
    "https://icanhazip.com",
    "https://httpbin.org/ip",
    "https://api.ipify.org"
)

foreach ($service in $testServices) {
    try {
        Write-Host "Testing: $service" -ForegroundColor White
        $response = Invoke-WebRequest -Uri $service -UseBasicParsing -TimeoutSec 8
        $currentIP = $response.Content.Trim()
        Write-Host "SUCCESS! Current IP: $currentIP" -ForegroundColor Green
        
        # Check if this is a VPN IP (different from real IP)
        if ($currentIP -ne "99.247.207.59") {
            Write-Host "EXCELLENT: This is your VPN IP (different from real IP)!" -ForegroundColor Green
        }
        
        $testSuccess = $true
        break
    } catch {
        Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# STEP 4: Results and next steps
Write-Host ""
Write-Host "FIREWALL TEST RESULTS" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

if ($testSuccess) {
    Write-Host "SUCCESS: VPN works with firewall disabled!" -ForegroundColor Green
    Write-Host "The Windows Firewall was blocking your VPN traffic" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "SOLUTION OPTIONS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "OPTION 1: Keep firewall disabled (NOT RECOMMENDED)" -ForegroundColor Red
    Write-Host "  Less secure but VPN will work" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 2: Create firewall rule for VPN (RECOMMENDED)" -ForegroundColor Green
    Write-Host "  Secure solution - allow only VPN traffic through firewall" -ForegroundColor White
    Write-Host ""
    Write-Host "OPTION 3: Re-enable firewall and use different VPN server" -ForegroundColor Yellow
    Write-Host "  Some VPN servers work better with Windows Firewall" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Choose option (1/2/3) or press Enter for Option 2 (recommended)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "WARNING: Firewall remains disabled" -ForegroundColor Red
        Write-Host "Your VPN is working but security is reduced" -ForegroundColor Yellow
        Write-Host "Consider enabling firewall later and creating VPN rules" -ForegroundColor White
    } 
    elseif ($choice -eq "3") {
        Write-Host ""
        Write-Host "Re-enabling Windows Firewall..." -ForegroundColor Yellow
        Set-NetFirewallProfile -All -Enabled True
        Write-Host "Firewall re-enabled" -ForegroundColor Green
        Write-Host "Try connecting to a different VPN server location" -ForegroundColor Cyan
    } 
    else {
        # Option 2 (default): Create firewall rule
        Write-Host ""
        Write-Host "Creating VPN firewall rule..." -ForegroundColor Cyan
        
        try {
            # Allow VPN traffic through firewall
            New-NetFirewallRule -DisplayName "Allow VPN Traffic" -Direction Outbound -Protocol Any -Action Allow -InterfaceAlias "Nebulavpn" -ErrorAction SilentlyContinue
            New-NetFirewallRule -DisplayName "Allow VPN Traffic Inbound" -Direction Inbound -Protocol Any -Action Allow -InterfaceAlias "Nebulavpn" -ErrorAction SilentlyContinue
            
            Write-Host "VPN firewall rules created" -ForegroundColor Green
            Write-Host ""
            Write-Host "Re-enabling Windows Firewall..." -ForegroundColor Yellow
            Set-NetFirewallProfile -All -Enabled True
            Write-Host "Firewall re-enabled with VPN exception" -ForegroundColor Green
            
            # Test again
            Write-Host ""
            Write-Host "Testing VPN with firewall rules..." -ForegroundColor Cyan
            Start-Sleep -Seconds 3
            
            try {
                $testAgain = (Invoke-WebRequest -Uri "https://icanhazip.com" -UseBasicParsing -TimeoutSec 8).Content.Trim()
                Write-Host "FINAL TEST SUCCESS: IP = $testAgain" -ForegroundColor Green
                Write-Host "VPN is working with Windows Firewall enabled!" -ForegroundColor Green
            } catch {
                Write-Host "Firewall rules may need adjustment" -ForegroundColor Yellow  
                Write-Host "VPN might still timeout with firewall enabled" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "Could not create firewall rules: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "You may need to configure firewall manually" -ForegroundColor White
        }
    }
    
} else {
    Write-Host "VPN still not working even with firewall disabled" -ForegroundColor Red
    Write-Host "The issue is not Windows Firewall" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Re-enabling Windows Firewall..." -ForegroundColor Cyan
    Set-NetFirewallProfile -All -Enabled True
    Write-Host "Firewall re-enabled" -ForegroundColor Green
    Write-Host ""
    Write-Host "OTHER POSSIBLE CAUSES:" -ForegroundColor Yellow
    Write-Host "1. VPN server is down or unreachable" -ForegroundColor White
    Write-Host "2. ISP blocking VPN traffic" -ForegroundColor White
    Write-Host "3. WireGuard configuration issues" -ForegroundColor White
    Write-Host "4. Network adapter driver problems" -ForegroundColor White
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Try different VPN server location" -ForegroundColor White
    Write-Host "2. Contact VPN provider support" -ForegroundColor White
    Write-Host "3. Check VPN provider status page" -ForegroundColor White
}

Write-Host ""
Write-Host "Firewall test completed!" -ForegroundColor Cyan
Read-Host "Press Enter to exit"