#!/usr/bin/env pwsh
# OAuth Configuration Test Script
# Verifies GitHub and Google OAuth setup

Write-Host "`n=== OAuth Configuration Test ===" -ForegroundColor Cyan

# Load .env file
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found at: $envPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Found .env file" -ForegroundColor Green

# Parse .env
$envVars = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# Check required variables
Write-Host "`n🔍 Checking OAuth Configuration..." -ForegroundColor Cyan

$checks = @(
    @{ Name = "GITHUB_CLIENT_ID"; Required = $true; Sensitive = $false }
    @{ Name = "GITHUB_CLIENT_SECRET"; Required = $true; Sensitive = $true }
    @{ Name = "GOOGLE_CLIENT_ID"; Required = $true; Sensitive = $false }
    @{ Name = "GOOGLE_CLIENT_SECRET"; Required = $true; Sensitive = $true }
    @{ Name = "BACKEND_BASE_URL"; Required = $true; Sensitive = $false }
    @{ Name = "ALLOWED_ORIGINS"; Required = $true; Sensitive = $false }
)

$allPassed = $true

foreach ($check in $checks) {
    $value = $envVars[$check.Name]
    
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "❌ $($check.Name) - Missing or empty" -ForegroundColor Red
        $allPassed = $false
    } else {
        if ($check.Sensitive) {
            $masked = $value.Substring(0, [Math]::Min(8, $value.Length)) + "..." + $value.Substring([Math]::Max(0, $value.Length - 4))
            Write-Host "✅ $($check.Name) - Set ($masked)" -ForegroundColor Green
        } else {
            Write-Host "✅ $($check.Name) - Set ($value)" -ForegroundColor Green
        }
    }
}

# Verify ALLOWED_ORIGINS includes expected URLs
Write-Host "`n🔍 Checking ALLOWED_ORIGINS..." -ForegroundColor Cyan
$allowedOrigins = $envVars["ALLOWED_ORIGINS"] -split ','
$expectedOrigins = @(
    'http://localhost:3000',
    'https://colinnebula.github.io'
)

foreach ($expected in $expectedOrigins) {
    $found = $allowedOrigins | Where-Object { $_.Trim() -like "$expected*" }
    if ($found) {
        Write-Host "  ✅ $expected - Allowed" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $expected - Not in ALLOWED_ORIGINS" -ForegroundColor Yellow
        Write-Host "     This may cause OAuth redirect issues!" -ForegroundColor Yellow
    }
}

# Test server connectivity
Write-Host "`n🔍 Testing Server Connection..." -ForegroundColor Cyan
$serverTest = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -InformationLevel Quiet

if ($serverTest) {
    Write-Host "✅ Server is running on port 3001" -ForegroundColor Green
    
    # Test OAuth endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/oauth/github/start?app_url=http://localhost:3000/" -MaximumRedirection 0 -ErrorAction Stop
        Write-Host "✅ OAuth endpoint is accessible" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 302 -or $_.Exception.Response.StatusCode -eq 'Redirect') {
            Write-Host "✅ OAuth endpoint is working (redirecting as expected)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ OAuth endpoint returned: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ Server is not running on port 3001" -ForegroundColor Red
    Write-Host "   Start server with: cd server; npm run dev" -ForegroundColor Yellow
    $allPassed = $false
}

# Check database file
Write-Host "`n🔍 Checking Database..." -ForegroundColor Cyan
$dbPath = Join-Path $PSScriptRoot "nebula.db"
if (Test-Path $dbPath) {
    $dbSize = (Get-Item $dbPath).Length
    Write-Host "✅ Database exists ($($dbSize) bytes)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Database not yet created (will be created on first use)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "✅ OAuth configuration looks good!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Make sure server is running: cd server; npm run dev" -ForegroundColor White
    Write-Host "  2. Test GitHub login in browser" -ForegroundColor White
    Write-Host "  3. Test Google login in browser" -ForegroundColor White
} else {
    Write-Host "❌ Configuration issues detected. Fix the above errors." -ForegroundColor Red
}

Write-Host ""
