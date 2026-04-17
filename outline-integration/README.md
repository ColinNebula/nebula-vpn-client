# Outline VPN Integration

This directory contains the Outline SDK integration for Nebula VPN.

## What is Outline?

Outline is an open-source VPN created by Jigsaw (Google). It's:
- **Production-ready** - Used by millions worldwide
- **Secure** - Built on Shadowsocks protocol
- **Cross-platform** - Windows, Mac, Linux, iOS, Android
- **Free** - Open source, no licensing costs

## Architecture

```
Nebula VPN (Your UI)
      ↓
Your Node.js API
      ↓
Outline Client SDK
      ↓
Outline Server (Shadowsocks)
      ↓
Internet
```

## Setup Steps

### 1. Set Up Outline Server

You need to deploy Outline servers. Options:

**A. DigitalOcean (Easiest)**
```bash
# One-click install
# Cost: $5-10/month per server
# https://cloud.digitalocean.com/droplets/new
```

**B. AWS EC2**
```bash
# Cost: ~$5-15/month
# More control, more complex
```

**C. Your Own Server**
```bash
# Install Outline Manager
# Follow: https://getoutline.org/get-started/
```

### 2. Install Outline Manager (Desktop App)

Download from: https://getoutline.org/get-started/

This gives you:
- Server creation wizard
- Access key generation
- Server management UI

### 3. Create Outline Servers

Using Outline Manager:
1. Click "Add Server"
2. Choose provider (DigitalOcean recommended)
3. Connect your account
4. Deploy server
5. Copy access keys

You'll get access keys like:
```
ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTo=@192.0.2.1:8388/?outline=1
```

### 4. Configure Backend

Add to `server/.env`:
```env
OUTLINE_SERVERS=ss://...@server1:8388,ss://...@server2:8388
```

## Integration Status

✅ Outline SDK cloned
⏳ Server deployment (manual step)
⏳ Access key configuration
⏳ Client integration
⏳ Testing

## Next Steps

1. Deploy Outline servers (see above)
2. Get access keys
3. Configure in backend
4. Test connections
5. Deploy to production

## Cost Breakdown

**Monthly Costs:**
- 3 servers (Free tier): $15-30/month
- 10 servers (Premium): $50-100/month
- 20+ servers (Ultimate): $100-200/month

**One-time:**
- $0 (all open source)

**Total to start:** ~$15/month for 3 locations

## Resources

- Outline Docs: https://getoutline.org/
- Outline Server: https://github.com/Jigsaw-Code/outline-server
- Outline Client: https://github.com/Jigsaw-Code/outline-client
- Deployment Guide: https://support.getoutline.org/
