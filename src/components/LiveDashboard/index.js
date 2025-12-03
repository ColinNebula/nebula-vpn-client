import React, { useState, useEffect, useCallback } from 'react';
import './LiveDashboard.css';

const LiveDashboard = ({ isConnected, selectedServer, connectionTime, trafficData, multiHopServers, onQuickConnect, onServerSelect, servers }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [widgets, setWidgets] = useState([
    { id: 'status', name: 'Connection', enabled: true, size: 'large' },
    { id: 'security', name: 'Security', enabled: true, size: 'medium' },
    { id: 'speed', name: 'Speed', enabled: true, size: 'medium' },
    { id: 'ipinfo', name: 'IP Info', enabled: true, size: 'medium' },
    { id: 'threats', name: 'Threats', enabled: true, size: 'medium' },
    { id: 'quickconnect', name: 'Quick Connect', enabled: true, size: 'medium' },
    { id: 'bandwidth', name: 'Bandwidth', enabled: true, size: 'large' },
    { id: 'worldmap', name: 'Map', enabled: true, size: 'medium' },
  ]);
  
  const [layout, setLayout] = useState('grid');
  const [networkHealth, setNetworkHealth] = useState(92);
  const [speedHistory, setSpeedHistory] = useState(Array(20).fill({ down: 0, up: 0 }));
  const [securityScore, setSecurityScore] = useState(0);
  const [threatsBlocked, setThreatsBlocked] = useState({ malware: 0, ads: 0, trackers: 0, phishing: 0 });
  const [ipInfo, setIpInfo] = useState({ visible: '---', real: '---', country: '---', isp: '---' });
  const [animatedSecurityScore, setAnimatedSecurityScore] = useState(0);

  const recentServers = [
    { id: '1', name: 'US East', flag: '🇺🇸', ping: '24ms', load: 35 },
    { id: '2', name: 'UK London', flag: '🇬🇧', ping: '45ms', load: 42 },
    { id: '3', name: 'Germany', flag: '🇩🇪', ping: '38ms', load: 28 },
    { id: '4', name: 'Japan', flag: '🇯🇵', ping: '120ms', load: 55 },
  ];

  const securityFeatures = [
    { id: 'killswitch', name: 'Kill Switch', enabled: true, icon: '🛡️' },
    { id: 'dns', name: 'DNS Protection', enabled: true, icon: '🔐' },
    { id: 'leak', name: 'Leak Protection', enabled: true, icon: '💧' },
    { id: 'malware', name: 'Malware Block', enabled: true, icon: '🦠' },
    { id: 'ads', name: 'Ad Blocker', enabled: true, icon: '🚫' },
    { id: 'tracker', name: 'Anti-Tracking', enabled: false, icon: '👁️' },
  ];

  // Calculate security score based on features
  useEffect(() => {
    const enabledFeatures = securityFeatures.filter(f => f.enabled).length;
    const baseScore = isConnected ? 60 : 20;
    const featureScore = (enabledFeatures / securityFeatures.length) * 40;
    setSecurityScore(Math.round(baseScore + featureScore));
  }, [isConnected]);

  // Animate security score
  useEffect(() => {
    const target = securityScore;
    const step = (target - animatedSecurityScore) / 20;
    if (Math.abs(target - animatedSecurityScore) > 1) {
      const timer = setTimeout(() => {
        setAnimatedSecurityScore(prev => prev + step);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setAnimatedSecurityScore(target);
    }
  }, [securityScore, animatedSecurityScore]);

  // Simulate IP info
  useEffect(() => {
    if (isConnected && selectedServer) {
      setIpInfo({
        visible: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        real: '192.168.1.xxx (Hidden)',
        country: selectedServer.location || selectedServer.name,
        isp: 'Nebula VPN Network'
      });
    } else {
      setIpInfo({
        visible: '192.168.1.105',
        real: '192.168.1.105 (Exposed!)',
        country: 'Your Location',
        isp: 'Your ISP (Visible!)'
      });
    }
  }, [isConnected, selectedServer]);

  // Simulate threats blocked
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setThreatsBlocked(prev => ({
          malware: prev.malware + (Math.random() > 0.95 ? 1 : 0),
          ads: prev.ads + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0),
          trackers: prev.trackers + (Math.random() > 0.8 ? Math.floor(Math.random() * 2) : 0),
          phishing: prev.phishing + (Math.random() > 0.98 ? 1 : 0),
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Update speed history
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeedHistory(prev => {
        const newHistory = [...prev.slice(1), { 
          down: trafficData.download, 
          up: trafficData.upload 
        }];
        return newHistory;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [trafficData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
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
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatSpeed = (kbps) => {
    if (kbps < 1024) return `${kbps.toFixed(0)} KB/s`;
    return `${(kbps / 1024).toFixed(1)} MB/s`;
  };

  const toggleWidget = (widgetId) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const getOptimalServer = useCallback(() => {
    if (!servers || servers.length === 0) return null;
    return servers.reduce((best, current) => {
      const currentScore = (100 - current.load) + (200 - parseInt(current.ping));
      const bestScore = (100 - best.load) + (200 - parseInt(best.ping));
      return currentScore > bestScore ? current : best;
    });
  }, [servers]);

  const getSecurityColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getSecurityLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'At Risk';
  };

  const maxSpeed = Math.max(...speedHistory.map(s => Math.max(s.down, s.up)), 100);

  return (
    <div className="live-dashboard">
      {/* Hero Status Section */}
      <div className={`dashboard-hero ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="hero-background">
          <div className="hero-gradient"></div>
          {isConnected && <div className="hero-pulse"></div>}
        </div>
        
        <div className="hero-content">
          <div className="hero-left">
            <div className={`connection-orb ${isConnected ? 'active' : ''}`}>
              <div className="orb-inner">
                {isConnected ? '🛡️' : '⚠️'}
              </div>
              {isConnected && (
                <>
                  <div className="orb-ring ring-1"></div>
                  <div className="orb-ring ring-2"></div>
                  <div className="orb-ring ring-3"></div>
                </>
              )}
            </div>
            
            <div className="hero-info">
              <span className={`status-pill ${isConnected ? 'connected' : 'disconnected'}`}>
                <span className="status-dot"></span>
                {isConnected ? 'Protected' : 'Unprotected'}
              </span>
              
              {isConnected ? (
                <>
                  <h1 className="hero-title">
                    {multiHopServers.length > 0 
                      ? `Multi-Hop: ${multiHopServers.length} Servers`
                      : `${selectedServer?.flag} ${selectedServer?.name}`
                    }
                  </h1>
                  <p className="hero-subtitle">
                    {multiHopServers.length > 0 
                      ? multiHopServers.map(s => s.flag).join(' → ')
                      : selectedServer?.location
                    }
                  </p>
                </>
              ) : (
                <>
                  <h1 className="hero-title">Not Connected</h1>
                  <p className="hero-subtitle">Your traffic is visible to your ISP</p>
                </>
              )}
            </div>
          </div>
          
          <div className="hero-right">
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-value">{formatTime(connectionTime)}</span>
                <span className="stat-label">Duration</span>
              </div>
              <div className="hero-stat">
                <span className="stat-value">{formatBytes(trafficData.totalDownload * 1024)}</span>
                <span className="stat-label">Downloaded</span>
              </div>
              <div className="hero-stat">
                <span className="stat-value">{selectedServer?.ping || '--'}</span>
                <span className="stat-label">Ping</span>
              </div>
            </div>
            
            {!isConnected && (
              <button className="hero-connect-btn" onClick={onQuickConnect}>
                <span className="btn-icon">⚡</span>
                Quick Connect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Controls */}
      <div className="dashboard-controls">
        <div className="controls-left">
          <span className="controls-time">{currentTime.toLocaleString()}</span>
        </div>
        <div className="controls-right">
          <div className="widget-toggles">
            {widgets.map(widget => (
              <button 
                key={widget.id}
                className={`widget-toggle-btn ${widget.enabled ? 'active' : ''}`}
                onClick={() => toggleWidget(widget.id)}
              >
                {widget.name}
              </button>
            ))}
          </div>
          <div className="layout-selector">
            {['grid', 'compact', 'focused'].map(l => (
              <button 
                key={l}
                className={`layout-btn ${layout === l ? 'active' : ''}`}
                onClick={() => setLayout(l)}
              >
                {l === 'grid' ? '⊞' : l === 'compact' ? '☰' : '⊡'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <div className={`dashboard-grid layout-${layout}`}>
        
        {/* Security Score Widget */}
        {widgets.find(w => w.id === 'security' && w.enabled) && (
          <div className="widget widget-security">
            <div className="widget-header">
              <h3>🛡️ Security Score</h3>
              <span className="widget-badge" style={{ background: getSecurityColor(securityScore) }}>
                {getSecurityLabel(securityScore)}
              </span>
            </div>
            <div className="widget-content">
              <div className="security-score-display">
                <svg className="score-ring" viewBox="0 0 120 120">
                  <circle className="score-bg" cx="60" cy="60" r="52" />
                  <circle 
                    className="score-progress" 
                    cx="60" cy="60" r="52"
                    style={{ 
                      strokeDasharray: `${animatedSecurityScore * 3.27} 327`,
                      stroke: getSecurityColor(securityScore)
                    }}
                  />
                </svg>
                <div className="score-value">
                  <span className="score-number">{Math.round(animatedSecurityScore)}</span>
                  <span className="score-label">/ 100</span>
                </div>
              </div>
              
              <div className="security-features">
                {securityFeatures.map(feature => (
                  <div key={feature.id} className={`security-feature ${feature.enabled ? 'enabled' : 'disabled'}`}>
                    <span className="feature-icon">{feature.icon}</span>
                    <span className="feature-name">{feature.name}</span>
                    <span className="feature-status">{feature.enabled ? '✓' : '○'}</span>
                  </div>
                ))}
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
              <div className="speed-display">
                <div className="speed-metric download">
                  <span className="speed-icon">⬇️</span>
                  <div className="speed-info">
                    <span className="speed-value">{formatSpeed(trafficData.download)}</span>
                    <span className="speed-label">Download</span>
                  </div>
                </div>
                <div className="speed-metric upload">
                  <span className="speed-icon">⬆️</span>
                  <div className="speed-info">
                    <span className="speed-value">{formatSpeed(trafficData.upload)}</span>
                    <span className="speed-label">Upload</span>
                  </div>
                </div>
              </div>
              
              <div className="speed-chart">
                <div className="chart-bars">
                  {speedHistory.map((speed, i) => (
                    <div key={i} className="chart-bar-group">
                      <div 
                        className="chart-bar download"
                        style={{ height: `${(speed.down / maxSpeed) * 100}%` }}
                      />
                      <div 
                        className="chart-bar upload"
                        style={{ height: `${(speed.up / maxSpeed) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <span className="legend-item download">⬇ Download</span>
                  <span className="legend-item upload">⬆ Upload</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IP Info Widget */}
        {widgets.find(w => w.id === 'ipinfo' && w.enabled) && (
          <div className="widget widget-ipinfo">
            <div className="widget-header">
              <h3>🌐 IP Information</h3>
              <button className="refresh-btn">🔄</button>
            </div>
            <div className="widget-content">
              <div className="ip-display">
                <div className={`ip-card ${isConnected ? 'protected' : 'exposed'}`}>
                  <span className="ip-label">Visible IP</span>
                  <span className="ip-value">{ipInfo.visible}</span>
                  <span className={`ip-status ${isConnected ? 'safe' : 'danger'}`}>
                    {isConnected ? '🔒 Protected' : '⚠️ Exposed'}
                  </span>
                </div>
              </div>
              
              <div className="ip-details">
                <div className="ip-detail">
                  <span className="detail-icon">📍</span>
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{ipInfo.country}</span>
                </div>
                <div className="ip-detail">
                  <span className="detail-icon">🏢</span>
                  <span className="detail-label">ISP</span>
                  <span className="detail-value">{ipInfo.isp}</span>
                </div>
                <div className="ip-detail">
                  <span className="detail-icon">🔐</span>
                  <span className="detail-label">Encryption</span>
                  <span className="detail-value">{isConnected ? 'AES-256-GCM' : 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threats Blocked Widget */}
        {widgets.find(w => w.id === 'threats' && w.enabled) && (
          <div className="widget widget-threats">
            <div className="widget-header">
              <h3>🚨 Threats Blocked</h3>
              <span className="threats-total">
                {Object.values(threatsBlocked).reduce((a, b) => a + b, 0)} Total
              </span>
            </div>
            <div className="widget-content">
              <div className="threats-grid">
                <div className="threat-item malware">
                  <span className="threat-icon">🦠</span>
                  <span className="threat-count">{threatsBlocked.malware}</span>
                  <span className="threat-label">Malware</span>
                </div>
                <div className="threat-item ads">
                  <span className="threat-icon">🚫</span>
                  <span className="threat-count">{threatsBlocked.ads}</span>
                  <span className="threat-label">Ads</span>
                </div>
                <div className="threat-item trackers">
                  <span className="threat-icon">👁️</span>
                  <span className="threat-count">{threatsBlocked.trackers}</span>
                  <span className="threat-label">Trackers</span>
                </div>
                <div className="threat-item phishing">
                  <span className="threat-icon">🎣</span>
                  <span className="threat-count">{threatsBlocked.phishing}</span>
                  <span className="threat-label">Phishing</span>
                </div>
              </div>
              
              {isConnected && (
                <div className="threats-activity">
                  <div className="activity-bar">
                    <div className="activity-pulse"></div>
                  </div>
                  <span className="activity-text">Actively protecting...</span>
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
              <div className="quick-servers">
                {recentServers.map(server => (
                  <button 
                    key={server.id}
                    className="quick-server"
                    onClick={() => {
                      const fullServer = servers?.find(s => s.id === server.id);
                      if (fullServer) onServerSelect(fullServer);
                    }}
                  >
                    <span className="server-flag">{server.flag}</span>
                    <div className="server-info">
                      <span className="server-name">{server.name}</span>
                      <span className="server-ping">{server.ping}</span>
                    </div>
                    <div className="server-load">
                      <div className="load-bar">
                        <div className="load-fill" style={{ width: `${server.load}%` }}></div>
                      </div>
                      <span className="load-text">{server.load}%</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <button 
                className="optimal-connect-btn"
                onClick={() => {
                  const optimal = getOptimalServer();
                  if (optimal) onServerSelect(optimal);
                }}
              >
                <span className="btn-icon">🚀</span>
                Connect to Fastest
              </button>
            </div>
          </div>
        )}

        {/* Bandwidth Usage Widget */}
        {widgets.find(w => w.id === 'bandwidth' && w.enabled) && (
          <div className="widget widget-bandwidth wide">
            <div className="widget-header">
              <h3>📊 Bandwidth Usage</h3>
              <div className="period-selector">
                <button className="period-btn active">Today</button>
                <button className="period-btn">Week</button>
                <button className="period-btn">Month</button>
              </div>
            </div>
            <div className="widget-content">
              <div className="bandwidth-overview">
                <div className="bandwidth-stat">
                  <div className="stat-circle download">
                    <span className="circle-value">{formatBytes(trafficData.totalDownload * 1024)}</span>
                  </div>
                  <span className="stat-label">Downloaded</span>
                </div>
                <div className="bandwidth-divider">
                  <div className="divider-line"></div>
                  <span className="divider-icon">↔️</span>
                  <div className="divider-line"></div>
                </div>
                <div className="bandwidth-stat">
                  <div className="stat-circle upload">
                    <span className="circle-value">{formatBytes(trafficData.totalUpload * 1024)}</span>
                  </div>
                  <span className="stat-label">Uploaded</span>
                </div>
              </div>
              
              <div className="bandwidth-breakdown">
                <div className="breakdown-header">
                  <span>Top Usage by Category</span>
                </div>
                <div className="breakdown-bars">
                  <div className="breakdown-item">
                    <span className="item-label">🎬 Streaming</span>
                    <div className="item-bar"><div className="item-fill" style={{ width: '75%' }}></div></div>
                    <span className="item-value">1.8 GB</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="item-label">🌐 Browsing</span>
                    <div className="item-bar"><div className="item-fill" style={{ width: '45%' }}></div></div>
                    <span className="item-value">420 MB</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="item-label">📧 Email</span>
                    <div className="item-bar"><div className="item-fill" style={{ width: '15%' }}></div></div>
                    <span className="item-value">85 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* World Map Widget */}
        {widgets.find(w => w.id === 'worldmap' && w.enabled) && (
          <div className="widget widget-worldmap">
            <div className="widget-header">
              <h3>🗺️ Connection Map</h3>
            </div>
            <div className="widget-content">
              <div className="map-placeholder">
                <div className="map-dots">
                  <div className="map-dot you" style={{ left: '20%', top: '40%' }}>
                    <span className="dot-label">You</span>
                  </div>
                  {isConnected && (
                    <>
                      <div className="connection-line"></div>
                      <div className="map-dot server" style={{ left: '70%', top: '35%' }}>
                        <span className="dot-label">{selectedServer?.name || 'Server'}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="map-grid">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="grid-line horizontal" style={{ top: `${(i + 1) * 16}%` }}></div>
                  ))}
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="grid-line vertical" style={{ left: `${(i + 1) * 11}%` }}></div>
                  ))}
                </div>
              </div>
              
              <div className="map-legend">
                <div className="legend-item">
                  <span className="legend-dot you"></span>
                  <span>Your Location</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot server"></span>
                  <span>VPN Server</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card pulse">
          <span className="stat-icon">🔒</span>
          <div className="stat-info">
            <span className="stat-value">{isConnected ? 'AES-256' : 'None'}</span>
            <span className="stat-label">Encryption</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📡</span>
          <div className="stat-info">
            <span className="stat-value">{isConnected ? 'WireGuard' : '--'}</span>
            <span className="stat-label">Protocol</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🌍</span>
          <div className="stat-info">
            <span className="stat-value">{servers?.length || 0}</span>
            <span className="stat-label">Servers</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <div className="stat-info">
            <span className="stat-value">{networkHealth.toFixed(0)}%</span>
            <span className="stat-label">Health</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🛡️</span>
          <div className="stat-info">
            <span className="stat-value">{Object.values(threatsBlocked).reduce((a, b) => a + b, 0)}</span>
            <span className="stat-label">Blocked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
