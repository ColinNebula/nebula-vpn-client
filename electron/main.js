const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, autoUpdater, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const WireGuardTunnel = require('./vpn-tunnel');

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
  try {
    const apiBase = process.env.API_URL || 'http://localhost:3001/api';

    // Step 1 – generate keys in main process and get peer config from API server
    const keyPair = tunnel.generateKeyPair();

    const res = await fetch(`${apiBase}/vpn/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ serverId, protocol: protocol || 'wireguard', clientPublicKey: keyPair.publicKey }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `API returned ${res.status}`);
    }

    const { serverPublicKey, serverEndpoint, assignedIP, dns } = await res.json();

    // Inject the pre-generated private key so tunnel.connect() uses it
    tunnel.keyPair = keyPair;

    // Step 2 – bring up the actual WireGuard tunnel
    const result = await tunnel.connect({
      serverPublicKey,
      serverEndpoint,
      assignedIP,
      dns,
      enableKillSwitch: !!killSwitch,
    });

    // Update tray tooltip
    if (tray) tray.setToolTip(`Nebula VPN – Connected (${assignedIP})`);

    return { success: true, ip: result.assignedIP, publicKey: result.publicKey };
  } catch (err) {
    console.error('[IPC vpn-connect] Error:', err.message);
    return { success: false, error: err.message };
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
ipcMain.handle('check-for-updates', () => {
  if (isDev) {
    return { checking: false, message: 'Updates disabled in development' };
  }
  try {
    autoUpdater.checkForUpdates();
    return { checking: true };
  } catch (err) {
    console.warn('[autoUpdater] check failed:', err.message);
    return { checking: false, error: err.message };
  }
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

// ── Auto-updater setup ───────────────────────────────────────────────────
if (!isDev) {
  // Feed URL should be set via environment variable or electron-builder config.
  // e.g. process.env.UPDATE_FEED_URL = 'https://updates.yourserver.com/'
  if (process.env.UPDATE_FEED_URL) {
    autoUpdater.setFeedURL({ url: process.env.UPDATE_FEED_URL });
  }

  autoUpdater.on('update-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded', { releaseName, releaseNotes });
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${releaseName} has been downloaded.`,
      detail: 'Restart Nebula VPN to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[autoUpdater] Error:', err.message);
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
