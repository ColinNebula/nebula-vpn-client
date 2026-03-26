# Nebula VPN - Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - March 26, 2026

#### 🔐 Database Security
- **Column-level encryption** for sensitive user data using AES-256-GCM
  - Two-factor authentication secrets encrypted at rest
  - OAuth provider tokens encrypted at rest
  - 2FA backup codes encrypted at rest
  - Automatic encryption/decryption transparent to application code
- **Encryption key management** via `ENCRYPTION_KEY` environment variable
- **Migration script** for encrypting existing database data: `server/src/migrations/encrypt-existing-data.js`
- **Idempotent encryption** - migration safely handles already-encrypted data
- See [server/DATABASE_ENCRYPTION.md](server/DATABASE_ENCRYPTION.md) for details

#### 🛡️ DNS Enforcement Verification
- **Administrator privilege detection** on Electron app startup
- **Elevation prompt dialog** when admin privileges are missing
  - Option to restart as Administrator
  - Option to continue without admin (shows risks)
  - Option to quit application
- **Real-time admin status checking** via IPC handler `check-admin-privileges`
- **Enhanced DNS error handling** with specific admin-required error messages
- **DNS verification script**: `verify-dns-simple.ps1` - comprehensive DNS leak testing
- **Automated launcher**: `start-vpn-admin.ps1` - starts app with elevation
- See [DNS_ENFORCEMENT_VERIFICATION.md](DNS_ENFORCEMENT_VERIFICATION.md) for full verification

#### 📜 NPM Scripts
- `npm run verify:dns` - Run DNS enforcement verification on Windows
- `npm run db:migrate:encrypt` - Encrypt existing database records
- `npm run generate-secrets` - Generate production secrets (already existed, now documented)

#### 📚 Documentation
- **DATABASE_ENCRYPTION.md** - Complete encryption implementation guide
  - Encryption algorithm details (AES-256-GCM)
  - Key management best practices
  - Migration procedures
  - Security compliance benefits (GDPR, PCI DSS, HIPAA)
- **DNS_ENFORCEMENT_VERIFICATION.md** - Proof of real OS-level DNS enforcement
  - Evidence of `netsh` usage (not UI toggle)
  - Manual verification test results
  - Interface priority confirmation
  - Admin privilege requirements explained
- Updated **DEPLOYMENT.md** with:
  - Database encryption requirements
  - DNS enforcement admin privileges section
  - Key rotation procedures
- Updated **README.md** with:
  - New security features (encryption, DNS verification)
  - Admin privilege requirements
  - Updated installation steps with verification script

### Changed - March 26, 2026

#### 🔧 Electron Main Process
- `electron/main.js`:
  - Added `isRunningAsAdmin()` function for cross-platform admin detection
  - Added `promptForElevation()` function with user-friendly dialog
  - Added `hasAdminPrivileges` global state variable
  - Admin check runs on `app.whenReady()` before window creation
  - Non-blocking elevation prompt (delayed 2 seconds to allow UI to load)
  - Added IPC handler: `check-admin-privileges` for renderer to query admin status

#### 🌐 VPN Tunnel Module
- `electron/vpn-tunnel.js`:
  - Enhanced DNS error handling in `_dnsWindows()` method
  - Detects "elevation required" errors and throws specific error type
  - Error code: `REQUIRES_ADMIN` for programmatic handling
  - Improved error messages guide users to restart as Administrator
  - Success message now shows ✅ emoji for better UX

#### 💾 Database Module
- `server/src/db.js`:
  - Added encryption imports and utilities
  - Added `encrypt()` function using AES-256-GCM with random IV
  - Added `decrypt()` function with authentication tag verification
  - Added `ENCRYPTED_FIELDS` array: `['twoFactorSecret', 'twoFactorTempSecret', 'oauthId']`
  - Updated `rowToUser()` to automatically decrypt encrypted fields on read
  - Updated `userToRow()` to automatically encrypt sensitive fields on write
  - Added `ENCRYPTION_KEY` validation on module load

### Fixed - March 26, 2026

#### 🐛 DNS Enforcement
- **Issue**: DNS enforcement failed silently when Electron ran without admin privileges
  - VPN connected successfully but DNS leaked through ISP
  - No user feedback about the problem
- **Fix**: 
  - Detect admin privileges on startup
  - Prompt user to restart with elevation
  - Show clear error messages when DNS operations fail due to missing privileges
  - Provide verification script to confirm DNS enforcement working

#### 🐛 User Data Security
- **Issue**: Sensitive 2FA secrets and OAuth tokens stored in plaintext in SQLite database
- **Fix**: 
  - Implemented AES-256-GCM encryption for sensitive columns
  - Encryption is transparent - no code changes needed in routes
  - Migration script safely encrypts existing data
  - Encryption key stored securely in environment variables

### Security

#### 🔒 Enhanced Security Posture

**Database Encryption** (AES-256-GCM):
- Protects against database file theft
- Meets compliance requirements (GDPR Article 32, PCI DSS, HIPAA)
- Uses authenticated encryption preventing tampering
- 256-bit keys with unique 12-byte IV per record

**DNS Enforcement Verification**:
- Proves OS-level DNS configuration (not just UI)
- Prevents DNS leak attacks
- User verification tools for transparency
- Clear documentation of security model

**Admin Privilege Handling**:
- Proper privilege detection on all platforms (Windows/Linux/macOS)
- User consent for elevation (no silent privilege requests)
- Graceful degradation when admin denied
- Security warnings shown in UI

---

## [0.1.0] - March 20, 2026

### Initial Release

#### Features
- WireGuard VPN protocol support
- Kill switch functionality
- IPv6 leak prevention
- DNS leak protection
- Multi-server support (8+ locations)
- Real-time traffic monitoring
- Connection history logging
- Two-factor authentication (TOTP)
- OAuth authentication (Google)
- Progressive Web App (PWA) support
- Electron desktop application (Windows/macOS/Linux)
- React-based responsive UI
- Dark/light theme support
- User data usage tracking
- Admin dashboard

#### Security
- bcrypt password hashing
- JWT authentication with refresh tokens
- CORS with strict origin validation
- Rate limiting on all endpoints
- Helmet.js security headers
- Input sanitization
- SQL injection prevention
- better-sqlite3 for database
- HTTPS enforcement

---

## Version Numbering

- **Major** (X.0.0): Breaking changes, major rewrites
- **Minor** (0.X.0): New features, non-breaking changes
- **Patch** (0.0.X): Bug fixes, security patches

---

## Upgrade Notes

### March 26, 2026 Updates

#### For Existing Deployments

1. **Update environment variables**:
   - Ensure `ENCRYPTION_KEY` is set in `server/.env` (64 hex characters)
   - If missing, run: `node scripts/generate-secrets.js --admin-email your@email.com --admin-password "YourPassword"`

2. **Encrypt existing data** (if you have existing users):
   ```bash
   cd server
   node src/migrations/encrypt-existing-data.js
   ```

3. **Restart Electron app with admin privileges**:
   ```powershell
   # Windows
   .\start-vpn-admin.ps1
   
   # Linux/macOS
   sudo electron .
   ```

4. **Verify DNS enforcement** works:
   ```powershell
   # Windows
   .\verify-dns-simple.ps1
   
   # Linux/macOS
   nslookup google.com  # Should show VPN DNS (1.1.1.1), not ISP
   ```

#### For Users

- **Windows**: Right-click Nebula VPN → "Run as Administrator" for full DNS protection
- **First launch**: Dialog will prompt you to restart with admin access
- **Verification**: Run `verify-dns-simple.ps1` to confirm no DNS leaks

---

## Contributing

When adding changes:
1. Update this changelog under `[Unreleased]`
2. Use categories: Added, Changed, Deprecated, Removed, Fixed, Security
3. Write user-facing descriptions (not technical jargon)
4. Link to relevant documentation

---

## Links

- [GitHub Repository](https://github.com/nebula-media-3d/nebula-vpn-client)
- [Documentation](README.md)
- [Security Policy](SECURITY.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Database Encryption](server/DATABASE_ENCRYPTION.md)
- [DNS Verification](DNS_ENFORCEMENT_VERIFICATION.md)
