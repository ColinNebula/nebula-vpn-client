/**
 * Secure Storage Utility
 * Provides encrypted localStorage and sessionStorage with type safety
 */

class SecureStorage {
  constructor() {
    this.encryptionKey = 'nebula-vpn-secure-key-2025'; // In production, use a proper encryption key
    this.prefix = 'nebula_';
  }

  /**
   * Simple encryption (base64 + obfuscation)
   * In production, use a proper encryption library like crypto-js
   */
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encoded = btoa(jsonString);
      // Add simple obfuscation
      return encoded.split('').reverse().join('');
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  /**
   * Simple decryption
   */
  decrypt(encryptedData) {
    try {
      const reversed = encryptedData.split('').reverse().join('');
      const decoded = atob(reversed);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Save to localStorage with encryption
   */
  setLocal(key, value, options = {}) {
    try {
      const prefixedKey = this.prefix + key;
      const encrypted = this.encrypt(value);
      
      if (encrypted) {
        localStorage.setItem(prefixedKey, encrypted);
        
        // Optional: Set expiration
        if (options.expiresIn) {
          const expirationTime = Date.now() + options.expiresIn;
          localStorage.setItem(`${prefixedKey}_exp`, expirationTime.toString());
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  /**
   * Get from localStorage with decryption
   */
  getLocal(key, defaultValue = null) {
    try {
      const prefixedKey = this.prefix + key;
      const encrypted = localStorage.getItem(prefixedKey);
      
      if (!encrypted) return defaultValue;

      // Check expiration
      const expirationTime = localStorage.getItem(`${prefixedKey}_exp`);
      if (expirationTime && Date.now() > parseInt(expirationTime)) {
        this.removeLocal(key);
        return defaultValue;
      }

      const decrypted = this.decrypt(encrypted);
      return decrypted !== null ? decrypted : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * Remove from localStorage
   */
  removeLocal(key) {
    try {
      const prefixedKey = this.prefix + key;
      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(`${prefixedKey}_exp`);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Save to sessionStorage with encryption
   */
  setSession(key, value) {
    try {
      const prefixedKey = this.prefix + key;
      const encrypted = this.encrypt(value);
      
      if (encrypted) {
        sessionStorage.setItem(prefixedKey, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
      return false;
    }
  }

  /**
   * Get from sessionStorage with decryption
   */
  getSession(key, defaultValue = null) {
    try {
      const prefixedKey = this.prefix + key;
      const encrypted = sessionStorage.getItem(prefixedKey);
      
      if (!encrypted) return defaultValue;

      const decrypted = this.decrypt(encrypted);
      return decrypted !== null ? decrypted : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  }

  /**
   * Remove from sessionStorage
   */
  removeSession(key) {
    try {
      const prefixedKey = this.prefix + key;
      sessionStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      return false;
    }
  }

  /**
   * Clear all app data from localStorage
   */
  clearLocal() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Clear all app data from sessionStorage
   */
  clearSession() {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  }

  /**
   * Get storage size in KB
   */
  getStorageSize(type = 'local') {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      let size = 0;
      
      for (let key in storage) {
        if (storage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
          size += storage[key].length + key.length;
        }
      }
      
      return (size / 1024).toFixed(2); // Return in KB
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  /**
   * Export all data
   */
  exportData() {
    try {
      const data = {};
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const cleanKey = key.replace(this.prefix, '');
          if (!cleanKey.endsWith('_exp')) {
            const value = this.getLocal(cleanKey);
            if (value !== null) {
              data[cleanKey] = value;
            }
          }
        }
      });
      
      return {
        data,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  /**
   * Import data
   */
  importData(importedData) {
    try {
      if (!importedData || !importedData.data) {
        throw new Error('Invalid import data format');
      }

      const { data } = importedData;
      let imported = 0;

      Object.keys(data).forEach(key => {
        if (this.setLocal(key, data[key])) {
          imported++;
        }
      });

      return { success: true, imported };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(type = 'local') {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get all keys with prefix
   */
  getAllKeys(type = 'local') {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const keys = Object.keys(storage);
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''))
        .filter(key => !key.endsWith('_exp'));
    } catch (error) {
      console.error('Error getting keys:', error);
      return [];
    }
  }

  /**
   * Batch operations
   */
  setMultiple(items, type = 'local') {
    try {
      const method = type === 'local' ? this.setLocal : this.setSession;
      let success = 0;

      Object.keys(items).forEach(key => {
        if (method.call(this, key, items[key])) {
          success++;
        }
      });

      return { success, total: Object.keys(items).length };
    } catch (error) {
      console.error('Error in batch set:', error);
      return { success: 0, total: 0 };
    }
  }

  /**
   * Get multiple items
   */
  getMultiple(keys, type = 'local') {
    try {
      const method = type === 'local' ? this.getLocal : this.getSession;
      const result = {};

      keys.forEach(key => {
        result[key] = method.call(this, key);
      });

      return result;
    } catch (error) {
      console.error('Error in batch get:', error);
      return {};
    }
  }
}

// Create singleton instance
const secureStorage = new SecureStorage();

// Specific storage helpers for common data types
export const UserStorage = {
  save: (userData) => secureStorage.setLocal('user', userData),
  get: () => secureStorage.getLocal('user'),
  remove: () => secureStorage.removeLocal('user')
};

export const SettingsStorage = {
  save: (settings) => secureStorage.setLocal('settings', settings),
  get: () => secureStorage.getLocal('settings', {}),
  remove: () => secureStorage.removeLocal('settings')
};

export const SessionStorage = {
  save: (sessionData) => secureStorage.setSession('active_session', sessionData),
  get: () => secureStorage.getSession('active_session'),
  remove: () => secureStorage.removeSession('active_session')
};

export const ConnectionStorage = {
  save: (connectionData) => secureStorage.setLocal('connections', connectionData),
  get: () => secureStorage.getLocal('connections', []),
  add: (connection) => {
    const connections = ConnectionStorage.get();
    connections.unshift(connection);
    // Keep only last 100 connections
    if (connections.length > 100) {
      connections.pop();
    }
    return secureStorage.setLocal('connections', connections);
  },
  clear: () => secureStorage.removeLocal('connections')
};

export const CacheStorage = {
  save: (key, data, expiresIn = 3600000) => // Default 1 hour
    secureStorage.setLocal(`cache_${key}`, data, { expiresIn }),
  get: (key) => secureStorage.getLocal(`cache_${key}`),
  remove: (key) => secureStorage.removeLocal(`cache_${key}`)
};

export default secureStorage;
