# Backend Server Test

Test the backend API endpoints.

## Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T...",
  "uptime": 123.456
}
```

## Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"<your-password>","name":"Your Name"}'
```

Save the `token` from the response!

## Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"<your-password>"}'
```

## Get Servers (with authentication)

Replace `YOUR_TOKEN` with the actual token:

```bash
curl http://localhost:3001/api/servers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Connect to VPN

```bash
curl -X POST http://localhost:3001/api/vpn/connect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"serverId\":\"1\"}"
```

## Get VPN Status

```bash
curl http://localhost:3001/api/vpn/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Disconnect from VPN

```bash
curl -X POST http://localhost:3001/api/vpn/disconnect \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Get Traffic Stats

```bash
curl http://localhost:3001/api/vpn/traffic \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Upgrade Plan

```bash
curl -X POST http://localhost:3001/api/user/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"plan\":\"premium\"}"
```

## Test Multi-Hop (Premium required)

```bash
curl -X POST http://localhost:3001/api/vpn/multihop \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"serverIds\":[\"1\",\"2\"]}"
```

---

## Using from Browser Console

Open your React app in browser, then in console:

```javascript
// Import the API service
const api = require('./services/api').default;

// Register
await api.register('your@email.com', '<your-password>', 'Your Name');

// Login
const result = await api.login('your@email.com', '<your-password>');
console.log('Logged in:', result);

// Get servers
const servers = await api.getServers();
console.log('Servers:', servers);

// Connect
const connected = await api.connectVPN('1');
console.log('Connected:', connected);

// Get status
const status = await api.getVPNStatus();
console.log('Status:', status);
```
