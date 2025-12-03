# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Nebula VPN seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Security vulnerabilities should **never** be reported through public GitHub issues. This protects our users while we work on a fix.

### 2. Report Privately

Please report security vulnerabilities by emailing:

**security@nebulavpn.com**

Or use GitHub's private vulnerability reporting feature if available.

### 3. Include Details

When reporting, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: What could an attacker achieve?
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Affected Version(s)**: Which version(s) are affected
- **Potential Fix**: If you have suggestions for fixing the issue
- **Your Contact Info**: So we can follow up with questions

### 4. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depending on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

## Security Measures

### Application Security

Nebula VPN implements multiple layers of security:

#### Electron Security
- ✅ `nodeIntegration: false` - Prevents direct Node.js access from renderer
- ✅ `contextIsolation: true` - Isolates preload scripts from web content
- ✅ `enableRemoteModule: false` - Disables deprecated remote module
- ✅ `webSecurity: true` - Enforces same-origin policy
- ✅ Secure preload scripts for IPC communication

#### Server Security
- ✅ Helmet.js for HTTP security headers
- ✅ CORS with strict origin validation
- ✅ Rate limiting to prevent abuse
- ✅ Input sanitization and validation
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Request size limits

#### Data Security
- ✅ Encrypted storage for sensitive data
- ✅ Secure session management
- ✅ JWT with secure configuration
- ✅ No hardcoded secrets
- ✅ Environment-based configuration

### Content Security Policy

Our CSP headers protect against:
- Cross-site scripting (XSS)
- Data injection attacks
- Clickjacking
- Mixed content

### Authentication

- JWT tokens with secure signing
- Token expiration and refresh
- Brute force protection
- Account lockout after failed attempts

## Security Best Practices for Users

### Keep Updated
Always use the latest version of Nebula VPN to ensure you have the latest security patches.

### Environment Variables
1. Never commit `.env` files to version control
2. Use strong, unique values for all secrets
3. Rotate secrets regularly
4. Use different secrets for development and production

### Secure Deployment
1. Always use HTTPS in production
2. Enable HSTS headers
3. Use secure cookie settings
4. Implement proper logging and monitoring

## Vulnerability Disclosure

We believe in responsible disclosure. After a vulnerability is fixed:

1. We will credit the reporter (if desired)
2. We will publish a security advisory
3. We will provide upgrade instructions
4. We will document the fix in our changelog

## Security Tools

We provide security scripts to help maintain security:

```bash
# Run security audit
npm run security:audit

# Prepare for GitHub (removes secrets, checks security)
npm run security:prepare

# Full security check before release
npm run security:check
```

## Third-Party Dependencies

We regularly audit our dependencies using:
- `npm audit` for known vulnerabilities
- Dependabot for automatic updates
- Manual review of critical dependencies

## Bug Bounty

We do not currently have a bug bounty program, but we deeply appreciate security researchers who help keep Nebula VPN secure. All legitimate reports will be acknowledged.

## Contact

For security concerns:
- Email: security@nebulavpn.com
- PGP Key: [Available upon request]

For general inquiries:
- GitHub Issues (non-security bugs)
- Email: support@nebulavpn.com

---

Thank you for helping keep Nebula VPN and our users safe! 🔒
