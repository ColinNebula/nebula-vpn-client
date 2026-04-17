# ENABLE-FULL-TUNNELING.ps1
# Enable complete IP masking with full tunneling (WiFi blocking may occur)

Write-Host "Enabling Full Tunneling Configuration" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "FULL TUNNELING MODE:" -ForegroundColor Yellow
Write-Host "✅ Complete privacy: All traffic through VPN" -ForegroundColor Green
Write-Host "✅ IP masking: Your real IP will be hidden" -ForegroundColor Green  
Write-Host "⚠️  WiFi impact: May affect local network access" -ForegroundColor Yellow
Write-Host "⚠️  Connectivity: Some local services may be blocked" -ForegroundColor Yellow
Write-Host ""

# Check current VPN status
$wgInterface = Get-NetAdapter | Where-Object { 
    $_.Name -like "*Nebula*" -or $_.Name -like "*WireGuard*" -or $_.Name -like "*wg*" 
}

if ($wgInterface) {
    Write-Host "Current VPN Status: CONNECTED ($($wgInterface.Name))" -ForegroundColor Green
    Write-Host ""
    Write-Host "To apply full tunneling configuration:" -ForegroundColor White
    Write-Host "1. Disconnect VPN completely" -ForegroundColor White
    Write-Host "2. Reconnect VPN (will use full tunnel: 0.0.0.0/0)" -ForegroundColor White
    Write-Host "3. All traffic will route through VPN for complete privacy" -ForegroundColor White
} else {
    Write-Host "Current VPN Status: DISCONNECTED" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ready to connect with full tunneling:" -ForegroundColor White
    Write-Host "✅ Connect VPN normally - full tunneling configured" -ForegroundColor Green
    Write-Host "✅ All traffic will be routed through VPN" -ForegroundColor Green
}

Write-Host ""
Write-Host "TROUBLESHOOTING:" -ForegroundColor Cyan
Write-Host "If WiFi access is blocked after connection:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 - Emergency WiFi Restore:" -ForegroundColor White
Write-Host "  .\FORCE-RESILIENT-ROUTING.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2 - Manual Route Fix:" -ForegroundColor White  
Write-Host "  route delete 0.0.0.0 mask 0.0.0.0" -ForegroundColor Gray
Write-Host "  (Run as Administrator)" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3 - Disconnect VPN:" -ForegroundColor White
Write-Host "  Complete disconnection restores normal routing" -ForegroundColor Gray
Write-Host ""

Write-Host "VERIFICATION:" -ForegroundColor Cyan
Write-Host "After connecting, check your configuration:" -ForegroundColor White
Write-Host "  .\VERIFY-RESILIENT-ROUTING-FIXED.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected with full tunneling:" -ForegroundColor White
Write-Host "  • VPN IP shown (not your real IP)" -ForegroundColor Green
Write-Host "  • Complete privacy protection" -ForegroundColor Green
Write-Host "  • Local network may be affected" -ForegroundColor Yellow
Write-Host ""

Write-Host "Ready to connect with FULL TUNNELING! 🔒" -ForegroundColor Green