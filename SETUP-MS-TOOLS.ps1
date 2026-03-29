#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick setup for Microsoft tools integration

.DESCRIPTION
    Installs and configures recommended Microsoft tools for Nebula VPN:
    - TypeScript for type safety
    - Playwright for testing
    - Azure CLI for cloud deployment
    - WinGet manifest tools

.PARAMETER Tool
    Specific tool to install (typescript, playwright, azure, all)

.EXAMPLE
    .\SETUP-MS-TOOLS.ps1 -Tool all
    .\SETUP-MS-TOOLS.ps1 -Tool typescript
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('all', 'typescript', 'playwright', 'azure', 'winget')]
    [string]$Tool = 'all'
)

$ErrorActionPreference = "Continue"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  MICROSOFT TOOLS SETUP FOR NEBULA VPN" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

function Install-TypeScript {
    Write-Host "`n[1/4] Installing TypeScript..." -ForegroundColor Yellow
    
    npm install --save-dev typescript @types/react @types/react-dom @types/node @types/electron
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Creating tsconfig.json..." -ForegroundColor Gray
        
        $tsconfig = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "noEmit": true
  },
  "include": ["src/**/*", "electron/**/*"],
  "exclude": ["node_modules", "build", "dist"]
}
"@
        
        $tsconfig | Set-Content "tsconfig.json" -Encoding UTF8
        Write-Host "TypeScript installed successfully!" -ForegroundColor Green
        Write-Host "Next: Add '// @ts-check' to your .js files for type checking" -ForegroundColor Cyan
    } else {
        Write-Host "TypeScript installation failed" -ForegroundColor Red
    }
}

function Install-Playwright {
    Write-Host "`n[2/4] Installing Playwright..." -ForegroundColor Yellow
    
    npm install --save-dev @playwright/test
    
    if ($LASTEXITCODE -eq 0) {
        npx playwright install chromium
        
        # Create test directory
        New-Item -ItemType Directory -Path "tests" -Force | Out-Null
        
        # Create sample test
        $sampleTest = @"
// @ts-check
const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test('Nebula VPN launches successfully', async () => {
  const app = await electron.launch({ 
    args: ['.'],
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  const window = await app.firstWindow();
  
  // Check title
  const title = await window.title();
  expect(title).toContain('Nebula VPN');
  
  // Check main elements
  const connectButton = window.locator('button:has-text("Connect")');
  await expect(connectButton).toBeVisible();
  
  await app.close();
});

test('VPN connection works', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  
  // Wait for app to be ready
  await window.waitForSelector('.status');
  
  // Click connect button
  await window.click('button:has-text("Connect")');
  
  // Wait for connection (max 30 seconds)
  await window.waitForSelector('.connected', { timeout: 30000 });
  
  // Verify connected state
  const status = await window.locator('.status').textContent();
  expect(status).toMatch(/connected/i);
  
  await app.close();
});
"@
        
        $sampleTest | Set-Content "tests/vpn.spec.js" -Encoding UTF8
        
        # Create playwright config
        $playwrightConfig = @"
// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
"@
        
        $playwrightConfig | Set-Content "playwright.config.js" -Encoding UTF8
        
        Write-Host "Playwright installed successfully!" -ForegroundColor Green
        Write-Host "Run tests: npx playwright test" -ForegroundColor Cyan
        Write-Host "See report: npx playwright show-report" -ForegroundColor Cyan
    } else {
        Write-Host "Playwright installation failed" -ForegroundColor Red
    }
}

function Install-AzureCLI {
    Write-Host "`n[3/4] Installing Azure CLI..." -ForegroundColor Yellow
    
    $installed = winget list --id Microsoft.AzureCLI 2>&1
    
    if ($installed -match "Microsoft.AzureCLI") {
        Write-Host "Azure CLI already installed" -ForegroundColor Green
    } else {
        Write-Host "Installing Azure CLI via winget..." -ForegroundColor Gray
        winget install Microsoft.AzureCLI --silent
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Azure CLI installed successfully!" -ForegroundColor Green
            Write-Host "Login: az login" -ForegroundColor Cyan
            Write-Host "Create resource: az group create --name nebula-rg --location eastus2" -ForegroundColor Cyan
        } else {
            Write-Host "Azure CLI installation failed" -ForegroundColor Red
        }
    }
}

function Install-WinGetTools {
    Write-Host "`n[4/4] Setting up WinGet manifest tools..." -ForegroundColor Yellow
    
    $installed = winget list --id Microsoft.WinGetCreate 2>&1
    
    if ($installed -match "Microsoft.WinGetCreate") {
        Write-Host "WinGetCreate already installed" -ForegroundColor Green
    } else {
        Write-Host "Installing WinGetCreate..." -ForegroundColor Gray
        winget install Microsoft.WinGetCreate --silent
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "WinGetCreate installed successfully!" -ForegroundColor Green
            Write-Host "Create manifest: wingetcreate new dist/Nebula-VPN-Setup.exe" -ForegroundColor Cyan
        }
    }
}

function Show-Summary {
    Write-Host "`n================================================================" -ForegroundColor Green
    Write-Host "  SETUP COMPLETE" -ForegroundColor Green
    Write-Host "================================================================`n" -ForegroundColor Green
    
    Write-Host "What's installed:" -ForegroundColor Cyan
    Write-Host "  - TypeScript for type safety" -ForegroundColor Gray
    Write-Host "  - Playwright for automated testing" -ForegroundColor Gray
    Write-Host "  - Azure CLI for cloud deployment" -ForegroundColor Gray
    Write-Host "  - WinGet tools for distribution" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Quick commands:" -ForegroundColor Yellow
    Write-Host "  npm run test          # Run Playwright tests" -ForegroundColor Gray
    Write-Host "  npx tsc --noEmit      # Type check without compiling" -ForegroundColor Gray
    Write-Host "  az login              # Login to Azure" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Add // @ts-check to your JavaScript files" -ForegroundColor Gray
    Write-Host "  2. Run: npx playwright test" -ForegroundColor Gray
    Write-Host "  3. Deploy to Azure: az webapp up" -ForegroundColor Gray
    Write-Host "  4. Read: MICROSOFT-TOOLS-GUIDE.md for details" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
if ($Tool -eq 'all' -or $Tool -eq 'typescript') {
    Install-TypeScript
}

if ($Tool -eq 'all' -or $Tool -eq 'playwright') {
    Install-Playwright
}

if ($Tool -eq 'all' -or $Tool -eq 'azure') {
    Install-AzureCLI
}

if ($Tool -eq 'all' -or $Tool -eq 'winget') {
    Install-WinGetTools
}

if ($Tool -eq 'all') {
    Show-Summary
}

Write-Host ""
