$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Nebula VPN (Admin).lnk")
$Shortcut.TargetPath = "D:\Development\nebula-vpn-client\dist\win-unpacked\Nebula VPN.exe"
$Shortcut.WorkingDirectory = "D:\Development\nebula-vpn-client\dist\win-unpacked"
$Shortcut.Description = "Nebula VPN (Administrator Mode)"
$Shortcut.Save()

# Set shortcut to run as admin
$bytes = [System.IO.File]::ReadAllBytes("$env:USERPROFILE\Desktop\Nebula VPN (Admin).lnk")
$bytes[0x15] = $bytes[0x15] -bor 0x20 # Set byte 21 (0x15) bit 6 (0x20) to run as admin
[System.IO.File]::WriteAllBytes("$env:USERPROFILE\Desktop\Nebula VPN (Admin).lnk", $bytes)

Write-Host "`n[SUCCESS] Created desktop shortcut: 'Nebula VPN (Admin).lnk'" -ForegroundColor Green
Write-Host "This shortcut will ALWAYS run the app as Administrator" -ForegroundColor Cyan
Write-Host "`nDouble-click this shortcut to launch the app with proper permissions!" -ForegroundColor Yellow
