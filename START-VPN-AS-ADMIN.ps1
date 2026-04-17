# START NEBULA VPN AS ADMINISTRATOR
# This script ensures the app runs with elevated privileges

$appPath = "D:\Development\nebula-vpn-client\dist\win-unpacked\Nebula VPN.exe"

Write-Host "`n=== STARTING NEBULA VPN AS ADMINISTRATOR ===" -ForegroundColor Cyan

# Check if app exists
if (-not (Test-Path $appPath)) {
    Write-Host "[ERROR] App not found at: $appPath" -ForegroundColor Red
    Write-Host "Run 'npm run electron:build:win' first to build the app" -ForegroundColor Yellow
    exit 1
}

# Close existing instances
Write-Host "`n[1] Closing any existing instances..." -ForegroundColor Yellow
Get-Process -Name "Nebula VPN" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "    Closing PID $($_.Id)..." -ForegroundColor Gray
    Stop-Process -Id $_.Id -Force
}
Start-Sleep -Seconds 2

# Start as admin
Write-Host "`n[2] Starting app with administrator privileges..." -ForegroundColor Yellow
Write-Host "    Path: $appPath" -ForegroundColor Gray

try {
    # This will trigger UAC prompt - you MUST click YES
    Start-Process -FilePath $appPath -Verb RunAs
    
    Write-Host "`n[SUCCESS] App is starting with admin privileges" -ForegroundColor Green
    Write-Host "`nIMPORTANT: " -ForegroundColor Yellow -NoNewline
    Write-Host "When the Windows UAC prompt appears, click YES!" -ForegroundColor White
    Write-Host "`nAfter the app opens:" -ForegroundColor Cyan
    Write-Host "  1. Click 'Connect' button in the app" -ForegroundColor White
    Write-Host "  2. Select a VPN server" -ForegroundColor White
    Write-Host "  3. Wait for connection to establish" -ForegroundColor White
    Write-Host "  4. Run: .\DIAGNOSE-VPN-CONNECTION.ps1`n" -ForegroundColor White
}
catch {
    Write-Host "`n[ERROR] Failed to start app: $_" -ForegroundColor Red
    Write-Host "`nTry this instead:" -ForegroundColor Yellow
    Write-Host "  1. Open File Explorer" -ForegroundColor White
    Write-Host "  2. Navigate to: D:\Development\nebula-vpn-client\dist\win-unpacked" -ForegroundColor White
    Write-Host "  3. Right-click on 'Nebula VPN.exe'" -ForegroundColor White
    Write-Host "  4. Select 'Run as administrator'" -ForegroundColor White
    Write-Host "  5. Click 'Yes' on the UAC prompt`n" -ForegroundColor White
}
