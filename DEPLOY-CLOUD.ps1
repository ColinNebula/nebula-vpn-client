#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Nebula VPN Cloud Deployment - GitHub Pages + DigitalOcean
.DESCRIPTION
    Comprehensive deployment script targeting:
    - Frontend: GitHub Pages (web app)
    - Backend: DigitalOcean Droplet (API server)
    - Electron: Local builds for distribution
.PARAMETER DeployFrontend
    Deploy frontend to GitHub Pages
.PARAMETER DeployBackend
    Deploy backend to DigitalOcean
.PARAMETER DropletIP
    DigitalOcean droplet IP address
.PARAMETER DropletUser
    SSH user for DigitalOcean (default: root)
.PARAMETER ServerPath
    Remote path on droplet (default: /opt/nebula-vpn-server)
.PARAMETER GitHubRepo
    GitHub repository URL (auto-detected if in git repo)
.PARAMETER GitHubBranch
    Branch to deploy from (default: gh-pages)
.PARAMETER SkipTests
    Skip security audits and tests
.PARAMETER SkipElectron
    Skip Electron desktop builds
.PARAMETER ElectronPlatform
    Electron build platform: win, mac, linux, or all
.PARAMETER ConfigureDroplet
    Run initial DigitalOcean droplet configuration
.PARAMETER InstallWireGuard
    Install and configure WireGuard on droplet
.PARAMETER SetupSSL
    Setup Let's Encrypt SSL on droplet
.PARAMETER DomainName
    Domain name for SSL certificate
.PARAMETER UpdateHomepage
    Update package.json homepage for GitHub Pages
.EXAMPLE
    .\DEPLOY-CLOUD.ps1 -DeployFrontend -DeployBackend -DropletIP 159.89.123.45
.EXAMPLE
    .\DEPLOY-CLOUD.ps1 -ConfigureDroplet -DropletIP 159.89.123.45 -InstallWireGuard
.EXAMPLE
    .\DEPLOY-CLOUD.ps1 -DeployFrontend -UpdateHomepage -GitHubRepo "https://github.com/user/repo"
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$DeployFrontend,
    
    [Parameter(Mandatory=$false)]
    [switch]$DeployBackend,
    
    [Parameter(Mandatory=$false)]
    [string]$DropletIP = '',
    
    [Parameter(Mandatory=$false)]
    [string]$DropletUser = 'root',
    
    [Parameter(Mandatory=$false)]
    [string]$ServerPath = '/opt/nebula-vpn-server',
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubRepo = '',
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubBranch = 'gh-pages',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipElectron,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('win', 'mac', 'linux', 'all')]
    [string]$ElectronPlatform = 'win',
    
    [Parameter(Mandatory=$false)]
    [switch]$ConfigureDroplet,
    
    [Parameter(Mandatory=$false)]
    [switch]$InstallWireGuard,
    
    [Parameter(Mandatory=$false)]
    [switch]$SetupSSL,
    
    [Parameter(Mandatory=$false)]
    [string]$DomainName = '',
    
    [Parameter(Mandatory=$false)]
    [switch]$UpdateHomepage
)

# Color output functions
function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success { param([string]$Message) Write-Host "SUCCESS: $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "WARNING: $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "ERROR: $Message" -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host "INFO: $Message" -ForegroundColor Blue }

# Global variables
$ErrorActionPreference = "Stop"
$Global:DeploymentErrors = @()
$Global:DeploymentSuccess = @()

# Validate parameter combinations
if ($DeployBackend -and [string]::IsNullOrWhiteSpace($DropletIP)) {
    Write-Host "`nERROR: -DropletIP is required when using -DeployBackend`n" -ForegroundColor Red
    Write-Host "Usage: .\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP <IP-ADDRESS>`n" -ForegroundColor Yellow
    Write-Host "Example: .\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP 165.227.32.85`n" -ForegroundColor Gray
    exit 1
}

if ($ConfigureDroplet -and [string]::IsNullOrWhiteSpace($DropletIP)) {
    Write-Host "`nERROR: -DropletIP is required when using -ConfigureDroplet`n" -ForegroundColor Red
    Write-Host "Usage: .\DEPLOY-CLOUD.ps1 -ConfigureDroplet -DropletIP <IP-ADDRESS>`n" -ForegroundColor Yellow
    exit 1
}

function Add-Error {
    param([string]$Message)
    $Global:DeploymentErrors += $Message
    Write-Error $Message
}

function Add-Success {
    param([string]$Message)
    $Global:DeploymentSuccess += $Message
    Write-Success $Message
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
    
    # Check Git
    try {
        $gitVersion = git --version 2>&1
        if ($LASTEXITCODE -ne 0) { throw }
        Write-Success "Git: $gitVersion"
        
        # Check if in git repository
        $isGitRepo = git rev-parse --git-dir 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Git repository detected"
        } else {
            Write-Warning "Not in a git repository (required for GitHub Pages)"
        }
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
            if ($DeployFrontend) {
                $missing += "Git (required for GitHub Pages)"
                Add-Error "Git is not installed. Download from https://git-scm.com"
            } else {
                Write-Warning "Git not installed (not needed for backend-only deployment)"
            }
        }
    }
    
    # Check SSH for DigitalOcean
    if ($DeployBackend -or $ConfigureDroplet) {
        try {
            Get-Command ssh -ErrorAction Stop | Out-Null
            Write-Success "SSH client available"
        } catch {
            $missing += "SSH client"
            Add-Error "SSH client required for DigitalOcean deployment"
        }
        
        if ([string]::IsNullOrWhiteSpace($DropletIP)) {
            Add-Error "DropletIP is required for backend deployment"
        } else {
            Write-Success "Target droplet: $DropletIP"
        }
    }
    
    # Check gh-pages package
    if ($DeployFrontend) {
        $hasGhPages = (Get-Content package.json | ConvertFrom-Json).devDependencies.'gh-pages'
        if ($hasGhPages) {
            Write-Success "gh-pages package found"
        } else {
            Write-Warning "gh-pages not found, installing..."
            npm install --save-dev gh-pages
        }
    }
    
    if ($missing.Count -gt 0) {
        throw "Missing required tools: $($missing -join ', ')"
    }
    
    Add-Success "All prerequisites met"
}

# Auto-detect GitHub repository
function Get-GitHubRepoInfo {
    if (-not [string]::IsNullOrWhiteSpace($GitHubRepo)) {
        return $GitHubRepo
    }
    
    try {
        $remoteUrl = git config --get remote.origin.url
        if ($remoteUrl) {
            Write-Info "Auto-detected repository: $remoteUrl"
            return $remoteUrl
        }
    } catch {
        Write-Warning "Could not auto-detect GitHub repository"
    }
    
    return ''
}

# Update homepage in package.json for GitHub Pages
function Update-GitHubHomepage {
    if (-not $UpdateHomepage) {
        return
    }
    
    Write-Step "Update GitHub Pages Homepage"
    
    $repo = Get-GitHubRepoInfo
    if ([string]::IsNullOrWhiteSpace($repo)) {
        $repo = Read-Host "Enter your GitHub repository (e.g., username/repo-name)"
    }
    
    # Extract repo name
    $repoName = ''
    if ($repo -match '([^/]+/[^/]+?)(\.git)?$') {
        $repoName = $matches[1]
    } else {
        $repoName = $repo
    }
    
    $homepage = "https://$($repoName.Split('/')[0]).github.io/$($repoName.Split('/')[1])/"
    
    Write-Info "Setting homepage to: $homepage"
    
    # Read package.json
    $packageJson = Get-Content package.json -Raw | ConvertFrom-Json
    $packageJson.homepage = $homepage
    
    # Write back
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content package.json
    
    Add-Success "Homepage updated in package.json"
}

# Install dependencies
function Install-Dependencies {
    Write-Step "Installing Dependencies"
    
    Write-Info "Installing frontend dependencies..."
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Add-Error "Frontend dependency installation failed"
        throw "npm install failed"
    }
    Add-Success "Frontend dependencies installed"
    
    Write-Info "Installing backend dependencies..."
    Push-Location server
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Add-Error "Backend dependency installation failed"
        throw "npm install failed for backend"
    }
    Pop-Location
    Add-Success "Backend dependencies installed"
}

# Security checks
function Invoke-SecurityChecks {
    if ($SkipTests) {
        Write-Info "Skipping security checks"
        return
    }
    
    Write-Step "Security Checks"
    
    Write-Info "Running security preparation..."
    npm run security:prepare
    
    Write-Info "Running security audit..."
    npm run security:audit
    
    Write-Info "Checking vulnerabilities..."
    npm audit --audit-level=moderate
    
    Add-Success "Security checks complete"
}

# Build frontend
function Build-Frontend {
    Write-Step "Building Frontend"
    
    Write-Info "Building React production bundle..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Add-Error "Frontend build failed"
        throw "React build failed"
    }
    
    if (Test-Path "build\index.html") {
        $buildSize = (Get-ChildItem -Path "build" -Recurse | Measure-Object -Property Length -Sum).Sum
        $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
        Add-Success "Frontend build complete - $buildSizeMB MB"
    } else {
        Add-Error "Build output not found"
        throw "Build verification failed"
    }
}

# Deploy to GitHub Pages
function Deploy-ToGitHub {
    if (-not $DeployFrontend) {
        Write-Info "Skipping GitHub Pages deployment"
        return
    }
    
    Write-Step "Deploy to GitHub Pages"
    
    # Verify build exists
    if (-not (Test-Path "build\index.html")) {
        Add-Error "Build not found. Run with frontend build first."
        throw "No build to deploy"
    }
    
    # Check Git status
    Write-Info "Checking Git status..."
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "Uncommitted changes detected:"
        git status --short
        $proceed = Read-Host "Continue with deployment? (yes/no) [no]"
        if ($proceed -ne 'yes') {
            Write-Warning "Deployment cancelled"
            return
        }
    }
    
    # Deploy using gh-pages
    Write-Info "Deploying to GitHub Pages..."
    npm run deploy
    
    if ($LASTEXITCODE -eq 0) {
        $repo = Get-GitHubRepoInfo
        if ($repo -match '([^/]+/[^/]+?)(\.git)?$') {
            $repoName = $matches[1]
            $url = "https://$($repoName.Split('/')[0]).github.io/$($repoName.Split('/')[1])/"
            Add-Success "Deployed to GitHub Pages: $url"
            Write-Host "`n  Frontend URL: $url`n" -ForegroundColor Magenta
        } else {
            Add-Success "Deployed to GitHub Pages"
        }
    } else {
        Add-Error "GitHub Pages deployment failed"
    }
}

# Build Electron applications
function Build-Electron {
    if ($SkipElectron) {
        Write-Info "Skipping Electron builds"
        return
    }
    
    Write-Step "Building Electron Apps"
    
    switch ($ElectronPlatform) {
        'win' { npm run electron:build:win }
        'mac' { npm run electron:build:mac }
        'linux' { npm run electron:build:linux }
        'all' {
            npm run electron:build:win
            npm run electron:build:mac
            npm run electron:build:linux
        }
    }
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path "dist")) {
        Write-Info "Build artifacts:"
        Get-ChildItem "dist" -File | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  - $($_.Name) - $sizeMB MB" -ForegroundColor Gray
        }
        Add-Success "Electron builds complete"
    } else {
        Write-Warning "Electron build had issues"
    }
}

# Configure DigitalOcean droplet
function Initialize-DigitalOceanDroplet {
    if (-not $ConfigureDroplet) {
        return
    }
    
    Write-Step "Configure DigitalOcean Droplet"
    
    $sshHost = "$DropletUser@$DropletIP"
    
    Write-Info "Connecting to $sshHost..."
    
    # Test connection
    ssh -o ConnectTimeout=10 $sshHost "echo 'Connection successful'" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Add-Error "Cannot connect to droplet. Check IP and SSH key."
        throw "SSH connection failed"
    }
    
    Write-Info "Updating system packages..."
    ssh $sshHost "apt update && apt upgrade -y"
    
    Write-Info "Installing Node.js..."
    ssh $sshHost @"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version
npm --version
"@
    
    Write-Info "Installing required system packages..."
    ssh $sshHost "apt install -y git curl tar gzip ufw fail2ban"
    
    Write-Info "Configuring firewall..."
    ssh $sshHost @"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
ufw allow 51820/udp
ufw status
"@
    
    Write-Info "Creating deployment user..."
    ssh $sshHost @"
useradd -r -s /bin/bash -m nebula || true
usermod -aG sudo nebula || true
mkdir -p /opt/nebula-vpn-server
chown -R nebula:nebula /opt/nebula-vpn-server
"@
    
    Add-Success "Droplet initial configuration complete"
}

# Install WireGuard on droplet
function Install-WireGuardOnDroplet {
    if (-not $InstallWireGuard) {
        return
    }
    
    Write-Step "Install WireGuard on Droplet"
    
    $sshHost = "$DropletUser@$DropletIP"
    
    Write-Info "Installing WireGuard..."
    ssh $sshHost @"
apt install -y wireguard wireguard-tools
"@
    
    Write-Info "Generating WireGuard server keys..."
    ssh $sshHost @"
mkdir -p /etc/wireguard
cd /etc/wireguard
wg genkey | tee server_private.key | wg pubkey > server_public.key
chmod 600 server_private.key
echo 'Server keys generated:'
echo 'Private key: (stored in /etc/wireguard/server_private.key)'
echo 'Public key:' \$(cat server_public.key)
"@
    
    Write-Info "Creating WireGuard configuration..."
    ssh $sshHost @"
cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = \$(cat /etc/wireguard/server_private.key)
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
EOF

chmod 600 /etc/wireguard/wg0.conf
"@
    
    Write-Info "Enabling IP forwarding..."
    ssh $sshHost @"
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
echo 'net.ipv6.conf.all.forwarding=1' >> /etc/sysctl.conf
sysctl -p
"@
    
    Write-Info "Starting WireGuard..."
    ssh $sshHost @"
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0
systemctl status wg-quick@wg0 --no-pager
"@
    
    # Get public key for configuration
    $publicKey = ssh $sshHost "cat /etc/wireguard/server_public.key"
    
    Write-Host "`n================================================================" -ForegroundColor Green
    Write-Host "  WireGuard Configuration" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "`nAdd these to your server/.env file:" -ForegroundColor Yellow
    Write-Host "WG_SERVER_PUBLIC_KEY=$publicKey" -ForegroundColor Cyan
    Write-Host "WG_SERVER_ENDPOINT=$DropletIP:51820" -ForegroundColor Cyan
    Write-Host "WG_INTERFACE=wg0" -ForegroundColor Cyan
    Write-Host "WG_DNS=1.1.1.1,1.0.0.1" -ForegroundColor Cyan
    Write-Host "WG_SUBNET=10.8.0.0/24`n" -ForegroundColor Cyan
    
    Add-Success "WireGuard installed and configured"
}

# Setup SSL with Let's Encrypt
function Setup-SSLCertificate {
    if (-not $SetupSSL) {
        return
    }
    
    if ([string]::IsNullOrWhiteSpace($DomainName)) {
        Write-Warning "Domain name required for SSL setup. Skipping..."
        return
    }
    
    Write-Step "Setup Let's Encrypt SSL"
    
    $sshHost = "$DropletUser@$DropletIP"
    
    Write-Info "Installing Certbot..."
    ssh $sshHost "apt install -y certbot python3-certbot-nginx"
    
    Write-Info "Obtaining SSL certificate for $DomainName..."
    $email = Read-Host "Enter email for Let's Encrypt notifications"
    
    ssh $sshHost @"
certbot certonly --standalone -d $DomainName --non-interactive --agree-tos --email $email
"@
    
    if ($LASTEXITCODE -eq 0) {
        Add-Success "SSL certificate obtained for $DomainName"
        Write-Info "Certificate: /etc/letsencrypt/live/$DomainName/fullchain.pem"
        Write-Info "Private key: /etc/letsencrypt/live/$DomainName/privkey.pem"
    } else {
        Write-Warning "SSL certificate setup failed"
    }
}

# Deploy backend to DigitalOcean
function Deploy-ToDigitalOcean {
    if (-not $DeployBackend) {
        Write-Info "Skipping DigitalOcean backend deployment"
        return
    }
    
    Write-Step "Deploy Backend to DigitalOcean"
    
    $sshHost = "$DropletUser@$DropletIP"
    
    # Test SSH connectivity first
    Write-Info "Testing SSH connection to $sshHost..."
    $sshTest = ssh -o ConnectTimeout=10 $sshHost "echo 'SSH OK'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "SSH connection failed. Error: $sshTest"
        Write-Info "Please ensure:"
        Write-Host "  1. SSH key is set up: ssh-copy-id $sshHost" -ForegroundColor Gray
        Write-Host "  2. Droplet IP is correct: $DropletIP" -ForegroundColor Gray
        Write-Host "  3. User has sudo access: $DropletUser" -ForegroundColor Gray
        Write-Host "  4. Firewall allows SSH (port 22)" -ForegroundColor Gray
        Add-Error "Cannot connect to droplet via SSH"
        throw "SSH connection failed"
    }
    Write-Success "SSH connection successful"
    
    # Create deployment package
    Write-Info "Creating deployment package..."
    $deployDir = "deploy-temp-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $deployDir -Force | Out-Null
    
    Copy-Item -Path "server\*" -Destination $deployDir -Recurse -Exclude @("node_modules", "logs", "*.log", "data.db", "*.db-*")
    
    if (Test-Path "server\.env") {
        Copy-Item -Path "server\.env" -Destination $deployDir
        Write-Success ".env included"
    } else {
        Write-Warning ".env not found - will need manual configuration"
    }
    
    # Create archive
    $archiveName = "nebula-backend.tar.gz"
    Write-Info "Creating archive: $archiveName"
    tar -czf $archiveName -C $deployDir .
    
    if (-not (Test-Path $archiveName)) {
        Remove-Item -Path $deployDir -Recurse -Force
        Add-Error "Failed to create deployment archive"
        throw "Archive creation failed"
    }
    
    $archiveSize = [math]::Round((Get-Item $archiveName).Length / 1MB, 2)
    Write-Success "Archive created - $archiveSize MB"
    
    # Upload to droplet
    Write-Info "Uploading to $sshHost..."
    scp -o ConnectTimeout=30 $archiveName "${sshHost}:~/"
    
    if ($LASTEXITCODE -ne 0) {
        Remove-Item -Path $deployDir -Recurse -Force
        Remove-Item -Path $archiveName -Force
        Add-Error "SCP upload failed"
        throw "SCP upload failed"
    }
    
    Write-Success "Upload complete"
    
    # Extract and install
    Write-Info "Extracting on droplet..."
    
    # Stop existing service and kill any processes on port 3001
    Write-Info "Stopping existing backend services..."
    ssh $sshHost @'
systemctl stop nebula-vpn-server 2>/dev/null || true
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "node.*index.js" || true
fuser -k 3001/tcp 2>/dev/null || true
sleep 2
'@
    
    # Create extraction script with Unix line endings
    $extractScript = @"
mkdir -p $ServerPath
tar -xzf ~/$archiveName -C $ServerPath
rm ~/$archiveName
cd $ServerPath
npm install --production
"@ -replace "`r`n", "`n"  # Convert Windows CRLF to Unix LF
    
    # Execute extraction script
    $extractScript | ssh $sshHost 'bash -s'
    
    # Setup systemd service
    Write-Info "Configuring systemd service..."
    
    # Create service file content with Unix line endings (simplified, no security restrictions)
    $serviceFileContent = "[Unit]
Description=Nebula VPN API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$ServerPath
EnvironmentFile=$ServerPath/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target" -replace "`r`n", "`n"  # Convert Windows CRLF to Unix LF
    
    # Write service file and reload systemd
    # Using echo instead of heredoc to avoid escaping issues
    $serviceFileContent | ssh $sshHost 'cat > /etc/systemd/system/nebula-vpn-server.service'
    ssh $sshHost 'systemctl daemon-reload'
    ssh $sshHost 'systemctl enable nebula-vpn-server'
    ssh $sshHost 'systemctl restart nebula-vpn-server'
    $serviceStatusOutput = ssh $sshHost 'systemctl status nebula-vpn-server --no-pager'
    
    Write-Info "Service status:"
    Write-Host $serviceStatusOutput -ForegroundColor Gray
    
    # Cleanup
    Remove-Item -Path $deployDir -Recurse -Force
    Remove-Item -Path $archiveName -Force
    
    # Get server status (trim output to remove whitespace/newlines)
    $serviceStatus = (ssh $sshHost "systemctl is-active nebula-vpn-server").Trim()
    
    if ($serviceStatus -eq 'active') {
        Add-Success "Backend deployed and running on DigitalOcean"
        Write-Host "`n  Backend API: http://$DropletIP:3001`n" -ForegroundColor Magenta
        Write-Host "  Test: curl http://$DropletIP:3001/health`n" -ForegroundColor Gray
    } else {
        Write-Warning "Backend deployed but service status: $serviceStatus"
    }
}

# Show deployment summary
function Show-DeploymentSummary {
    Write-Step "Deployment Summary"
    
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor Cyan
    Write-Host "================================================================`n" -ForegroundColor Cyan
    
    if ($Global:DeploymentSuccess.Count -gt 0) {
        Write-Host "SUCCESSFUL OPERATIONS:" -ForegroundColor Green
        $Global:DeploymentSuccess | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    }
    
    if ($Global:DeploymentErrors.Count -gt 0) {
        Write-Host "`nERRORS ENCOUNTERED:" -ForegroundColor Red
        $Global:DeploymentErrors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    
    # URLs
    Write-Host "`nYOUR DEPLOYMENT:" -ForegroundColor Magenta
    
    if ($DeployFrontend) {
        $repo = Get-GitHubRepoInfo
        if ($repo -match '([^/]+/[^/]+?)(\.git)?$') {
            $repoName = $matches[1]
            $url = "https://$($repoName.Split('/')[0]).github.io/$($repoName.Split('/')[1])/"
            Write-Host "  Frontend: $url" -ForegroundColor Cyan
        }
    }
    
    if ($DeployBackend -and $DropletIP) {
        Write-Host "  Backend:  http://$DropletIP:3001" -ForegroundColor Cyan
        if ($DomainName) {
            Write-Host "  Domain:   https://$DomainName" -ForegroundColor Cyan
        }
    }
    
    # Next steps
    Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
    
    if ($ConfigureDroplet -and -not $DeployBackend) {
        Write-Host "  - Deploy backend: .\DEPLOY-CLOUD.ps1 -DeployBackend -DropletIP $DropletIP" -ForegroundColor Gray
    }
    
    if ($InstallWireGuard -and (Test-Path "server\.env")) {
        Write-Host "  - Update server/.env with WireGuard configuration shown above" -ForegroundColor Gray
    }
    
    if ($DeployBackend) {
        Write-Host "  - Test API: curl http://$DropletIP:3001/health" -ForegroundColor Gray
        Write-Host "  - View logs: ssh $DropletUser@$DropletIP 'sudo journalctl -u nebula-vpn-server -f'" -ForegroundColor Gray
    }
    
    if ($DeployFrontend) {
        Write-Host "  - GitHub Pages may take 1-2 minutes to update" -ForegroundColor Gray
    }
    
    if (-not $SkipElectron -and (Test-Path "dist")) {
        Write-Host "  - Distribute Electron apps from dist/ folder" -ForegroundColor Gray
    }
    
    Write-Host "`n================================================================`n" -ForegroundColor Cyan
}

# Main execution
try {
    $startTime = Get-Date
    
    Write-Host @"

================================================================
                                                                
         NEBULA VPN - CLOUD DEPLOYMENT                         
         GitHub Pages + DigitalOcean                           
                                                                
================================================================

"@ -ForegroundColor Cyan
    
    # Execute deployment pipeline
    Test-Prerequisites
    
    if ($UpdateHomepage) {
        Update-GitHubHomepage
    }
    
    if ($ConfigureDroplet) {
        Initialize-DigitalOceanDroplet
    }
    
    if ($InstallWireGuard) {
        Install-WireGuardOnDroplet
    }
    
    if ($SetupSSL) {
        Setup-SSLCertificate
    }
    
    if ($DeployFrontend -or $DeployBackend -or -not $SkipElectron) {
        Install-Dependencies
        Invoke-SecurityChecks
        Build-Frontend
    }
    
    Deploy-ToGitHub
    Build-Electron
    Deploy-ToDigitalOcean
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Show-DeploymentSummary
    
    Write-Host "⏱  Total time: $([math]::Round($duration.TotalMinutes, 2)) minutes`n" -ForegroundColor Gray
    
    exit 0
    
} catch {
    Write-Host "`n================================================================" -ForegroundColor Red
    Write-Host "  X DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "================================================================`n" -ForegroundColor Red
    
    Write-Host "Error: $($_.Exception.Message)`n" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)`n" -ForegroundColor DarkGray
    
    exit 1
}
