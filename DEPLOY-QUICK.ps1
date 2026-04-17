#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick deployment script for common scenarios
.DESCRIPTION
    Simplified wrapper for DEPLOY-ALL.ps1 with preset configurations
.PARAMETER Scenario
    Deployment scenario: 'dev', 'build', 'full', 'production'
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'build', 'full', 'production', 'server')]
    [string]$Scenario = 'dev'
)

Write-Host @"

╔═══════════════════════════════════════════════════════╗
║         NEBULA VPN - QUICK DEPLOY                     ║
╚═══════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

switch ($Scenario) {
    'dev' {
        Write-Host "Development Build (local testing)" -ForegroundColor Yellow
        Write-Host "  - Skips: secrets, tests, Electron`n" -ForegroundColor Gray
        
        .\DEPLOY-ALL.ps1 -Target local -SkipSecrets -SkipTests -SkipElectron
    }
    
    'build' {
        Write-Host "Frontend Build Only" -ForegroundColor Yellow
        Write-Host "  - Builds: React frontend`n" -ForegroundColor Gray
        Write-Host "  - Skips: Electron, deployment`n" -ForegroundColor Gray
        
        .\DEPLOY-ALL.ps1 -Target local -SkipSecrets -SkipElectron
    }
    
    'full' {
        Write-Host "Full Local Build" -ForegroundColor Yellow
        Write-Host "  - Builds: Frontend + Windows Electron`n" -ForegroundColor Gray
        Write-Host "  - Includes: Security checks`n" -ForegroundColor Gray
        
        .\DEPLOY-ALL.ps1 -Target staging -ElectronPlatform win
    }
    
    'production' {
        Write-Host "Production Build (all platforms)" -ForegroundColor Yellow
        Write-Host "  - Builds: Everything`n" -ForegroundColor Gray
        Write-Host "  - Includes: All security checks`n" -ForegroundColor Gray
        Write-Host "  - Platforms: Windows, macOS, Linux`n" -ForegroundColor Gray
        
        $confirm = Read-Host "This will build for all platforms. Continue? (yes/no) [no]"
        if ($confirm -eq 'yes') {
            .\DEPLOY-ALL.ps1 -Target production -ElectronPlatform all
        } else {
            Write-Host "Cancelled." -ForegroundColor Yellow
            exit 0
        }
    }
    
    'server' {
        Write-Host "Server Deployment" -ForegroundColor Yellow
        Write-Host "  - Deploys backend to remote server`n" -ForegroundColor Gray
        
        $serverHost = Read-Host "Enter server host (e.g., user@server.com)"
        if ([string]::IsNullOrWhiteSpace($serverHost)) {
            Write-Host "Server host required. Cancelled." -ForegroundColor Red
            exit 1
        }
        
        $restart = Read-Host "Restart server after deployment? (yes/no) [yes]"
        
        $params = @{
            Target = 'production'
            SkipElectron = $true
            DeployBackend = $true
            ServerHost = $serverHost
        }
        
        if ($restart -ne 'no') {
            $params.RestartServer = $true
        }
        
        .\DEPLOY-ALL.ps1 @params
    }
}
