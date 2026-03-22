/**
 * UserStore - SQLite-backed drop-in replacement for the in-memory users Map.
 *
 * Exposes the same interface used throughout the codebase:
 *   users.get(email)       → user object | undefined
 *   users.set(email, user) → void
 *   users.has(email)       → boolean
 *   users.delete(email)    → void
 *   users.values()         → Iterator<user object>
 *
 * Complex fields (settings, devices, connectionHistory, twoFactorBackupCodes)
 * are stored as JSON strings and transparently serialised/deserialised.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Store the database file next to this file (server/src/nebula.db)
// In production you may want to move it to /var/lib/nebula/ or similar.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'nebula.db');

// Ensure the directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email                    TEXT PRIMARY KEY COLLATE NOCASE,
    password                 TEXT,
    name                     TEXT,
    role                     TEXT NOT NULL DEFAULT 'user',
    plan                     TEXT NOT NULL DEFAULT 'free',
    created_at               TEXT NOT NULL,
    data_usage               REAL NOT NULL DEFAULT 0,
    settings                 TEXT NOT NULL DEFAULT '{}',
    devices                  TEXT NOT NULL DEFAULT '[]',
    connection_history       TEXT NOT NULL DEFAULT '[]',
    two_factor_enabled       INTEGER NOT NULL DEFAULT 0,
    two_factor_secret        TEXT,
    two_factor_temp_secret   TEXT,
    two_factor_backup_codes  TEXT NOT NULL DEFAULT '[]',
    oauth_provider           TEXT,
    oauth_id                 TEXT
  )
`);

// ── JSON fields that must be serialised/deserialised automatically ─────────
const JSON_FIELDS = ['settings', 'devices', 'connectionHistory', 'twoFactorBackupCodes'];

// Mapping: JS object keys  ↔  database column names
const TO_DB = {
  email:                 'email',
  password:              'password',
  name:                  'name',
  role:                  'role',
  plan:                  'plan',
  createdAt:             'created_at',
  dataUsage:             'data_usage',
  settings:              'settings',
  devices:               'devices',
  connectionHistory:     'connection_history',
  twoFactorEnabled:      'two_factor_enabled',
  twoFactorSecret:       'two_factor_secret',
  twoFactorTempSecret:   'two_factor_temp_secret',
  twoFactorBackupCodes:  'two_factor_backup_codes',
  oauthProvider:         'oauth_provider',
  oauthId:               'oauth_id',
};

const FROM_DB = Object.fromEntries(Object.entries(TO_DB).map(([js, sql]) => [sql, js]));

/**
 * Convert a plain DB row → JS user object.
 */
function rowToUser(row) {
  if (!row) return undefined;
  const user = {};
  for (const [col, val] of Object.entries(row)) {
    const key = FROM_DB[col] || col;
    user[key] = val;
  }
  // Deserialise JSON fields
  for (const field of JSON_FIELDS) {
    if (typeof user[field] === 'string') {
      try { user[field] = JSON.parse(user[field]); } catch { user[field] = field === 'settings' ? {} : []; }
    }
  }
  // Normalise boolean
  user.twoFactorEnabled = !!user.twoFactorEnabled;
  // Normalise date
  if (typeof user.createdAt === 'string') user.createdAt = new Date(user.createdAt);
  return user;
}

/**
 * Convert a JS user object → flat DB row for INSERT/REPLACE.
 */
function userToRow(user) {
  const row = {};
  for (const [js, col] of Object.entries(TO_DB)) {
    if (Object.prototype.hasOwnProperty.call(user, js)) {
      let val = user[js];
      if (JSON_FIELDS.includes(js)) {
        val = JSON.stringify(val ?? (js === 'settings' ? {} : []));
      } else if (val instanceof Date) {
        val = val.toISOString();
      } else if (typeof val === 'boolean') {
        val = val ? 1 : 0;
      }
      row[col] = val;
    }
  }
  // Always include email
  if (!row.email) row.email = user.email;
  return row;
}

// ── Prepared statements ───────────────────────────────────────────────────
const stmtGet    = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
const stmtHas    = db.prepare('SELECT 1 FROM users WHERE email = ? COLLATE NOCASE');
const stmtDelete = db.prepare('DELETE FROM users WHERE email = ? COLLATE NOCASE');
const stmtAll    = db.prepare('SELECT * FROM users');

/**
 * UserStore - Map-compatible interface backed by SQLite.
 */
class UserStore {
  get(email) {
    return rowToUser(stmtGet.get(email));
  }

  set(email, user) {
    const row = userToRow({ ...user, email });
    const cols = Object.keys(row).join(', ');
    const placeholders = Object.keys(row).map(() => '?').join(', ');
    const vals = Object.values(row);
    // INSERT OR REPLACE handles both create and update atomically
    db.prepare(`INSERT OR REPLACE INTO users (${cols}) VALUES (${placeholders})`).run(...vals);
  }

  has(email) {
    return !!stmtHas.get(email);
  }

  delete(email) {
    stmtDelete.run(email);
  }

  values() {
    return stmtAll.all().map(rowToUser)[Symbol.iterator]();
  }

  // Extra helpers used by analytics route
  getAll() {
    return stmtAll.all().map(rowToUser);
  }
}

module.exports = { UserStore, db };
