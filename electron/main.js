const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, session, net, powerMonitor } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const isDev = require('electron-is-dev');
const { WireGuardTunnel } = require('./vpn-tunnel');
const PqcHandshake        = require('./pqc-handshake');

const execAsync = promisify(exec);

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

// Multi-hop VPN connection — connects via the entry node; the server routes
// traffic through the subsequent hops in the chain.
ipcMain.handle('vpn-multihop', async (event, { serverIds, protocol, token, killSwitch }) => {
  const pqc = new PqcHandshake();
  try {
    if (!Array.isArray(serverIds) || serverIds.length < 2) {
      return { success: false, error: 'At least 2 server IDs required' };
    }

    const apiBase  = process.env.API_URL || 'http://localhost:3001/api';
    const keyPair  = tunnel.generateKeyPair();

    const res = await fetch(`${apiBase}/vpn/multihop`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        serverIds,
        protocol:        protocol || 'wireguard',
        clientPublicKey: keyPair.publicKey,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `API returned ${res.status}`);
    }

    const { serverPublicKey, serverEndpoint, assignedIP, dns } = await res.json();

    tunnel.keyPair = keyPair;

    const result = await tunnel.connect({
      serverPublicKey,
      serverEndpoint,
      assignedIP,
      dns,
      enableKillSwitch: !!killSwitch,
      presharedKey:     null,
    });

    if (tray) {
      tray.setToolTip(`Nebula VPN – Multi-Hop Connected (${assignedIP})`);
    }

    return { success: true, ip: result.assignedIP, servers: serverIds, type: 'multi-hop' };
  } catch (err) {
    console.error('[IPC vpn-multihop] Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    pqc.wipe();
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

// ── WiFi / network scan ──────────────────────────────────────────────────

/**
 * Return current WiFi adapter info from the OS.
 * Windows: netsh wlan show interfaces
 * Linux:   iwconfig / nmcli
 * macOS:   airport -I
 */
ipcMain.handle('wifi-scan', async () => {
  try {
    let ssid = null, bssid = null, signal = null, security = null, frequency = null;

    if (process.platform === 'win32') {
      const { stdout } = await execAsync('netsh wlan show interfaces', { timeout: 5000 });
      const ssidMatch     = stdout.match(/^\s+SSID\s+:\s+(.+)$/m);
      const bssidMatch    = stdout.match(/^\s+BSSID\s+:\s+([\da-f:]+)/im);
      const signalMatch   = stdout.match(/^\s+Signal\s+:\s+(\d+)%/m);
      const securityMatch = stdout.match(/^\s+Authentication\s+:\s+(.+)$/m);
      const radioMatch    = stdout.match(/^\s+Radio type\s+:\s+(.+)$/m);
      ssid     = ssidMatch  ? ssidMatch[1].trim()     : null;
      bssid    = bssidMatch ? bssidMatch[1].trim()    : null;
      signal   = signalMatch ? parseInt(signalMatch[1], 10) : null;
      security = securityMatch ? securityMatch[1].trim() : null;
      frequency = radioMatch   ? radioMatch[1].trim()   : null;
    } else if (process.platform === 'linux') {
      const { stdout } = await execAsync(
        'nmcli -t -f active,ssid,bssid,signal,security dev wifi 2>/dev/null | grep "^yes"',
        { timeout: 5000 }
      ).catch(() => ({ stdout: '' }));
      const parts = stdout.trim().split(':');
      if (parts.length >= 4) {
        ssid     = parts[1] || null;
        bssid    = parts[2] || null;
        signal   = parts[3] ? parseInt(parts[3], 10) : null;
        security = parts[4] || null;
      }
    } else if (process.platform === 'darwin') {
      const airportPath = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
      const { stdout } = await execAsync(`${airportPath} -I`, { timeout: 5000 })
        .catch(() => ({ stdout: '' }));
      const ssidMatch   = stdout.match(/^\s+SSID:\s+(.+)$/m);
      const bssidMatch  = stdout.match(/^\s+BSSID:\s+([\da-f:]+)/im);
      const signalMatch = stdout.match(/^\s+agrCtlRSSI:\s+(-?\d+)/m);
      const authMatch   = stdout.match(/^\s+link auth:\s+(.+)$/m);
      ssid     = ssidMatch  ? ssidMatch[1].trim()  : null;
      bssid    = bssidMatch ? bssidMatch[1].trim() : null;
      signal   = signalMatch ? parseInt(signalMatch[1], 10) : null;
      security = authMatch  ? authMatch[1].trim()  : null;
    }

    // Determine if the network is open (no encryption)
    const isOpen = security
      ? /open|none/i.test(security)
      : false;

    return { success: true, ssid, bssid, signal, security, frequency, isOpen };
  } catch (err) {
    return { success: true, ssid: null, bssid: null, signal: null, security: null, isOpen: false, error: err.message };
  }
});

// ── Captive portal detection ──────────────────────────────────────────────

/**
 * Detect captive portals (hotel/airport login pages) by making a plain HTTP
 * request to a known-good endpoint.  If the response is redirected or
 * returns unexpected content we are behind a captive portal.
 *
 * Uses three canary endpoints (OS vendors' own portal checks) for reliability.
 */
ipcMain.handle('check-captive-portal', async () => {
  const CANARIES = [
    // Cloudflare  — returns exactly "success\n"
    { url: 'http://captive.cloudflare.com/cdn-cgi/trace', expect: /visit_scheme=http/ },
    // Apple iOS 14+ — returns exactly "<HTML>...<BODY>Success</BODY></HTML>"
    { url: 'http://captive.apple.com/', expect: /Success/i },
    // Android / Google — returns HTTP 204
    { url: 'http://connectivitycheck.gstatic.com/generate_204', expect: null, expectStatus: 204 },
  ];

  const check = (canary) => new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ captive: null, timedOut: true }), 4000);
    // Use http (not https) — if https works we might already be tunnelled
    const req = require('http').get(canary.url, { timeout: 4000 }, (res) => {
      clearTimeout(timeout);
      // Any redirect to a non-standard location means captive portal
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
        return resolve({ captive: true, redirectTo: res.headers.location || '(unknown)' });
      }
      if (canary.expectStatus && res.statusCode !== canary.expectStatus) {
        return resolve({ captive: true });
      }
      if (!canary.expect) return resolve({ captive: false });
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; if (body.length > 4096) req.destroy(); });
      res.on('end', () => resolve({ captive: !canary.expect.test(body) }));
    });
    req.on('error', () => { clearTimeout(timeout); resolve({ captive: null, error: true }); });
    req.on('timeout', () => { req.destroy(); clearTimeout(timeout); resolve({ captive: null, timedOut: true }); });
  });

  try {
    const results = await Promise.all(CANARIES.map(check));
    // If any test definitively says captive → captive
    const definitelyCaptive = results.some(r => r.captive === true);
    // If all timed out or errored → offline or VPN already active (treat as unknown)
    const allFailed = results.every(r => r.captive === null);
    const redirectTo = results.find(r => r.redirectTo)?.redirectTo || null;
    return { success: true, captive: allFailed ? null : definitelyCaptive, redirectTo };
  } catch (err) {
    return { success: false, captive: null, error: err.message };
  }
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

// ── Power monitor: notify renderer on system resume (wake from sleep) ───────
// This lets the UI re-check the network and re-connect the VPN immediately
// instead of waiting for the next user interaction, closing the exposure window.
app.whenReady().then(() => {
  powerMonitor.on('resume', () => {
    console.log('[PowerMonitor] System resumed – notifying renderer');
    if (mainWindow) mainWindow.webContents.send('system-resume');
  });

  powerMonitor.on('lock-screen', () => {
    if (mainWindow) mainWindow.webContents.send('system-lock-screen');
  });
});

// ── Network online/offline events ───────────────────────────────────────────
app.on('ready', () => {
  // Electron's net module fires these on the main process
  // Forward them to the renderer so AutoConnectWiFi can re-scan and reconnect
  setInterval(() => {
    const online = net.isOnline();
    if (mainWindow) mainWindow.webContents.send('network-status-change', { online });
  }, 3000); // poll every 3 s — lightweight, net.isOnline() is synchronous
});

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
