import React, { useState, useEffect } from 'react';
import './NetworkMonitor.css';

const NetworkMonitor = () => {
  const [monitoring, setMonitoring] = useState(true);
  const [networkHealth, setNetworkHealth] = useState({
    status: 'good',
    score: 85,
    latency: 24,
    jitter: 3,
    packetLoss: 0.2,
    bandwidth: 95.3
  });

  const [ispInfo] = useState({
    provider: 'Comcast Cable',
    ip: '203.0.113.42',
    location: 'San Francisco, CA',
    asn: 'AS7922',
    type: 'Cable'
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'High latency detected (>100ms)', time: '2 minutes ago', severity: 'medium' },
    { id: 2, type: 'info', message: 'Network switch detected', time: '15 minutes ago', severity: 'low' },
    { id: 3, type: 'critical', message: 'Packet loss above threshold (>5%)', time: '1 hour ago', severity: 'high' },
  ]);

  const [metrics, setMetrics] = useState({
    uptime: '99.98%',
    avgLatency: 26,
    peakBandwidth: 147.2,
    totalData: 245.6,
    connections: 1247
  });

  const [historyData] = useState([
    { time: '00:00', latency: 22, bandwidth: 85 },
    { time: '04:00', latency: 25, bandwidth: 92 },
    { time: '08:00', latency: 28, bandwidth: 78 },
    { time: '12:00', latency: 32, bandwidth: 65 },
    { time: '16:00', latency: 24, bandwidth: 95 },
    { time: '20:00', latency: 26, bandwidth: 88 },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    if (!monitoring) return;
    
    const interval = setInterval(() => {
      setNetworkHealth(prev => ({
        ...prev,
        latency: Math.max(15, Math.min(50, prev.latency + (Math.random() - 0.5) * 5)),
        jitter: Math.max(1, Math.min(10, prev.jitter + (Math.random() - 0.5) * 2)),
        packetLoss: Math.max(0, Math.min(5, prev.packetLoss + (Math.random() - 0.5) * 0.5)),
        bandwidth: Math.max(50, Math.min(150, prev.bandwidth + (Math.random() - 0.5) * 10))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [monitoring]);

  const getHealthStatus = (score) => {
    if (score >= 80) return { label: 'Excellent', color: '#4CAF50' };
    if (score >= 60) return { label: 'Good', color: '#8BC34A' };
    if (score >= 40) return { label: 'Fair', color: '#FF9800' };
    return { label: 'Poor', color: '#f44336' };
  };

  const healthStatus = getHealthStatus(networkHealth.score);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="network-monitor">
      <div className="monitor-header">
        <h3>📡 Network Monitor</h3>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${monitoring ? 'active' : 'paused'}`}>
        <span className="banner-icon">{monitoring ? '📊' : '⏸️'}</span>
        <div className="banner-content">
          <h4>Monitoring {monitoring ? 'Active' : 'Paused'}</h4>
          <p>
            {monitoring 
              ? `Network health: ${healthStatus.label} • ${alerts.length} active alerts`
              : 'Real-time monitoring is paused'}
          </p>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={monitoring}
            onChange={() => setMonitoring(!monitoring)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Network Health Score */}
      <div className="health-score-section">
        <h4>🎯 Network Health Score</h4>
        <div className="health-display">
          <div className="health-circle">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#eee" strokeWidth="10"/>
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke={healthStatus.color}
                strokeWidth="10"
                strokeDasharray={`${(networkHealth.score / 100) * 314} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="65" textAnchor="middle" fontSize="28" fontWeight="bold" fill={healthStatus.color}>
                {Math.round(networkHealth.score)}
              </text>
            </svg>
            <div className="health-label" style={{color: healthStatus.color}}>
              {healthStatus.label}
            </div>
          </div>

          <div className="health-metrics">
            <div className="metric-item">
              <span className="metric-icon">⚡</span>
              <div className="metric-details">
                <span className="metric-label">Latency</span>
                <span className="metric-value">{networkHealth.latency.toFixed(1)} ms</span>
              </div>
            </div>
            <div className="metric-item">
              <span className="metric-icon">📊</span>
              <div className="metric-details">
                <span className="metric-label">Jitter</span>
                <span className="metric-value">{networkHealth.jitter.toFixed(1)} ms</span>
              </div>
            </div>
            <div className="metric-item">
              <span className="metric-icon">📦</span>
              <div className="metric-details">
                <span className="metric-label">Packet Loss</span>
                <span className="metric-value">{networkHealth.packetLoss.toFixed(2)}%</span>
              </div>
            </div>
            <div className="metric-item">
              <span className="metric-icon">🚀</span>
              <div className="metric-details">
                <span className="metric-label">Bandwidth</span>
                <span className="metric-value">{networkHealth.bandwidth.toFixed(1)} Mbps</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ISP Information */}
      <div className="isp-section">
        <h4>🌐 ISP Information</h4>
        <div className="isp-grid">
          <div className="isp-card">
            <span className="isp-icon">🏢</span>
            <div className="isp-details">
              <span className="isp-label">Provider</span>
              <span className="isp-value">{ispInfo.provider}</span>
            </div>
          </div>
          <div className="isp-card">
            <span className="isp-icon">🌍</span>
            <div className="isp-details">
              <span className="isp-label">Public IP</span>
              <span className="isp-value">{ispInfo.ip}</span>
            </div>
          </div>
          <div className="isp-card">
            <span className="isp-icon">📍</span>
            <div className="isp-details">
              <span className="isp-label">Location</span>
              <span className="isp-value">{ispInfo.location}</span>
            </div>
          </div>
          <div className="isp-card">
            <span className="isp-icon">🔢</span>
            <div className="isp-details">
              <span className="isp-label">ASN</span>
              <span className="isp-value">{ispInfo.asn}</span>
            </div>
          </div>
          <div className="isp-card">
            <span className="isp-icon">📡</span>
            <div className="isp-details">
              <span className="isp-label">Connection Type</span>
              <span className="isp-value">{ispInfo.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h4>🚨 Active Alerts ({alerts.length})</h4>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <span className="alert-icon">
                  {alert.type === 'critical' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="alert-content">
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-time">{alert.time}</span>
                </div>
                <button 
                  className="dismiss-btn"
                  onClick={() => dismissAlert(alert.id)}
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="metrics-section">
        <h4>📈 Performance Metrics (Last 24h)</h4>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-big-icon">⏱️</span>
            <div className="metric-info">
              <span className="metric-big-value">{metrics.uptime}</span>
              <span className="metric-big-label">Uptime</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-big-icon">⚡</span>
            <div className="metric-info">
              <span className="metric-big-value">{metrics.avgLatency} ms</span>
              <span className="metric-big-label">Avg Latency</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-big-icon">🚀</span>
            <div className="metric-info">
              <span className="metric-big-value">{metrics.peakBandwidth} Mbps</span>
              <span className="metric-big-label">Peak Bandwidth</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-big-icon">📊</span>
            <div className="metric-info">
              <span className="metric-big-value">{metrics.totalData} GB</span>
              <span className="metric-big-label">Total Data</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-big-icon">🔗</span>
            <div className="metric-info">
              <span className="metric-big-value">{metrics.connections}</span>
              <span className="metric-big-label">Connections</span>
            </div>
          </div>
        </div>
      </div>

      {/* History Chart */}
      <div className="history-section">
        <h4>📉 Network History</h4>
        <div className="history-chart">
          <div className="chart-legend">
            <span className="legend-item latency">⚡ Latency (ms)</span>
            <span className="legend-item bandwidth">🚀 Bandwidth (Mbps)</span>
          </div>
          <div className="chart-container">
            {historyData.map((data, index) => (
              <div key={index} className="chart-bar-group">
                <div className="chart-bars">
                  <div 
                    className="chart-bar latency"
                    style={{height: `${(data.latency / 50) * 100}%`}}
                    title={`Latency: ${data.latency}ms`}
                  ></div>
                  <div 
                    className="chart-bar bandwidth"
                    style={{height: `${(data.bandwidth / 100) * 100}%`}}
                    title={`Bandwidth: ${data.bandwidth}Mbps`}
                  ></div>
                </div>
                <span className="chart-label">{data.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h4>⚡ Quick Actions</h4>
        <div className="actions-grid">
          <button className="action-btn">🔄 Run Diagnostics</button>
          <button className="action-btn">📊 Export Report</button>
          <button className="action-btn">🔔 Configure Alerts</button>
          <button className="action-btn">📈 View Full History</button>
        </div>
      </div>
    </div>
  );
};

export default NetworkMonitor;
