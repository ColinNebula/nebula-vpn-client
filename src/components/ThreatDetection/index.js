import React, { useState, useEffect } from 'react';
import './ThreatDetection.css';

const ThreatDetection = ({ isConnected }) => {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState({
    blocked: 0,
    malware: 0,
    phishing: 0,
    trackers: 0
  });
  const [settings, setSettings] = useState({
    enabled: true,
    blockMalware: true,
    blockPhishing: true,
    blockTrackers: true,
    blockAds: false,
    realTimeScanning: true
  });
  const [scanning, setScanning] = useState(false);

  const threatTypes = [
    { type: 'malware', icon: '🦠', color: '#f44336', label: 'Malware' },
    { type: 'phishing', icon: '🎣', color: '#ff9800', label: 'Phishing' },
    { type: 'tracker', icon: '👁️', color: '#9c27b0', label: 'Tracker' },
    { type: 'ads', icon: '📢', color: '#2196F3', label: 'Advertisement' }
  ];

  // Simulate threat detection
  useEffect(() => {
    if (!isConnected || !settings.enabled) return;

    const interval = setInterval(() => {
      // Random threat generation
      if (Math.random() > 0.7) {
        const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
        const domains = [
          'malicious-site.xyz',
          'fake-banking.com',
          'tracker-network.io',
          'ad-server-cdn.net',
          'phishing-scam.org',
          'malware-download.ru',
          'suspicious-domain.tk'
        ];

        const newThreat = {
          id: Date.now(),
          type: threatType.type,
          domain: domains[Math.floor(Math.random() * domains.length)],
          ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
          timestamp: new Date().toLocaleTimeString(),
          blocked: shouldBlock(threatType.type),
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
        };

        setThreats(prev => [newThreat, ...prev].slice(0, 100));
        
        if (newThreat.blocked) {
          setStats(prev => ({
            ...prev,
            blocked: prev.blocked + 1,
            [newThreat.type === 'ads' ? 'trackers' : newThreat.type]: prev[newThreat.type === 'ads' ? 'trackers' : newThreat.type] + 1
          }));
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, settings]);

  const shouldBlock = (type) => {
    if (type === 'malware') return settings.blockMalware;
    if (type === 'phishing') return settings.blockPhishing;
    if (type === 'tracker' || type === 'ads') return settings.blockTrackers || settings.blockAds;
    return false;
  };

  const runScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
    }, 3000);
  };

  const clearThreats = () => {
    setThreats([]);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#ffc107';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="threat-detection">
      <div className="threat-header">
        <h3>🛡️ Threat Detection & Protection</h3>
        <div className="header-actions">
          <button onClick={runScan} className={`scan-btn ${scanning ? 'scanning' : ''}`} disabled={!isConnected || scanning}>
            {scanning ? '🔄 Scanning...' : '🔍 Run Scan'}
          </button>
          <button onClick={clearThreats} className="clear-btn" disabled={threats.length === 0}>
            🗑️ Clear Log
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`protection-banner ${settings.enabled ? 'active' : 'disabled'}`}>
        <div className="banner-icon">
          {settings.enabled ? '✅' : '⚠️'}
        </div>
        <div className="banner-content">
          <h4>{settings.enabled ? 'Protection Active' : 'Protection Disabled'}</h4>
          <p>
            {settings.enabled 
              ? 'Your connection is being monitored for threats in real-time'
              : 'Enable threat detection to protect your connection'
            }
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="threat-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4CAF50, #45a049)' }}>
            🛡️
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.blocked}</div>
            <div className="stat-label">Total Blocked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f44336, #d32f2f)' }}>
            🦠
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.malware}</div>
            <div className="stat-label">Malware</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}>
            🎣
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.phishing}</div>
            <div className="stat-label">Phishing</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' }}>
            👁️
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.trackers}</div>
            <div className="stat-label">Trackers</div>
          </div>
        </div>
      </div>

      {/* Protection Settings */}
      <div className="protection-settings">
        <h4>🔧 Protection Settings</h4>
        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🛡️</span>
              <div className="setting-details">
                <div className="setting-title">Threat Detection</div>
                <div className="setting-description">Enable real-time threat monitoring</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🦠</span>
              <div className="setting-details">
                <div className="setting-title">Block Malware</div>
                <div className="setting-description">Prevent access to malicious websites</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.blockMalware}
                onChange={(e) => setSettings({...settings, blockMalware: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🎣</span>
              <div className="setting-details">
                <div className="setting-title">Block Phishing</div>
                <div className="setting-description">Block fraudulent and phishing sites</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.blockPhishing}
                onChange={(e) => setSettings({...settings, blockPhishing: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">👁️</span>
              <div className="setting-details">
                <div className="setting-title">Block Trackers</div>
                <div className="setting-description">Prevent online tracking and analytics</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.blockTrackers}
                onChange={(e) => setSettings({...settings, blockTrackers: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">📢</span>
              <div className="setting-details">
                <div className="setting-title">Block Advertisements</div>
                <div className="setting-description">Remove ads from websites</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.blockAds}
                onChange={(e) => setSettings({...settings, blockAds: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">⚡</span>
              <div className="setting-details">
                <div className="setting-title">Real-time Scanning</div>
                <div className="setting-description">Continuous threat monitoring</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.realTimeScanning}
                onChange={(e) => setSettings({...settings, realTimeScanning: e.target.checked})}
                disabled={!settings.enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Threat Log */}
      <div className="threat-log">
        <h4>📋 Recent Threats ({threats.length})</h4>
        {threats.length === 0 ? (
          <div className="no-threats">
            <div className="no-threats-icon">✨</div>
            <h5>No Threats Detected</h5>
            <p>Your connection is clean and secure</p>
          </div>
        ) : (
          <div className="threat-list">
            {threats.slice(0, 50).map(threat => (
              <div key={threat.id} className={`threat-item ${threat.blocked ? 'blocked' : 'allowed'}`}>
                <div className="threat-icon-wrapper">
                  <span className="threat-type-icon">
                    {threatTypes.find(t => t.type === threat.type)?.icon}
                  </span>
                  <span className={`threat-status ${threat.blocked ? 'blocked' : 'allowed'}`}>
                    {threat.blocked ? '🛡️' : '⚠️'}
                  </span>
                </div>
                <div className="threat-details">
                  <div className="threat-main">
                    <span className="threat-domain">{threat.domain}</span>
                    <span className="threat-severity" style={{ color: getSeverityColor(threat.severity) }}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="threat-meta">
                    <span className="threat-type">{threatTypes.find(t => t.type === threat.type)?.label}</span>
                    <span className="threat-ip">IP: {threat.ip}</span>
                    <span className="threat-time">{threat.timestamp}</span>
                  </div>
                </div>
                <div className="threat-action">
                  {threat.blocked ? (
                    <span className="action-badge blocked">BLOCKED</span>
                  ) : (
                    <span className="action-badge allowed">ALLOWED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="security-tips">
        <h4>💡 Security Recommendations</h4>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">✅</span>
            <div className="tip-content">
              <div className="tip-title">Keep All Protection Enabled</div>
              <p>Enable all threat protection features for maximum security</p>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔄</span>
            <div className="tip-content">
              <div className="tip-title">Regular Scans</div>
              <p>Run periodic security scans to check for threats</p>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">⚠️</span>
            <div className="tip-content">
              <div className="tip-title">Review Threat Log</div>
              <p>Regularly check blocked threats to stay informed</p>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🛡️</span>
            <div className="tip-content">
              <div className="tip-title">Combine with Kill Switch</div>
              <p>Use threat detection alongside kill switch for best protection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatDetection;
