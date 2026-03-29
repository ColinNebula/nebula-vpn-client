# Nebula VPN - Combined Launcher Script
# Starts API server + Electron app with admin privileges
# March 26, 2026

# ══════════════════════════════════════════════════════════════════════════════
# Configuration
# ══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$ServerPort = 3001
$MaxServerWaitSeconds = 30
$ProjectRoot = $PSScriptRoot

# ══════════════════════════════════════════════════════════════════════════════
# Helper Functions
# ══════════════════════════════════════════════════════════════════════════════

function Write-Step {
    param([string]$Message)
    Write-Host "[>] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Test-AdminPrivileges {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-ServerRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$ServerPort/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Wait-ForServer {
    param([int]$TimeoutSeconds = 30)
    
    Write-Step "Waiting for API server to start..."
    $elapsed = 0
    $checkInterval = 1
    
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-ServerRunning) {
            Write-Success "API server is ready on port $ServerPort"
            return $true
        }
        
        Start-Sleep -Seconds $checkInterval
        $elapsed += $checkInterval
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Error "Server failed to start within $TimeoutSeconds seconds"
    return $false
}

function Stop-ExistingServer {
    $connections = Get-NetTCPConnection -LocalPort $ServerPort -State Listen -ErrorAction SilentlyContinue
    
    if ($connections) {
        Write-Warning "Port $ServerPort is already in use"
        Write-Step "Attempting to stop existing server..."
        
        foreach ($conn in $connections) {
            try {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "   Stopping process: $($process.Name) (PID: $($process.Id))"
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                    Start-Sleep -Seconds 2
                }
            } catch {
                Write-Warning "Could not stop process: $_"
            }
        }
        
        # Verify port is now free
        Start-Sleep -Seconds 1
        $stillInUse = Get-NetTCPConnection -LocalPort $ServerPort -State Listen -ErrorAction SilentlyContinue
        if ($stillInUse) {
            Write-Error "Could not free port $ServerPort. Please close the application using it manually."
            return $false
        }
        
        Write-Success "Port $ServerPort is now available"
    }
    
    return $true
}

# ══════════════════════════════════════════════════════════════════════════════
# Main Script
# ══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "║                    Nebula VPN Launcher                         ║" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ──────────────────────────────────────────────────────────────────────────────
# Step 1: Check Admin Privileges
# ──────────────────────────────────────────────────────────────────────────────

Write-Step "Checking administrator privileges..."

if (-not (Test-AdminPrivileges)) {
    Write-Warning "Not running as Administrator"
    Write-Host ""
    Write-Host "Nebula VPN requires Administrator privileges for:" -ForegroundColor Yellow
    Write-Host "  • DNS enforcement (netsh commands)" -ForegroundColor Yellow
    Write-Host "  • VPN tunnel management (WireGuard)" -ForegroundColor Yellow
    Write-Host "  • Kill switch configuration" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host 'Would you like to restart as Administrator? (Y/N)'
    
    if ($choice -eq 'Y' -or $choice -eq 'y') {
        Write-Step "Restarting with Administrator privileges..."
        
        $scriptPath = $MyInvocation.MyCommand.Path
        Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-File", "`"$scriptPath`""
        exit
    } else {
        Write-Warning "Continuing without Administrator privileges (DNS enforcement may not work)"
        Start-Sleep -Seconds 2
    }
} else {
    Write-Success "Running as Administrator"
}

Write-Host ""

# ──────────────────────────────────────────────────────────────────────────────
# Step 2: Verify Project Structure
# ──────────────────────────────────────────────────────────────────────────────

Write-Step "Verifying project structure..."

$serverPath = Join-Path $ProjectRoot "server"
$serverIndexPath = Join-Path $serverPath "src\index.js"
$envPath = Join-Path $serverPath ".env"

if (-not (Test-Path $serverPath)) {
    Write-Error "Server directory not found: $serverPath"
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path $serverIndexPath)) {
    Write-Error "Server index.js not found: $serverIndexPath"
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path $envPath)) {
    Write-Warning ".env file not found at: $envPath"
    Write-Host ""
    Write-Host "You need to create the .env file with required secrets." -ForegroundColor Yellow
    Write-Host "Run this command to generate it:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  node scripts/generate-secrets.js --admin-email your@email.com --admin-password 'YourPassword'" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Success "Project structure verified"
Write-Host ""

# ──────────────────────────────────────────────────────────────────────────────
# Step 3: Check if Server is Already Running
# ──────────────────────────────────────────────────────────────────────────────

if (Test-ServerRunning) {
    Write-Success "API server is already running on port $ServerPort"
    $restartServer = Read-Host "Restart the server? (Y/N)"
    
    if ($restartServer -eq 'Y' -or $restartServer -eq 'y') {
        if (-not (Stop-ExistingServer)) {
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Step "Using existing server instance"
        $serverProcess = $null
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# Step 4: Start API Server
# ──────────────────────────────────────────────────────────────────────────────

if (-not (Test-ServerRunning)) {
    Write-Step "Starting API server..."
    
    # Ensure port is free
    if (-not (Stop-ExistingServer)) {
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Start server in new window
    $serverCmd = "cd '$serverPath'; Write-Host '🚀 Nebula VPN API Server' -ForegroundColor Green; Write-Host '════════════════════════════' -ForegroundColor Green; Write-Host ''; node src\index.js"
    
    $serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $serverCmd -PassThru -WindowStyle Normal
    
    if (-not $serverProcess) {
        Write-Error "Failed to start server process"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Success "Server process started (PID: $($serverProcess.Id))"
    
    # Wait for server to be ready
    if (-not (Wait-ForServer -TimeoutSeconds $MaxServerWaitSeconds)) {
        Write-Error "Server did not start successfully"
        Write-Host ""
        Write-Host "Please check the server terminal window for error messages." -ForegroundColor Yellow
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  • Missing or invalid .env file" -ForegroundColor Yellow
        Write-Host "  • Port $ServerPort already in use" -ForegroundColor Yellow
        Write-Host "  • Missing dependencies (run 'npm install' in server folder)" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""

# ──────────────────────────────────────────────────────────────────────────────
# Step 5: Launch Electron App
# ──────────────────────────────────────────────────────────────────────────────

Write-Step "Launching Electron app..."

try {
    $electronPath = Join-Path $ProjectRoot "node_modules\.bin\electron.cmd"
    
    if (-not (Test-Path $electronPath)) {
        Write-Error "Electron not found at: $electronPath"
        Write-Host "Run 'npm install' in the project root to install dependencies." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # Launch Electron
    Set-Location $ProjectRoot
    & $electronPath .
    
    Write-Success "Electron app launched"
    
} catch {
    Write-Error "Failed to launch Electron app: $_"
    Write-Host ""
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                    ║" -ForegroundColor Green
Write-Host "║               Nebula VPN Started Successfully!                 ║" -ForegroundColor Green
Write-Host "║                                                                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "API Server:    http://localhost:$ServerPort" -ForegroundColor Cyan
Write-Host "Electron App:  Running" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the server, close the server terminal window or press Ctrl+C there." -ForegroundColor Gray
Write-Host ""

# Keep this window open
Read-Host "Press Enter to close this launcher window (server will keep running)"
