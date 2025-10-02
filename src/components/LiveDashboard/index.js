import React, { useState, useEffect } from 'react';
import './LiveDashboard.css';

const LiveDashboard = ({ isConnected, selectedServer, connectionTime, trafficData, multiHopServers, onQuickConnect, onServerSelect, servers }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [widgets, setWidgets] = useState([
    { id: 'status', name: 'Connection Status', enabled: true, size: 'large' },
    { id: 'quickconnect', name: 'Quick Connect', enabled: true, size: 'medium' },
    { id: 'datausage', name: 'Data Usage', enabled: true, size: 'medium' },
    { id: 'speed', name: 'Live Speed', enabled: true, size: 'medium' },
    { id: 'health', name: 'Network Health', enabled: true, size: 'medium' },
    { id: 'recent', name: 'Recent Servers', enabled: true, size: 'medium' },
  ]);
  
  const [layout, setLayout] = useState('grid'); // grid, compact, focused
  const [networkHealth, setNetworkHealth] = useState(92);
  const [recentServers, setRecentServers] = useState([
    { id: '1', name: 'US East', flag: '🇺🇸', lastUsed: '2 hours ago' },
    { id: '2', name: 'UK London', flag: '🇬🇧', lastUsed: '5 hours ago' },
    { id: '3', name: 'Germany', flag: '🇩🇪', lastUsed: '1 day ago' },
  ]);

  const [stats, setStats] = useState({
    sessionsToday: 5,
    totalDataToday: 2.4,
    avgSpeed: 87.3,
    uptime: '99.8%'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate network health fluctuation
      if (isConnected) {
        setNetworkHealth(prev => Math.max(75, Math.min(100, prev + (Math.random() - 0.5) * 5)));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const toggleWidget = (widgetId) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const getOptimalServer = () => {
    return servers.reduce((best, current) => {
      const currentScore = (100 - current.load) + (200 - parseInt(current.ping));
      const bestScore = (100 - best.load) + (200 - parseInt(best.ping));
      return currentScore > bestScore ? current : best;
    });
  };

  const getHealthColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getHealthLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="live-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>📊 Dashboard</h2>
          <p className="current-time">{currentTime.toLocaleString()}</p>
        </div>
        <div className="header-controls">
          <div className="layout-selector">
            <button 
              className={`layout-btn ${layout === 'grid' ? 'active' : ''}`}
              onClick={() => setLayout('grid')}
              title="Grid Layout"
            >
              ⊞
            </button>
            <button 
              className={`layout-btn ${layout === 'compact' ? 'active' : ''}`}
              onClick={() => setLayout('compact')}
              title="Compact Layout"
            >
              ☰
            </button>
            <button 
              className={`layout-btn ${layout === 'focused' ? 'active' : ''}`}
              onClick={() => setLayout('focused')}
              title="Focused Layout"
            >
              ⊡
            </button>
          </div>
        </div>
      </div>

      {/* Widget Toggles */}
      <div className="widget-controls">
        <span className="controls-label">Widgets:</span>
        {widgets.map(widget => (
          <label key={widget.id} className="widget-toggle">
            <input 
              type="checkbox" 
              checked={widget.enabled}
              onChange={() => toggleWidget(widget.id)}
            />
            <span className="toggle-label">{widget.name}</span>
          </label>
        ))}
      </div>

      {/* Dashboard Widgets */}
      <div className={`dashboard-grid layout-${layout}`}>
        {/* Connection Status Widget */}
        {widgets.find(w => w.id === 'status' && w.enabled) && (
          <div className="widget widget-status">
            <div className="widget-header">
              <h3>🔐 Connection Status</h3>
              <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="widget-content">
              {isConnected ? (
                <>
                  <div className="status-main">
                    <div className="status-icon connected-icon">✓</div>
                    <div className="status-details">
                      {multiHopServers.length > 0 ? (
                        <>
                          <h4>Multi-Hop Active</h4>
                          <div className="hop-chain-mini">
                            {multiHopServers.map((server, index) => (
                              <span key={server.id}>
                                {server.flag} {server.name}
                                {index < multiHopServers.length - 1 && ' → '}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <h4>{selectedServer?.flag} {selectedServer?.name}</h4>
                          <p>{selectedServer?.location}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="status-stats">
                    <div className="stat-item">
                      <span className="stat-label">Duration</span>
                      <span className="stat-value">{formatTime(connectionTime)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Protocol</span>
                      <span className="stat-value">OpenVPN</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="status-disconnected">
                  <div className="status-icon disconnected-icon">○</div>
                  <p>Not connected to VPN</p>
                  <button className="quick-connect-btn" onClick={onQuickConnect}>
                    Quick Connect
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Connect Widget */}
        {widgets.find(w => w.id === 'quickconnect' && w.enabled) && (
          <div className="widget widget-quickconnect">
            <div className="widget-header">
              <h3>⚡ Quick Connect</h3>
            </div>
            <div className="widget-content">
              <button 
                className="quick-option fastest"
                onClick={() => {
                  const optimal = getOptimalServer();
                  onServerSelect(optimal);
                }}
              >
                <span className="option-icon">🚀</span>
                <div className="option-details">
                  <span className="option-title">Fastest Server</span>
                  <span className="option-subtitle">Auto-select optimal</span>
                </div>
              </button>
              <button className="quick-option recent">
                <span className="option-icon">🕐</span>
                <div className="option-details">
                  <span className="option-title">Last Used</span>
                  <span className="option-subtitle">{recentServers[0]?.name}</span>
                </div>
              </button>
              <button className="quick-option favorite">
                <span className="option-icon">⭐</span>
                <div className="option-details">
                  <span className="option-title">Favorite</span>
                  <span className="option-subtitle">US East</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Data Usage Widget */}
        {widgets.find(w => w.id === 'datausage' && w.enabled) && (
          <div className="widget widget-data">
            <div className="widget-header">
              <h3>📊 Data Usage</h3>
            </div>
            <div className="widget-content">
              <div className="data-circle">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="var(--accent-color)"
                    strokeWidth="10"
                    strokeDasharray={`${(trafficData.totalDownload / 5000) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text
                    x="60"
                    y="60"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="20"
                    fontWeight="bold"
                    fill="var(--text-primary)"
                  >
                    {formatBytes(trafficData.totalDownload * 1024)}
                  </text>
                </svg>
              </div>
              <div className="data-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-icon">⬇️</span>
                  <span className="breakdown-label">Download</span>
                  <span className="breakdown-value">{formatBytes(trafficData.totalDownload * 1024)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-icon">⬆️</span>
                  <span className="breakdown-label">Upload</span>
                  <span className="breakdown-value">{formatBytes(trafficData.totalUpload * 1024)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Speed Widget */}
        {widgets.find(w => w.id === 'speed' && w.enabled) && (
          <div className="widget widget-speed">
            <div className="widget-header">
              <h3>⚡ Live Speed</h3>
            </div>
            <div className="widget-content">
              <div className="speed-gauges">
                <div className="speed-gauge">
                  <div className="gauge-value">{trafficData.download.toFixed(1)}</div>
                  <div className="gauge-unit">KB/s</div>
                  <div className="gauge-label">⬇️ Download</div>
                </div>
                <div className="speed-gauge">
                  <div className="gauge-value">{trafficData.upload.toFixed(1)}</div>
                  <div className="gauge-unit">KB/s</div>
                  <div className="gauge-label">⬆️ Upload</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Health Widget */}
        {widgets.find(w => w.id === 'health' && w.enabled) && (
          <div className="widget widget-health">
            <div className="widget-header">
              <h3>💚 Network Health</h3>
            </div>
            <div className="widget-content">
              <div className="health-score">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={getHealthColor(networkHealth)}
                    strokeWidth="8"
                    strokeDasharray={`${networkHealth * 2.51} 251`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                  <text
                    x="50"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="24"
                    fontWeight="bold"
                    fill="var(--text-primary)"
                  >
                    {networkHealth.toFixed(0)}
                  </text>
                </svg>
              </div>
              <div className="health-status">
                <span 
                  className="health-label"
                  style={{ color: getHealthColor(networkHealth) }}
                >
                  {getHealthLabel(networkHealth)}
                </span>
                <p className="health-description">
                  {isConnected ? 'Connection stable' : 'Not connected'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Servers Widget */}
        {widgets.find(w => w.id === 'recent' && w.enabled) && (
          <div className="widget widget-recent">
            <div className="widget-header">
              <h3>🕐 Recent Servers</h3>
            </div>
            <div className="widget-content">
              <div className="recent-list">
                {recentServers.map(server => (
                  <button 
                    key={server.id}
                    className="recent-item"
                    onClick={() => {
                      const fullServer = servers.find(s => s.id === server.id);
                      if (fullServer) onServerSelect(fullServer);
                    }}
                  >
                    <span className="recent-flag">{server.flag}</span>
                    <div className="recent-details">
                      <span className="recent-name">{server.name}</span>
                      <span className="recent-time">{server.lastUsed}</span>
                    </div>
                    <span className="recent-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-icon">🔄</span>
          <div className="stat-info">
            <span className="stat-label">Sessions Today</span>
            <span className="stat-value">{stats.sessionsToday}</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div className="stat-info">
            <span className="stat-label">Data Today</span>
            <span className="stat-value">{stats.totalDataToday} GB</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div className="stat-info">
            <span className="stat-label">Avg Speed</span>
            <span className="stat-value">{stats.avgSpeed} Mbps</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✓</span>
          <div className="stat-info">
            <span className="stat-label">Uptime</span>
            <span className="stat-value">{stats.uptime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
