/**
 * Nebula VPN - Secure Preload Script
 * ===================================
 * This script exposes a limited, secure API to the renderer process.
 * Following Electron security best practices.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of allowed IPC channels for security
const ALLOWED_INVOKE_CHANNELS = [
  'vpn-connect',
  'vpn-disconnect',
  'get-system-info',
  'set-auto-launch',
  'get-app-version',
  'check-for-updates'
];

const ALLOWED_SEND_CHANNELS = [
  'vpn-status-changed',
  'log-event',
  'analytics-event'
];

const ALLOWED_RECEIVE_CHANNELS = [
  'vpn-status-changed',
  'vpn-quick-connect',
  'vpn-disconnect',
  'open-settings',
  'update-available',
  'update-downloaded'
];

/**
 * Secure IPC invoke wrapper
 * Only allows whitelisted channels
 */
function secureInvoke(channel, ...args) {
  if (!ALLOWED_INVOKE_CHANNELS.includes(channel)) {
    console.error(`[Security] Blocked invoke to unauthorized channel: ${channel}`);
    return Promise.reject(new Error('Unauthorized IPC channel'));
  }
  
  // Sanitize arguments - only allow primitive types and plain objects
  const sanitizedArgs = args.map(arg => {
    if (arg === null || arg === undefined) return arg;
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') return arg;
    if (typeof arg === 'object' && !Array.isArray(arg)) {
      // Only allow plain objects with primitive values
      return JSON.parse(JSON.stringify(arg));
    }
    if (Array.isArray(arg)) {
      return JSON.parse(JSON.stringify(arg));
    }
    return undefined;
  });
  
  return ipcRenderer.invoke(channel, ...sanitizedArgs);
}

/**
 * Secure IPC send wrapper
 */
function secureSend(channel, ...args) {
  if (!ALLOWED_SEND_CHANNELS.includes(channel)) {
    console.error(`[Security] Blocked send to unauthorized channel: ${channel}`);
    return;
  }
  
  const sanitizedArgs = args.map(arg => {
    if (arg === null || arg === undefined) return arg;
    if (typeof arg === 'object') {
      return JSON.parse(JSON.stringify(arg));
    }
    return arg;
  });
  
  ipcRenderer.send(channel, ...sanitizedArgs);
}

/**
 * Secure IPC listener wrapper
 */
function secureOn(channel, callback) {
  if (!ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
    console.error(`[Security] Blocked listener on unauthorized channel: ${channel}`);
    return () => {};
  }
  
  const wrappedCallback = (event, ...args) => {
    // Don't expose the event object to renderer
    callback(...args);
  };
  
  ipcRenderer.on(channel, wrappedCallback);
  
  // Return cleanup function
  return () => {
    ipcRenderer.removeListener(channel, wrappedCallback);
  };
}

/**
 * Secure one-time listener wrapper
 */
function secureOnce(channel, callback) {
  if (!ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
    console.error(`[Security] Blocked once listener on unauthorized channel: ${channel}`);
    return;
  }
  
  ipcRenderer.once(channel, (event, ...args) => {
    callback(...args);
  });
}

// Expose protected methods to the renderer process
// Using contextBridge for proper isolation
contextBridge.exposeInMainWorld('electron', {
  // VPN controls - restricted API surface
  vpn: {
    connect: (serverId) => {
      // Validate serverId
      if (typeof serverId !== 'string' || serverId.length > 100) {
        return Promise.reject(new Error('Invalid server ID'));
      }
      return secureInvoke('vpn-connect', serverId);
    },
    disconnect: () => secureInvoke('vpn-disconnect'),
    updateStatus: (status) => {
      // Validate status object
      if (typeof status !== 'object' || status === null) return;
      const safeStatus = {
        connected: Boolean(status.connected),
        server: String(status.server || '').slice(0, 100),
        ip: String(status.ip || '').slice(0, 50),
        protocol: String(status.protocol || '').slice(0, 20)
      };
      secureSend('vpn-status-changed', safeStatus);
    },
    onStatusChange: (callback) => secureOn('vpn-status-changed', callback),
    onQuickConnect: (callback) => secureOn('vpn-quick-connect', callback),
    onDisconnect: (callback) => secureOn('vpn-disconnect', callback)
  },

  // System info - read-only access
  system: {
    getInfo: () => secureInvoke('get-system-info'),
    getVersion: () => secureInvoke('get-app-version'),
    setAutoLaunch: (enabled) => secureInvoke('set-auto-launch', Boolean(enabled)),
    checkForUpdates: () => secureInvoke('check-for-updates'),
    onUpdateAvailable: (callback) => secureOn('update-available', callback),
    onUpdateDownloaded: (callback) => secureOn('update-downloaded', callback)
  },

  // Settings - event only
  settings: {
    onOpen: (callback) => secureOn('open-settings', callback)
  },

  // Secure notification wrapper
  notify: (title, message) => {
    // Sanitize inputs
    const safeTitle = String(title || 'Nebula VPN').slice(0, 100);
    const safeMessage = String(message || '').slice(0, 500);
    
    // Use Notification API (already sandboxed)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(safeTitle, { 
        body: safeMessage,
        icon: './logo192.png',
        silent: false
      });
    }
  },

  // Logging (one-way, no return)
  log: {
    event: (eventName, data) => {
      if (typeof eventName !== 'string') return;
      secureSend('log-event', {
        event: eventName.slice(0, 100),
        data: typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : String(data).slice(0, 1000),
        timestamp: Date.now()
      });
    }
  },

  // Platform detection
  platform: process.platform,
  
  // Check if running in Electron
  isElectron: true
});

// Prevent prototype pollution
Object.freeze(window.electron);
Object.freeze(window.electron.vpn);
Object.freeze(window.electron.system);
Object.freeze(window.electron.settings);
Object.freeze(window.electron.log);

// Security logging
console.log('[Preload] Secure bridge initialized');

