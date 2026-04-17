# FIX-WIREGUARD-TRAFFIC.ps1
# Quick diagnostic and fix script for WireGuard traffic blocking issues
# 
# Usage:
#   .\FIX-WIREGUARD-TRAFFIC.ps1              # Diagnose only
#   .\FIX-WIREGUARD-TRAFFIC.ps1 -FixAll      # Diagnose and fix all issues
#   .\FIX-WIREGUARD-TRAFFIC.ps1 -RemoveAllRules  # Remove all Nebula VPN rules

param(
    [switch]$DiagnoseOnly = $false,
    [switch]$FixAll = $false,
    [switch]$RemoveAllRules = $false
)

# Require admin privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script requires administrator privileges" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Helper functions for output
function Write-Step { param([string]$msg) Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-OK { param([string]$msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param([string]$msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Warn { param([string]$msg) Write-Host "⚠️ $msg" -ForegroundColor Yellow }
function Write-Info { param([string]$msg) Write-Host "ℹ️ $msg" -ForegroundColor Gray }

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  WIREGUARD TRAFFIC FIX UTILITY" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# ============================================================================
# STEP 1: Detect WireGuard Adapter
# ============================================================================

Write-Step "Detecting WireGuard adapter..."

$vpnAdapter = Get-NetAdapter | Where-Object {
    ($_.InterfaceDescription -like "*WireGuard*") -or
    ($_.Name -like "*Nebula*") -or
    ($_.Name -eq "Nebulavpn")
} | Select-Object -First 1

if (-not $vpnAdapter) {
    Write-Error "WireGuard adapter not found!"
    Write-Info "Make sure VPN is connected first"
    Write-Info "Try running: Get-NetAdapter | Where-Object Status -eq 'Up'"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-OK "Found VPN adapter: $($vpnAdapter.Name) ($($vpnAdapter.Status))"
$vpnIndex = $vpnAdapter.InterfaceIndex
$vpnName = $vpnAdapter.Name

# ============================================================================
# STEP 2: Diagnose Firewall Rules
# ============================================================================

Write-Step "Diagnosing firewall rules..."

# Initialize fix flags
$needsInterfaceFix = $false
$needsRoutingFix = $false

$nebulaRules = Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*Nebula*" -or $_.Name -like "*NebulaVPN*"
}

Write-Info "Found $($nebulaRules.Count) Nebula VPN firewall rules"

# Check for blocking rules
$blockAllRule = $nebulaRules | Where-Object {
    $_.Name -like "*BlockAll*" -and $_.Action -eq "Block"
}

if ($blockAllRule) {
    Write-Warn "Kill switch 'Block All' rule is active"
    Write-Info "This blocks ALL traffic by default"
}

# Check for interface allow rule
$allowInterfaceRule = $nebulaRules | Where-Object {
    ($_.Name -like "*AllowInterface*" -or $_.Name -like "*AllowVPNNet*") -and
    $_.Action -eq "Allow"
}

if (-not $allowInterfaceRule) {
    Write-Error "MISSING: Firewall rule to allow traffic through VPN interface!"
    Write-Info "This is the main cause of traffic blocking"
    $needsInterfaceFix = $true
} else {
    Write-OK "Interface allow rule exists: $($allowInterfaceRule.Name)"
    $needsInterfaceFix = $false
}

# Check DNS rules
$dnsRules = $nebulaRules | Where-Object {
    $_.Name -like "*DNS*"
}

if ($dnsRules) {
    Write-Info "Found $($dnsRules.Count) DNS-related rules"
    foreach ($rule in $dnsRules) {
        Write-Info "  - $($rule.Name): $($rule.Action) (Enabled: $($rule.Enabled))"
    }
}

# ============================================================================
# STEP 3: Check Routing
# ============================================================================

Write-Step "Checking routing configuration..."

$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | 
    Sort-Object -Property RouteMetric | Select-Object -First 1

if ($defaultRoute) {
    if ($defaultRoute.InterfaceIndex -eq $vpnIndex) {
        Write-OK "VPN is the default gateway (metric: $($defaultRoute.RouteMetric))"
        $needsRoutingFix = $false
    } else {
        $actualInterface = Get-NetAdapter -InterfaceIndex $defaultRoute.InterfaceIndex -ErrorAction SilentlyContinue
        Write-Warn "Default gateway is NOT the VPN"
        Write-Info "Current default: $($actualInterface.Name) (metric: $($defaultRoute.RouteMetric))"
        $needsRoutingFix = $true
    }
} else {
    Write-Error "No default route found"
    $needsRoutingFix = $true
}

# ============================================================================
# STEP 4: Check VPN Status
# ============================================================================

Write-Step "Checking VPN interface status..."

if ($vpnAdapter.Status -eq "Up") {
    Write-OK "VPN interface is UP"
} else {
    Write-Error "VPN interface is $($vpnAdapter.Status)"
    Write-Info "VPN may not be connected properly"
}

# Check for IP address assignment
$vpnIP = Get-NetIPAddress -InterfaceIndex $vpnIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue

if ($vpnIP) {
    Write-OK "VPN IP address: $($vpnIP.IPAddress)"
} else {
    Write-Error "No IP address assigned to VPN interface"
}

# ============================================================================
# SUMMARY & FIX OPTIONS
# ============================================================================

Write-Host "`n=========================================" -ForegroundColor Yellow
Write-Host "         DIAGNOSIS SUMMARY" -ForegroundColor Yellow
Write-Host "=========================================`n" -ForegroundColor Yellow

$issuesFound = @()

if ($needsInterfaceFix) {
    $issuesFound += "Missing firewall rule to allow VPN interface traffic"
}

if ($needsRoutingFix) {
    $issuesFound += "VPN is not the default gateway"
}

if ($vpnAdapter.Status -ne "Up") {
    $issuesFound += "VPN interface is down"
}

if (-not $vpnIP) {
    $issuesFound += "No IP address on VPN interface"
}

if ($issuesFound.Count -eq 0) {
    Write-OK "No major issues detected!"
    Write-Info "If traffic is still blocked, try the following:"
    Write-Info "  1. Disconnect and reconnect VPN"
    Write-Info "  2. Disable kill switch temporarily"
    Write-Info "  3. Check WireGuard configuration file"
} else {
    Write-Host "Issues found:" -ForegroundColor Yellow
    foreach ($issue in $issuesFound) {
        Write-Host "  ✗ $issue" -ForegroundColor Red
    }
}

if ($DiagnoseOnly) {
    Write-Host "`nDiagnosis complete (no fixes applied)" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 0
}

# ============================================================================
# FIX OPERATIONS
# ============================================================================

if ($RemoveAllRules) {
    Write-Host "`n========================================================" -ForegroundColor Red
    Write-Host "         REMOVE ALL NEBULA VPN RULES                   " -ForegroundColor Red
    Write-Host "========================================================`n" -ForegroundColor Red
    
    Write-Warn "This will remove ALL Nebula VPN firewall rules"
    Write-Warn "Kill switch protection will be DISABLED"
    $confirm = Read-Host "Continue? (yes/no)"
    
    if ($confirm -eq "yes") {
        Write-Step "Removing all Nebula VPN firewall rules..."
        
        foreach ($rule in $nebulaRules) {
            try {
                Remove-NetFirewallRule -Name $rule.Name -ErrorAction Stop
                Write-OK "Removed: $($rule.Name)"
            } catch {
                Write-Error "Failed to remove $($rule.Name): $($_.Exception.Message)"
            }
        }
        
        Write-OK "All rules removed. You can now reconnect VPN to recreate them."
    } else {
        Write-Info "Cancelled"
    }
    
    Read-Host "Press Enter to exit"
    exit 0
}

if ($FixAll -or $issuesFound.Count -gt 0) {
    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "              APPLYING FIXES" -ForegroundColor Green
    Write-Host "========================================================`n" -ForegroundColor Green
    
    if ($needsInterfaceFix) {
        Write-Step "Creating interface allow rule..."
        
        try {
            # Create PowerShell rule to allow all traffic through VPN interface
            $ruleName = "NebulaVPN-AllowVPNInterface"
            
            # Remove existing rule if present
            $existingRule = Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
            if ($existingRule) {
                Remove-NetFirewallRule -Name $ruleName -ErrorAction Stop
                Write-Info "Removed existing rule"
            }
            
            # Create new rule using PowerShell with InterfaceAlias parameter
            New-NetFirewallRule `
                -Name $ruleName `
                -DisplayName "Nebula VPN - Allow VPN Interface" `
                -Description "Allow all traffic through the Nebula VPN tunnel interface" `
               -Direction Outbound `
                -Action Allow `
                -Enabled True `
                -Profile Any `
                -InterfaceAlias $vpnName `
                -ErrorAction Stop | Out-Null
            
            Write-OK "Created interface allow rule"
            Write-Info "Rule name: $ruleName"
            Write-Info "Interface: $vpnName"
            
        } catch {
            Write-Error "Failed to create interface rule: $($_.Exception.Message)"
        }
    }
    
    if ($needsRoutingFix) {
        Write-Step "Fixing default gateway routing..."
        Write-Warn "Routing fixes are complex and may disrupt connectivity"
        Write-Info "Best option: Disconnect and reconnect VPN to reset routes"
        
        $confirm = Read-Host "Attempt automatic routing fix? (yes/no)"
        if ($confirm -eq "yes") {
            try {
                # Force VPN to be default gateway by adjusting interface metric
                Set-NetIPInterface -InterfaceIndex $vpnIndex -InterfaceMetric 5 -ErrorAction Stop
                Write-OK "Set VPN interface metric to 5 (high priority)"
                
                # Lower metric on all other interfaces
                $otherInterfaces = Get-NetAdapter | Where-Object {
                    $_.InterfaceIndex -ne $vpnIndex -and $_.Status -eq "Up"
                }
                
                foreach ($iface in $otherInterfaces) {
                    try {
                        Set-NetIPInterface -InterfaceIndex $iface.InterfaceIndex -InterfaceMetric 50 -ErrorAction Stop
                        Write-Info "Set $($iface.Name) metric to 50"
                    } catch {
                        Write-Warn "Could not adjust $($iface.Name)"
                    }
                }
                
                Write-OK "Routing adjustments complete"
                
            } catch {
                Write-Error "Failed to fix routing: $($_.Exception.Message)"
            }
        } else {
            Write-Info "Skipped routing fix"
        }
    }
    
    Write-Host "`n=========================================" -ForegroundColor Green
    Write-Host "         FIXES APPLIED" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    
    Write-Info "Next steps:"
    Write-Info "  1. Test connectivity: ping 1.1.1.1"
    Write-Info "  2. Test DNS: ping google.com"
    Write-Info "  3. Check external IP: curl ifconfig.me"
    Write-Info "  4. Verify connection: Test-NetConnection -ComputerName google.com -Port 443"
    
} else {
    Write-OK "`nNo automatic fixes needed"
    Write-Info "Run with -FixAll to apply fixes anyway"
}

Write-Host "`nScript completed!" -ForegroundColor Cyan
Read-Host "Press Enter to exit"
