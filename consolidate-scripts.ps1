#!/usr/bin/env pwsh
<parameter name="content">#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Consolidate 118 PowerShell scripts into organized structure
.DESCRIPTION
    Moves essential scripts to /scripts folder and deletes obsolete ones
.EXAMPLE
    .\consolidate-scripts.ps1
    .\consolidate-scripts.ps1 -WhatIf
#>

param(
    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  NEBULA VPN - SCRIPT CONSOLIDATION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Count current scripts
$currentScripts = Get-ChildItem -Filter "*.ps1" -File
$currentSize = ($currentScripts | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "Current state:" -ForegroundColor Yellow
Write-Host "  Total scripts: $($currentScripts.Count)" -ForegroundColor White
Write-Host "  Total size: $([math]::Round($currentSize, 2)) MB" -ForegroundColor White
Write-Host ""

# Define scripts to keep and their new locations
$scriptsToKeep = @{
    # Deployment
    'DEPLOY-PRODUCTION.ps1' = 'scripts/deployment/deploy-production.ps1'
    'DEPLOY-CLOUD.ps1' = 'scripts/deployment/deploy-cloud.ps1'
    'setup-ssl.sh' = 'scripts/deployment/setup-ssl.sh'
    
    # Development
    'BUILD-ELECTRON.ps1' = 'scripts/development/build-electron.ps1'
    'start-nebula.ps1' = 'scripts/development/start-dev.ps1'
    
    # Testing (keep in root for quick access)
    'TEST-VPN-TUNNEL.ps1' = 'TEST-VPN-TUNNEL.ps1'
    'TEST-VPN-QUICK.ps1' = 'TEST-VPN-QUICK.ps1'
    
    # Utils
    'scripts/generate-secrets.js' = 'scripts/utils/generate-secrets.js'
    'scripts/security-audit.js' = 'scripts/utils/security-audit.js'
}

# All VPN-related scripts consolidated into nebula-vpn.ps1
$vpnScriptsToDelete = @(
    'ADMIN-VPN-FIX.ps1', 'ALTERNATIVE-VPN-ROUTING.ps1', 'APPLY-RESILIENT-ROUTING.ps1',
    'CHECK-VPN-LEAK.ps1', 'CHECK-WIREGUARD-STATUS.ps1', 'CLEANUP-*.ps1',
    'COMPLETE-*.ps1', 'COMPREHENSIVE-VPN-FIX.ps1',
    'DIAGNOSE-*.ps1', 'EMERGENCY-*.ps1', 'ENABLE-FULL-TUNNELING.ps1',
    'ENHANCED-VPN-CLEANUP*.ps1', 'FIREWALL-VPN-FIX.ps1',
    'FIX-*.ps1', 'FORCE-*.ps1', 'GATEWAY-*.ps1', 'GENTLE-*.ps1',
    'IMMEDIATE-*.ps1', 'IMPLEMENT-*.ps1', 'MICROSOFT-*.ps1', 'MONITOR-*.ps1',
    'OPTIMAL-*.ps1', 'QUICK-*.ps1', 'REALTIME-*.ps1', 'REMOVE-*.ps1',
    'REPAIR-*.ps1', 'RESTART-*.ps1', 'RESTORE-*.ps1',
    'START-VPN-*.ps1', 'start-vpn-*.ps1', 'SETUP-SPLIT-TUNNELING*.ps1',
    'SETUP-PRODUCTION-WIREGUARD.ps1', 'SETUP-GPS-SPOOFING.ps1',
    'ULTIMATE-*.ps1', 'VERIFY-*.ps1', 'verify-dns*.ps1',
    'VPN-*.ps1', 'WG-STATUS.ps1', 'WIFI-*.ps1', 'WIREGUARD-*.ps1', 'WORKING-*.ps1'
)

# Deployment scripts to delete (consolidated)
$deploymentScriptsToDelete = @(
    'DEPLOY-ALL.ps1', 'DEPLOY-AZURE.ps1', 'DEPLOY-CLOUD-QUICK.ps1', 'DEPLOY-QUICK.ps1'
)

# Other obsolete scripts
$obsoleteScripts = @(
    'CREATE-ADMIN-SHORTCUT.ps1', 'FIX-SSH-PERMISSIONS.ps1',
    'SETUP-MS-TOOLS.ps1', 'SETUP-SSH-ACCESS.ps1', 'UI-DIAGNOSTIC-GUIDE.ps1',
    'start-nebula-clean.ps1', 'START-PRODUCTION-VPN.ps1'
)

# Create directory structure
$directories = @(
    'scripts/vpn',
    'scripts/deployment',
    'scripts/development',
    'scripts/utils'
)

Write-Host "Creating directory structure..." -ForegroundColor Yellow
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        if ($WhatIf) {
            Write-Host "  [WhatIf] Would create: $dir" -ForegroundColor Cyan
        } else {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
            Write-Host "  ✓ Created: $dir" -ForegroundColor Green
        }
    }
}

# Move essential scripts
Write-Host ""
Write-Host "Moving essential scripts..." -ForegroundColor Yellow
$moveCount = 0
foreach ($script in $scriptsToKeep.GetEnumerator()) {
    if (Test-Path $script.Key) {
        if ($WhatIf) {
            Write-Host "  [WhatIf] Would move: $($script.Key) → $($script.Value)" -ForegroundColor Cyan
        } else {
            $destDir = Split-Path $script.Value -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -Path $destDir -ItemType Directory -Force | Out-Null
            }
            Move-Item -Path $script.Key -Destination $script.Value -Force -ErrorAction SilentlyContinue
            if (Test-Path $script.Value) {
                Write-Host "  ✓ Moved: $($script.Key)" -ForegroundColor Green
                $moveCount++
            }
        }
    }
}

# Delete VPN scripts (replaced by nebula-vpn.ps1)
Write-Host ""
Write-Host "Deleting consolidated VPN scripts..." -ForegroundColor Yellow
$deleteCount = 0
foreach ($pattern in $vpnScriptsToDelete) {
    Get-ChildItem -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
        if ($WhatIf) {
            Write-Host "  [WhatIf] Would delete: $($_.Name)" -ForegroundColor Cyan
        } else {
            Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Deleted: $($_.Name)" -ForegroundColor Gray
            $deleteCount++
        }
    }
}

# Delete deployment scripts
Write-Host ""
Write-Host "Deleting redundant deployment scripts..." -ForegroundColor Yellow
foreach ($script in $deploymentScriptsToDelete) {
    if (Test-Path $script) {
        if ($WhatIf) {
            Write-Host "  [WhatIf] Would delete: $script" -ForegroundColor Cyan
        } else {
            Remove-Item $script -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Deleted: $script" -ForegroundColor Gray
            $deleteCount++
        }
    }
}

# Delete obsolete scripts
Write-Host ""
Write-Host "Deleting obsolete scripts..." -ForegroundColor Yellow
foreach ($script in $obsoleteScripts) {
    if (Test-Path $script) {
        if ($WhatIf) {
            Write-Host "  [WhatIf] Would delete: $script" -ForegroundColor Cyan
        } else {
            Remove-Item $script -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Deleted: $script" -ForegroundColor Gray
            $deleteCount++
        }
    }
}

# Final summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan

if ($WhatIf) {
    Write-Host "  DRY RUN COMPLETE (no changes made)" -ForegroundColor Yellow
} else {
    Write-Host "  CONSOLIDATION COMPLETE!" -ForegroundColor Green
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$remainingScripts = Get-ChildItem -Filter "*.ps1" -File
$remainingSize = ($remainingScripts | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  Scripts moved: $moveCount" -ForegroundColor White
Write-Host "  Scripts deleted: $deleteCount" -ForegroundColor White
Write-Host ""
Write-Host "Before: $($currentScripts.Count) scripts ($([math]::Round($currentSize, 2)) MB)" -ForegroundColor White
Write-Host "After:  $($remainingScripts.Count) scripts ($([math]::Round($remainingSize, 2)) MB)" -ForegroundColor White
Write-Host "Saved:  $($currentScripts.Count - $remainingScripts.Count) scripts ($([math]::Round($currentSize - $remainingSize, 2)) MB)" -ForegroundColor Green
Write-Host ""

if (-not $WhatIf) {
    Write-Host "New structure:" -ForegroundColor Yellow
    Write-Host "  scripts/vpn/nebula-vpn.ps1        - Unified VPN management" -ForegroundColor Cyan
    Write-Host "  scripts/deployment/deploy-*.ps1   - Deployment scripts" -ForegroundColor Cyan
    Write-Host "  scripts/development/              - Dev utilities" -ForegroundColor Cyan
    Write-Host "  TEST-VPN-*.ps1                    - Quick test scripts (root)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\vpn\nebula-vpn.ps1            - Interactive menu" -ForegroundColor White
    Write-Host "  .\scripts\vpn\nebula-vpn.ps1 -Action diagnose" -ForegroundColor White
    Write-Host "  .\scripts\vpn\nebula-vpn.ps1 -Action fix" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Run without -WhatIf to apply changes" -ForegroundColor Yellow
    Write-Host ""
}
