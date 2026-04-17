# ═══════════════════════════════════════════════════════════════════════
# NUCLEAR OPTION - Complete Git History Reset (PowerShell Version)
# ═══════════════════════════════════════════════════════════════════════
# 
# This script will:
# 1. Remove ALL git history (including exposed secrets)
# 2. Create a fresh repository with current files
# 3. Force push to GitHub (overwriting remote)
#
# WARNING: This destroys all commit history!
# ═══════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  [!] NUCLEAR OPTION - Git History Reset" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "[!] This will DELETE all git history and create a fresh repository." -ForegroundColor Yellow
Write-Host "    All previous commits will be lost permanently." -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Are you sure you want to continue? (type 'YES' to confirm)"

if ($confirm -ne "YES") {
    Write-Host "[X] Aborted. No changes made." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 1: Backup remote URL" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Find git executable
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitPath) {
    # Try common Git installation paths
    $possiblePaths = @(
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files (x86)\Git\bin\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $gitPath = $path
            break
        }
    }
    
    if (-not $gitPath) {
        Write-Host "[X] Error: Git not found. Please install Git or add it to PATH." -ForegroundColor Red
        Write-Host "    Download: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "[OK] Found Git: $gitPath" -ForegroundColor Green

# Get remote URL before deleting .git
try {
    $remoteUrl = & $gitPath remote get-url origin 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "No remote found"
    }
} catch {
    Write-Host "[X] Error: Could not find remote URL. Is this a git repository?" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Remote URL: $remoteUrl" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 2: Remove .git directory" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if (Test-Path ".git") {
    Write-Host "[DEL] Removing .git directory..." -ForegroundColor Yellow
    
    # Remove read-only attributes recursively
    try {
        attrib -R .git\* /S /D 2>$null | Out-Null
    } catch {
        # Ignore errors
    }
    
    # Try PowerShell Remove-Item first
    try {
        Remove-Item -Recurse -Force .git -ErrorAction Stop
        Write-Host "[OK] .git directory removed" -ForegroundColor Green
    } catch {
        Write-Host "   PowerShell removal failed, trying cmd.exe..." -ForegroundColor Yellow
        
        # Fallback to cmd.exe
        try {
            cmd /c "rd /s /q .git" 2>$null
            if (Test-Path ".git") {
                throw "cmd removal failed"
            }
            Write-Host "[OK] .git directory removed" -ForegroundColor Green
        } catch {
            Write-Host "[X] Failed to remove .git directory." -ForegroundColor Red
            Write-Host "   Try running PowerShell as Administrator, or manually delete:" -ForegroundColor Yellow
            Write-Host "   Right-click .git folder → Delete" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "[!] .git directory not found (already removed?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 3: Initialize fresh repository" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

& $gitPath init
Write-Host "[OK] Initialized fresh git repository" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 4: Stage all files" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

& $gitPath add .
Write-Host "[OK] Staged all files" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 5: Create initial commit" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

& $gitPath commit -m "Initial commit (history cleaned - OAuth secrets removed)"
Write-Host "[OK] Created initial commit" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 6: Add remote and force push" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

& $gitPath remote add origin $remoteUrl
Write-Host "[OK] Added remote: $remoteUrl" -ForegroundColor Green

Write-Host ""
Write-Host "[>>>] Pushing to GitHub (force push)..." -ForegroundColor Cyan
Write-Host ""

& $gitPath push -u --force origin main

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "[OK] SUCCESS! Git history has been completely reset and pushed." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "What happened:" -ForegroundColor White
Write-Host "  [OK] All commit history deleted (including OAuth secrets)" -ForegroundColor Green
Write-Host "  [OK] Fresh repository created with current files" -ForegroundColor Green
Write-Host "  [OK] Pushed to GitHub (overwrote remote history)" -ForegroundColor Green
Write-Host ""
Write-Host "[!] IMPORTANT: You MUST still revoke the exposed OAuth secrets!" -ForegroundColor Red
Write-Host "    -> Google: https://console.cloud.google.com/apis/credentials" -ForegroundColor Yellow
Write-Host "    -> GitHub: https://github.com/settings/developers" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. [SECURITY] Revoke OAuth secrets (URLs above)" -ForegroundColor Yellow
Write-Host "  2. [SECURITY] Generate new OAuth credentials" -ForegroundColor Yellow
Write-Host "  3. [CONFIG] Update server/.env with new secrets" -ForegroundColor Yellow
Write-Host "  4. [DEPLOY] Deploy to production" -ForegroundColor Yellow
Write-Host ""
