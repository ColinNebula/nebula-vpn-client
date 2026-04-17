# IMMEDIATE VPN SERVER SWITCH GUIDE
# =================================
# Quick fix for VPN gateway failure (10.8.0.1 unresponsive)

Write-Host "IMMEDIATE VPN SERVER SWITCH GUIDE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚨 PROBLEM CONFIRMED:" -ForegroundColor Red
Write-Host "Your VPN gateway (10.8.0.1) has 100% packet loss" -ForegroundColor White
Write-Host "This means the VPN server is down/overloaded/unreachable" -ForegroundColor White
Write-Host ""

Write-Host "✅ IMMEDIATE SOLUTION (Takes 30 seconds):" -ForegroundColor Green
Write-Host ""

Write-Host "STEP 1: Open Nebula VPN Application" -ForegroundColor Yellow
Write-Host "• Look for the Nebula VPN system tray icon or desktop app" -ForegroundColor White
Write-Host "• If not visible, search 'Nebula VPN' in Start menu" -ForegroundColor White
Write-Host ""

Write-Host "STEP 2: Find Server Selection" -ForegroundColor Yellow
Write-Host "Look for one of these options in the app:" -ForegroundColor White
Write-Host "• 'Server Location'" -ForegroundColor Cyan
Write-Host "• 'Change Server'" -ForegroundColor Cyan  
Write-Host "• 'Location' or 'Country'" -ForegroundColor Cyan
Write-Host "• 'Server List'" -ForegroundColor Cyan
Write-Host "• Settings → Server Location" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 3: Try These Server Locations (in order):" -ForegroundColor Yellow
Write-Host "🌎 AMERICAS:" -ForegroundColor Cyan
Write-Host "• United States - East Coast (New York, Atlanta)" -ForegroundColor White
Write-Host "• United States - West Coast (Los Angeles, San Francisco)" -ForegroundColor White
Write-Host "• Canada (Toronto, Vancouver)" -ForegroundColor White
Write-Host ""
Write-Host "🌍 EUROPE:" -ForegroundColor Cyan
Write-Host "• United Kingdom (London)" -ForegroundColor White
Write-Host "• Germany (Frankfurt, Berlin)" -ForegroundColor White
Write-Host "• Netherlands (Amsterdam)" -ForegroundColor White
Write-Host ""
Write-Host "🌏 ASIA-PACIFIC:" -ForegroundColor Cyan
Write-Host "• Singapore" -ForegroundColor White
Write-Host "• Japan (Tokyo)" -ForegroundColor White
Write-Host "• Australia (Sydney)" -ForegroundColor White
Write-Host ""

Write-Host "STEP 4: Reconnect and Test" -ForegroundColor Yellow
Write-Host "• Click 'Connect' or 'Apply' after selecting new server" -ForegroundColor White
Write-Host "• Wait 30 seconds for connection to establish" -ForegroundColor White  
Write-Host "• Run the verification test below" -ForegroundColor White
Write-Host ""

# Quick connectivity test
Write-Host "🧪 VERIFICATION TEST:" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""

Write-Host "After switching servers, run this quick test:" -ForegroundColor White
Write-Host ""
Write-Host "Test VPN Gateway:" -ForegroundColor Yellow
try {
    $ping = ping 10.8.0.1 -n 2
    Write-Host $ping -ForegroundColor Gray
} catch {
    Write-Host "Current status: VPN gateway still unreachable" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test Internet:" -ForegroundColor Yellow
try {
    $ip = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 3).Content
    Write-Host "✅ Current IP: $ip" -ForegroundColor Green
    if ($ip -eq "99.247.207.59") {
        Write-Host "⚠️ Still using your real IP (VPN not working)" -ForegroundColor Yellow
    } else {
        Write-Host "🎉 VPN IP detected! Server switch successful!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Internet test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 WHAT TO EXPECT AFTER SERVER SWITCH:" -ForegroundColor Green
Write-Host ""
Write-Host "✅ SUCCESSFUL SERVER SWITCH shows:" -ForegroundColor Green
Write-Host "• ping 10.8.0.1 responds (or similar gateway like 10.6.0.1)" -ForegroundColor White
Write-Host "• Your IP changes from 99.247.207.59 to VPN server IP" -ForegroundColor White
Write-Host "• .\TEST-ROUTING-FIX.ps1 passes all tests" -ForegroundColor White
Write-Host ""

Write-Host "❌ STILL NOT WORKING means:" -ForegroundColor Red
Write-Host "• Try different server location" -ForegroundColor White
Write-Host "• VPN service may have widespread outages" -ForegroundColor White
Write-Host "• Network/ISP may be blocking VPN entirely" -ForegroundColor White
Write-Host ""

Write-Host "🔄 IF FIRST SERVER DOESN'T WORK:" -ForegroundColor Yellow
Write-Host "• Try 2-3 different server locations" -ForegroundColor White
Write-Host "• Servers in different regions may work better" -ForegroundColor White
Write-Host "• Some locations may be less congested" -ForegroundColor White
Write-Host ""

Write-Host "⚡ BACKUP PLAN - DNS-ONLY PRIVACY:" -ForegroundColor Cyan
Write-Host "If VPN servers are all down, the Admin script is configuring:" -ForegroundColor White
Write-Host "• DNS privacy through VPN (if any gateway responds)" -ForegroundColor White
Write-Host "• Internet through WiFi (for reliability)" -ForegroundColor White  
Write-Host "• You get partial privacy with full connectivity" -ForegroundColor White

Write-Host ""
Write-Host "🎯 PRIORITY ACTION: Switch to different VPN server NOW!" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter after you've tried switching VPN servers"