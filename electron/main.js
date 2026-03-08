const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, session } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');
const { WireGuardTunnel } = require('./vpn-tunnel');
const PqcHandshake        = require('./pqc-handshake');

// One tunnel instance for the lifetime of the app
const tunnel = new WireGuardTunnel();

let mainWindow;
let tray;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Nebula VPN',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: isDev,            // DevTools disabled in production builds
      preload: path.join(__dirname, 'preload.js'),
      // Prevent WebRTC from enumerating local network interfaces, which would
      // expose the user's real LAN/WAN IP even when the VPN tunnel is active.
      webRTCIPHandlingPolicy: 'disable_non_proxied_udp',
    },
    backgroundColor: '#0f0f23',
    show: false, // Don't show until ready
    frame: true,
    titleBarStyle: 'default'
  });

  // Security: block renderer from navigating to untrusted origins
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const trusted = isDev
      ? url.startsWith('http://localhost:3000')
      : url.startsWith(`file://${path.join(__dirname, '../build')}`);
    if (!trusted) {
      event.preventDefault();
      console.warn(`[Security] Blocked renderer navigation to: ${url}`);
    }
  });

  // Security: deny all window.open() / target="_blank" attempts from renderer
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`[Security] Blocked window.open() request to: ${url}`);
    return { action: 'deny' };
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close - minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create system tray
  createTray();
}

function createTray() {
  // Use PNG logo for tray icon (SVG not well supported in system tray)
  const iconPath = path.join(__dirname, '../public/logo192.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Nebula VPN',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quick Connect',
      click: () => {
        mainWindow.webContents.send('vpn-quick-connect');
      }
    },
    {
      label: 'Disconnect',
      click: () => {
        mainWindow.webContents.send('vpn-disconnect');
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('open-settings');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Nebula VPN - Disconnected');

  tray.on('click', () => {
    if (!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Update tray based on VPN status
ipcMain.on('vpn-status-changed', (event, status) => {
  if (tray) {
    const tooltip = status.connected
      ? `Nebula VPN - Connected to ${status.server}`
      : 'Nebula VPN - Disconnected';
    tray.setToolTip(tooltip);
  }
});

// Handle VPN connection request from renderer
ipcMain.handle('vpn-connect', async (event, { serverId, protocol, token, killSwitch }) => {
  const pqc = new PqcHandshake();

  try {
    const apiBase = process.env.API_URL || 'http://localhost:3001/api';

    // Step 1 – generate WireGuard X25519 keypair in main process
    const keyPair = tunnel.generateKeyPair();

    // Step 2 – attempt PQC ML-KEM-768 keypair generation (FIPS 203)
    let pqcEncapKeyB64 = null;
    if (pqc.available) {
      try {
        ({ encapKeyB64: pqcEncapKeyB64 } = pqc.generateKeypair());
      } catch (e) {
        console.warn('[IPC vpn-connect] PQC keypair gen failed (degrading):', e.message);
      }
    }

    // Step 3 – fetch peer config from API server, including PQC encap key
    const res = await fetch(`${apiBase}/vpn/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        serverId,
        protocol:        protocol || 'wireguard',
        clientPublicKey: keyPair.publicKey,
        // PQC fields — server may ignore if it doesn't support PQC yet
        pqcEncapKey:     pqcEncapKeyB64,
        pqcAlgorithm:    pqcEncapKeyB64 ? 'ml-kem-768' : null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `API returned ${res.status}`);
    }

    const {
      serverPublicKey, serverEndpoint, assignedIP, dns,
      // Optional PQC response: server encapsulates using our encapKey
      pqcCiphertext,
    } = await res.json();

    // Step 4 – derive hybrid PSK if server returned a PQC ciphertext
    let hybridPSK = null;
    if (pqcCiphertext && pqcEncapKeyB64) {
      try {
        hybridPSK = pqc.deriveHybridPSK(pqcCiphertext, keyPair.publicKey);
        console.log('[IPC vpn-connect] PQC hybrid PSK derived (ML-KEM-768 + HKDF-SHA256)');
      } catch (e) {
        console.warn('[IPC vpn-connect] PQC PSK derivation failed (degrading):', e.message);
      }
    }

    // Step 5 – inject the pre-generated private key so tunnel.connect() uses it
    tunnel.keyPair = keyPair;

    // Step 6 – bring up the actual WireGuard tunnel
    const result = await tunnel.connect({
      serverPublicKey,
      serverEndpoint,
      assignedIP,
      dns,
      enableKillSwitch: !!killSwitch,
      presharedKey:     hybridPSK, // null when server doesn't support PQC yet
    });

    // Update tray tooltip
    if (tray) {
      const pqcLabel = hybridPSK ? ' + PQC' : '';
      tray.setToolTip(`Nebula VPN – Connected (${assignedIP}${pqcLabel})`);
    }

    return {
      success:    true,
      ip:         result.assignedIP,
      publicKey:  result.publicKey,
      pqcEnabled: !!hybridPSK,
    };
  } catch (err) {
    console.error('[IPC vpn-connect] Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    // Always wipe PQC secret key from memory after use
    pqc.wipe();
  }
});

// Handle VPN disconnection
ipcMain.handle('vpn-disconnect', async (event, { token } = {}) => {
  try {
    await tunnel.disconnect();

    // Notify API server so it can remove the peer from WireGuard
    if (token) {
      const apiBase = process.env.API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/vpn/disconnect`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(e => console.warn('[IPC vpn-disconnect] API notify failed:', e.message));
    }

    if (tray) tray.setToolTip('Nebula VPN – Disconnected');
    return { success: true };
  } catch (err) {
    console.error('[IPC vpn-disconnect] Error:', err.message);
    return { success: false, error: err.message };
  }
});

// Real-time tunnel traffic stats
ipcMain.handle('vpn-stats', async () => {
  try {
    const stats = await tunnel.getStats();
    return { success: true, ...stats };
  } catch (err) {
    return { success: false, download: 0, upload: 0 };
  }
});

// Toggle kill switch while connected
ipcMain.handle('vpn-kill-switch', async (event, { enable, serverIP }) => {
  try {
    if (enable) {
      await tunnel.enableKillSwitch(serverIP || tunnel._vpnServerIP);
    } else {
      await tunnel.disableKillSwitch();
    }
    return { success: true, active: tunnel.killSwitchActive };
  } catch (err) {
    console.error('[IPC vpn-kill-switch] Error:', err.message);
    return { success: false, error: err.message };
  }
});

// ── Split tunneling ──────────────────────────────────────────────────────

/**
 * Enable per-app VPN bypass.
 * @param {{ apps: Array<{id:string, name:string, execPath?:string}> }} payload
 */
ipcMain.handle('vpn-split-tunnel-enable', async (event, payload) => {
  try {
    const apps = JSON.parse(JSON.stringify(payload?.apps ?? []));
    if (!tunnel._splitTunnel) {
      const { SplitTunnelManager } = require('./vpn-tunnel');
      tunnel._splitTunnel = new SplitTunnelManager(process.platform, 'nebula0');
    }
    await tunnel._splitTunnel.enable(apps);
    return { success: true, active: true, apps: apps.length };
  } catch (err) {
    console.error('[IPC vpn-split-tunnel-enable] Error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('vpn-split-tunnel-disable', async () => {
  try {
    if (tunnel._splitTunnel?.active) {
      await tunnel._splitTunnel.disable();
    }
    tunnel._splitTunnel = null;
    return { success: true, active: false };
  } catch (err) {
    console.error('[IPC vpn-split-tunnel-disable] Error:', err.message);
    return { success: false, error: err.message };
  }
});

// ── DNS-over-HTTPS / DoT proxy ──────────────────────────────────────────

/**
 * Start local DoH/DoT proxy and redirect system DNS through it.
 * @param {{ url: string, mode?: 'doh'|'dot', dotHost?: string, dotPort?: number }} payload
 */
ipcMain.handle('vpn-doh-start', async (event, payload) => {
  try {
    const { url = 'https://1.1.1.1/dns-query', mode = 'doh',
            dotHost = '1.1.1.1', dotPort = 853 } = JSON.parse(JSON.stringify(payload ?? {}));
    if (!tunnel._dohProxy) {
      const { DohProxy } = require('./vpn-tunnel');
      tunnel._dohProxy = new DohProxy();
    }
    if (!tunnel._dohProxy.active) {
      await tunnel._dohProxy.start(url, mode, dotHost, dotPort);
      if (tunnel._dohProxy.port !== 53) {
        await tunnel._dohProxy.applyNatRedirect(process.platform);
      }
      // Override system DNS to point at the local proxy
      await tunnel.setDNS([tunnel._dohProxy.host]).catch(() => {});
    }
    return { success: true, active: true, host: tunnel._dohProxy.host, port: tunnel._dohProxy.port };
  } catch (err) {
    console.error('[IPC vpn-doh-start] Error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('vpn-doh-stop', async () => {
  try {
    if (tunnel._dohProxy?.active) {
      if (tunnel._dohProxy.port !== 53) {
        await tunnel._dohProxy.removeNatRedirect(process.platform).catch(() => {});
      }
      tunnel._dohProxy.stop();
    }
    tunnel._dohProxy = null;
    // Restore DNS to the tunnel's assigned DNS (if still connected)
    if (tunnel.connected) {
      await tunnel.restoreDNS().catch(() => {});
    }
    return { success: true, active: false };
  } catch (err) {
    console.error('[IPC vpn-doh-stop] Error:', err.message);
    return { success: false, error: err.message };
  }
});

// ── Shadowsocks obfuscation relay ────────────────────────────────────────

/**
 * Start Shadowsocks relay.  The VPN must be reconnected after this for the
 * new (obfuscated) endpoint to take effect.
 * @param {{ ssServer:string, ssPort:number, password:string, method?:string,
 *           wgServer:string, wgPort:number, localPort?:number,
 *           ssLocalPath?:string }} payload
 */
ipcMain.handle('vpn-obfuscation-start', async (event, payload) => {
  try {
    const cfg = JSON.parse(JSON.stringify(payload ?? {}));
    if (!tunnel._ssRelay) {
      const { ShadowsocksRelay } = require('./vpn-tunnel');
      tunnel._ssRelay = new ShadowsocksRelay();
    }
    if (!tunnel._ssRelay.active) {
      await tunnel._ssRelay.start(cfg);
    }
    return {
      success:          true,
      active:           true,
      tunneledEndpoint: tunnel._ssRelay.tunneledEndpoint,
    };
  } catch (err) {
    console.error('[IPC vpn-obfuscation-start] Error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('vpn-obfuscation-stop', async () => {
  try {
    if (tunnel._ssRelay?.active) {
      tunnel._ssRelay.stop();
    }
    tunnel._ssRelay = null;
    return { success: true, active: false };
  } catch (err) {
    console.error('[IPC vpn-obfuscation-stop] Error:', err.message);
    return { success: false, error: err.message };
  }
});

// Get system info
ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion()
  };
});

// Get app version
ipcMain.handle('get-app-version', () => {
  return { version: app.getVersion() };
});

// Check for updates
ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { checking: false, message: 'Updates disabled in development' };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { checking: true };
  } catch (err) {
    console.warn('[autoUpdater] check failed:', err.message);
    return { checking: false, error: err.message };
  }
});

// Restart and apply a downloaded update
ipcMain.handle('restart-and-install', () => {
  autoUpdater.quitAndInstall(false, true);
});

// Log events from renderer (fire-and-forget)
ipcMain.on('log-event', (event, payload) => {
  if (payload && typeof payload.event === 'string') {
    console.log(`[renderer] ${payload.event}`, payload.data ?? '');
  }
});

// Analytics events from renderer (fire-and-forget)
ipcMain.on('analytics-event', (event, payload) => {
  // Intentionally a no-op in the main process; extend as needed.
});

// Auto-launch on system startup
ipcMain.handle('set-auto-launch', async (event, enabled) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true
  });
  return { success: true };
});

// ── Auto-updater setup (electron-updater) ───────────────────────────────
autoUpdater.autoDownload = true;      // download silently in background
autoUpdater.autoInstallOnAppQuit = true; // install on next quit if not restarted
autoUpdater.logger = { info: (m) => console.log('[updater]', m), warn: (m) => console.warn('[updater]', m), error: (m) => console.error('[updater]', m) };

if (!isDev) {
  // Check for updates once the window is fully shown, then every 4 hours
  app.once('browser-window-show', () => {
    setTimeout(() => autoUpdater.checkForUpdates().catch((e) => console.warn('[updater] initial check failed:', e.message)), 3000);
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
  });
}

autoUpdater.on('update-available', (info) => {
  console.log('[updater] update available:', info.version);
  if (mainWindow) mainWindow.webContents.send('update-available', {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
  });
});

autoUpdater.on('update-not-available', (info) => {
  if (mainWindow) mainWindow.webContents.send('update-not-available', { version: info.version });
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) mainWindow.webContents.send('update-progress', {
    percent:       Math.round(progress.percent),
    transferred:   progress.transferred,
    total:         progress.total,
    bytesPerSecond: progress.bytesPerSecond,
  });
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[updater] update downloaded:', info.version);
  if (mainWindow) mainWindow.webContents.send('update-downloaded', {
    version:      info.version,
    releaseDate:  info.releaseDate,
    releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
  });
});

autoUpdater.on('error', (err) => {
  console.error('[updater] error:', err.message);
  if (mainWindow) mainWindow.webContents.send('update-error', { message: err.message });
});

// Security: inject strict Content-Security-Policy for production file:// content
if (!isDev) {
  app.on('ready', () => {
    const apiOrigin = (process.env.API_URL || 'http://localhost:3001').replace(/\/api$/, '');
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            `default-src 'self' file:; ` +
            `script-src 'self' 'unsafe-inline' file:; ` +
            `style-src 'self' 'unsafe-inline' file:; ` +
            `img-src 'self' data: blob: file:; ` +
            `font-src 'self' data: file:; ` +
            `connect-src 'self' file: ${apiOrigin}; ` +
            `object-src 'none'; ` +
            `frame-ancestors 'none'; ` +
            `base-uri 'none';`
          ],
          // Remove headers that leak information
          'X-Powered-By': [],
          'Server': [],
        }
      });
    });
  });
}

// App ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle second instance (prevent multiple instances)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
