import React, { useState, useEffect } from 'react';
import './AutoConnectWiFi.css';

const AutoConnectWiFi = ({ 
  isEnabled = false, 
  onToggle, 
  onConnect,
  trustedNetworks = [],
  onAddTrustedNetwork,
  onRemoveTrustedNetwork
}) => {
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [networkType, setNetworkType] = useState('unknown');
  const [isSecure, setIsSecure] = useState(true);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [autoConnectLog, setAutoConnectLog] = useState([]);

  // Simulated network detection (in real app, would use native APIs)
  useEffect(() => {
    const detectNetwork = () => {
      // Simulated network info - in production, use native WiFi APIs
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setNetworkType(connection.type || 'unknown');
      }

      // Check if online
      if (navigator.onLine) {
        // Simulate detecting current network name
        // In production, this would come from native API
        setCurrentNetwork({
          name: 'Current Network',
          type: connection?.type || 'wifi',
          isSecure: true // Would be detected in production
        });
      } else {
        setCurrentNetwork(null);
      }
    };

    detectNetwork();

    // Listen for network changes
    window.addEventListener('online', detectNetwork);
    window.addEventListener('offline', detectNetwork);

    if (navigator.connection) {
      navigator.connection.addEventListener('change', detectNetwork);
    }

    return () => {
      window.removeEventListener('online', detectNetwork);
      window.removeEventListener('offline', detectNetwork);
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', detectNetwork);
      }
    };
  }, []);

  // Auto-connect logic
  useEffect(() => {
    if (!isEnabled || !currentNetwork) return;

    const isTrusted = trustedNetworks.some(
      network => network.name.toLowerCase() === currentNetwork.name.toLowerCase()
    );

    if (!isTrusted) {
      // Untrusted network detected - should auto-connect VPN
      const logEntry = {
        timestamp: new Date(),
        network: currentNetwork.name,
        action: 'Auto-connected VPN',
        reason: 'Untrusted network detected'
      };
      setAutoConnectLog(prev => [logEntry, ...prev.slice(0, 9)]);
      
      if (onConnect) {
        onConnect();
      }
    }
  }, [isEnabled, currentNetwork, trustedNetworks, onConnect]);

  const handleAddTrustedNetwork = () => {
    if (newNetworkName.trim() && onAddTrustedNetwork) {
      onAddTrustedNetwork({
        id: Date.now().toString(),
        name: newNetworkName.trim(),
        addedAt: new Date()
      });
      setNewNetworkName('');
      setShowAddNetwork(false);
    }
  };

  const addCurrentAsTrusted = () => {
    if (currentNetwork && onAddTrustedNetwork) {
      onAddTrustedNetwork({
        id: Date.now().toString(),
        name: currentNetwork.name,
        addedAt: new Date()
      });
    }
  };

  const getNetworkIcon = () => {
    switch (networkType) {
      case 'wifi': return '📶';
      case 'cellular': return '📱';
      case 'ethernet': return '🔌';
      default: return '🌐';
    }
  };

  const getSecurityIcon = () => {
    return isSecure ? '🔒' : '⚠️';
  };

  return (
    <div className={`auto-connect-wifi-container ${isEnabled ? 'enabled' : ''}`}>
      {/* Header */}
      <div className="auto-connect-header">
        <div className="header-left">
          <span className="feature-icon">🛡️</span>
          <div className="header-text">
            <span className="feature-title">Auto-Connect on WiFi</span>
            <span className="feature-subtitle">
              {isEnabled ? 'Protection active on untrusted networks' : 'Enable to auto-protect'}
            </span>
          </div>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={() => onToggle && onToggle(!isEnabled)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Current Network Status */}
      <div className="current-network-status">
        <div className="network-info">
          <span className="network-icon">{getNetworkIcon()}</span>
          <div className="network-details">
            <span className="network-name">
              {currentNetwork ? currentNetwork.name : 'No Network'}
            </span>
            <span className="network-type">{networkType.toUpperCase()}</span>
          </div>
          <span className="security-icon">{getSecurityIcon()}</span>
        </div>

        {currentNetwork && (
          <div className="network-trust-status">
            {trustedNetworks.some(n => n.name.toLowerCase() === currentNetwork.name.toLowerCase()) ? (
              <span className="trust-badge trusted">
                <span className="badge-icon">✓</span> Trusted Network
              </span>
            ) : (
              <div className="untrusted-actions">
                <span className="trust-badge untrusted">
                  <span className="badge-icon">!</span> Untrusted
                </span>
                <button 
                  className="trust-button"
                  onClick={addCurrentAsTrusted}
                >
                  Mark as Trusted
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Behavior Settings */}
      {isEnabled && (
        <div className="behavior-settings">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔄</span>
              <div className="setting-text">
                <span className="setting-title">Auto-connect on untrusted</span>
                <span className="setting-desc">VPN connects automatically on public WiFi</span>
              </div>
            </div>
            <span className="setting-status active">Active</span>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">📱</span>
              <div className="setting-text">
                <span className="setting-title">Mobile data protection</span>
                <span className="setting-desc">Also protect on cellular networks</span>
              </div>
            </div>
            <label className="mini-toggle">
              <input type="checkbox" defaultChecked />
              <span className="mini-slider"></span>
            </label>
          </div>
        </div>
      )}

      {/* Trusted Networks List */}
      <div className="trusted-networks">
        <div className="section-header">
          <span className="section-title">Trusted Networks</span>
          <button 
            className="add-network-btn"
            onClick={() => setShowAddNetwork(!showAddNetwork)}
          >
            {showAddNetwork ? '✕' : '+'}
          </button>
        </div>

        {showAddNetwork && (
          <div className="add-network-form">
            <input
              type="text"
              placeholder="Enter network name (SSID)"
              value={newNetworkName}
              onChange={(e) => setNewNetworkName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTrustedNetwork()}
            />
            <button onClick={handleAddTrustedNetwork}>Add</button>
          </div>
        )}

        {trustedNetworks.length > 0 ? (
          <div className="networks-list">
            {trustedNetworks.map(network => (
              <div key={network.id} className="network-item">
                <div className="network-item-info">
                  <span className="network-item-icon">📶</span>
                  <span className="network-item-name">{network.name}</span>
                </div>
                <button 
                  className="remove-network-btn"
                  onClick={() => onRemoveTrustedNetwork && onRemoveTrustedNetwork(network.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-networks">
            <span className="no-networks-icon">🏠</span>
            <span className="no-networks-text">
              No trusted networks yet. Add your home or work WiFi to skip auto-connect.
            </span>
          </div>
        )}
      </div>

      {/* Auto-Connect Log */}
      {autoConnectLog.length > 0 && (
        <div className="auto-connect-log">
          <div className="log-header">
            <span className="log-icon">📋</span>
            <span>Recent Auto-Connections</span>
          </div>
          <div className="log-list">
            {autoConnectLog.slice(0, 5).map((entry, index) => (
              <div key={index} className="log-item">
                <span className="log-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="log-network">{entry.network}</span>
                <span className="log-action">{entry.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="info-note">
        <span className="note-icon">💡</span>
        <span>VPN will automatically connect when you join an untrusted network, protecting your data from potential threats on public WiFi.</span>
      </div>
    </div>
  );
};

export default AutoConnectWiFi;
