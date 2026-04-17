#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Troubleshoot VPN Connection Issues
.DESCRIPTION
    Simple diagnostics for "IPC vpn-connect Error: fetch failed"
#>

Write-Host ""
Write-Host "VPN CONNECTION TROUBLESHOOTER" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Detect environment
$isDev = $false
$apiEndpoint = "https://api.nebula3ddev.com/api"

if (Test-Path "package.json") {
    $packageContent = Get-Content "package.json" -Raw -ErrorAction SilentlyContinue
    if ($packageContent -and ($packageContent.Contains('"dev"') -or $env:NODE_ENV -eq "development")) {
        $isDev = $true
        $apiEndpoint = "http://localhost:3001/api"
    }
}

Write-Host "[1] Environment Detection" -ForegroundColor Yellow
Write-Host "   Development mode: $isDev" -ForegroundColor White
Write-Host "   API endpoint: $apiEndpoint" -ForegroundColor White

if ($env:API_URL) {
    $apiEndpoint = $env:API_URL
    Write-Host "   Custom API_URL: $apiEndpoint" -ForegroundColor Magenta
}

# Network test
Write-Host ""
Write-Host "[2] Network Test" -ForegroundColor Yellow

if ($apiEndpoint -like "*localhost*") {
    Write-Host "   Testing localhost:3001..." -ForegroundColor White
    $tcpTest = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($tcpTest -and $tcpTest.TcpTestSucceeded) {
        Write-Host "   SUCCESS: Port 3001 is reachable" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: Port 3001 is NOT reachable" -ForegroundColor Red
        Write-Host "   -> Backend server is not running!" -ForegroundColor Red
        Write-Host "   -> Fix: Run 'npm run server' in a separate terminal" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Testing remote API..." -ForegroundColor White
    $hostname = "api.nebula3ddev.com"
    $tcpTest = Test-NetConnection -ComputerName $hostname -Port 443 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($tcpTest -and $tcpTest.TcpTestSucceeded) {
        Write-Host "   SUCCESS: Can reach $hostname" -ForegroundColor Green
    } else {
        Write-Host "   FAILED: Cannot reach $hostname" -ForegroundColor Red
        Write-Host "   -> Check your internet connection" -ForegroundColor Yellow
    }
}

# Process check
Write-Host ""
Write-Host "[3] Process Check" -ForegroundColor Yellow

if ($isDev) {
    $nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcess) {
        Write-Host "   SUCCESS: Node.js is running (PID: $($nodeProcess.Id -join ', '))" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: No Node.js process found" -ForegroundColor Yellow
        Write-Host "   -> Start backend: npm run server" -ForegroundColor Yellow
    }
}

$electronProcesses = Get-Process -Name "*electron*" -ErrorAction SilentlyContinue
if ($electronProcesses) {
    Write-Host "   SUCCESS: Electron app running" -ForegroundColor Green
} else {
    Write-Host "   INFO: No Electron processes found (app may not be running)" -ForegroundColor White
}

# Quick fixes
Write-Host ""
Write-Host "[4] Quick Fixes" -ForegroundColor Yellow

if ($isDev) {
    Write-Host "   DEVELOPMENT MODE:" -ForegroundColor Cyan
    Write-Host "   1. Start backend server: npm run server" -ForegroundColor White
    Write-Host "   2. Test server: curl http://localhost:3001/api/health" -ForegroundColor White
    Write-Host "   3. Check server terminal for errors" -ForegroundColor White
} else {
    Write-Host "   PRODUCTION MODE:" -ForegroundColor Cyan
    Write-Host "   1. Check internet connection" -ForegroundColor White
    Write-Host "   2. Test API: curl -I https://api.nebula3ddev.com/api" -ForegroundColor White
    Write-Host "   3. Try from different network" -ForegroundColor White
}

Write-Host ""
Write-Host "   GENERAL FIXES:" -ForegroundColor Cyan  
Write-Host "   1. Restart Nebula app completely" -ForegroundColor White
Write-Host "   2. Run as Administrator" -ForegroundColor White
Write-Host "   3. Check Windows Firewall" -ForegroundColor White
Write-Host "   4. Temporarily disable antivirus" -ForegroundColor White

Write-Host ""
Write-Host "Enhanced error logging is active!" -ForegroundColor Green
Write-Host "-> Try connecting again for detailed error messages" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to continue"