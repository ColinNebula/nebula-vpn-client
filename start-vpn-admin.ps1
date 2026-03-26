#!/usr/bin/env pwsh
# Nebula VPN - Start with Administrator Privileges
# Run this script as Administrator: Right-click → Run with PowerShell

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Nebula VPN with Administrator privileges..." -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click this script and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Navigate to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "📂 Project directory: $projectDir" -ForegroundColor Green

# 1. Check if API server is running on port 3001
Write-Host "`n🔍 Checking API server..." -ForegroundColor Cyan
$serverRunning = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -InformationLevel Quiet

if (-not $serverRunning) {
    Write-Host "📡 Starting API server..." -ForegroundColor Yellow
    Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$projectDir\server'; npm start"
    Write-Host "⏳ Waiting for server to initialize..."
    Start-Sleep -Seconds 5
} else {
    Write-Host "✅ API server is already running" -ForegroundColor Green
}

# 2. Check if React dev server is running on port 3000
Write-Host "`n🔍 Checking React dev server..." -ForegroundColor Cyan
$reactRunning = Test-NetConnection -ComputerName localhost -Port 3000 -WarningAction SilentlyContinue -InformationLevel Quiet

if (-not $reactRunning) {
    Write-Host "⚛️  Starting React dev server..." -ForegroundColor Yellow
    Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "cd '$projectDir'; npm start"
    Write-Host "⏳ Waiting for React to compile..."
    Start-Sleep -Seconds 10
} else {
    Write-Host "✅ React dev server is already running" -ForegroundColor Green
}

# 3. Check if Electron is installed
if (-not (Test-Path "node_modules\electron\dist\electron.exe")) {
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# 4. Launch Electron (already running as Admin)
Write-Host "`n⚡ Launching Electron app..." -ForegroundColor Cyan
& "node_modules\.bin\electron.cmd" .

Write-Host "`n✅ Done!" -ForegroundColor Green
