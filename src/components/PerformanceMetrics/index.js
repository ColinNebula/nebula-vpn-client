import React, { useState, useEffect, useRef } from 'react';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({ isConnected, currentServer }) => {
  const [metrics, setMetrics] = useState({
    latency: [],
    packetLoss: [],
    jitter: [],
    timestamps: []
  });

  const [currentMetrics, setCurrentMetrics] = useState({
    latency: 0,
    packetLoss: 0,
    jitter: 0,
    downloadSpeed: 0,
    uploadSpeed: 0
  });

  const [stats, setStats] = useState({
    avgLatency: 0,
    minLatency: 0,
    maxLatency: 0,
    avgPacketLoss: 0,
    avgJitter: 0,
    stability: 0
  });

  const [timeWindow, setTimeWindow] = useState('5m');
  const maxDataPoints = useRef(60);

  // Update max data points based on time window
  useEffect(() => {
    if (timeWindow === '1m') maxDataPoints.current = 20;
    else if (timeWindow === '5m') maxDataPoints.current = 60;
    else if (timeWindow === '15m') maxDataPoints.current = 90;
    else if (timeWindow === '30m') maxDataPoints.current = 120;
  }, [timeWindow]);

  // Simulate real-time metrics
  useEffect(() => {
    if (!isConnected) {
      setCurrentMetrics({
        latency: 0,
        packetLoss: 0,
        jitter: 0,
        downloadSpeed: 0,
        uploadSpeed: 0
      });
      setMetrics({
        latency: [],
        packetLoss: [],
        jitter: [],
        timestamps: []
      });
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      // Generate realistic metrics
      const baseLatency = 25;
      const latencyVariation = Math.random() * 30 - 15;
      const newLatency = Math.max(5, baseLatency + latencyVariation);
      
      const newPacketLoss = Math.random() < 0.95 ? 0 : Math.random() * 2;
      const newJitter = Math.abs(latencyVariation);
      
      const downloadSpeed = Math.random() * 50 + 20;
      const uploadSpeed = Math.random() * 30 + 10;

      setCurrentMetrics({
        latency: newLatency.toFixed(1),
        packetLoss: newPacketLoss.toFixed(2),
        jitter: newJitter.toFixed(1),
        downloadSpeed: downloadSpeed.toFixed(1),
        uploadSpeed: uploadSpeed.toFixed(1)
      });

      setMetrics(prev => {
        const newData = {
          latency: [...prev.latency, newLatency],
          packetLoss: [...prev.packetLoss, newPacketLoss],
          jitter: [...prev.jitter, newJitter],
          timestamps: [...prev.timestamps, time]
        };

        // Keep only last N data points
        if (newData.latency.length > maxDataPoints.current) {
          newData.latency = newData.latency.slice(-maxDataPoints.current);
          newData.packetLoss = newData.packetLoss.slice(-maxDataPoints.current);
          newData.jitter = newData.jitter.slice(-maxDataPoints.current);
          newData.timestamps = newData.timestamps.slice(-maxDataPoints.current);
        }

        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Calculate statistics
  useEffect(() => {
    if (metrics.latency.length === 0) return;

    const avgLat = metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length;
    const minLat = Math.min(...metrics.latency);
    const maxLat = Math.max(...metrics.latency);
    const avgPkt = metrics.packetLoss.reduce((a, b) => a + b, 0) / metrics.packetLoss.length;
    const avgJit = metrics.jitter.reduce((a, b) => a + b, 0) / metrics.jitter.length;
    
    // Calculate stability score (100 = perfect, 0 = terrible)
    const latencyScore = Math.max(0, 100 - avgLat);
    const packetLossScore = Math.max(0, 100 - avgPkt * 50);
    const jitterScore = Math.max(0, 100 - avgJit * 2);
    const stability = ((latencyScore + packetLossScore + jitterScore) / 3).toFixed(0);

    setStats({
      avgLatency: avgLat.toFixed(1),
      minLatency: minLat.toFixed(1),
      maxLatency: maxLat.toFixed(1),
      avgPacketLoss: avgPkt.toFixed(2),
      avgJitter: avgJit.toFixed(1),
      stability: parseInt(stability)
    });
  }, [metrics]);

  const getQualityColor = (value, type) => {
    if (type === 'latency') {
      if (value < 30) return '#4CAF50';
      if (value < 60) return '#ff9800';
      return '#f44336';
    }
    if (type === 'packetLoss') {
      if (value < 0.5) return '#4CAF50';
      if (value < 2) return '#ff9800';
      return '#f44336';
    }
    if (type === 'jitter') {
      if (value < 10) return '#4CAF50';
      if (value < 30) return '#ff9800';
      return '#f44336';
    }
    if (type === 'stability') {
      if (value >= 80) return '#4CAF50';
      if (value >= 60) return '#ff9800';
      return '#f44336';
    }
    return '#4CAF50';
  };

  const getQualityLabel = (stability) => {
    if (stability >= 90) return 'Excellent';
    if (stability >= 80) return 'Very Good';
    if (stability >= 70) return 'Good';
    if (stability >= 60) return 'Fair';
    if (stability >= 50) return 'Poor';
    return 'Very Poor';
  };

  const renderChart = (data, color, label) => {
    if (data.length === 0) return null;

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    return (
      <div className="metric-chart">
        <div className="chart-header">
          <h5>{label}</h5>
          <span className="chart-range">{timeWindow}</span>
        </div>
        <div className="chart-canvas">
          <div className="y-axis-labels">
            <span>{max.toFixed(0)}</span>
            <span>{((max + min) / 2).toFixed(0)}</span>
            <span>{min.toFixed(0)}</span>
          </div>
          <div className="chart-area">
            <svg width="100%" height="100%" preserveAspectRatio="none">
              <polyline
                points={data.map((value, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - ((value - min) / range) * 100;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={data.map((value, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - ((value - min) / range) * 100;
                  return `${x},${y}`;
                }).join(' ') + ' 100,100 0,100'}
                fill={`url(#gradient-${label})`}
                opacity="0.3"
              />
              <defs>
                <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="performance-metrics">
        <div className="metrics-header">
          <h3>📈 Performance Metrics</h3>
        </div>
        <div className="not-connected-message">
          <div className="message-icon">⚠️</div>
          <h4>Not Connected</h4>
          <p>Connect to a VPN server to view performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-metrics">
      <div className="metrics-header">
        <h3>📈 Performance Metrics</h3>
        <select 
          value={timeWindow} 
          onChange={(e) => setTimeWindow(e.target.value)}
          className="time-window-selector"
        >
          <option value="1m">Last 1 Minute</option>
          <option value="5m">Last 5 Minutes</option>
          <option value="15m">Last 15 Minutes</option>
          <option value="30m">Last 30 Minutes</option>
        </select>
      </div>

      {/* Server Info */}
      <div className="server-info-banner">
        <span className="server-icon">🌐</span>
        <div className="server-details">
          <span className="server-label">Connected to:</span>
          <span className="server-name">{currentServer?.location || 'Unknown Server'}</span>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="realtime-metrics">
        <div className="metric-card">
          <div className="metric-icon" style={{ color: getQualityColor(parseFloat(currentMetrics.latency), 'latency') }}>
            ⚡
          </div>
          <div className="metric-content">
            <div className="metric-value">{currentMetrics.latency} ms</div>
            <div className="metric-label">Latency</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: getQualityColor(parseFloat(currentMetrics.packetLoss), 'packetLoss') }}>
            📦
          </div>
          <div className="metric-content">
            <div className="metric-value">{currentMetrics.packetLoss}%</div>
            <div className="metric-label">Packet Loss</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ color: getQualityColor(parseFloat(currentMetrics.jitter), 'jitter') }}>
            📊
          </div>
          <div className="metric-content">
            <div className="metric-value">{currentMetrics.jitter} ms</div>
            <div className="metric-label">Jitter</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⬇️</div>
          <div className="metric-content">
            <div className="metric-value">{currentMetrics.downloadSpeed} MB/s</div>
            <div className="metric-label">Download</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⬆️</div>
          <div className="metric-content">
            <div className="metric-value">{currentMetrics.uploadSpeed} MB/s</div>
            <div className="metric-label">Upload</div>
          </div>
        </div>
      </div>

      {/* Connection Quality */}
      <div className="quality-section">
        <h4>Connection Quality</h4>
        <div className="quality-indicator">
          <div className="quality-label">
            <span>{getQualityLabel(stats.stability)}</span>
            <span className="quality-score">{stats.stability}/100</span>
          </div>
          <div className="quality-bar">
            <div 
              className="quality-fill"
              style={{ 
                width: `${stats.stability}%`,
                background: getQualityColor(stats.stability, 'stability')
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Avg Latency</span>
          <span className="stat-value" style={{ color: getQualityColor(parseFloat(stats.avgLatency), 'latency') }}>
            {stats.avgLatency} ms
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Min Latency</span>
          <span className="stat-value">{stats.minLatency} ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max Latency</span>
          <span className="stat-value">{stats.maxLatency} ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Packet Loss</span>
          <span className="stat-value" style={{ color: getQualityColor(parseFloat(stats.avgPacketLoss), 'packetLoss') }}>
            {stats.avgPacketLoss}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Jitter</span>
          <span className="stat-value" style={{ color: getQualityColor(parseFloat(stats.avgJitter), 'jitter') }}>
            {stats.avgJitter} ms
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data Points</span>
          <span className="stat-value">{metrics.latency.length}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {renderChart(metrics.latency, '#2196F3', 'Latency (ms)')}
        {renderChart(metrics.packetLoss, '#f44336', 'Packet Loss (%)')}
        {renderChart(metrics.jitter, '#ff9800', 'Jitter (ms)')}
      </div>

      {/* Performance Tips */}
      <div className="performance-tips">
        <h4>💡 Performance Tips</h4>
        <div className="tips-grid">
          {parseFloat(currentMetrics.latency) > 60 && (
            <div className="tip-card warning">
              <span className="tip-icon">⚠️</span>
              <p>High latency detected. Try connecting to a server closer to your location.</p>
            </div>
          )}
          {parseFloat(currentMetrics.packetLoss) > 1 && (
            <div className="tip-card error">
              <span className="tip-icon">❌</span>
              <p>Packet loss detected. Check your internet connection or try a different server.</p>
            </div>
          )}
          {parseFloat(currentMetrics.jitter) > 20 && (
            <div className="tip-card warning">
              <span className="tip-icon">📊</span>
              <p>High jitter detected. This may affect real-time applications like gaming or video calls.</p>
            </div>
          )}
          {stats.stability >= 80 && (
            <div className="tip-card success">
              <span className="tip-icon">✅</span>
              <p>Connection quality is excellent! Your VPN is performing optimally.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
