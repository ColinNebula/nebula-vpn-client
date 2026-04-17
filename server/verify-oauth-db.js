// Quick script to verify OAuth states are persisted
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'nebula.db');
const db = new Database(DB_PATH);

console.log('\n=== OAuth State Store Verification ===\n');

// Check if table exists
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='oauth_states'").get();

if (tableExists) {
  console.log('✅ oauth_states table exists\n');
  
  // Get recent states
  const states = db.prepare('SELECT state, provider, app_url, expires_at, created_at FROM oauth_states ORDER BY created_at DESC LIMIT 5').all();
  
  if (states.length > 0) {
    console.log(`Found ${states.length} OAuth state(s):\n`);
    
    states.forEach((row, i) => {
      const now = Date.now();
      const expiresAt = new Date(row.expires_at);
      const createdAt = new Date(row.created_at);
      const isExpired = row.expires_at < now;
      
      console.log(`${i + 1}. Provider: ${row.provider}`);
      console.log(`   State: ${row.state.substring(0, 16)}...`);
      console.log(`   App URL: ${row.app_url}`);
      console.log(`   Created: ${createdAt.toISOString()}`);
      console.log(`   Expires: ${expiresAt.toISOString()}${isExpired ? ' (EXPIRED)' : ' (valid)'}`);
      console.log('');
    });
  } else {
    console.log('ℹ️ No OAuth states in database yet (will be created on first OAuth attempt)\n');
  }
  
  // Get total count
  const count = db.prepare('SELECT COUNT(*) as count FROM oauth_states').get();
  console.log(`Total states: ${count.count}\n`);
  
} else {
  console.log('❌ oauth_states table does not exist\n');
  console.log('Make sure the server has started at least once to create the table.\n');
}

db.close();
console.log('✅ Database verification complete\n');
