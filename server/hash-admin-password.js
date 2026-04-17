#!/usr/bin/env node
/**
 * Hash Admin Password
 * Generates a bcrypt hash for the admin password
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function hashPassword() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('         NEBULA VPN - Admin Password Hasher');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  rl.question('Enter admin password to hash (or press Enter for current): ', async (password) => {
    const currentPassword = 'cupcos-jojruJ-susca2@T';
    const passwordToHash = password || currentPassword;
    
    if (!password) {
      console.log(`\n⚠️  Using current password from .env: ${currentPassword}`);
    }
    
    console.log('\n⏳ Hashing password with bcrypt (salt rounds: 12)...\n');
    
    try {
      // Use same salt rounds as the app (12)
      const hashedPassword = await bcrypt.hash(passwordToHash, 12);
      
      console.log('✅ Password hashed successfully!\n');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Add this to your server/.env file:');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log(`ADMIN_PASSWORD_HASH=${hashedPassword}`);
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('⚠️  Note: The backend currently expects plaintext password.');
      console.log('   To use hashed passwords, update server/src/routes/auth.js');
      console.log('   to check for ADMIN_PASSWORD_HASH first.');
      console.log('');
      console.log('For production deployment:');
      console.log('  1. Copy the hash above');
      console.log('  2. Update server/.env:');
      console.log('     ADMIN_PASSWORD=' + hashedPassword);
      console.log('  3. Or even better, use a NEW strong password!');
      console.log('');
      
      // Verify the hash works
      console.log('🔐 Verifying hash...');
      const isValid = await bcrypt.compare(passwordToHash, hashedPassword);
      console.log(isValid ? '✅ Hash verified successfully!\n' : '❌ Hash verification failed!\n');
      
    } catch (error) {
      console.error('❌ Error hashing password:', error.message);
    }
    
    rl.close();
  });
}

hashPassword();
