#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup SSH access to DigitalOcean droplet for passwordless deployment

.DESCRIPTION
    This script helps you set up SSH key authentication for your DigitalOcean droplet,
    which is required for automatic deployment without password prompts.

.PARAMETER DropletIP
    The IP address of your DigitalOcean droplet

.PARAMETER DropletUser
    SSH username (default: root)

.EXAMPLE
    .\SETUP-SSH-ACCESS.ps1 -DropletIP "157.230.xxx.xxx"
    .\SETUP-SSH-ACCESS.ps1 -DropletIP "157.230.xxx.xxx" -DropletUser "deploy"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$DropletIP,
    
    [Parameter(Mandatory=$false)]
    [string]$DropletUser = "root"
)

$ErrorActionPreference = "Continue"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  SSH ACCESS SETUP FOR DIGITALOCEAN" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

$sshHost = "$DropletUser@$DropletIP"

# Check if SSH key exists
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
$sshKeyPathEd = "$env:USERPROFILE\.ssh\id_ed25519.pub"

if (-not (Test-Path $sshKeyPath) -and -not (Test-Path $sshKeyPathEd)) {
    Write-Host "No SSH key found. Generating one..." -ForegroundColor Yellow
    Write-Host ""
    
    ssh-keygen -t ed25519 -C "$env:USERNAME@$env:COMPUTERNAME" -f "$env:USERPROFILE\.ssh\id_ed25519"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSSH key generated successfully!" -ForegroundColor Green
        $sshKeyPath = $sshKeyPathEd
    } else {
        Write-Host "`nFailed to generate SSH key" -ForegroundColor Red
        exit 1
    }
} else {
    if (Test-Path $sshKeyPathEd) {
        $sshKeyPath = $sshKeyPathEd
        Write-Host "Using existing SSH key: $sshKeyPath" -ForegroundColor Green
    } else {
        Write-Host "Using existing SSH key: $sshKeyPath" -ForegroundColor Green
    }
}

# Test current SSH access
Write-Host "`nTesting SSH connection to $sshHost..." -ForegroundColor Cyan
$testResult = ssh -o ConnectTimeout=10 -o BatchMode=yes $sshHost "echo 'OK'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: SSH key authentication already working!" -ForegroundColor Green
    Write-Host "You can now run deployment scripts without passwords.`n" -ForegroundColor Green
    exit 0
}

# SSH key not set up, need to copy it
Write-Host "SSH key authentication not configured yet." -ForegroundColor Yellow
Write-Host ""
Write-Host "Copying SSH key to $sshHost..." -ForegroundColor Cyan
Write-Host "(You will be prompted for the droplet password ONE TIME)" -ForegroundColor Yellow
Write-Host ""

# Read the public key
$publicKey = Get-Content $sshKeyPath -Raw

# Copy SSH key to server (will prompt for password)
$copyKeyScript = @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$publicKey' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo 'SSH key added successfully'
"@

ssh $sshHost $copyKeyScript

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSSH key copied successfully!" -ForegroundColor Green
    
    # Test again
    Write-Host "Testing passwordless SSH..." -ForegroundColor Cyan
    $testResult2 = ssh -o BatchMode=yes $sshHost "echo 'Passwordless SSH works!'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSUCCESS: $testResult2" -ForegroundColor Green
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host "  SSH ACCESS CONFIGURED SUCCESSFULLY" -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run deployment scripts without entering passwords:" -ForegroundColor Cyan
        Write-Host "  .\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP $DropletIP" -ForegroundColor Gray
        Write-Host "  .\DEPLOY-CLOUD-QUICK.ps1" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "`nWARNING: SSH key was copied but passwordless login test failed" -ForegroundColor Yellow
        Write-Host "This might be a temporary issue. Try running the deployment script." -ForegroundColor Yellow
    }
} else {
    Write-Host "`nFailed to copy SSH key" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup instructions:" -ForegroundColor Yellow
    Write-Host "1. Copy your public key:" -ForegroundColor Gray
    Write-Host "   type $sshKeyPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. On your droplet, run:" -ForegroundColor Gray
    Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
    Write-Host "   nano ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "   (Paste the public key and save)" -ForegroundColor Gray
    Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
