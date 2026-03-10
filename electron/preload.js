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
  'vpn-stats',
  'vpn-kill-switch',
  'vpn-split-tunnel-enable',
  'vpn-split-tunnel-disable',
  'vpn-doh-start',
  'vpn-doh-stop',
  'vpn-obfuscation-start',
  'vpn-obfuscation-stop',
  'wifi-scan',
  'check-captive-portal',
  'get-system-info',
  'set-auto-launch',
  'get-app-version',
  'check-for-updates',
  'restart-and-install'
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
  'update-not-available',
  'update-progress',
  'update-downloaded',
  'update-error',
  'system-resume',
  'system-lock-screen',
  'network-status-change',
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
    /**
     * Connect to a VPN server.
     * @param {{ serverId: string, protocol?: string, token: string, killSwitch?: boolean }} config
     */
    connect: (config) => {
      if (!config || typeof config !== 'object') {
        return Promise.reject(new Error('Invalid connect config'));
      }
      if (typeof config.serverId !== 'string' || config.serverId.length > 100) {
        return Promise.reject(new Error('Invalid server ID'));
      }
      if (typeof config.token !== 'string' || config.token.length < 10) {
        return Promise.reject(new Error('Missing auth token'));
      }
      return secureInvoke('vpn-connect', {
        serverId:   config.serverId.slice(0, 100),
        protocol:   String(config.protocol || 'wireguard').slice(0, 20),
        token:      config.token,
        killSwitch: Boolean(config.killSwitch),
      });
    },
    disconnect: ({ token } = {}) => secureInvoke('vpn-disconnect', { token: token || '' }),
    getStats:   () => secureInvoke('vpn-stats'),
    setKillSwitch: (enable, serverIP) => secureInvoke('vpn-kill-switch', {
      enable: Boolean(enable),
      serverIP: typeof serverIP === 'string' ? serverIP.slice(0, 45) : undefined,
    }),
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
    onDisconnect: (callback) => secureOn('vpn-disconnect', callback),

    /**
     * Enable per-application VPN bypass (split tunneling).
     * @param {Array<{id:string, name:string, execPath?:string}>} apps
     */
    enableSplitTunnel: (apps) => {
      if (!Array.isArray(apps)) return Promise.reject(new Error('apps must be an array'));
      // Sanitize: only keep safe scalar fields
      const safeApps = apps.map(a => ({
        id:       String(a.id   || '').slice(0, 64),
        name:     String(a.name || '').slice(0, 100),
        execPath: typeof a.execPath === 'string' ? a.execPath.slice(0, 260) : undefined,
      }));
      return secureInvoke('vpn-split-tunnel-enable', { apps: safeApps });
    },

    disableSplitTunnel: () => secureInvoke('vpn-split-tunnel-disable'),

    /**
     * Start DNS-over-HTTPS or DNS-over-TLS proxy.
     * @param {{ url?: string, mode?: 'doh'|'dot', dotHost?: string, dotPort?: number }} cfg
     */
    startDoh: (cfg = {}) => {
      const safe = {
        url:     typeof cfg.url     === 'string'  ? cfg.url.slice(0, 200)       : 'https://1.1.1.1/dns-query',
        mode:    ['doh', 'dot'].includes(cfg.mode) ? cfg.mode                    : 'doh',
        dotHost: typeof cfg.dotHost === 'string'  ? cfg.dotHost.slice(0, 100)   : '1.1.1.1',
        dotPort: Number.isInteger(cfg.dotPort)    ? Math.max(1, Math.min(65535, cfg.dotPort)) : 853,
      };
      return secureInvoke('vpn-doh-start', safe);
    },

    stopDoh: () => secureInvoke('vpn-doh-stop'),

    /**
     * Start Shadowsocks obfuscation relay.
     * @param {{ ssServer:string, ssPort:number, password:string, method?:string,
     *           wgServer:string, wgPort:number, localPort?:number }} cfg
     */
    startObfuscation: (cfg) => {
      if (!cfg || typeof cfg !== 'object') return Promise.reject(new Error('cfg required'));
      if (typeof cfg.ssServer !== 'string' || typeof cfg.password !== 'string') {
        return Promise.reject(new Error('ssServer and password are required'));
      }
      const safe = {
        ssServer:  cfg.ssServer.slice(0, 253),
        ssPort:    Math.max(1, Math.min(65535, Number(cfg.ssPort)  || 8388)),
        password:  cfg.password,                // handled server-side, no UI display
        method:    ['aes-256-gcm', 'chacha20-poly1305'].includes(cfg.method) ? cfg.method : 'aes-256-gcm',
        wgServer:  String(cfg.wgServer || '').slice(0, 253),
        wgPort:    Math.max(1, Math.min(65535, Number(cfg.wgPort)  || 51820)),
        localPort: Math.max(1024, Math.min(65535, Number(cfg.localPort) || 51821)),
        jitterMs:  Math.min(200, Math.max(0, Number(cfg.jitterMs) || 0)),
        ssLocalPath: typeof cfg.ssLocalPath === 'string' ? cfg.ssLocalPath.slice(0, 260) : undefined,
      };
      return secureInvoke('vpn-obfuscation-start', safe);
    },

    stopObfuscation: () => secureInvoke('vpn-obfuscation-stop'),
  },

  // System info - read-only access
  system: {
    getInfo: () => secureInvoke('get-system-info'),
    getVersion: () => secureInvoke('get-app-version'),
    setAutoLaunch: (enabled) => secureInvoke('set-auto-launch', Boolean(enabled)),
    checkForUpdates:      () => secureInvoke('check-for-updates'),
    restartAndInstall:    () => secureInvoke('restart-and-install'),
    onUpdateAvailable:    (cb) => secureOn('update-available', cb),
    onUpdateNotAvailable: (cb) => secureOn('update-not-available', cb),
    onUpdateProgress:     (cb) => secureOn('update-progress', cb),
    onUpdateDownloaded:   (cb) => secureOn('update-downloaded', cb),
    onUpdateError:        (cb) => secureOn('update-error', cb),
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
  isElectron: true,

  // ── Network / WiFi ──────────────────────────────────────────────────
  network: {
    /**
     * Scan the current WiFi adapter and return SSID, BSSID, signal, security.
     * @returns {{ ssid, bssid, signal, security, isOpen, frequency }}
     */
    scan: () => secureInvoke('wifi-scan'),

    /**
     * Test for captive portal (hotel/airport login page).
     * @returns {{ captive: boolean|null, redirectTo: string|null }}
     *   captive=true  → definitely behind a portal
     *   captive=false → clean internet
     *   captive=null  → inconclusive (offline or VPN already active)
     */
    checkCaptivePortal: () => secureInvoke('check-captive-portal'),

    /** Fired when the system wakes from sleep. */
    onResume:              (cb) => secureOn('system-resume', cb),
    /** Fired when the screen is locked. */
    onLockScreen:          (cb) => secureOn('system-lock-screen', cb),
    /** Fired every ~3 s with { online: boolean }. */
    onStatusChange:        (cb) => secureOn('network-status-change', cb),
  },
});

// Prevent prototype pollution
Object.freeze(window.electron);
Object.freeze(window.electron.vpn);
Object.freeze(window.electron.system);
Object.freeze(window.electron.settings);
Object.freeze(window.electron.log);
Object.freeze(window.electron.network);

// Security logging
console.log('[Preload] Secure bridge initialized');

