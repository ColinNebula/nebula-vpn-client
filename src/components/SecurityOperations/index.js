import React, { useState } from 'react';
import './SecurityOperations.css';

const SecurityOperations = () => {
  const [activeView, setActiveView] = useState('dashboard');
  
  const threatFeeds = [
    { name: 'Malware Domains', status: 'active', lastUpdate: '2 min ago', threats: 1247 },
    { name: 'Phishing URLs', status: 'active', lastUpdate: '5 min ago', threats: 892 },
    { name: 'Botnet IPs', status: 'active', lastUpdate: '1 min ago', threats: 2156 },
    { name: 'C&C Servers', status: 'active', lastUpdate: '3 min ago', threats: 437 }
  ];

  const incidents = [
    { id: 1, type: 'DNS Leak', severity: 'high', status: 'investigating', time: '10 min ago' },
    { id: 2, type: 'Malware Blocked', severity: 'medium', status: 'resolved', time: '1 hour ago' },
    { id: 3, type: 'Suspicious Traffic', severity: 'low', status: 'monitoring', time: '3 hours ago' }
  ];

  const vulnerabilities = [
    { id: 1, cve: 'CVE-2025-1234', severity: 'critical', component: 'OpenVPN Client', status: 'patch_available' },
    { id: 2, cve: 'CVE-2025-5678', severity: 'high', component: 'Network Driver', status: 'investigating' },
    { id: 3, cve: 'CVE-2025-9012', severity: 'medium', component: 'UI Framework', status: 'patched' }
  ];

  return (
    <div className="security-operations">
      <div className="sec-ops-header">
        <h3>🛡️ Security Operations Center</h3>
        <div className="threat-level">
          <span className="threat-indicator medium">⚠️</span>
          <span>Threat Level: ELEVATED</span>
        </div>
      </div>

      <div className="sec-ops-nav">
        <button className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
          📊 SOC Dashboard
        </button>
        <button className={`nav-btn ${activeView === 'incidents' ? 'active' : ''}`} onClick={() => setActiveView('incidents')}>
          🚨 Incidents
        </button>
        <button className={`nav-btn ${activeView === 'vulnerabilities' ? 'active' : ''}`} onClick={() => setActiveView('vulnerabilities')}>
          🔍 Vulnerabilities
        </button>
      </div>

      {activeView === 'dashboard' && (
        <div className="soc-dashboard">
          <div className="threat-feeds">
            <h4>📡 Threat Intelligence Feeds</h4>
            <div className="feeds-grid">
              {threatFeeds.map((feed, index) => (
                <div key={index} className="feed-card">
                  <div className="feed-header">
                    <span className="feed-name">{feed.name}</span>
                    <span className={`feed-status ${feed.status}`}>●</span>
                  </div>
                  <div className="feed-stats">
                    <span className="threat-count">{feed.threats.toLocaleString()} threats</span>
                    <span className="last-update">Updated {feed.lastUpdate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="security-metrics">
            <h4>📈 Security Metrics (24h)</h4>
            <div className="metrics-grid">
              <div className="sec-metric">
                <span className="metric-icon">🛡️</span>
                <div className="metric-data">
                  <span className="metric-value">2,847</span>
                  <span className="metric-label">Threats Blocked</span>
                </div>
              </div>
              <div className="sec-metric">
                <span className="metric-icon">🔍</span>
                <div className="metric-data">
                  <span className="metric-value">156</span>
                  <span className="metric-label">Scans Performed</span>
                </div>
              </div>
              <div className="sec-metric">
                <span className="metric-icon">⚠️</span>
                <div className="metric-data">
                  <span className="metric-value">3</span>
                  <span className="metric-label">Active Incidents</span>
                </div>
              </div>
              <div className="sec-metric">
                <span className="metric-icon">🔄</span>
                <div className="metric-data">
                  <span className="metric-value">99.97%</span>
                  <span className="metric-label">Protection Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'incidents' && (
        <div className="incidents-view">
          <div className="incidents-header">
            <h4>🚨 Active Security Incidents</h4>
            <button className="create-incident">➕ Create Incident</button>
          </div>
          <div className="incidents-list">
            {incidents.map(incident => (
              <div key={incident.id} className="incident-card">
                <div className="incident-info">
                  <span className="incident-type">{incident.type}</span>
                  <span className={`severity-badge ${incident.severity}`}>
                    {incident.severity.toUpperCase()}
                  </span>
                </div>
                <div className="incident-status">
                  <span className={`status-badge ${incident.status}`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                  <span className="incident-time">{incident.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'vulnerabilities' && (
        <div className="vulnerabilities-view">
          <div className="vuln-header">
            <h4>🔍 Vulnerability Management</h4>
            <button className="scan-vulnerabilities">🔍 Run Scan</button>
          </div>
          <div className="vulnerabilities-list">
            {vulnerabilities.map(vuln => (
              <div key={vuln.id} className="vuln-card">
                <div className="vuln-info">
                  <span className="vuln-cve">{vuln.cve}</span>
                  <span className={`vuln-severity ${vuln.severity}`}>
                    {vuln.severity.toUpperCase()}
                  </span>
                </div>
                <div className="vuln-component">{vuln.component}</div>
                <div className="vuln-status">
                  <span className={`vuln-status-badge ${vuln.status}`}>
                    {vuln.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityOperations;