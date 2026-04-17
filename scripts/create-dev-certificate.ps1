# Create Self-Signed Certificate for MSIX Development
# This certificate is for TESTING ONLY - not for production!

param(
    [string]$CertName = "Nebula Media 3D",
    [string]$Password = "NebulaVPN2026!Dev",
    [string]$OutputPath = ".\build"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Creating Self-Signed Certificate for MSIX Development" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# Create output directory if it doesn't exist
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
}

try {
    # Create self-signed certificate
    Write-Host "[1/5] Creating self-signed certificate..." -ForegroundColor Yellow
    
    $cert = New-SelfSignedCertificate `
        -Type Custom `
        -Subject "CN=$CertName" `
        -KeyUsage DigitalSignature `
        -FriendlyName "Nebula VPN Development Certificate" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}") `
        -NotAfter (Get-Date).AddYears(2)
    
    Write-Host "  ✓ Certificate created with thumbprint: $($cert.Thumbprint)" -ForegroundColor Green
    
    # Export PFX (for signing)
    Write-Host "`n[2/5] Exporting PFX certificate..." -ForegroundColor Yellow
    $pfxPath = Join-Path $OutputPath "NebulaVPN-Dev.pfx"
    $securePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText
    
    Export-PfxCertificate `
        -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" `
        -FilePath $pfxPath `
        -Password $securePassword | Out-Null
    
    Write-Host "  ✓ PFX exported to: $pfxPath" -ForegroundColor Green
    
    # Export CER (for installation)
    Write-Host "`n[3/5] Exporting CER certificate..." -ForegroundColor Yellow
    $cerPath = Join-Path $OutputPath "NebulaVPN-Dev.cer"
    
    Export-Certificate `
        -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" `
        -FilePath $cerPath | Out-Null
    
    Write-Host "  ✓ CER exported to: $cerPath" -ForegroundColor Green
    
    # Trust the certificate (install to Trusted Root)
    Write-Host "`n[4/5] Installing certificate to Trusted Root..." -ForegroundColor Yellow
    
    $elevated = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if ($elevated) {
        Import-Certificate `
            -FilePath $cerPath `
            -CertStoreLocation "Cert:\LocalMachine\Root" | Out-Null
        Write-Host "  ✓ Certificate trusted (installed to Trusted Root)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Not running as Administrator - certificate NOT trusted" -ForegroundColor Yellow
        Write-Host "  Run this command as Administrator to trust the certificate:" -ForegroundColor Yellow
        Write-Host "  Import-Certificate -FilePath '$cerPath' -CertStoreLocation 'Cert:\LocalMachine\Root'" -ForegroundColor Cyan
    }
    
    # Create .env snippet for electron-builder
    Write-Host "`n[5/5] Creating environment configuration..." -ForegroundColor Yellow
    
    $envPath = Join-Path $OutputPath "certificate-env.txt"
    $envContent = @"
# Add these to your environment variables or .env file
# WARNING: Never commit these to Git!

CERTIFICATE_FILE=$pfxPath
CERTIFICATE_PASSWORD=$Password
CERTIFICATE_THUMBPRINT=$($cert.Thumbprint)

# For use in package.json:
# "win": {
#   "certificateFile": "`${env.CERTIFICATE_FILE}",
#   "certificatePassword": "`${env.CERTIFICATE_PASSWORD}"
# }
"@
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "  ✓ Environment configuration saved to: $envPath" -ForegroundColor Green
    
    # Summary
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "  Certificate Creation Complete!" -ForegroundColor Cyan
    Write-Host "================================================================`n" -ForegroundColor Cyan
    
    Write-Host "Certificate Details:" -ForegroundColor White
    Write-Host "  Subject:     CN=$CertName" -ForegroundColor Gray
    Write-Host "  Thumbprint:  $($cert.Thumbprint)" -ForegroundColor Gray
    Write-Host "  Expires:     $($cert.NotAfter)" -ForegroundColor Gray
    Write-Host "  PFX File:    $pfxPath" -ForegroundColor Gray
    Write-Host "  CER File:    $cerPath" -ForegroundColor Gray
    Write-Host "  Password:    $Password" -ForegroundColor Gray
    
    Write-Host "`nNext Steps:" -ForegroundColor White
    Write-Host "  1. Review certificate-env.txt for environment variables" -ForegroundColor Gray
    Write-Host "  2. Set environment variables (NEVER commit them to Git!)" -ForegroundColor Gray
    Write-Host "  3. Build MSIX: npm run electron:build:msix" -ForegroundColor Gray
    Write-Host "  4. Test installation of the generated .appx file" -ForegroundColor Gray
    
    if (!$elevated) {
        Write-Host "`n⚠ IMPORTANT: Run this script as Administrator to auto-trust the certificate!" -ForegroundColor Yellow
    }
    
    Write-Host "`n⚠ WARNING: This is a DEVELOPMENT certificate only!" -ForegroundColor Red
    Write-Host "  For production, purchase a commercial code signing certificate." -ForegroundColor Red
    
} catch {
    Write-Host "`n✗ Error creating certificate: $_" -ForegroundColor Red
    exit 1
}
