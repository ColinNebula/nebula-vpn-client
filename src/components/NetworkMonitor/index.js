import React, { useState, useEffect, useRef } from 'react';
import './NetworkMonitor.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

const NetworkMonitor = ({ isConnected, trafficData }) => {
  const [monitoring, setMonitoring] = useState(true);
  const [networkHealth, setNetworkHealth] = useState({
    status: 'good',
    score: 0,
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    bandwidth: 0
  });

  const [ispInfo, setIspInfo] = useState({
    provider: 'Loading…',
    ip: '-',
    location: '-',
    asn: '-',
    type: '-'
  });

  const [alerts, setAlerts] = useState([]);

  const [metrics, setMetrics] = useState({
    uptime: '-',
    avgLatency: 0,
    peakBandwidth: 0,
    totalData: 0,
    connections: 0
  });

  const [historyData, setHistoryData] = useState([]);
  const latencyHistoryRef = useRef([]);

  // Fetch real ISP / IP info from the backend proxy (never directly from ipwho.is)
  useEffect(() => {
    const fetchIspInfo = async () => {
      try {
        const resp = await fetch(`${API_BASE}/security/ip-info`, {
          headers: authHeader(),
        });
        if (!resp.ok) throw new Error('ip-info unavailable');
        const data = await resp.json();
        setIspInfo({
          provider: data.org || data.isp || 'Unknown ISP',
          ip:       data.ip  || '-',
          location: [data.city, data.region, data.country].filter(Boolean).join(', ') || '-',
          asn:      data.asn || '-',
          type:     data.type || '-',
        });
      } catch {
        setIspInfo(prev => ({ ...prev, provider: 'Unavailable', ip: '-' }));
      }
    };
    fetchIspInfo();
  }, []);

  // Real-time latency + jitter measurement via ping endpoint + bandwidth from trafficData
  useEffect(() => {
    if (!monitoring) return;

    const interval = setInterval(async () => {
      // Measure RTT
      let latencyMs = null;
      let lostProbe = false;
      try {
        const t0 = Date.now();
        const resp = await fetch(`${API_BASE}/speedtest/ping`, {
          headers: authHeader(),
          cache: 'no-store',
        });
        if (resp.status === 204 || resp.ok) {
          latencyMs = Date.now() - t0;
        } else {
          lostProbe = true;
        }
      } catch {
        lostProbe = true;
      }

      if (lostProbe || latencyMs === null) {
        setAlerts(prev => {
          const exists = prev.some(a => a.id === 'ping-fail');
          if (exists) return prev;
          return [{ id: 'ping-fail', type: 'warning', message: 'Ping probe failed', time: new Date().toLocaleTimeString(), severity: 'medium' }, ...prev.slice(0, 9)];
        });
        return;
      }

      // Remove lingering ping-fail alert
      setAlerts(prev => prev.filter(a => a.id !== 'ping-fail'));

      // Rolling jitter
      latencyHistoryRef.current.push(latencyMs);
      if (latencyHistoryRef.current.length > 10) latencyHistoryRef.current.shift();
      const mean = latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length;
      const jitterMs = latencyHistoryRef.current.length > 1
        ? Math.sqrt(latencyHistoryRef.current.reduce((s, v) => s + (v - mean) ** 2, 0) / latencyHistoryRef.current.length)
        : 0;

      // Bandwidth in Mbps from trafficData (KB/s * 8 / 1024)
      const bwMbps = trafficData
        ? ((trafficData.download + trafficData.upload) / 1024 * 8)
        : 0;

      // Health score: penalize high latency, jitter, packet loss
      const latencyScore  = Math.max(0, 100 - latencyMs);
      const jitterScore   = Math.max(0, 100 - jitterMs * 2);
      const score         = Math.round((latencyScore + jitterScore) / 2);

      setNetworkHealth({
        status:     score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor',
        score:      Math.min(100, score),
        latency:    latencyMs,
        jitter:     parseFloat(jitterMs.toFixed(1)),
        packetLoss: 0,
        bandwidth:  parseFloat(bwMbps.toFixed(1)),
      });

      // Update history (last 6 readings)
      const label = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHistoryData(prev => [...prev.slice(-5), { time: label, latency: latencyMs, bandwidth: bwMbps }]);

      // Latency alert
      if (latencyMs > 150) {
        setAlerts(prev => {
          const exists = prev.some(a => a.id === 'high-latency');
          if (exists) return prev;
          return [{ id: 'high-latency', type: 'warning', message: `High latency detected (${latencyMs}ms)`, time: new Date().toLocaleTimeString(), severity: 'medium' }, ...prev.slice(0, 9)];
        });
      } else {
        setAlerts(prev => prev.filter(a => a.id !== 'high-latency'));
      }

      setMetrics(prev => {
        const newAvg = latencyHistoryRef.current.length > 0
          ? Math.round(mean)
          : prev.avgLatency;
        return {
          ...prev,
          avgLatency:    newAvg,
          peakBandwidth: Math.max(prev.peakBandwidth, bwMbps),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [monitoring, trafficData]);

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
