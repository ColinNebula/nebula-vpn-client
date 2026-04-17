# VERIFY-WIREGUARD-STATUS.ps1
# Quick verification of WireGuard production setup status

Write-Host "🔍 Nebula VPN - WireGuard Status Verification" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Function: Check Client Configuration Status
function Check-ClientConfiguration {
    Write-Host "📱 CLIENT CONFIGURATION STATUS" -ForegroundColor Yellow
    Write-Host "------------------------------" -ForegroundColor Yellow
    
    $status = @{
        VpnTunnelJs = $false
        ServerEnv = $false
        Details = @()
    }
    
    # Check vpn-tunnel.js
    $vpnTunnelPath = ".\electron\vpn-tunnel.js"
    if (Test-Path $vpnTunnelPath) {
        $content = Get-Content $vpnTunnelPath -Raw
        
        if ($content -match 'this\.FORCE_DEV_MODE\s*=\s*false') {
            Write-Host "✅ vpn-tunnel.js: PRODUCTION MODE (Real WireGuard)" -ForegroundColor Green
            $status.VpnTunnelJs = $true
        }
        elseif ($content -match 'this\.FORCE_DEV_MODE\s*=.*process\.env\.NODE_ENV.*development') {
            Write-Host "⚠️  vpn-tunnel.js: DEVELOPMENT MODE (Bypass WireGuard)" -ForegroundColor Yellow
            $status.Details += "Set FORCE_DEV_MODE = false for production"
        }
        else {
            Write-Host "❓ vpn-tunnel.js: Unknown FORCE_DEV_MODE configuration" -ForegroundColor Red
            $status.Details += "Check FORCE_DEV_MODE setting in vpn-tunnel.js"
        }
    } else {
        Write-Host "❌ vpn-tunnel.js: File not found!" -ForegroundColor Red
        $status.Details += "Missing electron/vpn-tunnel.js file"
    }
    
    # Check server .env
    $envPath = ".\server\.env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath
        $envSettings = @{}
        
        foreach ($line in $envContent) {
            if ($line -match '^([^#]*?)=(.*)$') {
                $envSettings[$matches[1]] = $matches[2]
            }
        }
        
        Write-Host ""
        Write-Host "📊 SERVER ENVIRONMENT SETTINGS:" -ForegroundColor Cyan
        
        # Check ALLOW_INSECURE_WG_DEV
        if ($envSettings.ContainsKey('ALLOW_INSECURE_WG_DEV')) {
            if ($envSettings['ALLOW_INSECURE_WG_DEV'] -eq 'false') {
                Write-Host "✅ ALLOW_INSECURE_WG_DEV: false (Production)" -ForegroundColor Green
                $status.ServerEnv = $true
            } else {
                Write-Host "⚠️  ALLOW_INSECURE_WG_DEV: true (Development)" -ForegroundColor Yellow
                $status.Details += "Set ALLOW_INSECURE_WG_DEV=false for production"
            }
        } else {
            Write-Host "❓ ALLOW_INSECURE_WG_DEV: Not set" -ForegroundColor Red
            $status.Details += "Add ALLOW_INSECURE_WG_DEV=false to .env"
        }
        
        # Check WireGuard settings
        $wgSettings = @('WG_SERVER_PUBLIC_KEY', 'WG_SERVER_ENDPOINT', 'WG_DNS')
        foreach ($setting in $wgSettings) {
            if ($envSettings.ContainsKey($setting) -and $envSettings[$setting]) {
                $value = $envSettings[$setting]
                if ($setting -eq 'WG_SERVER_PUBLIC_KEY') {
                    $displayValue = $value.Substring(0, [Math]::Min(20, $value.Length)) + "..."
                } else {
                    $displayValue = $value
                }
                Write-Host "✅ $setting`: $displayValue" -ForegroundColor Green
            } else {
                Write-Host "❌ $setting`: Not configured" -ForegroundColor Red
                $status.Details += "Configure $setting in .env file"
            }
        }
        
    } else {
        Write-Host "❌ server .env: File not found!" -ForegroundColor Red
        $status.Details += "Missing server/.env file"
    }
    
    return $status
}

# Function: Test Network Connectivity
function Test-NetworkConnectivity {
    Write-Host ""
    Write-Host "🌐 NETWORK CONNECTIVITY" -ForegroundColor Yellow
    Write-Host "-----------------------" -ForegroundColor Yellow
    
    # Test internet connectivity
    try {
        $response = Invoke-WebRequest -Uri "https://httpbin.org/ip" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            $ipInfo = $response.Content | ConvertFrom-Json
            Write-Host "✅ Internet: Connected" -ForegroundColor Green
            Write-Host "📍 Public IP: $($ipInfo.origin)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Internet: Connection failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Test DNS resolution
    try {
        $dnsTest = Resolve-DnsName -Name "google.com" -Type A -ErrorAction Stop
        Write-Host "✅ DNS: Working" -ForegroundColor Green
    } catch {
        Write-Host "❌ DNS: Resolution failed" -ForegroundColor Red
    }
}

# Function: Show Setup Recommendations
function Show-SetupRecommendations {
    param([object]$Status)
    
    Write-Host ""
    Write-Host "💡 SETUP RECOMMENDATIONS" -ForegroundColor Yellow
    Write-Host "========================" -ForegroundColor Yellow
    
    if ($Status.VpnTunnelJs -and $Status.ServerEnv -and ($Status.Details.Count -eq 0)) {
        Write-Host "🎉 Configuration looks good for production WireGuard!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Next steps:" -ForegroundColor Cyan
        Write-Host "1. Run: npm run electron-dev" -ForegroundColor White
        Write-Host "2. Test VPN connection in the app" -ForegroundColor White
        Write-Host "3. Verify IP/DNS with: https://whatismyip.com" -ForegroundColor White
    } else {
        Write-Host "🔧 Configuration needs updates for production:" -ForegroundColor Yellow
        Write-Host ""
        
        foreach ($detail in $Status.Details) {
            Write-Host "• $detail" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "🚀 Quick fix:" -ForegroundColor Cyan
        Write-Host "Run: .\SETUP-PRODUCTION-WIREGUARD.ps1 -ClientSetup" -ForegroundColor White
    }
}

# Main execution
$status = Check-ClientConfiguration
Test-NetworkConnectivity
Show-SetupRecommendations -Status $status

Write-Host ""
Write-Host "🔍 Status check complete!" -ForegroundColor Green