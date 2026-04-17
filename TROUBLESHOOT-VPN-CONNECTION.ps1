#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Troubleshoot VPN Connection Issues
.DESCRIPTION
    Diagnoses "IPC vpn-connect Error: fetch failed" problems
#>

Write-Host ""
Write-Host "VPN CONNECTION TROUBLESHOOTER" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Environment detection
$isDev = $false
$apiEndpoint = "https://api.nebula3ddev.com/api"

if (Test-Path "package.json") {
    $content = Get-Content "package.json" -Raw -ErrorAction SilentlyContinue
    if ($content -and ($content.Contains('"dev"') -or $env:NODE_ENV -eq "development")) {
        $isDev = $true
        $apiEndpoint = "http://localhost:3001/api"
    }
}

Write-Host "[1] Environment" -ForegroundColor Yellow
Write-Host "   Mode: $(if($isDev){'Development'}else{'Production'})" -ForegroundColor White
Write-Host "   API: $apiEndpoint" -ForegroundColor White

if ($env:API_URL) {
    $apiEndpoint = $env:API_URL
    Write-Host "   Custom: $apiEndpoint" -ForegroundColor Magenta
}

# Network connectivity
Write-Host ""
Write-Host "[2] Network Test" -ForegroundColor Yellow

if ($apiEndpoint.Contains("localhost")) {
    Write-Host "   Testing localhost:3001..." -ForegroundColor White
    $result = Test-NetConnection localhost 3001 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "   SUCCESS: Backend server reachable" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: Backend server not running" -ForegroundColor Red
        Write-Host "   Fix: npm run server" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Testing remote API..." -ForegroundColor White
    $result = Test-NetConnection api.nebula3ddev.com 443 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "   SUCCESS: Remote API reachable" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: Cannot reach remote API" -ForegroundColor Red
        Write-Host "   Fix: Check internet connection" -ForegroundColor Yellow
    }
}

# Process check
Write-Host ""
Write-Host "[3] Processes" -ForegroundColor Yellow

if ($isDev) {
    $node = Get-Process node -ErrorAction SilentlyContinue
    if ($node) {
        Write-Host "   Node.js: Running (PID $($node.Id -join ','))" -ForegroundColor Green
    } else {
        Write-Host "   Node.js: Not found" -ForegroundColor Yellow
    }
}

$electron = Get-Process "*electron*" -ErrorAction SilentlyContinue
if ($electron) {
    Write-Host "   Electron: Running" -ForegroundColor Green
} else {
    Write-Host "   Electron: Not running" -ForegroundColor White
}

# Solutions
Write-Host ""
Write-Host "[4] Solutions" -ForegroundColor Yellow

if ($isDev) {
    Write-Host "   DEV MODE FIXES:" -ForegroundColor Cyan
    Write-Host "   1. npm run server" -ForegroundColor White
    Write-Host "   2. Check server terminal for errors" -ForegroundColor White
} else {
    Write-Host "   PROD MODE FIXES:" -ForegroundColor Cyan
    Write-Host "   1. Check internet connection" -ForegroundColor White
    Write-Host "   2. Verify API endpoint is correct" -ForegroundColor White
}

Write-Host ""
Write-Host "   GENERAL FIXES:" -ForegroundColor Cyan
Write-Host "   1. Restart VPN app" -ForegroundColor White
Write-Host "   2. Run as Administrator" -ForegroundColor White
Write-Host "   3. Check Windows Firewall" -ForegroundColor White

Write-Host ""
Write-Host "Enhanced logging active - try connecting again!" -ForegroundColor Green
Write-Host ""

pause