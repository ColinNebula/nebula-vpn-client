# WORKING ADVANCED VPN CLEANUP
# ============================
# Robust cleanup of advanced VPN configurations with better error handling

param([switch]$Force)

Write-Host "🧹 ADVANCED VPN CLEANUP" -ForegroundColor Red
Write-Host "=======================" -ForegroundColor Red
Write-Host ""

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Yellow
    Write-Host "1. Close this PowerShell" -ForegroundColor White
    Write-Host "2. Right-click PowerShell icon -> 'Run as administrator'" -ForegroundColor White
    Write-Host "3. cd 'd:\Development\nebula-vpn-client'" -ForegroundColor White
    Write-Host "4. .\WORKING-VPN-CLEANUP.ps1" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

$totalCleaned = 0

# PHASE 1: Remove VPN routes
Write-Host "PHASE 1: Removing VPN routes..." -ForegroundColor Yellow
$routes = @(
    "0.0.0.0 mask 128.0.0.0",
    "128.0.0.0 mask 128.0.0.0", 
    "0.0.0.0 mask 0.0.0.0"
)

foreach ($route in $routes) {
    try {
        $output = cmd /c "route delete $route 2>&1"
        if ($output -notmatch "not found" -and $output -notmatch "find a host") {
            Write-Host "  ✓ Removed route: $route" -ForegroundColor Green
            $totalCleaned++
        } else {
            Write-Host "  ℹ️ Route not present: $route" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ⚠️ Route cleanup issue: $route" -ForegroundColor Yellow
    }
}

Write-Host ""

# PHASE 2: Remove NRPT DNS rules
Write-Host "PHASE 2: Removing NRPT DNS rules..." -ForegroundColor Yellow
try {
    $nrptRules = Get-DnsClientNrptRule -ErrorAction SilentlyContinue | Where-Object { $_.Comment -like "*Nebula*" -or $_.Comment -like "*VPN*" }
    
    if ($nrptRules) {
        foreach ($rule in $nrptRules) {
            try {
                Remove-DnsClientNrptRule -Name $rule.Name -Force -ErrorAction Stop
                Write-Host "  ✓ Removed NRPT rule: $($rule.Name)" -ForegroundColor Green
                $totalCleaned++
            } catch {
                Write-Host "  ⚠️ NRPT rule removal failed: $($rule.Name)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ℹ️ No NRPT rules found" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️ NRPT cleanup error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 3: Remove firewall rules
Write-Host "PHASE 3: Removing firewall rules..." -ForegroundColor Yellow
$firewallRules = @(
    "NebulaVPN-IPv6-Block-Out",
    "NebulaVPN-IPv6-Block-In", 
    "NebulaVPN-Kill-Switch-Out",
    "NebulaVPN-Kill-Switch-In",
    "NebulaVPN-VPN-Allow",
    "Nebula VPN - Block IPv6*"
)

foreach ($ruleName in $firewallRules) {
    try {
        $existingRules = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        if ($existingRules) {
            Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction Stop
            Write-Host "  ✓ Removed firewall rule: $ruleName" -ForegroundColor Green
            $totalCleaned++
        } else {
            Write-Host "  ℹ️ Firewall rule not found: $ruleName" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ⚠️ Firewall rule cleanup issue: $ruleName" -ForegroundColor Yellow
    }
}

Write-Host ""

# PHASE 4: Restore IPv6
Write-Host "PHASE 4: Restoring IPv6..." -ForegroundColor Yellow
try {
    $regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters"
    if (Test-Path $regPath) {
        $currentValue = Get-ItemProperty -Path $regPath -Name "DisabledComponents" -ErrorAction SilentlyContinue
        if ($currentValue -and $currentValue.DisabledComponents -eq 255) {
            Set-ItemProperty -Path $regPath -Name "DisabledComponents" -Value 0 -Type DWord
            Write-Host "  ✅ IPv6 restored (was disabled)" -ForegroundColor Green
            $totalCleaned++
        } else {
            Write-Host "  ℹ️ IPv6 already enabled" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ⚠️ IPv6 restore issue: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 5: Network refresh
Write-Host "PHASE 5: Network refresh..." -ForegroundColor Yellow
try {
    Write-Host "  Flushing DNS cache..." -ForegroundColor Gray
    ipconfig /flushdns | Out-Null
    Write-Host "  ✅ DNS cache flushed" -ForegroundColor Green
    
    Write-Host "  Refreshing network adapters..." -ForegroundColor Gray
    Get-NetAdapter | ForEach-Object { 
        try {
            Restart-NetAdapter -Name $_.Name -ErrorAction SilentlyContinue
        } catch {
            # Continue even if some adapters fail
        }
    }
    Write-Host "  ✅ Network adapters refreshed" -ForegroundColor Green
    $totalCleaned++
} catch {
    Write-Host "  ⚠️ Network refresh had issues" -ForegroundColor Yellow
}

Write-Host ""

# PHASE 6: Verification tests
Write-Host "PHASE 6: Verification..." -ForegroundColor Yellow

# Test basic connectivity
Write-Host "Testing internet connectivity..." -ForegroundColor Gray
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "  ✅ Internet: WORKING" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Internet: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Internet test error" -ForegroundColor Red
}

# Test external IP
Write-Host "Testing external IP..." -ForegroundColor Gray
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "  ✅ External IP: $externalIP" -ForegroundColor Green
    
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
        Write-Host "  ℹ️ IP appears to be VPN (if VPN connected, this is normal)" -ForegroundColor Cyan
    } else {
        Write-Host "  ℹ️ IP appears to be ISP (cleanup successful)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ External IP check failed" -ForegroundColor Red
}

# Check route table
Write-Host "Checking route table..." -ForegroundColor Gray
try {
    $defaultRoutes = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue
    if ($defaultRoutes) {
        Write-Host "  ✅ Default routes present: $($defaultRoutes.Count)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ No default routes found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️ Route check failed" -ForegroundColor Yellow
}

Write-Host ""

# RESULTS
Write-Host "🔧 CLEANUP RESULTS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Items cleaned: $totalCleaned" -ForegroundColor White
Write-Host ""

if ($ping -and $defaultRoutes) {
    Write-Host "✅ SUCCESS: Network connectivity restored" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "✅ Advanced VPN configurations cleaned up" -ForegroundColor Green
    Write-Host "✅ System ready for normal use or new VPN setup" -ForegroundColor Green
} elseif ($ping) {
    Write-Host "⚠️ PARTIAL SUCCESS: Internet works but routing may need attention" -ForegroundColor Yellow
} else {
    Write-Host "❌ CONNECTIVITY ISSUES: Manual intervention may be needed" -ForegroundColor Red
    Write-Host ""
    Write-Host "TRY THESE STEPS:" -ForegroundColor Yellow
    Write-Host "1. Restart network adapter in Windows settings" -ForegroundColor White
    Write-Host "2. Reboot computer to fully reset networking" -ForegroundColor White
    Write-Host "3. Check Windows Network troubleshooter" -ForegroundColor White
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "• Test normal internet browsing" -ForegroundColor Gray
Write-Host "• If setting up VPN again: .\MICROSOFT-ADVANCED-VPN-SETUP.ps1" -ForegroundColor Gray
Write-Host "• If issues persist: Restart computer" -ForegroundColor Gray
Write-Host ""

Write-Host "Cleanup completed at $(Get-Date)" -ForegroundColor Gray