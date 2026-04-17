/**
 * Secure Storage Utility
 * Provides AES-256-GCM encrypted localStorage and sessionStorage via the
 * Web Crypto API (SubtleCrypto).  No secrets are stored in code - the key
 * is derived at runtime from stable browser/device fingerprint data using
 * PBKDF2 with 100,000 iterations and SHA-256.
 *
 * All read/write methods are async and return Promises.
 * Data stored in the old base64-reversal format is automatically migrated
 * to AES-GCM on first read.
 */

// Public, non-secret salt - unique to this app and storage version.
const _SALT = new TextEncoder().encode('nebula-vpn-storage-v2');
const _PBKDF2_ITERATIONS = 100_000;

/** Create a timed AbortSignal (works in every supported env). */
function _timeout(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

class SecureStorage {
  constructor() {
    this.prefix = 'nebula_';
    // Begin key derivation immediately so subsequent ops just await this promise.
    this._keyPromise = this._deriveKey();
  }

  /** Derive an AES-GCM-256 CryptoKey from the stable browser fingerprint. */
  async _deriveKey() {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0,
    ].join('|');

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(fingerprint),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: _SALT, iterations: _PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt any JSON-serializable value with AES-256-GCM.
   * Returns a version-tagged base64 string: "v2:<base64(iv || ciphertext)>".
   */
  async encrypt(data) {
    try {
      const key  = await this._keyPromise;
      const iv   = crypto.getRandomValues(new Uint8Array(12)); // 96-bit random IV
      const plain = new TextEncoder().encode(JSON.stringify(data));
      const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);

      // Concatenate IV + ciphertext (ciphertext already includes the 16-byte GCM tag)
      const combined = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(cipherBuf), iv.byteLength);

      return 'v2:' + btoa(String.fromCharCode(...combined));
    } catch (err) {
      console.error('[SecureStorage] encrypt failed:', err);
      return null;
    }
  }

  /**
   * Decrypt a value previously produced by encrypt().
   * Also transparently handles the old base64-reversal format for migration.
   */
  async decrypt(encryptedData) {
    try {
      if (!encryptedData.startsWith('v2:')) {
        // Legacy format - migrate transparently
        return this._decryptLegacy(encryptedData);
      }

      const key      = await this._keyPromise;
      const combined = Uint8Array.from(atob(encryptedData.slice(3)), c => c.charCodeAt(0));
      const iv       = combined.slice(0, 12);
      const cipher   = combined.slice(12);

      const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
      return JSON.parse(new TextDecoder().decode(plainBuf));
    } catch (err) {
      console.error('[SecureStorage] decrypt failed:', err);
      return null;
    }
  }

  /** Decode the old (insecure) base64+reversal format. Used only during migration. */
  _decryptLegacy(data) {
    try {
      return JSON.parse(atob(data.split('').reverse().join('')));
    } catch {
      return null;
    }
  }

  // ── localStorage ─────────────────────────────────────────────────────────

  async setLocal(key, value, options = {}) {
    try {
      const prefixedKey = this.prefix + key;
      const encrypted   = await this.encrypt(value);
      if (!encrypted) return false;

      localStorage.setItem(prefixedKey, encrypted);
      if (options.expiresIn) {
        localStorage.setItem(`${prefixedKey}_exp`, String(Date.now() + options.expiresIn));
      }
      return true;
    } catch (err) {
      console.error('[SecureStorage] setLocal error:', err);
      return false;
    }
  }

  async getLocal(key, defaultValue = null) {
    try {
      const prefixedKey  = this.prefix + key;
      const encryptedRaw = localStorage.getItem(prefixedKey);
      if (!encryptedRaw) return defaultValue;

      // Expiry check
      const exp = localStorage.getItem(`${prefixedKey}_exp`);
      if (exp && Date.now() > parseInt(exp, 10)) {
        this.removeLocal(key);
        return defaultValue;
      }

      const value = await this.decrypt(encryptedRaw);

      // Migrate legacy (plain base64) entries to AES-GCM in place
      if (value !== null && !encryptedRaw.startsWith('v2:')) {
        await this.setLocal(key, value);
      }

      return value !== null ? value : defaultValue;
    } catch (err) {
      console.error('[SecureStorage] getLocal error:', err);
      return defaultValue;
    }
  }

  removeLocal(key) {
    const prefixedKey = this.prefix + key;
    localStorage.removeItem(prefixedKey);
    localStorage.removeItem(`${prefixedKey}_exp`);
    return true;
  }

  // ── sessionStorage ────────────────────────────────────────────────────────

  async setSession(key, value) {
    try {
      const encrypted = await this.encrypt(value);
      if (!encrypted) return false;
      sessionStorage.setItem(this.prefix + key, encrypted);
      return true;
    } catch (err) {
      console.error('[SecureStorage] setSession error:', err);
      return false;
    }
  }

  async getSession(key, defaultValue = null) {
    try {
      const raw = sessionStorage.getItem(this.prefix + key);
      if (!raw) return defaultValue;
      const val = await this.decrypt(raw);
      return val !== null ? val : defaultValue;
    } catch (err) {
      console.error('[SecureStorage] getSession error:', err);
      return defaultValue;
    }
  }

  removeSession(key) {
    sessionStorage.removeItem(this.prefix + key);
    return true;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  clearLocal() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
    return true;
  }

  clearSession() {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => sessionStorage.removeItem(k));
    return true;
  }

  getStorageSize(type = 'local') {
    const storage = type === 'local' ? localStorage : sessionStorage;
    let size = 0;
    for (const key of Object.keys(storage)) {
      if (key.startsWith(this.prefix)) size += storage[key].length + key.length;
    }
    return (size / 1024).toFixed(2);
  }

  isAvailable(type = 'local') {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const test = '__nebula_storage_test__';
      storage.setItem(test, '1');
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getAllKeys(type = 'local') {
    const storage = type === 'local' ? localStorage : sessionStorage;
    return Object.keys(storage)
      .filter(k => k.startsWith(this.prefix) && !k.endsWith('_exp'))
      .map(k => k.replace(this.prefix, ''));
  }

  async setMultiple(items, type = 'local') {
    const ops = Object.keys(items).map(key =>
      type === 'local' ? this.setLocal(key, items[key]) : this.setSession(key, items[key])
    );
    const results = await Promise.all(ops);
    return { success: results.filter(Boolean).length, total: results.length };
  }

  async getMultiple(keys, type = 'local') {
    const entries = await Promise.all(
      keys.map(async k => [k, type === 'local' ? await this.getLocal(k) : await this.getSession(k)])
    );
    return Object.fromEntries(entries);
  }

  async exportData() {
    const keys    = this.getAllKeys('local');
    const entries = await Promise.all(keys.map(async k => [k, await this.getLocal(k)]));
    return {
      data:       Object.fromEntries(entries.filter(([, v]) => v !== null)),
      exportedAt: new Date().toISOString(),
      version:    '2.0',
    };
  }

  async importData(importedData) {
    if (!importedData?.data) return { success: false, error: 'Invalid import format' };
    const { success } = await this.setMultiple(importedData.data, 'local');
    return { success: true, imported: success };
  }
}

// ── Singleton + named helpers ─────────────────────────────────────────────────

const secureStorage = new SecureStorage();

export const UserStorage = {
  save:   (userData) => secureStorage.setLocal('user', userData),
  get:    ()         => secureStorage.getLocal('user'),
  remove: ()         => secureStorage.removeLocal('user'),
};

export const SettingsStorage = {
  save:   (settings) => secureStorage.setLocal('settings', settings),
  get:    ()         => secureStorage.getLocal('settings', {}),
  remove: ()         => secureStorage.removeLocal('settings'),
};

export const SessionStorage = {
  save:   (sessionData) => secureStorage.setSession('active_session', sessionData),
  get:    ()            => secureStorage.getSession('active_session'),
  remove: ()            => secureStorage.removeSession('active_session'),
};

export const ConnectionStorage = {
  save:  (data) => secureStorage.setLocal('connections', data),
  get:   ()     => secureStorage.getLocal('connections', []),
  add: async (connection) => {
    const connections = await secureStorage.getLocal('connections', []);
    connections.unshift(connection);
    if (connections.length > 100) connections.pop();
    return secureStorage.setLocal('connections', connections);
  },
  clear: () => secureStorage.removeLocal('connections'),
};

export const CacheStorage = {
  save:   (key, data, expiresIn = 3_600_000) =>
    secureStorage.setLocal(`cache_${key}`, data, { expiresIn }),
  get:    (key) => secureStorage.getLocal(`cache_${key}`),
  remove: (key) => secureStorage.removeLocal(`cache_${key}`),
};

export default secureStorage;

