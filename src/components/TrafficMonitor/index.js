import React from 'react';
import './TrafficMonitor.css';

const TrafficMonitor = ({ trafficData, isConnected }) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  if (!isConnected) {
    return (
      <div className="traffic-monitor">
        <div className="no-connection">
          <h3>📊 Traffic Monitor</h3>
          <p>Connect to a VPN server to monitor traffic</p>
        </div>
      </div>
    );
  }

  return (
    <div className="traffic-monitor">
      <h3>📊 Traffic Monitor</h3>
      
      <div className="traffic-stats">
        <div className="traffic-card download">
          <div className="traffic-icon">⬇️</div>
          <div className="traffic-info">
            <div className="traffic-label">Download</div>
            <div className="traffic-speed">{formatSpeed(trafficData.download)}</div>
            <div className="traffic-total">Total: {formatBytes(trafficData.totalDownload)}</div>
          </div>
        </div>
        
        <div className="traffic-card upload">
          <div className="traffic-icon">⬆️</div>
          <div className="traffic-info">
            <div className="traffic-label">Upload</div>
            <div className="traffic-speed">{formatSpeed(trafficData.upload)}</div>
            <div className="traffic-total">Total: {formatBytes(trafficData.totalUpload)}</div>
          </div>
        </div>
      </div>
      
      <div className="traffic-graph">
        <div className="graph-header">
          <h4>Real-time Speed</h4>
        </div>
        <div className="speed-bars">
          <div className="speed-bar">
            <div className="bar-label">Download</div>
            <div className="bar-container">
              <div 
                className="bar-fill download-bar"
                style={{ width: `${Math.min((trafficData.download / 2000) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="bar-value">{formatSpeed(trafficData.download)}</div>
          </div>
          
          <div className="speed-bar">
            <div className="bar-label">Upload</div>
            <div className="bar-container">
              <div 
                className="bar-fill upload-bar"
                style={{ width: `${Math.min((trafficData.upload / 600) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="bar-value">{formatSpeed(trafficData.upload)}</div>
          </div>
        </div>
      </div>
      
      <div className="traffic-summary">
        <div className="summary-item">
          <span className="summary-label">Total Data:</span>
          <span className="summary-value">
            {formatBytes(trafficData.totalDownload + trafficData.totalUpload)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Session Time:</span>
          <span className="summary-value">Active</span>
        </div>
      </div>
    </div>
  );
};

export default TrafficMonitor;