/**
 * Secure preload bridge for renderer <-> main process IPC.
 */

const { contextBridge, ipcRenderer } = require('electron');

const vpnApi = {
  connect: async (config = {}) => {
    return ipcRenderer.invoke('vpn-connect', {
      serverId: config.serverId,
      protocol: config.protocol || 'wireguard',
      token: config.token,
      killSwitch: !!config.killSwitch,
    });
  },

  disconnect: async (config = {}) => {
    return ipcRenderer.invoke('vpn-disconnect', config);
  },

  getStats: async () => {
    return ipcRenderer.invoke('vpn-stats');
  },

  multiHopConnect: async (config = {}) => {
    return ipcRenderer.invoke('vpn-multihop', config);
  },

  updateStatus: async (status = {}) => {
    return ipcRenderer.invoke('vpn-update-status', status);
  },

  configureDns: async (config = {}) => {
    return ipcRenderer.invoke('vpn-dns-configure', config);
  },

  getDnsConfig: async () => {
    return ipcRenderer.invoke('vpn-dns-get-config');
  },
};

const gpsApi = {
  enable: async (config = {}) => {
    return ipcRenderer.invoke('gps-enable', {
      location: config.location,
      mode: config.mode,
    });
  },

  disable: async () => {
    return ipcRenderer.invoke('gps-disable');
  },

  update: async (config = {}) => {
    return ipcRenderer.invoke('gps-update', {
      location: config.location,
    });
  },

  getStatus: async () => {
    return ipcRenderer.invoke('gps-status');
  },

  addJitter: async (config = {}) => {
    return ipcRenderer.invoke('gps-add-jitter', {
      maxMeters: config.maxMeters,
    });
  },

  getTimezone: async (config = {}) => {
    return ipcRenderer.invoke('gps-get-timezone', {
      location: config.location,
    });
  },
};

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  vpn: vpnApi,
  gps: gpsApi,
  ipc: {
    test: () => ipcRenderer.invoke('test'),
    ping: () => ipcRenderer.invoke('ping'),
  },
});

contextBridge.exposeInMainWorld('nebulaVPN', {
  minimal: true,
  isElectron: true,
  vpn: vpnApi,
  gps: gpsApi,
});
