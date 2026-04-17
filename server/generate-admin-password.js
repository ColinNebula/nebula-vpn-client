#!/usr/bin/env node
/**
 * Generate Secure Admin Password
 * Creates a strong random password and bcrypt hash for production deployment
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateStrongPassword(length = 24) {
  // Generate cryptographically secure random password
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

async function generateAdminCredentials() {
  console.log('');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('     NEBULA VPN - Production Admin Password Generator');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('');
  
  // Generate new secure password
  const newPassword = generateStrongPassword(32);
  
  console.log('⏳ Generating secure password...\n');
  console.log('✅ New admin password generated!');
  console.log('');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('📝 SAVE THIS PASSWORD - You will need it to log in!');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Password: ${newPassword}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Store this password in a secure location!');
  console.log('   (Password manager, encrypted file, etc.)');
  console.log('');
  
  // Hash the password
  console.log('⏳ Hashing password with bcrypt (salt rounds: 12)...\n');
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  console.log('═════════════════════════════════════════════════════════════');
  console.log('📋 Production .env Configuration');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Add or update these lines in server/.env:');
  console.log('');
  console.log(`ADMIN_EMAIL=colinnebula@nebula3ddev.com`);
  console.log(`ADMIN_PASSWORD=${newPassword}`);
  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('');
  console.log('The password is stored in PLAINTEXT in .env, which is OK because:');
  console.log('  ✅ .env is in .gitignore (never committed to Git)');
  console.log('  ✅ Server hashes it automatically at startup');
  console.log('  ✅ Only stored on secure production server');
  console.log('');
  console.log('On production, make sure .env file permissions are secure:');
  console.log('  chmod 600 /opt/nebula-vpn-server/.env');
  console.log('');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('📊 Password Strength');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Length: ${newPassword.length} characters`);
  console.log(`  Entropy: ~${Math.floor(newPassword.length * Math.log2(72))} bits`);
  console.log('  Contains: Letters (upper/lower), numbers, special chars');
  console.log('  Strength: 🔐 VERY STRONG');
  console.log('');
  
  // Verify hash
  console.log('🔐 Verifying bcrypt hash...');
  const isValid = await bcrypt.compare(newPassword, hashedPassword);
  console.log(isValid ? '✅ Hash verified successfully!' : '❌ Hash verification failed!');
  console.log('');
  
  console.log('═════════════════════════════════════════════════════════════');
  console.log('✅ READY FOR PRODUCTION DEPLOYMENT');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('  1. ✅ Save the password above in your password manager');
  console.log('  2. Update server/.env with the new ADMIN_PASSWORD');
  console.log('  3. Deploy to production: .\\DEPLOY-PRODUCTION.ps1');
  console.log('  4. Test login with the new password');
  console.log('');
}

generateAdminCredentials().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
