import React from 'react';
import './KillSwitch.css';

const KillSwitch = ({ isActive, isAdvanced, isOnline, protectionState }) => {
  const isVerified = protectionState?.state === 'verified';
  const isSimulated = protectionState?.state === 'simulated';

  const getStatusMessage = () => {
    if (!isOnline) {
      return 'No Internet Connection';
    }
    if (isActive) {
      return isAdvanced ? 'Advanced Kill Switch Active' : 'Kill Switch Active';
    }
    if (isVerified) {
      return 'WireGuard Tunnel Verified';
    }
    if (isSimulated) {
      return 'Browser Simulation Only';
    }
    return 'Traffic Exposed';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📡';
    if (isActive) return '🛡️';
    if (isVerified) return '✅';
    if (isSimulated) return '🧪';
    return '⚠️';
  };

  const getStatusColor = () => {
    if (!isOnline) return '#ff9800';
    if (isActive) return '#f44336';
    if (isVerified) return '#4caf50';
    if (isSimulated) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`kill-switch-indicator ${isActive ? 'active' : ''} ${!isOnline ? 'offline' : ''}`}>
      <div className="kill-switch-status">
        <div 
          className="status-icon"
          style={{ color: getStatusColor() }}
        >
          {getStatusIcon()}
        </div>
        <div className="status-info">
          <div className="status-title">{getStatusMessage()}</div>
          {isActive && (
            <div className="status-subtitle">
              All traffic blocked for security
            </div>
          )}
          {isSimulated && !isActive && isOnline && (
            <div className="status-subtitle">
              UI simulation only — your normal network is still in use
            </div>
          )}
          {!isVerified && !isSimulated && !isActive && isOnline && (
            <div className="status-subtitle">
              Connect the desktop tunnel to protect traffic
            </div>
          )}
          {!isOnline && (
            <div className="status-subtitle">
              Check your network connection
            </div>
          )}
        </div>
      </div>
      
      {isAdvanced && (
        <div className="advanced-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <span className="feature-text">DNS Leak Protection</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🚫</span>
            <span className="feature-text">IPv6 Blocking</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">Auto-Reconnect</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KillSwitch;