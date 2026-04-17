#!/bin/bash
# SSL Setup Script for Nebula VPN Production API
# Run this on your Digital Ocean droplet as root

set -e  # Exit on error

DOMAIN="api.nebula3ddev.com"
BACKEND_PORT="3001"
EMAIL="" # Will prompt if not set

echo ""
echo "================================================================"
echo "  NEBULA VPN - SSL PRODUCTION SETUP"
echo "================================================================"
echo ""
echo "This script will:"
echo "  1. Install Nginx and Certbot"
echo "  2. Configure reverse proxy"
echo "  3. Get SSL certificate from Let's Encrypt"
echo "  4. Setup auto-renewal"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root: sudo bash setup-ssl.sh"
    exit 1
fi

# Check if backend is running
echo "[1/6] Checking backend status..."
if systemctl is-active --quiet nebula-vpn-server; then
    echo "  ✓ Backend service is running"
else
    echo "  ⚠ Backend service is not running!"
    echo "  Starting backend..."
    systemctl start nebula-vpn-server || {
        echo "  ❌ Failed to start backend. Please fix this first."
        exit 1
    }
fi

# Test backend locally
echo "  Testing backend on port $BACKEND_PORT..."
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    echo "  ✓ Backend is responding"
else
    echo "  ❌ Backend not responding on port $BACKEND_PORT"
    exit 1
fi

# Check DNS
echo ""
echo "[2/6] Checking DNS configuration..."
RESOLVED_IP=$(dig +short $DOMAIN @8.8.8.8 | tail -n1)
CURRENT_IP=$(curl -s ifconfig.me)

if [ -z "$RESOLVED_IP" ]; then
    echo "  ❌ DNS not configured!"
    echo "  Please add A record: $DOMAIN → $CURRENT_IP"
    echo "  Wait 5-10 minutes and run this script again."
    exit 1
elif [ "$RESOLVED_IP" != "$CURRENT_IP" ]; then
    echo "  ⚠ DNS mismatch!"
    echo "  Domain resolves to: $RESOLVED_IP"
    echo "  Server IP is: $CURRENT_IP"
    echo "  Update your DNS A record and try again."
    exit 1
else
    echo "  ✓ DNS correctly configured: $DOMAIN → $CURRENT_IP"
fi

# Install Nginx and Certbot
echo ""
echo "[3/6] Installing Nginx and Certbot..."
apt update -qq
apt install -y nginx certbot python3-certbot-nginx > /dev/null 2>&1
echo "  ✓ Packages installed"

# Configure Nginx
echo ""
echo "[4/6] Configuring Nginx reverse proxy..."

cat > /etc/nginx/sites-available/nebula-vpn-api << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Pass headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        access_log off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/nebula-vpn-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
if nginx -t > /dev/null 2>&1; then
    echo "  ✓ Nginx configuration valid"
    systemctl restart nginx
    echo "  ✓ Nginx restarted"
else
    echo "  ❌ Nginx configuration error"
    nginx -t
    exit 1
fi

# Test HTTP
echo "  Testing HTTP endpoint..."
sleep 2
if curl -s http://$DOMAIN/health > /dev/null; then
    echo "  ✓ HTTP endpoint working"
else
    echo "  ❌ HTTP endpoint not responding"
    exit 1
fi

# Configure firewall
echo ""
echo "[5/6] Configuring firewall..."
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
echo "  ✓ Ports 80 and 443 allowed"

# Get SSL certificate
echo ""
echo "[6/6] Getting SSL certificate from Let's Encrypt..."
echo ""

# Prompt for email if not set
if [ -z "$EMAIL" ]; then
    read -p "Enter your email for SSL renewal notifications: " EMAIL
fi

# Run certbot
certbot --nginx -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect \
    || {
        echo ""
        echo "❌ Certbot failed. Common issues:"
        echo "  - DNS not fully propagated (wait 10 more minutes)"
        echo "  - Port 80 blocked by firewall"
        echo "  - Domain already has certificate"
        echo ""
        echo "Try manual mode: certbot --nginx -d $DOMAIN"
        exit 1
    }

echo ""
echo "================================================================"
echo "  ✅ SSL SETUP COMPLETE!"
echo "================================================================"
echo ""
echo "Your API is now available at: https://$DOMAIN"
echo ""

# Test HTTPS
echo "Testing HTTPS endpoint..."
sleep 2
if curl -s https://$DOMAIN/health > /dev/null; then
    echo "  ✓ HTTPS endpoint working!"
    echo ""
    curl -s https://$DOMAIN/health | python3 -m json.tool || cat
else
    echo "  ⚠ HTTPS endpoint not responding yet (may need a moment)"
fi

echo ""
echo "Next steps:"
echo "  1. Test: curl https://$DOMAIN/health"
echo "  2. Update Windows .env: REACT_APP_API_URL=https://$DOMAIN/api"
echo "  3. Rebuild Electron: npm run electron:build:win"
echo ""
echo "Certificate auto-renewal is configured via systemd timer."
echo "Check status: systemctl status certbot.timer"
echo ""
echo "View Nginx logs:"
echo "  Access: tail -f /var/log/nginx/access.log"
echo "  Errors: tail -f /var/log/nginx/error.log"
echo ""
