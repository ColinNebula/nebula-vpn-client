#!/usr/bin/env pwsh
# Quick cloud deployment presets

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('setup', 'frontend', 'backend', 'full', 'update')]
    [string]$Scenario = 'setup'
)

function Show-Menu {
    Write-Host ""
    Write-Host "######################################################################" -ForegroundColor Cyan
    Write-Host "#         NEBULA VPN - CLOUD DEPLOYMENT WIZARD                       #" -ForegroundColor Cyan
    Write-Host "######################################################################" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Select deployment scenario:" -ForegroundColor Yellow
    Write-Host "  1. Setup new DigitalOcean droplet" -ForegroundColor White
    Write-Host "  2. Deploy frontend to GitHub Pages" -ForegroundColor White
    Write-Host "  3. Deploy backend to DigitalOcean" -ForegroundColor White
    Write-Host "  4. Full deployment (frontend + backend)" -ForegroundColor White
    Write-Host "  5. Update existing deployment" -ForegroundColor White
    Write-Host "  6. Exit" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-6)"
    
    switch ($choice) {
        '1' { return 'setup' }
        '2' { return 'frontend' }
        '3' { return 'backend' }
        '4' { return 'full' }
        '5' { return 'update' }
        '6' { exit 0 }
        default {
            Write-Host "Invalid choice. Exiting." -ForegroundColor Red
            exit 1
        }
    }
}

if ($Scenario -eq 'setup' -and $args.Count -eq 0) {
    $Scenario = Show-Menu
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

switch ($Scenario) {
    'setup' {
        Write-Host "SETUP NEW DIGITALOCEAN DROPLET" -ForegroundColor Cyan
        Write-Host "------------------------------------------------------------" -ForegroundColor Gray
        Write-Host ""
        
        $dropletIP = Read-Host "Enter your DigitalOcean droplet IP address"
        
        if ([string]::IsNullOrWhiteSpace($dropletIP)) {
            Write-Host "Droplet IP required. Exiting." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "`nThis will:" -ForegroundColor Yellow
        Write-Host "  - Configure system packages and security" -ForegroundColor Gray
        Write-Host "  - Install WireGuard VPN server" -ForegroundColor Gray
        Write-Host "  - Setup firewall rules" -ForegroundColor Gray
        Write-Host "  - Generate WireGuard keys`n" -ForegroundColor Gray
        
        $confirm = Read-Host "Continue? (yes/no) [yes]"
        if ($confirm -eq 'no') {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        .\DEPLOY-CLOUD.ps1 -ConfigureDroplet -InstallWireGuard -DropletIP $dropletIP
        
        Write-Host "`nSetup complete!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "  1. Copy WireGuard configuration to server/.env" -ForegroundColor Gray
        Write-Host "  2. Run: .\DEPLOY-CLOUD-QUICK.ps1 backend`n" -ForegroundColor Gray
    }
    
    'frontend' {
        Write-Host "DEPLOY FRONTEND TO GITHUB PAGES" -ForegroundColor Cyan
        Write-Host "------------------------------------------------------------" -ForegroundColor Gray
        Write-Host ""
        
        $isGitRepo = git rev-parse --git-dir 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Not in a git repository. Initialize git first:" -ForegroundColor Red
            Write-Host "  git init" -ForegroundColor Gray
            Write-Host "  git remote add origin https://github.com/username/repo.git`n" -ForegroundColor Gray
            exit 1
        }
        
        Write-Host "This will:" -ForegroundColor Yellow
        Write-Host "  - Build React production bundle" -ForegroundColor Gray
        Write-Host "  - Update package.json homepage" -ForegroundColor Gray
        Write-Host "  - Deploy to GitHub Pages" -ForegroundColor Gray
        Write-Host "  - Publish to https://username.github.io/repo/`n" -ForegroundColor Gray
        
        $confirm = Read-Host "Continue? (yes/no) [yes]"
        if ($confirm -eq 'no') {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        .\DEPLOY-CLOUD.ps1 -DeployFrontend -UpdateHomepage -SkipElectron
        
        Write-Host "`nFrontend deployed!" -ForegroundColor Green
        Write-Host "`nNote: GitHub Pages may take 1-2 minutes to update.`n" -ForegroundColor Yellow
    }
    
    'backend' {
        Write-Host "DEPLOY BACKEND TO DIGITALOCEAN" -ForegroundColor Cyan
        Write-Host "------------------------------------------------------------" -ForegroundColor Gray
        Write-Host ""
        
        $dropletIP = Read-Host "Enter your DigitalOcean droplet IP address"
        
        if ([string]::IsNullOrWhiteSpace($dropletIP)) {
            Write-Host "Droplet IP required. Exiting." -ForegroundColor Red
            exit 1
        }
        
        if (-not (Test-Path "server\.env")) {
            Write-Host "Warning: server/.env not found!" -ForegroundColor Yellow
            Write-Host "`nYou should:" -ForegroundColor Yellow
            Write-Host "  1. Run: node scripts/generate-secrets.js" -ForegroundColor Gray
            Write-Host "  2. Configure WireGuard settings in server/.env`n" -ForegroundColor Gray
            
            $proceed = Read-Host "Continue anyway? (yes/no) [no]"
            if ($proceed -ne 'yes') {
                Write-Host "Cancelled." -ForegroundColor Yellow
                exit 0
            }
        }
        
        Write-Host "`nThis will:" -ForegroundColor Yellow
        Write-Host "  - Package backend server" -ForegroundColor Gray
        Write-Host "  - Upload to DigitalOcean via SSH" -ForegroundColor Gray
        Write-Host "  - Install dependencies" -ForegroundColor Gray
        Write-Host "  - Configure systemd service" -ForegroundColor Gray
        Write-Host "  - Start the API server`n" -ForegroundColor Gray
        
        $confirm = Read-Host "Continue? (yes/no) [yes]"
        if ($confirm -eq 'no') {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        .\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP $dropletIP -SkipElectron
        
        Write-Host "`nBackend deployed!" -ForegroundColor Green
        Write-Host "`nTest your API:" -ForegroundColor Yellow
        Write-Host "  curl http://$dropletIP:3001/health`n" -ForegroundColor Gray
    }
    
    'full' {
        Write-Host "FULL DEPLOYMENT (FRONTEND + BACKEND)" -ForegroundColor Cyan
        Write-Host "------------------------------------------------------------" -ForegroundColor Gray
        Write-Host ""
        
        $dropletIP = Read-Host "Enter your DigitalOcean droplet IP address"
        
        if ([string]::IsNullOrWhiteSpace($dropletIP)) {
            Write-Host "Droplet IP required. Exiting." -ForegroundColor Red
            exit 1
        }
        
        Write-Host "`nThis will deploy:" -ForegroundColor Yellow
        Write-Host "  Frontend -> GitHub Pages" -ForegroundColor Gray
        Write-Host "  Backend  -> DigitalOcean ($dropletIP)" -ForegroundColor Gray
        Write-Host "  Electron -> Build desktop apps (optional)`n" -ForegroundColor Gray
        
        $buildElectron = Read-Host "Build Electron desktop apps? (yes/no) [no]"
        
        $confirm = Read-Host "Start full deployment? (yes/no) [yes]"
        if ($confirm -eq 'no') {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        $params = @{
            DeployFrontend = $true
            DeployBackend = $true
            DropletIP = $dropletIP
            UpdateHomepage = $true
        }
        
        if ($buildElectron -eq 'no') {
            $params.SkipElectron = $true
        }
        
        .\DEPLOY-CLOUD.ps1 @params
        
        Write-Host "`nFull deployment complete!" -ForegroundColor Green
    }
    
    'update' {
        Write-Host "UPDATE EXISTING DEPLOYMENT" -ForegroundColor Cyan
        Write-Host "------------------------------------------------------------" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "What do you want to update?" -ForegroundColor Yellow
        Write-Host "  1. Frontend only (GitHub Pages)" -ForegroundColor White
        Write-Host "  2. Backend only (DigitalOcean)" -ForegroundColor White
        Write-Host "  3. Both frontend and backend" -ForegroundColor White
        Write-Host ""
        
        $updateChoice = Read-Host "Enter choice (1-3)"
        
        switch ($updateChoice) {
            '1' {
                Write-Host "`nUpdating frontend..." -ForegroundColor Yellow
                .\DEPLOY-CLOUD.ps1 -DeployFrontend -SkipTests -SkipElectron
            }
            '2' {
                $dropletIP = Read-Host "`nEnter DigitalOcean droplet IP"
                Write-Host "`nUpdating backend..." -ForegroundColor Yellow
                .\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP $dropletIP -SkipTests -SkipElectron
            }
            '3' {
                $dropletIP = Read-Host "`nEnter DigitalOcean droplet IP"
                Write-Host "`nUpdating both..." -ForegroundColor Yellow
                .\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP $dropletIP -SkipTests -SkipElectron
            }
            default {
                Write-Host "Invalid choice." -ForegroundColor Red
                exit 1
            }
        }
        
        Write-Host "`nUpdate complete!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
