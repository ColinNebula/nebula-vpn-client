#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build React app for Electron with proper relative paths

.DESCRIPTION
    Creates an optimized production build of the React app specifically for Electron.
    Fixes path issues by using relative paths instead of absolute paths.
    Optionally fixes emoji rendering issues.

.PARAMETER FixEmojis
    Replace emojis with text alternatives for better cross-platform compatibility

.EXAMPLE
    .\BUILD-ELECTRON.ps1
    .\BUILD-ELECTRON.ps1 -FixEmojis
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$FixEmojis
)

$ErrorActionPreference = "Stop"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  BUILDING REACT APP FOR ELECTRON" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# Fix emojis if requested
if ($FixEmojis) {
    Write-Host "Running emoji fix..." -ForegroundColor Yellow
    node FIX-EMOJI.js
    if ($LASTEXITCODE -ne 0) {
        throw "Emoji fix failed"
    }
    Write-Host ""
}

# Backup original package.json
Write-Host "Backing up package.json..." -ForegroundColor Cyan
Copy-Item "package.json" "package.json.backup" -Force

try {
    # Read package.json
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    # Save original homepage
    $originalHomepage = $packageJson.homepage
    Write-Host "Original homepage: $originalHomepage" -ForegroundColor Gray
    
    # Change homepage to "." for relative paths
    $packageJson.homepage = "."
    
    # Save modified package.json
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content "package.json"
    Write-Host "Updated homepage to '.' for Electron build" -ForegroundColor Green
    
    # Build the React app
    Write-Host "`nBuilding React app..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "React build failed"
    }
    
    # Inject emoji font fix into index.html
    Write-Host "`nInjecting emoji font fix..." -ForegroundColor Cyan
    $indexPath = "build\index.html"
    $indexContent = Get-Content $indexPath -Raw
    
    # Add emoji font CSS before </head>
    $emojiCSS = @"
<style>
/* Force emoji font loading for Electron */
@font-face {
  font-family: 'Segoe UI Emoji';
  src: local('Segoe UI Emoji'), local('Segoe UI Symbol'), local('Apple Color Emoji'), local('Noto Color Emoji');
}
body, * {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif !important;
}
/* Emoji rendering fixes */
.emoji, [class*="icon"], button:contains('') {
  font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif !important;
  font-style: normal !important;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
</head>
"@
    
    $indexContent = $indexContent -replace '</head>', $emojiCSS
    $indexContent | Set-Content $indexPath -Encoding UTF8 -NoNewline
    Write-Host "Emoji font fix applied" -ForegroundColor Green
    
    Write-Host "`nBuild complete!" -ForegroundColor Green
    Write-Host "Build directory: build/" -ForegroundColor Gray
    
    # Show build size
    $buildSize = (Get-ChildItem "build" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Total build size: $([math]::Round($buildSize, 2)) MB" -ForegroundColor Cyan
    
    Write-Host "`n================================================================" -ForegroundColor Green
    Write-Host "  ELECTRON BUILD READY" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run Electron:" -ForegroundColor Cyan
    Write-Host "  npm run electron" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or build installers:" -ForegroundColor Cyan
    Write-Host "  npm run electron:build:win   (Windows installer)" -ForegroundColor Gray
    Write-Host "  npm run electron:build:mac   (macOS installer)" -ForegroundColor Gray
    Write-Host "  npm run electron:build:linux (Linux installer)" -ForegroundColor Gray
    Write-Host ""
    
    if ($FixEmojis) {
        Write-Host "Note: Emojis were replaced with text. To restore emojis:" -ForegroundColor Yellow
        Write-Host "  node FIX-EMOJI.js --restore" -ForegroundColor Gray
        Write-Host ""
    }
    
} catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    # Restore emojis if they were modified
    if ($FixEmojis -and (Test-Path "FIX-EMOJI.js")) {
        Write-Host "Restoring original emoji files..." -ForegroundColor Yellow
        node FIX-EMOJI.js --restore | Out-Null
    }
    
    exit 1
} finally {
    # Restore original package.json
    Write-Host "Restoring original package.json..." -ForegroundColor Yellow
    Move-Item "package.json.backup" "package.json" -Force
    Write-Host "package.json restored" -ForegroundColor Green
}
