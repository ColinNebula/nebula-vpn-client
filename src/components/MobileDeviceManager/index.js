import React, { useState, useEffect } from 'react';
import './MobileDeviceManager.css';

const MobileDeviceManager = () => {
  const [connectedDevices, setConnectedDevices] = useState([
    { id: 1, name: 'iPhone 15 Pro', type: 'iOS', version: '17.5', status: 'connected', battery: 78, lastSync: '2 min ago', location: 'US East', security: 'high' },
    { id: 2, name: 'Samsung Galaxy S24', type: 'Android', version: '14.0', status: 'connected', battery: 92, lastSync: '5 min ago', location: 'Singapore', security: 'high' },
    { id: 3, name: 'iPad Air', type: 'iPadOS', version: '17.4', status: 'standby', battery: 45, lastSync: '1 hour ago', location: 'UK London', security: 'medium' },
    { id: 4, name: 'Google Pixel 8', type: 'Android', version: '14.0', status: 'offline', battery: 23, lastSync: '6 hours ago', location: 'Germany', security: 'low' }
  ]);

  const [mobileSettings, setMobileSettings] = useState({
    autoConnect: true,
    batteryOptimization: true,
    backgroundSync: false,
    locationServices: true,
    biometricAuth: true,
    mobileDataUsage: true,
    wifiAutoSwitch: true,
    pushNotifications: true
  });

  const [securityFeatures, setSecurityFeatures] = useState([
    { name: 'Device Fingerprinting', enabled: true, description: 'Unique device identification for enhanced security' },
    { name: 'Jailbreak/Root Detection', enabled: true, description: 'Detect and block compromised devices' },
    { name: 'App Integrity Check', enabled: true, description: 'Verify VPN app authenticity and integrity' },
    { name: 'Network Anomaly Detection', enabled: false, description: 'Monitor for unusual network patterns' },
    { name: 'SIM Card Monitoring', enabled: true, description: 'Track SIM card changes and alerts' },
    { name: 'Geofencing', enabled: false, description: 'Location-based access controls' }
  ]);

  const [deviceAnalytics, setDeviceAnalytics] = useState({
    totalDevices: 24,
    activeConnections: 12,
    averageBattery: 67,
    dataUsage: 156.8, // MB
    securityScore: 87,
    syncedDevices: 18
  });

  const [crossPlatformSync, setCrossPlatformSync] = useState({
    profiles: { total: 8, synced: 6, pending: 2 },
    settings: { total: 15, synced: 14, pending: 1 },
    history: { total: 247, synced: 230, pending: 17 },
    favorites: { total: 12, synced: 12, pending: 0 }
  });

  useEffect(() => {
    // Simulate real-time device updates
    const interval = setInterval(() => {
      setConnectedDevices(prev => prev.map(device => ({
        ...device,
        battery: Math.max(5, device.battery + (Math.random() - 0.7) * 2),
        lastSync: device.status === 'connected' ? 'now' : device.lastSync
      })));

      setDeviceAnalytics(prev => ({
        ...prev,
        dataUsage: prev.dataUsage + Math.random() * 2,
        averageBattery: Math.max(20, Math.min(100, prev.averageBattery + (Math.random() - 0.5) * 3)),
        securityScore: Math.max(75, Math.min(100, prev.securityScore + (Math.random() - 0.3)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleDeviceAction = (deviceId, action) => {
    setConnectedDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { 
            ...device, 
            status: action === 'disconnect' ? 'offline' : action === 'wake' ? 'connected' : device.status,
            lastSync: action === 'sync' ? 'now' : device.lastSync
          }
        : device
    ));
  };

  const toggleSetting = (setting) => {
    setMobileSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const toggleSecurityFeature = (index) => {
    setSecurityFeatures(prev => prev.map((feature, i) => 
      i === index ? { ...feature, enabled: !feature.enabled } : feature
    ));
  };

  return (
    <div className="mobile-device-manager">
      <div className="mobile-header">
        <h3>📱 Mobile Device Manager</h3>
        <div className="device-summary">
          <span className="connected-count">{connectedDevices.filter(d => d.status === 'connected').length} Connected</span>
          <span className="total-count">{connectedDevices.length} Total Devices</span>
        </div>
      </div>

      <div className="mobile-dashboard">
        <div className="device-overview">
          <h4>📊 Device Analytics</h4>
          <div className="analytics-grid">
            <div className="analytics-card">
              <span className="analytics-value">{deviceAnalytics.totalDevices}</span>
              <span className="analytics-label">Total Devices</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{deviceAnalytics.activeConnections}</span>
              <span className="analytics-label">Active Connections</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{deviceAnalytics.averageBattery}%</span>
              <span className="analytics-label">Avg Battery</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{deviceAnalytics.dataUsage.toFixed(1)} MB</span>
              <span className="analytics-label">Data Usage</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{deviceAnalytics.securityScore}%</span>
              <span className="analytics-label">Security Score</span>
            </div>
            <div className="analytics-card">
              <span className="analytics-value">{deviceAnalytics.syncedDevices}</span>
              <span className="analytics-label">Synced Devices</span>
            </div>
          </div>
        </div>

        <div className="connected-devices">
          <h4>📱 Connected Devices</h4>
          <div className="devices-list">
            {connectedDevices.map(device => (
              <div key={device.id} className={`device-card ${device.status}`}>
                <div className="device-info">
                  <div className="device-icon">
                    {device.type === 'iOS' && '📱'}
                    {device.type === 'Android' && '🤖'}
                    {device.type === 'iPadOS' && '📟'}
                  </div>
                  <div className="device-details">
                    <span className="device-name">{device.name}</span>
                    <span className="device-type">{device.type} {device.version}</span>
                    <span className="device-location">📍 {device.location}</span>
                  </div>
                </div>
                
                <div className="device-metrics">
                  <div className="battery-indicator">
                    <span className="battery-icon">🔋</span>
                    <span className="battery-level">{device.battery}%</span>
                    <div className="battery-bar">
                      <div 
                        className="battery-fill"
                        style={{ 
                          width: `${device.battery}%`,
                          backgroundColor: device.battery > 50 ? '#10b981' : device.battery > 20 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="device-status">
                    <span className={`status-badge ${device.status}`}>
                      {device.status === 'connected' && '🟢 Connected'}
                      {device.status === 'standby' && '🟡 Standby'}
                      {device.status === 'offline' && '⚫ Offline'}
                    </span>
                    <span className="last-sync">Last sync: {device.lastSync}</span>
                  </div>
                  
                  <div className={`security-level ${device.security}`}>
                    <span className="security-icon">
                      {device.security === 'high' && '🛡️'}
                      {device.security === 'medium' && '⚠️'}
                      {device.security === 'low' && '🔴'}
                    </span>
                    <span className="security-text">{device.security} security</span>
                  </div>
                </div>
                
                <div className="device-actions">
                  {device.status === 'connected' && (
                    <button 
                      className="device-btn disconnect"
                      onClick={() => handleDeviceAction(device.id, 'disconnect')}
                    >
                      Disconnect
                    </button>
                  )}
                  {device.status === 'offline' && (
                    <button 
                      className="device-btn wake"
                      onClick={() => handleDeviceAction(device.id, 'wake')}
                    >
                      Wake Up
                    </button>
                  )}
                  <button 
                    className="device-btn sync"
                    onClick={() => handleDeviceAction(device.id, 'sync')}
                  >
                    🔄 Sync
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mobile-settings">
          <h4>⚙️ Mobile Optimization Settings</h4>
          <div className="settings-grid">
            {Object.entries(mobileSettings).map(([key, value]) => (
              <div key={key} className="setting-item">
                <label className="setting-label">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </label>
                <label className="setting-toggle">
                  <input 
                    type="checkbox" 
                    checked={value}
                    onChange={() => toggleSetting(key)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="security-features">
          <h4>🔒 Mobile Security Features</h4>
          <div className="security-list">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="security-item">
                <div className="security-info">
                  <span className="security-name">{feature.name}</span>
                  <span className="security-description">{feature.description}</span>
                </div>
                <label className="security-toggle">
                  <input 
                    type="checkbox" 
                    checked={feature.enabled}
                    onChange={() => toggleSecurityFeature(index)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="cross-platform-sync">
          <h4>🔄 Cross-Platform Synchronization</h4>
          <div className="sync-status">
            {Object.entries(crossPlatformSync).map(([category, data]) => (
              <div key={category} className="sync-category">
                <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                <div className="sync-progress">
                  <div className="sync-bar">
                    <div 
                      className="sync-fill"
                      style={{ width: `${(data.synced / data.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="sync-text">
                    {data.synced}/{data.total} synced
                    {data.pending > 0 && ` (${data.pending} pending)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDeviceManager;