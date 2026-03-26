/**
 * Migration: Encrypt existing unencrypted sensitive fields
 * 
 * Run this once to encrypt existing data in the database.
 * This script detects unencrypted values and encrypts them.
 * 
 * Usage: node src/migrations/encrypt-existing-data.js
 */

require('dotenv').config();
const { UserStore, db } = require('../db');

const ENCRYPTED_FIELDS_DB = ['two_factor_secret', 'two_factor_temp_secret', 'oauth_id'];

/**
 * Check if a value is already encrypted (format: base64:base64:base64)
 */
function isEncrypted(value) {
  if (!value) return true; // null/empty is fine
  const parts = value.split(':');
  return parts.length === 3 && parts.every(part => {
    try {
      Buffer.from(part, 'base64').toString('base64') === part;
      return true;
    } catch {
      return false;
    }
  });
}

async function migrateEncryption() {
  console.log('🔐 Starting encryption migration...\n');
  
  try {
    // Get all users directly from DB
    const users = db.prepare('SELECT * FROM users').all();
    console.log(`Found ${users.length} users in database\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const user of users) {
      const updates = {};
      let needsUpdate = false;
      
      for (const field of ENCRYPTED_FIELDS_DB) {
        if (user[field] && !isEncrypted(user[field])) {
          console.log(`  ⚠️  User ${user.email}: Unencrypted ${field} detected`);
          // The UserStore.set() will automatically encrypt when we save
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        // Re-save using UserStore which will encrypt automatically
        const userStore = new UserStore();
        const fullUser = userStore.get(user.email);
        userStore.set(user.email, fullUser);
        updated++;
        console.log(`  ✅ User ${user.email}: Encrypted sensitive fields\n`);
      } else {
        skipped++;
      }
    }
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           MIGRATION COMPLETE                          ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`✅ Updated: ${updated} users`);
    console.log(`⏭️  Skipped: ${skipped} users (already encrypted)`);
    console.log(`📊 Total:   ${users.length} users\n`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateEncryption().then(() => {
  console.log('🎉 Migration completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
