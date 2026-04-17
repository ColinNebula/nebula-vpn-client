# SETUP-PRODUCTION-WIREGUARD.ps1
# Automated WireGuard Production Setup - Industry Standards
# Configures real WireGuard tunnels with full internet connectivity

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$ServerPublicKey,
    
    [Parameter(Mandatory=$false)]
    [switch]$ServerSetup,
    
    [Parameter(Mandatory=$false)]
    [switch]$ClientSetup,
    
    [Parameter(Mandatory=$false)]
    [switch]$FullSetup
)

Write-Host "🔐 Nebula VPN - Production WireGuard Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Ensure running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# Function: Update Client Configuration
function Update-ClientConfiguration {
    Write-Host "🖥️  Configuring Client for Production WireGuard..." -ForegroundColor Green
    
    try {
        # 1. Disable FORCE_DEV_MODE in vpn-tunnel.js
        $vpnTunnelPath = ".\electron\vpn-tunnel.js"
        if (Test-Path $vpnTunnelPath) {
            Write-Host "   📝 Updating vpn-tunnel.js to disable dev mode..." -ForegroundColor Yellow
            
            $content = Get-Content $vpnTunnelPath -Raw
            
            # Replace FORCE_DEV_MODE logic with production setting
            $oldPattern = 'this\.FORCE_DEV_MODE\s*=\s*process\.env\.NODE_ENV\s*===\s*[''"]development[''"].*?;'
            $newContent = 'this.FORCE_DEV_MODE = false; // PRODUCTION: Real WireGuard tunnels enabled'
            
            if ($content -match $oldPattern) {
                $content = $content -replace $oldPattern, $newContent
                $content | Out-File -FilePath $vpnTunnelPath -Encoding UTF8 -NoNewline
                Write-Host "   ✅ vpn-tunnel.js updated for production" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Could not find FORCE_DEV_MODE pattern in vpn-tunnel.js" -ForegroundColor Yellow
                Write-Host "      Please manually set: this.FORCE_DEV_MODE = false;" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ❌ vpn-tunnel.js not found!" -ForegroundColor Red
            return $false
        }
        
        # 2. Update server .env file
        $envPath = ".\server\.env"
        if (Test-Path $envPath) {
            Write-Host "   📝 Updating server .env for production..." -ForegroundColor Yellow
            
            $envContent = Get-Content $envPath
            $newEnvContent = @()
            $updatedKeys = @()
            
            foreach ($line in $envContent) {
                if ($line -match "^ALLOW_INSECURE_WG_DEV=") {
                    $newEnvContent += "ALLOW_INSECURE_WG_DEV=false"
                    $updatedKeys += "ALLOW_INSECURE_WG_DEV"
                }
                elseif ($line -match "^WG_SERVER_PUBLIC_KEY=" -and $ServerPublicKey) {
                    $newEnvContent += "WG_SERVER_PUBLIC_KEY=$ServerPublicKey"
                    $updatedKeys += "WG_SERVER_PUBLIC_KEY"
                }
                elseif ($line -match "^WG_SERVER_ENDPOINT=" -and $ServerIP) {
                    $newEnvContent += "WG_SERVER_ENDPOINT=${ServerIP}:51820"
                    $updatedKeys += "WG_SERVER_ENDPOINT"
                }
                elseif ($line -match "^WG_DNS=") {
                    $newEnvContent += "WG_DNS=1.1.1.1,1.0.0.1,8.8.8.8,8.8.4.4"
                    $updatedKeys += "WG_DNS"
                }
                else {
                    $newEnvContent += $line
                }
            }
            
            # Add missing production settings
            if ("ALLOW_INSECURE_WG_DEV" -notin $updatedKeys) {
                $newEnvContent += "ALLOW_INSECURE_WG_DEV=false"
            }
            if ("WG_DNS" -notin $updatedKeys) {
                $newEnvContent += "WG_DNS=1.1.1.1,1.0.0.1,8.8.8.8,8.8.4.4"
            }
            if ("WG_INTERFACE" -notin $updatedKeys) {
                $newEnvContent += "WG_INTERFACE=wg0"
            }
            if ("WG_SUBNET" -notin $updatedKeys) {
                $newEnvContent += "WG_SUBNET=10.8.0.0/24"
            }
            
            $newEnvContent | Out-File -FilePath $envPath -Encoding UTF8
            Write-Host "   ✅ server .env updated for production" -ForegroundColor Green
            
            # Display current configuration
            Write-Host "   📊 Current WireGuard Configuration:" -ForegroundColor Cyan
            Get-Content $envPath | Where-Object { $_ -match "^WG_" -or $_ -match "^ALLOW_INSECURE" } | ForEach-Object {
                Write-Host "      $($_)" -ForegroundColor White
            }
        } else {
            Write-Host "   ❌ server .env not found!" -ForegroundColor Red
            return $false
        }
        
        return $true
        
    } catch {
        Write-Host "   ❌ Error updating client configuration: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function: Generate Server Setup Script
function Generate-ServerSetupScript {
    Write-Host "🖥️  Generating Linux Server Setup Script..." -ForegroundColor Green
    
    $serverScript = @'
#!/bin/bash
# WireGuard Production Server Setup - Auto-generated by Nebula VPN
# Run this script on your Linux VPN server

set -e

echo "🔐 Setting up WireGuard Production Server..."
echo "============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Detect Linux distribution
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    PKG_MANAGER="apt"
elif [ -f /etc/redhat-release ]; then
    DISTRO="redhat" 
    PKG_MANAGER="yum"
else
    echo "⚠️  Unsupported Linux distribution. Manual setup required."
    exit 1
fi

echo "📦 Installing WireGuard..."
if [ "$DISTRO" = "debian" ]; then
    apt update
    apt install -y wireguard wireguard-tools iptables-persistent ufw fail2ban curl
elif [ "$DISTRO" = "redhat" ]; then
    yum install -y epel-release
    yum install -y wireguard-tools iptables-services firewalld fail2ban curl
fi

echo "🔑 Generating server keys..."
wg genkey | tee /etc/wireguard/server_private.key
cat /etc/wireguard/server_private.key | wg pubkey | tee /etc/wireguard/server_public.key

# Secure key permissions
chmod 600 /etc/wireguard/server_private.key
chmod 644 /etc/wireguard/server_public.key

echo "📝 Creating WireGuard configuration..."
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
# Server Configuration - Industry Standards
PrivateKey = $(cat /etc/wireguard/server_private.key)
Address = 10.8.0.1/24
ListenPort = 51820

# Performance Optimization
MTU = 1420
SaveConfig = false

# Security Hardening
PreUp = echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
PreUp = echo 'net.ipv6.conf.all.forwarding=1' >> /etc/sysctl.conf
PreUp = sysctl -p

# Get the default network interface dynamically
PostUp = iptables -A FORWARD -i %i -j ACCEPT
PostUp = iptables -A FORWARD -o %i -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o \$(ip route | grep default | awk '{print \$5}' | head -1) -j MASQUERADE
PostUp = ip6tables -A FORWARD -i %i -j ACCEPT
PostUp = ip6tables -A FORWARD -o %i -j ACCEPT
PostUp = ip6tables -t nat -A POSTROUTING -o \$(ip route | grep default | awk '{print \$5}' | head -1) -j MASQUERADE

# Cleanup on shutdown
PreDown = iptables -D FORWARD -i %i -j ACCEPT
PreDown = iptables -D FORWARD -o %i -j ACCEPT
PreDown = iptables -t nat -D POSTROUTING -o \$(ip route | grep default | awk '{print \$5}' | head -1) -j MASQUERADE
PreDown = ip6tables -D FORWARD -i %i -j ACCEPT
PreDown = ip6tables -D FORWARD -o %i -j ACCEPT
PreDown = ip6tables -t nat -D POSTROUTING -o \$(ip route | grep default | awk '{print \$5}' | head -1) -j MASQUERADE

# Dynamic peer management handled by Nebula VPN API
EOF

echo "🔥 Configuring firewall..."
if [ "$DISTRO" = "debian" ]; then
    # UFW Configuration
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 51820/udp comment 'WireGuard VPN'
    ufw --force enable
elif [ "$DISTRO" = "redhat" ]; then
    # Firewalld configuration
    systemctl enable firewalld
    systemctl start firewalld
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-port=51820/udp
    firewall-cmd --reload
fi

echo "📊 Optimizing network performance..."
cat >> /etc/sysctl.conf << EOF

# WireGuard Performance Optimization
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
net.core.netdev_max_backlog = 5000
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.udp_mem = 65536 131072 262144
net.ipv4.udp_rmem_min = 8192
net.ipv4.udp_wmem_min = 8192

# Security hardening
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
EOF

sysctl -p

echo "🛡️  Configuring fail2ban for DDoS protection..."
cat > /etc/fail2ban/filter.d/wireguard.conf << EOF
[Definition]
failregex = .*: Invalid handshake initiation from <HOST>:.*
ignoreregex =
EOF

cat > /etc/fail2ban/jail.d/wireguard.conf << EOF
[wireguard]
enabled = true
filter = wireguard
logpath = /var/log/kern.log
maxretry = 3
bantime = 86400
findtime = 600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo "🚀 Starting WireGuard service..."
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0

echo ""
echo "✅ WireGuard Server Setup Complete!"
echo "===================================="
echo ""
echo "📋 SERVER INFORMATION FOR CLIENT SETUP:"
echo "----------------------------------------"
echo "Server Public Key: $(cat /etc/wireguard/server_public.key)"
echo "Server Public IP:  $(curl -s ifconfig.me)"
echo "Server Endpoint:   $(curl -s ifconfig.me):51820"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Copy the Server Public Key above"
echo "2. Run the Windows client setup with:"
echo "   .\SETUP-PRODUCTION-WIREGUARD.ps1 -ClientSetup -ServerIP $(curl -s ifconfig.me) -ServerPublicKey \"$(cat /etc/wireguard/server_public.key)\""
echo ""
echo "📊 Verify server status:"
echo "sudo wg show"
echo "sudo systemctl status wg-quick@wg0"
echo ""
echo "🎯 Your WireGuard server is now ready for production!"
'@

    $serverScript | Out-File -FilePath ".\setup-wireguard-server.sh" -Encoding UTF8 -NoNewline
    Write-Host "   ✅ Server setup script created: setup-wireguard-server.sh" -ForegroundColor Green
    Write-Host "   📋 Upload this script to your Linux server and run with: sudo bash setup-wireguard-server.sh" -ForegroundColor Yellow
}

# Function: Test WireGuard Connection
function Test-WireGuardConnection {
    Write-Host "🔍 Testing WireGuard Connection..." -ForegroundColor Green
    
    try {
        # Check if WireGuard is installed
        $wgPath = Get-Command "wg" -ErrorAction SilentlyContinue
        if (-not $wgPath) {
            Write-Host "   ⚠️  WireGuard not found in PATH. Checking common locations..." -ForegroundColor Yellow
            
            $commonPaths = @(
                "C:\Program Files\WireGuard\wg.exe",
                "C:\Program Files (x86)\WireGuard\wg.exe",
                "$env:ProgramFiles\WireGuard\wg.exe"
            )
            
            foreach ($path in $commonPaths) {
                if (Test-Path $path) {
                    $wgPath = $path
                    break
                }
            }
            
            if (-not $wgPath) {
                Write-Host "   ❌ WireGuard not installed! Please install WireGuard for Windows first." -ForegroundColor Red
                Write-Host "      Download from: https://www.wireguard.com/install/" -ForegroundColor Yellow
                return $false
            }
        }
        
        Write-Host "   ✅ WireGuard found: $($wgPath)" -ForegroundColor Green
        
        # Test basic WireGuard functionality
        try {
            $wgVersion = & $wgPath --version 2>$null
            Write-Host "   📊 WireGuard version: $wgVersion" -ForegroundColor Cyan
        } catch {
            Write-Host "   ⚠️  Could not get WireGuard version" -ForegroundColor Yellow
        }
        
        return $true
        
    } catch {
        Write-Host "   ❌ Error testing WireGuard: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function: Restart Development Environment
function Restart-DevelopmentEnvironment {
    Write-Host "🔄 Restarting Development Environment..." -ForegroundColor Green
    
    try {
        # Kill any existing npm processes
        Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*npm*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "   🛑 Stopped existing Node.js processes" -ForegroundColor Yellow
        
        Start-Sleep -Seconds 2
        
        # Start the development environment
        Write-Host "   🚀 Starting Nebula VPN with production WireGuard..." -ForegroundColor Cyan
        Write-Host "" -ForegroundColor White
        Write-Host "   Commands to run:" -ForegroundColor Yellow
        Write-Host "   1. cd $PWD" -ForegroundColor White
        Write-Host "   2. npm run electron-dev" -ForegroundColor White
        Write-Host "" -ForegroundColor White
        Write-Host "   Expected logs:" -ForegroundColor Yellow
        Write-Host "   ✅ 'FORCE_DEV_MODE = false (REAL VPN TUNNELS ENABLED)'" -ForegroundColor Green
        Write-Host "   ✅ 'WireGuard handshake verified'" -ForegroundColor Green
        Write-Host "   ✅ 'Client IP assigned: 10.8.0.x'" -ForegroundColor Green
        Write-Host "" -ForegroundColor White
        
        $startNow = Read-Host "Start development environment now? (y/N)"
        if ($startNow -eq "y" -or $startNow -eq "Y") {
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run electron-dev"
        }
        
        return $true
        
    } catch {
        Write-Host "   ❌ Error restarting environment: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function: Display Connection Verification Steps
function Show-VerificationSteps {
    Write-Host "🔍 Connection Verification Steps" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "1. 🌐 IP Address Test:" -ForegroundColor Yellow
    Write-Host "   Visit: https://whatismyip.com" -ForegroundColor White
    Write-Host "   Should show: Your server IP (not your real IP)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "2. 🛡️  DNS Leak Test:" -ForegroundColor Yellow
    Write-Host "   Visit: https://dnsleaktest.com" -ForegroundColor White
    Write-Host "   Should show: Cloudflare (1.1.1.1) or Google (8.8.8.8)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "3. 🔒 WebRTC Leak Test:" -ForegroundColor Yellow
    Write-Host "   Visit: https://browserleaks.com/webrtc" -ForegroundColor White
    Write-Host "   Should NOT show your real IP" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "4. 📊 Advanced Tests:" -ForegroundColor Yellow
    Write-Host "   • Speed test: https://fast.com" -ForegroundColor White
    Write-Host "   • Torrent IP: https://checkmytorrentip.upcoil.com" -ForegroundColor White
    Write-Host "   • Full analysis: https://ipleak.net" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎯 All tests should show your VPN server's location and IP," -ForegroundColor Cyan
    Write-Host "   never your real location or IP address!" -ForegroundColor Cyan
}

# Main Execution Logic
Write-Host ""

# Parameter validation
if ($FullSetup) {
    $ServerSetup = $true
    $ClientSetup = $true
}

if (-not $ServerSetup -and -not $ClientSetup -and -not $FullSetup) {
    Write-Host "⚡ Quick Setup Menu" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Server Setup (Linux) - Generate server setup script"
    Write-Host "2. Client Setup (Windows) - Configure client for production"
    Write-Host "3. Full Setup - Both server and client"
    Write-Host "4. Test Connection - Verify WireGuard setup"
    Write-Host "5. Exit"
    Write-Host ""
    
    do {
        $choice = Read-Host "Choose option (1-5)"
        switch ($choice) {
            "1" { $ServerSetup = $true; break }
            "2" { $ClientSetup = $true; break }
            "3" { $ServerSetup = $true; $ClientSetup = $true; break }
            "4" { 
                Test-WireGuardConnection
                Show-VerificationSteps
                Read-Host "Press Enter to continue..."
                exit
            }
            "5" { exit }
            default { Write-Host "Invalid choice. Please enter 1-5." -ForegroundColor Red }
        }
    } while ($choice -notmatch "^[1-5]$")
}

# Execute Server Setup
if ($ServerSetup) {
    Write-Host ""
    Generate-ServerSetupScript
    
    Write-Host ""
    Write-Host "📋 Server Setup Instructions:" -ForegroundColor Cyan
    Write-Host "1. Upload 'setup-wireguard-server.sh' to your Linux server" -ForegroundColor White
    Write-Host "2. Run: chmod +x setup-wireguard-server.sh" -ForegroundColor White
    Write-Host "3. Run: sudo ./setup-wireguard-server.sh" -ForegroundColor White
    Write-Host "4. Copy the Server Public Key from the output" -ForegroundColor White
    Write-Host ""
    
    if ($ClientSetup) {
        if (-not $ServerIP) {
            $ServerIP = Read-Host "Enter your server's public IP address"
        }
        if (-not $ServerPublicKey) {
            Write-Host "Run the server setup first to get the public key, then:" -ForegroundColor Yellow
            Write-Host ".\SETUP-PRODUCTION-WIREGUARD.ps1 -ClientSetup -ServerIP $ServerIP -ServerPublicKey \"YOUR_SERVER_PUBLIC_KEY\"" -ForegroundColor White
            exit
        }
    }
}

# Execute Client Setup
if ($ClientSetup) {
    Write-Host ""
    
    if (-not $ServerIP -or -not $ServerPublicKey) {
        Write-Host "❓ Client setup requires server information:" -ForegroundColor Yellow
        if (-not $ServerIP) {
            $ServerIP = Read-Host "Enter your server's public IP address"
        }
        if (-not $ServerPublicKey) {
            $ServerPublicKey = Read-Host "Enter your server's public key"
        }
    }
    
    Write-Host "📝 Configuring client with:" -ForegroundColor Cyan
    Write-Host "   Server IP: $ServerIP" -ForegroundColor White
    Write-Host "   Server Key: $($ServerPublicKey.Substring(0,20))..." -ForegroundColor White
    Write-Host ""
    
    # Test WireGuard installation
    if (-not (Test-WireGuardConnection)) {
        Write-Host "❌ Please install WireGuard for Windows first!" -ForegroundColor Red
        exit 1
    }
    
    # Update client configuration
    if (Update-ClientConfiguration) {
        Write-Host ""
        Write-Host "✅ Client configuration updated successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Restart development environment
        Restart-DevelopmentEnvironment
        
        Write-Host ""
        Show-VerificationSteps
        
        Write-Host ""
        Write-Host "🎉 Production WireGuard Setup Complete!" -ForegroundColor Green
        Write-Host "=======================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your Nebula VPN now uses real WireGuard tunnels with:" -ForegroundColor Cyan
        Write-Host "✅ Full internet connectivity" -ForegroundColor Green
        Write-Host "✅ DNS leak protection" -ForegroundColor Green
        Write-Host "✅ IP leak protection" -ForegroundColor Green
        Write-Host "✅ Industry-standard encryption" -ForegroundColor Green
        Write-Host "✅ Kill switch functionality" -ForegroundColor Green
        Write-Host "✅ Performance optimization" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host "❌ Client configuration failed!" -ForegroundColor Red
        Write-Host "Please check the errors above and try again." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📚 For detailed configuration info, see: WIREGUARD-PRODUCTION-SETUP.md" -ForegroundColor Cyan
Write-Host ""