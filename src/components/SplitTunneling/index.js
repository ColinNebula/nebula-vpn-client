import React, { useState, useEffect } from 'react';
import './SplitTunneling.css';

const SplitTunneling = ({ apps, onAppsChange, isConnected, enabled }) => {
  const [availableApps] = useState([
    { id: 'chrome', name: 'Google Chrome', icon: '🌐', category: 'Browser', description: 'Web browser' },
    { id: 'firefox', name: 'Mozilla Firefox', icon: '🦊', category: 'Browser', description: 'Web browser' },
    { id: 'steam', name: 'Steam', icon: '🎮', category: 'Gaming', description: 'Gaming platform' },
    { id: 'discord', name: 'Discord', icon: '💬', category: 'Communication', description: 'Voice and text chat' },
    { id: 'spotify', name: 'Spotify', icon: '🎵', category: 'Media', description: 'Music streaming' },
    { id: 'netflix', name: 'Netflix', icon: '🎬', category: 'Media', description: 'Video streaming' },
    { id: 'zoom', name: 'Zoom', icon: '📹', category: 'Communication', description: 'Video conferencing' },
    { id: 'teams', name: 'Microsoft Teams', icon: '👥', category: 'Communication', description: 'Collaboration platform' },
    { id: 'torrent', name: 'BitTorrent', icon: '📦', category: 'File Sharing', description: 'P2P file sharing' },
    { id: 'email', name: 'Email Client', icon: '📧', category: 'Communication', description: 'Email application' },
    { id: 'banking', name: 'Banking App', icon: '🏦', category: 'Finance', description: 'Banking application' },
    { id: 'shopping', name: 'Shopping Apps', icon: '🛒', category: 'E-commerce', description: 'Online shopping' }
  ]);
  
  const [filterCategory, setFilterCategory] = useState('all');
  const [tunnelMode, setTunnelMode] = useState('exclude'); // 'exclude' or 'include'
  const [customApp, setCustomApp] = useState('');

  const categories = ['Browser', 'Gaming', 'Communication', 'Media', 'File Sharing', 'Finance', 'E-commerce'];

  const handleAppToggle = (app) => {
    const isSelected = apps.find(a => a.id === app.id);
    let newApps;
    
    if (isSelected) {
      newApps = apps.filter(a => a.id !== app.id);
    } else {
      newApps = [...apps, { ...app, mode: tunnelMode }];
    }
    
    onAppsChange(newApps);
  };

  const handleAddCustomApp = () => {
    if (customApp.trim() && !apps.find(a => a.name.toLowerCase() === customApp.toLowerCase())) {
      const newApp = {
        id: customApp.toLowerCase().replace(/\s+/g, '_'),
        name: customApp,
        icon: '⚙️',
        category: 'Custom',
        description: 'Custom application',
        mode: tunnelMode
      };
      onAppsChange([...apps, newApp]);
      setCustomApp('');
    }
  };

  const getFilteredApps = () => {
    if (filterCategory === 'all') return availableApps;
    return availableApps.filter(app => app.category === filterCategory);
  };

  const getTunnelDescription = () => {
    if (tunnelMode === 'exclude') {
      return 'Selected apps will bypass the VPN and use your regular internet connection';
    } else {
      return 'Only selected apps will use the VPN, all other traffic bypasses it';
    }
  };

  const getSecurityWarning = () => {
    const criticalApps = apps.filter(app => 
      ['banking', 'email'].includes(app.id) && app.mode === 'exclude'
    );
    
    if (criticalApps.length > 0) {
      return `Warning: ${criticalApps.map(a => a.name).join(', ')} will not be protected by VPN`;
    }
    return null;
  };

  if (!enabled) {
    return (
      <div className="split-tunneling">
        <div className="split-tunnel-intro">
          <h3>📱 Split Tunneling</h3>
          <div className="intro-content">
            <p>Split tunneling allows you to choose which applications use the VPN and which use your regular internet connection.</p>
            
            <div className="benefits">
              <h4>Benefits:</h4>
              <ul>
                <li><strong>Selective Protection:</strong> Protect sensitive apps while allowing others direct access</li>
                <li><strong>Improved Performance:</strong> Games and streaming can bypass VPN for better speeds</li>
                <li><strong>Local Access:</strong> Access local network resources while connected to VPN</li>
                <li><strong>Bandwidth Optimization:</strong> Reduce VPN bandwidth usage for non-critical apps</li>
              </ul>
            </div>

            <div className="enable-section">
              <p>Enable Split Tunneling in Settings to configure application rules.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="split-tunneling">
      <div className="split-tunnel-header">
        <h3>📱 Split Tunneling Configuration</h3>
        <div className="tunnel-stats">
          <div className="stat-item">
            <span className="stat-label">Configured Apps:</span>
            <span className="stat-value">{apps.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Mode:</span>
            <span className="stat-value">{tunnelMode === 'exclude' ? 'Bypass VPN' : 'VPN Only'}</span>
          </div>
        </div>
      </div>

      <div className="tunnel-mode-selector">
        <h4>Tunneling Mode</h4>
        <div className="mode-options">
          <label className={`mode-option ${tunnelMode === 'exclude' ? 'active' : ''}`}>
            <input
              type="radio"
              value="exclude"
              checked={tunnelMode === 'exclude'}
              onChange={(e) => setTunnelMode(e.target.value)}
              disabled={isConnected}
            />
            <div className="mode-info">
              <div className="mode-title">🚫 Bypass VPN</div>
              <div className="mode-description">Selected apps bypass VPN (recommended)</div>
            </div>
          </label>
          
          <label className={`mode-option ${tunnelMode === 'include' ? 'active' : ''}`}>
            <input
              type="radio"
              value="include"
              checked={tunnelMode === 'include'}
              onChange={(e) => setTunnelMode(e.target.value)}
              disabled={isConnected}
            />
            <div className="mode-info">
              <div className="mode-title">✅ VPN Only</div>
              <div className="mode-description">Only selected apps use VPN</div>
            </div>
          </label>
        </div>
        
        <div className="mode-explanation">
          <p>{getTunnelDescription()}</p>
        </div>
      </div>

      {apps.length > 0 && (
        <div className="configured-apps">
          <h4>Configured Applications</h4>
          <div className="app-list">
            {apps.map(app => (
              <div key={app.id} className="configured-app">
                <div className="app-info">
                  <span className="app-icon">{app.icon}</span>
                  <div className="app-details">
                    <div className="app-name">{app.name}</div>
                    <div className="app-category">{app.category}</div>
                  </div>
                </div>
                <div className="app-status">
                  <span className={`status-badge ${app.mode || tunnelMode}`}>
                    {(app.mode || tunnelMode) === 'exclude' ? 'Bypass VPN' : 'VPN Only'}
                  </span>
                  {!isConnected && (
                    <button 
                      className="remove-app"
                      onClick={() => handleAppToggle(app)}
                      title="Remove from split tunnel"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {getSecurityWarning() && (
        <div className="security-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">{getSecurityWarning()}</div>
        </div>
      )}

      {!isConnected && (
        <>
          <div className="app-selector">
            <div className="selector-header">
              <h4>Add Applications</h4>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="category-filter"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="app-grid">
              {getFilteredApps().map(app => (
                <div 
                  key={app.id}
                  className={`app-card ${apps.find(a => a.id === app.id) ? 'selected' : ''}`}
                  onClick={() => handleAppToggle(app)}
                >
                  <div className="app-header">
                    <span className="app-icon">{app.icon}</span>
                    <div className="app-name">{app.name}</div>
                    {apps.find(a => a.id === app.id) && (
                      <span className="selected-indicator">✓</span>
                    )}
                  </div>
                  <div className="app-meta">
                    <div className="app-category">{app.category}</div>
                    <div className="app-description">{app.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="custom-app-section">
            <h4>Add Custom Application</h4>
            <div className="custom-app-input">
              <input
                type="text"
                placeholder="Application name (e.g., My Custom App)"
                value={customApp}
                onChange={(e) => setCustomApp(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomApp()}
              />
              <button 
                onClick={handleAddCustomApp}
                disabled={!customApp.trim()}
                className="add-custom-btn"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}

      <div className="split-tunnel-info">
        <div className="info-card">
          <h5>💡 Split Tunneling Tips:</h5>
          <ul>
            <li><strong>Gaming:</strong> Bypass VPN for games to reduce latency</li>
            <li><strong>Streaming:</strong> Some services work better without VPN</li>
            <li><strong>Banking:</strong> Consider VPN protection for financial apps</li>
            <li><strong>Local Network:</strong> Bypass VPN for printers and NAS access</li>
            <li><strong>Work Apps:</strong> Follow company policy for business applications</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SplitTunneling;