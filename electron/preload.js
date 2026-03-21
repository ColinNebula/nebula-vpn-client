/**
 * Minimal Preload Script for Testing
 */

console.log('🟢🟢🟢 MINIMAL PRELOAD SCRIPT STARTED 🟢🟢🟢');
console.log('process.versions.electron:', process.versions.electron);
console.log('process.versions.node:', process.versions.node);

const { contextBridge, ipcRenderer } = require('electron');

console.log('🟢 contextBridge loaded successfully');
console.log('🟢 ipcRenderer loaded successfully');

// Check what's already on window object
console.log('🔍 PRELOAD - Checking window.electron before exposure:', typeof window?.electron);
console.log('🔍 PRELOAD - Window object keys:', Object.keys(window || {}));

// Try to clean up any existing electron property
try {
  if (typeof window !== 'undefined' && window.electron) {
    delete window.electron;
    console.log('🔧 PRELOAD - Deleted existing window.electron');
  }
} catch (e) {
  console.log('🔧 PRELOAD - Could not delete window.electron:', e.message);
}

// Expose as 'electron' to match what renderer code expects
try {
  contextBridge.exposeInMainWorld('electron', {
    minimal: true,
    isElectron: true,
    test: () => {
      console.log('🟢 Minimal test function called');
      return 'minimal-test-success';
    },
    vpn: {
      connect: async (config) => {
        console.log('🔧 PRELOAD vpn.connect() called with:', config);
        try {
          const result = await ipcRenderer.invoke('vpn-connect-test', config);
          console.log('🔧 PRELOAD vpn-connect-test result:', result);
          return result;
        } catch (error) {
          console.log('🚨 PRELOAD vpn-connect-test error:', error.message);
          return { success: false, error: error.message };
        }
      },
      disconnect: async (config) => {
        console.log('🔧 PRELOAD vpn.disconnect() called with:', config);
        try {
          const result = await ipcRenderer.invoke('vpn-disconnect', config);
          console.log('🔧 PRELOAD vpn-disconnect result:', result);
          return result;
        } catch (error) {
          console.log('🚨 PRELOAD vpn-disconnect error:', error.message);
          return { success: false, error: error.message };
        }
      },
      multiHopConnect: async (config) => {
        console.log('🔧 PRELOAD vpn.multiHopConnect() called with:', config);
        try {
          const result = await ipcRenderer.invoke('vpn-multi-hop-connect', config);
          console.log('🔧 PRELOAD vpn-multi-hop-connect result:', result);
          return result;
        } catch (error) {
          console.log('🚨 PRELOAD vpn-multi-hop-connect error:', error.message);
          return { success: false, error: error.message };
        }
      },
      updateStatus: (status) => {
        console.log('🔧 PRELOAD vpn.updateStatus() called with:', status);
        try {
          ipcRenderer.invoke('vpn-update-status', status);
        } catch (error) {
          console.log('🚨 PRELOAD vpn-update-status error:', error.message);
        }
      },
      // DNS Protection Configuration
      configureDns: async (config) => {
        console.log('🔧 PRELOAD vpn.configureDns() called with:', config);
        try {
          const result = await ipcRenderer.invoke('vpn-dns-configure', config);
          console.log('🔧 PRELOAD vpn-dns-configure result:', result);
          return result;
        } catch (error) {
          console.log('🚨 PRELOAD vpn-dns-configure error:', error.message);
          return { success: false, error: error.message };
        }
      },
      getDnsConfig: async () => {
        console.log('🔧 PRELOAD vpn.getDnsConfig() called');
        try {
          const result = await ipcRenderer.invoke('vpn-dns-get-config');
          console.log('🔧 PRELOAD vpn-dns-get-config result:', result);
          return result;
        } catch (error) {
          console.log('🚨 PRELOAD vpn-dns-get-config error:', error.message);
          return { success: false, error: error.message };
        }
      }
    },
    ipc: {
      test: () => ipcRenderer.invoke('test'),
      ping: () => ipcRenderer.invoke('ping')
    }
  });
  console.log('🟢 PRELOAD - Successfully exposed electron API');
} catch (error) {
  console.error('🚨 PRELOAD FAILED to expose electron:', error.message);
}

console.log('🟢🟢🟢 MINIMAL PRELOAD SCRIPT FINISHED 🟢🟢🟢');
console.log('🔧 PRELOAD SCRIPT - ipcRenderer available:', !!ipcRenderer);

try {
  console.log('🔧 PRELOAD - About to expose electron API via contextBridge...');
  
  contextBridge.exposeInMainWorld('electron', {
    DEBUG_PRELOAD_LOADED: true,
    DEBUG_TIMESTAMP: new Date().toISOString(),
    
    // Add debugging method to list available IPC channels
    debugIPC: async () => {
      try {
        console.log('🔍 PRELOAD.JS - Testing ipcRenderer methods available:');
        console.log('🔍 PRELOAD.JS - ipcRenderer.invoke available:', typeof ipcRenderer.invoke);
        
        // Try to call an invalid handler to see what error we get
        try {
          await ipcRenderer.invoke('nonexistent-handler-test');
        } catch (error) {
          console.log('🔍 PRELOAD.JS - Error from nonexistent handler:', error.message);
        }
        
        return { success: true, timestamp: new Date().toISOString() };
      } catch (error) {
        console.log('🔍 PRELOAD.JS - Debug error:', error.message);
        return { success: false, error: error.message };
      }
    },
    
    vpn: {
      connect: async (config) => {
        console.log('🔧 PRELOAD vpn.connect() called with:', config);
        
        try {
          // Test simplest handlers first
          console.log('🔧 PRELOAD testing simplest handlers first...');
          try {
            const testResult = await ipcRenderer.invoke('test');
            console.log('🟢 PRELOAD test handler result:', testResult);
          } catch (testError) {
            console.log('🔴 PRELOAD test handler error:', testError.message);
          }

          try {
            const pingResult = await ipcRenderer.invoke('ping');
            console.log('🟢 PRELOAD ping handler result:', pingResult);
          } catch (pingError) {
            console.log('🔴 PRELOAD ping handler error:', pingError.message);
          }
          
          // Test unique IPC handler 
          console.log('🔧 PRELOAD testing unique IPC handler...');
          const testResult = await ipcRenderer.invoke('vpn-connect-test', {
            serverId: 'test',
            protocol: 'wireguard',
            token: 'test-token',
            killSwitch: false
          });  
          console.log('🔧 PRELOAD test handler result:', testResult);
          
          // Try real IPC first
          console.log('🔧 PRELOAD attempting IPC to main process...');
          const result = await ipcRenderer.invoke('vpn-connect', {
            serverId: config.serverId,
            protocol: config.protocol || 'wireguard',
            token: config.token,
            killSwitch: config.killSwitch || false
          });
          
          console.log('🔧 PRELOAD IPC result:', result);
          
          // Always use the IPC result (no fallback)
          if (result && result.success) {
            console.log('🚀 PRELOAD IPC SUCCESS - using real result!');
            return result;
          } else {
            console.log('🔧 PRELOAD IPC returned error, but still using it:', result);
            return result; // Return the actual error, don't simulate success
          }
          
        } catch (error) {
          console.error('🚨 PRELOAD IPC error:', error);
          // Only fallback on complete IPC failure
          return {
            success: false,
            error: `IPC communication failed: ${error.message}`
          };
        }
      },
      
      disconnect: async (config = {}) => {
        try {
          const result = await ipcRenderer.invoke('vpn-disconnect', config);
          return result || { success: true };
        } catch (error) {
          return { success: true };
        }
      },
      
      getStats: async () => {
        try {
          const result = await ipcRenderer.invoke('vpn-stats');
          return result || { success: true };
        } catch (error) {
          return { success: true };
        }
      },
      
      multiHopConnect: async (config) => {
        try {
          const result = await ipcRenderer.invoke('vpn-multihop', config);
          return result || { success: true };
        } catch (error) {
          return { success: true };
        }
      }
    }
  });
  
  console.log('🚀 PRELOAD SUCCESS: contextBridge.exposeInMainWorld completed with real IPC');
  
} catch (error) {
  console.error('🚨 PRELOAD FAILED:', error);
}

