# SSL Setup for Production API

## Overview

This guide will setup HTTPS for your production API at `https://api.nebula3ddev.com`

**What you'll have:**
- ✅ HTTPS with valid SSL certificate (Let's Encrypt)
- ✅ Auto-renewal of certificates
- ✅ Nginx reverse proxy to backend
- ✅ Professional production setup

**Time:** 10-15 minutes

---

## Step 1: DNS Configuration

### Configure Your Domain DNS

Go to your domain registrar (wherever you bought `nebula3ddev.com`) and add an A record:

```
Type: A
Name: api
Value: 165.227.32.85
TTL: 300 (5 minutes)
```

**Wait 5-10 minutes** for DNS to propagate.

### Verify DNS is Working

**On Windows:**
```powershell
nslookup api.nebula3ddev.com
# Should return: 165.227.32.85
```

**Or test online:** https://dnschecker.org/

Once you see `165.227.32.85`, proceed to Step 2.

---

## Step 2: Install Nginx (On Droplet)

**SSH into your droplet:**
```bash
# From Windows:
ssh root@165.227.32.85
```

**Install Nginx and Certbot:**
```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
```

**Check Nginx is running:**
```bash
systemctl status nginx
```

---

## Step 3: Configure Nginx Reverse Proxy

**Create Nginx configuration:**

```bash
cat > /etc/nginx/sites-available/nebula-vpn-api << 'EOF'
server {
    listen 80;
    server_name api.nebula3ddev.com;

    # Redirect HTTP to HTTPS (will be configured by Certbot)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Pass headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Don't cache
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF
```

**Enable the site:**
```bash
# Create symbolic link
ln -sf /etc/nginx/sites-available/nebula-vpn-api /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

**Test HTTP is working:**
```bash
curl http://api.nebula3ddev.com/health
# Should return: {"status":"healthy",...}
```

---

## Step 4: Get SSL Certificate (Let's Encrypt)

**Run Certbot:**
```bash
certbot --nginx -d api.nebula3ddev.com
```

**During the prompts:**
1. **Email:** Enter your email (for renewal notifications)
2. **Terms:** Agree (type `Y`)
3. **Share email:** Your choice (`N` is fine)
4. **Redirect HTTP to HTTPS:** Choose `2` (Redirect)

**Certbot will automatically:**
- Get SSL certificate
- Configure Nginx with HTTPS
- Setup auto-renewal

**Verify SSL is working:**
```bash
curl https://api.nebula3ddev.com/health
# Should return: {"status":"healthy",...}
```

---

## Step 5: Configure Firewall

```bash
# Allow HTTPS
ufw allow 443/tcp comment 'HTTPS'

# Allow HTTP (for Let's Encrypt renewal)
ufw allow 80/tcp comment 'HTTP redirect'

# Verify
ufw status
```

---

## Step 6: Test from Windows

**On your Windows machine:**

```powershell
# Test HTTPS endpoint
Invoke-WebRequest https://api.nebula3ddev.com/health

# Should show SSL certificate info
Invoke-WebRequest https://api.nebula3ddev.com/health | Select-Object -ExpandProperty BaseResponse | Select-Object -ExpandProperty Headers

# Test API endpoints
Invoke-WebRequest https://api.nebula3ddev.com/api/servers
```

---

## Step 7: Update Your .env (Already Done!)

Your `.env` file should have:
```env
REACT_APP_API_URL=https://api.nebula3ddev.com/api
```

But we changed it to the IP. Let's change it back:

**On Windows, edit `.env`:**
```env
REACT_APP_API_URL=https://api.nebula3ddev.com/api
```

Then rebuild:
```powershell
npm run electron:build:win
```

---

## Certificate Auto-Renewal

Let's Encrypt certificates expire every 90 days, but Certbot sets up automatic renewal.

**Test renewal:**
```bash
certbot renew --dry-run
```

**Check renewal timer:**
```bash
systemctl status certbot.timer
```

It should show `active (waiting)`.

---

## Troubleshooting

### DNS Not Resolving

```bash
# Check DNS
dig api.nebula3ddev.com +short
# Should return: 165.227.32.85

# Wait longer if it doesn't (DNS can take up to 24h but usually 5-10 min)
```

### Certbot Fails

**Common issues:**

1. **DNS not yet propagated:**
   - Wait 10 more minutes and try again

2. **Port 80 not accessible:**
   ```bash
   ufw allow 80/tcp
   systemctl restart nginx
   ```

3. **Backend not running:**
   ```bash
   systemctl status nebula-vpn-server
   systemctl start nebula-vpn-server
   ```

### Nginx Errors

```bash
# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Check if backend is running
curl http://localhost:3001/health

# Restart everything
systemctl restart nebula-vpn-server
systemctl restart nginx
```

### SSL Certificate Not Working

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew --force-renewal

# Check Nginx SSL config
cat /etc/nginx/sites-enabled/nebula-vpn-api | grep ssl
```

---

## Nginx Management Commands

```bash
# Restart Nginx
systemctl restart nginx

# Reload config (no downtime)
systemctl reload nginx

# Check status
systemctl status nginx

# Test config
nginx -t

# View access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log
```

---

## Security Enhancements (Optional)

### Add Rate Limiting

Edit `/etc/nginx/sites-available/nebula-vpn-api` and add at the top:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ... existing config ...
    
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        # ... rest of proxy config ...
    }
}
```

### Enable HSTS

Certbot should add this, but verify in your Nginx config:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Update Backend CORS

**On droplet, edit `/opt/nebula-vpn-server/.env`:**

```bash
nano /opt/nebula-vpn-server/.env
```

Update ALLOWED_ORIGINS to include your HTTPS domain:
```env
ALLOWED_ORIGINS=https://colinnebula.github.io,https://api.nebula3ddev.com,file://
```

Restart backend:
```bash
systemctl restart nebula-vpn-server
```

---

## Complete Setup Verification

Run these tests from Windows:

```powershell
# 1. Test HTTPS health
Invoke-WebRequest https://api.nebula3ddev.com/health

# 2. Test API endpoint
Invoke-WebRequest https://api.nebula3ddev.com/api/servers

# 3. Verify SSL certificate
$request = [System.Net.WebRequest]::Create("https://api.nebula3ddev.com/health")
$request.GetResponse().Dispose()
Write-Host "SSL Valid - Certificate issued by Let's Encrypt" -ForegroundColor Green

# 4. Test from browser
Start-Process "https://api.nebula3ddev.com/health"
```

---

## Summary

✅ **Before:** `http://165.227.32.85:3001/api` (insecure, IP-based)  
✅ **After:** `https://api.nebula3ddev.com/api` (secure, professional)

**Benefits:**
- 🔒 Encrypted traffic (SSL/TLS)
- ✅ Valid SSL certificate (trusted by browsers)
- 🌐 Professional domain name
- 🔄 Auto-renewal (no maintenance)
- 🚀 Better performance (Nginx caching)
- 🛡️ Additional security layer

---

## Quick Reference

| Resource | Value |
|----------|-------|
| **Domain** | api.nebula3ddev.com |
| **IP Address** | 165.227.32.85 |
| **HTTPS Port** | 443 |
| **HTTP Port** | 80 (redirects to HTTPS) |
| **Backend Port** | 3001 (internal) |
| **Nginx Config** | /etc/nginx/sites-available/nebula-vpn-api |
| **SSL Cert Path** | /etc/letsencrypt/live/api.nebula3ddev.com/ |
| **Logs** | /var/log/nginx/ |

---

## Next Steps After SSL Setup

1. ✅ Update `.env` to use HTTPS URL
2. ✅ Rebuild Electron app
3. ✅ Test VPN connection through new endpoint
4. ⏳ Setup monitoring/alerts
5. ⏳ Configure backups
6. ⏳ Setup staging environment

**Need help?** Check the Troubleshooting section or run diagnostics:

```bash
# On droplet - full diagnostic
systemctl status nginx nebula-vpn-server
curl http://localhost:3001/health
curl https://api.nebula3ddev.com/health
certbot certificates
```
