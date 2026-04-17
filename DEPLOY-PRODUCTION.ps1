#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick Production Backend Deployment to Digital Ocean
.DESCRIPTION
    Deploys Nebula VPN backend to production droplet with minimal fuss
.EXAMPLE
    .\DEPLOY-PRODUCTION.ps1
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$DropletIP = '165.227.32.85',
    
    [Parameter(Mandatory=$false)]
    [string]$DropletUser = 'root',
    
    [Parameter(Mandatory=$false)]
    [switch]$UseProductionEnv
)

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  NEBULA VPN - PRODUCTION BACKEND DEPLOYMENT" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Validate SSH access
Write-Host "[1/7] Testing SSH connection to $DropletIP..." -ForegroundColor Yellow
$sshHost = "$DropletUser@$DropletIP"
$sshTest = ssh -o ConnectTimeout=5 $sshHost 'echo ok' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ SSH connection failed!" -ForegroundColor Red
    Write-Host "  Make sure you can run: ssh $sshHost" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ SSH connection successful" -ForegroundColor Green

# Check if production .env exists
if ($UseProductionEnv -and -not (Test-Path "server\.env.production")) {
    Write-Host "  ✗ server\.env.production not found!" -ForegroundColor Red
    Write-Host "  Run without -UseProductionEnv to use existing .env" -ForegroundColor Yellow
    exit 1
}

# Create deployment package
Write-Host ""
Write-Host "[2/7] Creating deployment package..." -ForegroundColor Yellow
Push-Location server

# Copy the right .env file
if ($UseProductionEnv) {
    Write-Host "  Using .env.production for deployment" -ForegroundColor Cyan
    Copy-Item .env.production .env.deploy -Force
} else {
    Write-Host "  Using existing .env for deployment" -ForegroundColor Cyan
    Copy-Item .env .env.deploy -Force
}

# Create tarball (faster than zip over network)
$tarFile = "..\nebula-backend.tar.gz"
if (Test-Path $tarFile) { Remove-Item $tarFile -Force }

Write-Host "  Packaging server files..." -ForegroundColor Cyan
tar -czf $tarFile --exclude=node_modules --exclude=logs --exclude=*.db --exclude=*.db-shm --exclude=*.db-wal .

Remove-Item .env.deploy -Force
Pop-Location

if (-not (Test-Path $tarFile)) {
    Write-Host "  ✗ Failed to create package!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Package created: $(Get-Item $tarFile | Select-Object -ExpandProperty Length | ForEach-Object { "{0:N2} MB" -f ($_ / 1MB) })" -ForegroundColor Green

# Upload to droplet
Write-Host ""
Write-Host "[3/7] Uploading to droplet..." -ForegroundColor Yellow
scp -C $tarFile "${sshHost}:/tmp/nebula-backend.tar.gz"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Upload complete" -ForegroundColor Green

# Stop existing service
Write-Host ""
Write-Host "[4/7] Stopping existing service..." -ForegroundColor Yellow
$stopScript = @"
systemctl stop nebula-vpn-server 2>/dev/null || true
pkill -f 'node.*index.js' 2>/dev/null || true
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo 'Stopped'
"@

ssh $sshHost $stopScript | Out-Null
Write-Host "  ✓ Service stopped" -ForegroundColor Green

# Extract and install
Write-Host ""
Write-Host "[5/7] Installing on droplet..." -ForegroundColor Yellow
$installScript = @"
cd /opt
rm -rf nebula-vpn-server.backup 2>/dev/null || true
if [ -d nebula-vpn-server ]; then
    mv nebula-vpn-server nebula-vpn-server.backup
fi
mkdir -p nebula-vpn-server
cd nebula-vpn-server
tar -xzf /tmp/nebula-backend.tar.gz
echo 'Extracted'
"@

ssh $sshHost $installScript | Out-Null
Write-Host "  ✓ Files extracted to /opt/nebula-vpn-server" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "[6/7] Installing dependencies (this may take a minute)..." -ForegroundColor Yellow
ssh $sshHost 'cd /opt/nebula-vpn-server && npm install --production --quiet'
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# Create/update systemd service
Write-Host ""
Write-Host "[7/7] Starting service..." -ForegroundColor Yellow
$serviceConfig = @'
[Unit]
Description=Nebula VPN API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nebula-vpn-server
EnvironmentFile=/opt/nebula-vpn-server/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
'@

# Upload service file
$serviceConfig | ssh $sshHost 'cat > /etc/systemd/system/nebula-vpn-server.service'

# Start service
$startScript = @"
systemctl daemon-reload
systemctl enable nebula-vpn-server
systemctl start nebula-vpn-server
sleep 2
systemctl is-active nebula-vpn-server
"@

$status = (ssh $sshHost $startScript).Trim()
if ($status -eq 'active') {
    Write-Host "  ✓ Service started successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Service failed to start!" -ForegroundColor Red
    Write-Host "  Check logs: ssh $sshHost 'journalctl -u nebula-vpn-server -n 50'" -ForegroundColor Yellow
    exit 1
}

# Test health endpoint
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Yellow

Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://${DropletIP}:3001/health" -UseBasicParsing -TimeoutSec 10
    $health = $response.Content | ConvertFrom-Json
    
    Write-Host "  ✓ API is responding!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Status: $($health.status)" -ForegroundColor Cyan
    Write-Host "  Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Cyan
} catch {
    Write-Host "  ⚠ Health check failed (server may still be starting)" -ForegroundColor Yellow
    Write-Host "  Try: Invoke-WebRequest http://${DropletIP}:3001/health" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:     ssh $sshHost 'journalctl -u nebula-vpn-server -f'" -ForegroundColor White
Write-Host "  Check status:  ssh $sshHost 'systemctl status nebula-vpn-server'" -ForegroundColor White
Write-Host "  Restart:       ssh $sshHost 'systemctl restart nebula-vpn-server'" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoint: http://${DropletIP}:3001" -ForegroundColor Green
Write-Host ""

# Cleanup
Remove-Item $tarFile -Force -ErrorAction SilentlyContinue
