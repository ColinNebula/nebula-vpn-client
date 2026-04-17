# CLEANUP MICROSOFT ADVANCED VPN SETUP
# =====================================
# Removes all advanced VPN routing configurations and restores normal networking

Write-Host "🧹 MICROSOFT ADVANCED VPN CLEANUP" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

$itemsRemoved = 0

# CLEANUP 1: Remove NRPT DNS Rules
Write-Host "[Cleanup 1] Removing NRPT DNS enforcement rules..." -ForegroundColor Yellow
try {
    $nrptRules = Get-DnsClientNrptRule | Where-Object { $_.Comment -like "*NebulaVPN*" }
    
    foreach ($rule in $nrptRules) {
        Remove-DnsClientNrptRule -Name $rule.Name -Force
        $itemsRemoved++
        Write-Host "  ✓ Removed NRPT rule: $($rule.Name)" -ForegroundColor Green
    }
    
    if ($nrptRules.Count -eq 0) {
        Write-Host "  ℹ️ No NRPT rules found" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ NRPT cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# CLEANUP 2: Restore IPv6 (Remove Registry Disable)
Write-Host "[Cleanup 2] Restoring IPv6 functionality..." -ForegroundColor Yellow
try {
    $regPath = "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip6\Parameters"
    
    # Restore default IPv6 (remove or set to 0)
    if (Test-Path $regPath) {
        Set-ItemProperty -Path $regPath -Name "DisabledComponents" -Value 0 -Type DWord -Force
        $itemsRemoved++
        Write-Host "  ✅ IPv6 restored (DisabledComponents=0)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ IPv6 restore failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# CLEANUP 3: Remove Firewall Rules
Write-Host "[Cleanup 3] Removing advanced firewall rules..." -ForegroundColor Yellow

$firewallRulesNames = @(
    "NebulaVPN-IPv6-Block-Out", 
    "NebulaVPN-IPv6-Block-In",
    "NebulaVPN-Kill-Switch-Out", 
    "NebulaVPN-Kill-Switch-In",
    "NebulaVPN-VPN-Allow"
)

foreach ($ruleName in $firewallRulesNames) {
    try {
        $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        if ($rule) {
            Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction Stop
            $itemsRemoved++
            Write-Host "  ✓ Removed firewall rule: $ruleName" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ Rule not found or failed: $ruleName" -ForegroundColor Yellow
    }
}

Write-Host ""

# CLEANUP 4: Remove VPN Routes
Write-Host "[Cleanup 4] Removing policy-based routes..." -ForegroundColor Yellow

$vpnRoutes = @(
    "0.0.0.0/1",
    "128.0.0.0/1", 
    "8.8.8.8/32",
    "1.1.1.1/32"
)

foreach ($routePrefix in $vpnRoutes) {
    try {
        $route = Get-NetRoute -DestinationPrefix $routePrefix -ErrorAction SilentlyContinue
        if ($route) {
            Remove-NetRoute -DestinationPrefix $routePrefix -Confirm:$false -ErrorAction Stop
            $itemsRemoved++
            Write-Host "  ✓ Removed route: $routePrefix" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ Route not found or failed: $routePrefix" -ForegroundColor Yellow
    }
}

Write-Host ""

# CLEANUP 5: Flush DNS Cache
Write-Host "[Cleanup 5] Flushing DNS cache..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "  ✅ DNS cache flushed" -ForegroundColor Green
} catch {
    Write-Host "  ❌ DNS flush failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# CLEANUP 6: Remove monitoring script
Write-Host "[Cleanup 6] Removing monitoring files..." -ForegroundColor Yellow
$monitorFiles = @("VPN-LEAK-MONITOR.ps1")

foreach ($file in $monitorFiles) {
    try {
        if (Test-Path $file) {
            Remove-Item $file -Force
            $itemsRemoved++
            Write-Host "  ✓ Removed: $file" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️ Failed to remove: $file" -ForegroundColor Yellow
    }
}

Write-Host ""

# VERIFICATION: Test Normal Connectivity
Write-Host "🔍 VERIFICATION - Testing restored connectivity..." -ForegroundColor Yellow

# Test ping
try {
    $ping = Test-Connection -ComputerName "8.8.8.8" -Count 1 -Quiet -TimeoutSec 5
    if ($ping) {
        Write-Host "✅ Ping test: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "❌ Ping test: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ping test: ERROR" -ForegroundColor Red
}

# Test external IP
try {
    $externalIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 8).Content.Trim()
    Write-Host "✅ External IP restored: $externalIP" -ForegroundColor Green
    
    if ($externalIP -match "^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)") {
        Write-Host "ℹ️ IP still appears to be VPN (WireGuard tunnel may still be active)" -ForegroundColor Cyan
    } else {
        Write-Host "✅ IP appears to be normal ISP (advanced routing cleaned up)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ External IP test: FAILED" -ForegroundColor Red
}

# Test DNS
try {
    $dns = Resolve-DnsName google.com -ErrorAction Stop
    Write-Host "✅ DNS resolution: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "❌ DNS resolution: FAILED" -ForegroundColor Red
}

Write-Host ""

# SUMMARY
Write-Host "🧹 CLEANUP SUMMARY" -ForegroundColor Red
Write-Host "==================" -ForegroundColor Red
Write-Host "Items removed: $itemsRemoved" -ForegroundColor White
Write-Host ""

if ($itemsRemoved -gt 0) {
    Write-Host "✅ Advanced VPN routing has been cleaned up" -ForegroundColor Green
    Write-Host "✅ Normal networking should be restored" -ForegroundColor Green
} else {
    Write-Host "ℹ️ No advanced VPN configurations found to remove" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "NOTE:" -ForegroundColor Yellow
Write-Host "- This only removes the ADVANCED routing setup" -ForegroundColor White
Write-Host "- Basic WireGuard tunnel may still be active" -ForegroundColor White  
Write-Host "- To fully disconnect VPN, use your main VPN app" -ForegroundColor White
Write-Host ""

Write-Host "To re-enable advanced routing later:" -ForegroundColor Cyan
Write-Host ".\MICROSOFT-ADVANCED-VPN-SETUP.ps1" -ForegroundColor White
Write-Host ""