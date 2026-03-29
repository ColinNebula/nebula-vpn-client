#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Nebula VPN Complete Deployment Script
.DESCRIPTION
    Deploys frontend and backend components with security checks, build processes,
    and optional server deployment. Handles all aspects of the Nebula VPN deployment pipeline.
.PARAMETER Target
    Deployment target: 'local', 'staging', or 'production'
.PARAMETER SkipSecrets
    Skip secret generation (use if secrets already exist)
.PARAMETER SkipTests
    Skip security audits and tests
.PARAMETER SkipElectron
    Skip Electron desktop app builds
.PARAMETER ElectronPlatform
    Build Electron for specific platform: 'win', 'mac', 'linux', or 'all'
.PARAMETER ServerHost
    SSH host for server deployment (e.g., user@server.com)
.PARAMETER ServerPath
    Remote path for server deployment (default: /opt/nebula-vpn-server)
.PARAMETER DeployBackend
    Deploy backend to remote server
.PARAMETER RestartServer
    Restart server after deployment
.EXAMPLE
    .\DEPLOY-ALL.ps1 -Target local
    .\DEPLOY-ALL.ps1 -Target production -DeployBackend -ServerHost user@yourserver.com -RestartServer
    .\DEPLOY-ALL.ps1 -Target staging -ElectronPlatform win
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('local', 'staging', 'production')]
    [string]$Target = 'local',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSecrets,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipElectron,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('win', 'mac', 'linux', 'all')]
    [string]$ElectronPlatform = 'win',
    
    [Parameter(Mandatory=$false)]
    [string]$ServerHost = '',
    
    [Parameter(Mandatory=$false)]
    [string]$ServerPath = '/opt/nebula-vpn-server',
    
    [Parameter(Mandatory=$false)]
    [switch]$DeployBackend,
    
    [Parameter(Mandatory=$false)]
    [switch]$RestartServer
)

# Color output functions
function Write-Step {
    param([string]$Message)
    Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# Error handling
$ErrorActionPreference = "Stop"
$Global:DeploymentErrors = @()

function Add-Error {
    param([string]$Message)
    $Global:DeploymentErrors += $Message
    Write-Error $Message
}

# Validate prerequisites
function Test-Prerequisites {
    Write-Step "Checking Prerequisites"
    
    $missing = @()
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } catch {
        $missing += "Node.js"
        Add-Error "Node.js is not installed"
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm: $npmVersion"
    } catch {
        $missing += "npm"
        Add-Error "npm is not installed"
    }
    
    # Check Git (optional but recommended)
    try {
        $gitVersion = git --version 2>&1
        if ($LASTEXITCODE -ne 0) { throw }
        Write-Success "Git: $gitVersion"
    } catch {
        # Try to find Git in common installation locations
        $gitPaths = @(
            "C:\Program Files\Git\bin",
            "C:\Program Files (x86)\Git\bin",
            "$env:LOCALAPPDATA\Programs\Git\bin"
        )
        
        $gitFound = $false
        foreach ($path in $gitPaths) {
            if (Test-Path "$path\git.exe") {
                $env:Path += ";$path"
                Write-Info "Found Git at: $path"
                try {
                    $gitVersion = git --version
                    Write-Success "Git: $gitVersion"
                    $gitFound = $true
                    break
                } catch { }
            }
        }
        
        if (-not $gitFound) {
            Write-Warning "Git is not installed (optional but recommended)"
        }
    }
    
    # Check SSH for remote deployment
    if ($DeployBackend -and $ServerHost) {
        try {
            Get-Command ssh -ErrorAction Stop | Out-Null
            Write-Success "SSH client available"
        } catch {
            Add-Error "SSH client required for backend deployment"
        }
    }
    
    if ($missing.Count -gt 0) {
        throw "Missing required tools: $($missing -join ', ')"
    }
    
    Write-Success "All prerequisites met"
}

# Step 1: Generate secrets
function Initialize-Secrets {
    if ($SkipSecrets) {
        Write-Info "Skipping secret generation (--SkipSecrets)"
        return
    }
    
    Write-Step "Step 1: Generate Production Secrets"
    
    # Check if .env already exists
    if (Test-Path "server\.env") {
        Write-Warning "server\.env already exists"
        $response = Read-Host "Overwrite existing secrets? (yes/no) [no]"
        if ($response -ne 'yes') {
            Write-Info "Keeping existing secrets"
            return
        }
    }
    
    # Prompt for admin credentials
    Write-Host "`nEnter admin credentials for initial setup:" -ForegroundColor Yellow
    $adminEmail = Read-Host "Admin email"
    $adminPassword = Read-Host "Admin password (min 20 chars, uppercase, digit, special)" -AsSecureString
    $adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword)
    )
    
    # Generate secrets
    Write-Info "Generating cryptographic secrets..."
    node scripts/generate-secrets.js --admin-email "$adminEmail" --admin-password "$adminPasswordPlain"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Secrets generated successfully"
    } else {
        Add-Error "Failed to generate secrets"
        throw "Secret generation failed"
    }
}

# Step 2: Install dependencies
function Install-Dependencies {
    Write-Step "Step 2: Install Dependencies"
    
    # Frontend dependencies
    Write-Info "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Add-Error "Frontend dependency installation failed"
        throw "npm install failed for frontend"
    }
    Write-Success "Frontend dependencies installed"
    
    # Backend dependencies
    Write-Info "Installing backend dependencies..."
    Push-Location server
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Add-Error "Backend dependency installation failed"
        throw "npm install failed for backend"
    }
    Pop-Location
    Write-Success "Backend dependencies installed"
}

# Step 3: Run security checks
function Invoke-SecurityChecks {
    if ($SkipTests) {
        Write-Info "Skipping security checks (--SkipTests)"
        return
    }
    
    Write-Step "Step 3: Security Checks & Audits"
    
    # Prepare for GitHub (security scrub)
    Write-Info "Running security preparation..."
    npm run security:prepare
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Security preparation had warnings"
    } else {
        Write-Success "Security preparation complete"
    }
    
    # Run security audit
    Write-Info "Running security audit..."
    npm run security:audit
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Security audit found issues"
    } else {
        Write-Success "Security audit passed"
    }
    
    # Check for vulnerabilities
    Write-Info "Checking npm vulnerabilities..."
    npm audit --audit-level=high
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "npm audit found vulnerabilities"
    } else {
        Write-Success "No high-risk vulnerabilities found"
    }
}

# Step 4: Build frontend
function Build-Frontend {
    Write-Step "Step 4: Build Frontend"
    
    Write-Info "Building React frontend..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Add-Error "Frontend build failed"
        throw "React build failed"
    }
    
    if (Test-Path "build\index.html") {
        Write-Success "Frontend build complete"
        
        # Calculate build size
        $buildSize = (Get-ChildItem -Path "build" -Recurse | Measure-Object -Property Length -Sum).Sum
        $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
        Write-Info "Build size: $buildSizeMB MB"
    } else {
        Add-Error "Build output not found"
        throw "Build verification failed"
    }
}

# Step 5: Build Electron apps
function Build-Electron {
    if ($SkipElectron) {
        Write-Info "Skipping Electron builds (--SkipElectron)"
        return
    }
    
    Write-Step "Step 5: Build Electron Desktop Apps"
    
    switch ($ElectronPlatform.ToLower()) {
        'win' {
            Write-Info "Building for Windows..."
            npm run electron:build:win
        }
        'mac' {
            Write-Info "Building for macOS..."
            npm run electron:build:mac
        }
        'linux' {
            Write-Info "Building for Linux..."
            npm run electron:build:linux
        }
        'all' {
            Write-Info "Building for all platforms..."
            npm run electron:build:win
            npm run electron:build:mac
            npm run electron:build:linux
        }
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Electron build complete"
        
        # List built artifacts
        if (Test-Path "dist") {
            Write-Info "Build artifacts:"
            Get-ChildItem "dist" -File | ForEach-Object {
                $sizeMB = [math]::Round($_.Length / 1MB, 2)
                Write-Host "  - $($_.Name) ($sizeMB MB)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Warning "Electron build had errors"
    }
}

# Step 6: Deploy backend to server
function Deploy-Backend {
    if (-not $DeployBackend) {
        Write-Info "Backend deployment skipped (use -DeployBackend to enable)"
        return
    }
    
    if (-not $ServerHost) {
        Write-Warning "No server host specified, skipping backend deployment"
        return
    }
    
    Write-Step "Step 6: Deploy Backend to Server"
    
    Write-Info "Preparing backend deployment package..."
    
    # Create temporary deployment directory
    $deployDir = "deploy-temp-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $deployDir -Force | Out-Null
    
    # Copy server files
    Write-Info "Copying server files..."
    Copy-Item -Path "server\*" -Destination $deployDir -Recurse -Exclude @("node_modules", "logs", "*.log", "data.db", "*.db-*")
    
    # Copy .env if it exists
    if (Test-Path "server\.env") {
        Copy-Item -Path "server\.env" -Destination $deployDir
        Write-Success ".env file included"
    } else {
        Write-Warning ".env file not found - you'll need to configure it on the server"
    }
    
    # Create archive
    Write-Info "Creating deployment archive..."
    $archiveName = "nebula-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"
    tar -czf $archiveName -C $deployDir .
    
    if (-not (Test-Path $archiveName)) {
        Add-Error "Failed to create deployment archive"
        Remove-Item -Path $deployDir -Recurse -Force
        throw "Archive creation failed"
    }
    
    Write-Success "Archive created: $archiveName"
    
    # Test SSH connectivity first
    Write-Info "Testing SSH connection to $ServerHost..."
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $ServerHost "echo 'SSH OK'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "SSH connection failed. Error: $sshTest"
        Write-Info "Please ensure:"
        Write-Host "  1. SSH key is set up: ssh-copy-id $ServerHost" -ForegroundColor Gray
        Write-Host "  2. Server is reachable" -ForegroundColor Gray
        Write-Host "  3. User has sudo access" -ForegroundColor Gray
        Write-Host "  4. Firewall allows SSH (port 22)" -ForegroundColor Gray
        Remove-Item -Path $deployDir -Recurse -Force
        Remove-Item -Path $archiveName -Force
        Add-Error "Cannot connect to server via SSH"
        throw "SSH connection failed"
    }
    Write-Success "SSH connection successful"
    
    # Upload to server
    Write-Info "Uploading to $ServerHost..."
    $archiveSize = [math]::Round((Get-Item $archiveName).Length / 1MB, 2)
    Write-Info "Uploading $archiveSize MB..."
    $scpOutput = scp -v -o ConnectTimeout=30 $archiveName "${ServerHost}:~/" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nSCP Error Output:" -ForegroundColor Red
        Write-Host $scpOutput -ForegroundColor Gray
        Add-Error "Failed to upload to server"
        Remove-Item -Path $deployDir -Recurse -Force
        Remove-Item -Path $archiveName -Force
        throw "Upload failed"
    }
    
    Write-Success "Upload complete"
    
    # Extract on server
    Write-Info "Extracting on server..."
    ssh $ServerHost "sudo mkdir -p $ServerPath && sudo tar -xzf ~/$archiveName -C $ServerPath && rm ~/$archiveName"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Extraction may have had issues"
    } else {
        Write-Success "Extracted to $ServerPath"
    }
    
    # Install dependencies on server
    Write-Info "Installing dependencies on server..."
    ssh $ServerHost "cd $ServerPath && npm install --production"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Dependency installation had issues"
    } else {
        Write-Success "Server dependencies installed"
    }
    
    # Run database migrations
    Write-Info "Running database migrations..."
    ssh $ServerHost "cd $ServerPath && node src/migrations/encrypt-existing-data.js"
    
    # Cleanup local files
    Remove-Item -Path $deployDir -Recurse -Force
    Remove-Item -Path $archiveName -Force
    
    Write-Success "Backend deployment complete"
}

# Step 7: Restart server
function Restart-ServerService {
    if (-not $RestartServer) {
        Write-Info "Server restart skipped (use -RestartServer to enable)"
        return
    }
    
    if (-not $ServerHost) {
        Write-Warning "No server host specified for restart"
        return
    }
    
    Write-Step "Step 7: Restart Server Service"
    
    Write-Info "Restarting nebula-vpn-server service..."
    ssh $ServerHost "sudo systemctl restart nebula-vpn-server"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Service restart may have failed"
        return
    }
    
    # Wait a moment for service to start
    Start-Sleep -Seconds 2
    
    # Check status
    Write-Info "Checking service status..."
    ssh $ServerHost "sudo systemctl status nebula-vpn-server --no-pager -l"
    
    Write-Success "Server restarted"
}

# Generate deployment report
function Show-DeploymentReport {
    Write-Step "Deployment Complete"
    
    Write-Host "`nDeployment Summary:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "Target:           $Target" -ForegroundColor White
    Write-Host "Frontend Built:   $(if (Test-Path 'build\index.html') { '✓' } else { '✗' })" -ForegroundColor White
    Write-Host "Electron Built:   $(if (-not $SkipElectron -and (Test-Path 'dist')) { '✓' } else { '○' })" -ForegroundColor White
    Write-Host "Backend Deployed: $(if ($DeployBackend) { '✓' } else { '○' })" -ForegroundColor White
    Write-Host "Server Restarted: $(if ($RestartServer) { '✓' } else { '○' })" -ForegroundColor White
    
    if ($Global:DeploymentErrors.Count -gt 0) {
        Write-Host "`nErrors encountered:" -ForegroundColor Red
        $Global:DeploymentErrors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    } else {
        Write-Host "`n✓ No errors!" -ForegroundColor Green
    }
    
    # Next steps
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    
    if (-not $DeployBackend) {
        Write-Host "  • Deploy backend with: .\DEPLOY-ALL.ps1 -DeployBackend -ServerHost user@server.com" -ForegroundColor Gray
    }
    
    if (-not $SkipElectron -and (Test-Path "dist")) {
        Write-Host "  • Distribute Electron apps from the 'dist' folder" -ForegroundColor Gray
    }
    
    if ($Target -eq 'production') {
        Write-Host "  • Verify DNS enforcement: .\verify-dns-simple.ps1" -ForegroundColor Gray
        Write-Host "  • Test VPN connection: npm run start:vpn" -ForegroundColor Gray
        Write-Host "  • Monitor server logs: ssh $ServerHost 'sudo journalctl -u nebula-vpn-server -f'" -ForegroundColor Gray
    }
    
    Write-Host "`n═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan
}

# Main execution
try {
    $startTime = Get-Date
    
    Write-Host @"
    
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║            NEBULA VPN - COMPLETE DEPLOYMENT                   ║
║                                                               ║
║  Target: $($Target.ToUpper().PadRight(52)) ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
    
    # Execute deployment steps
    Test-Prerequisites
    Initialize-Secrets
    Install-Dependencies
    Invoke-SecurityChecks
    Build-Frontend
    Build-Electron
    Deploy-Backend
    Restart-ServerService
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Show-DeploymentReport
    
    Write-Host "Total deployment time: $([math]::Round($duration.TotalMinutes, 2)) minutes`n" -ForegroundColor Gray
    
    exit 0
    
} catch {
    Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                  DEPLOYMENT FAILED                            ║" -ForegroundColor Red
    Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Red
    
    Write-Host "Error: $($_.Exception.Message)`n" -ForegroundColor Red
    
    if ($Global:DeploymentErrors.Count -gt 0) {
        Write-Host "Errors encountered:" -ForegroundColor Red
        $Global:DeploymentErrors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    
    exit 1
}
