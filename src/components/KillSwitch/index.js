import React from 'react';
import './KillSwitch.css';

const KillSwitch = ({ isActive, isAdvanced, isOnline }) => {
  const getStatusMessage = () => {
    if (!isOnline) {
      return 'No Internet Connection';
    }
    if (isActive) {
      return isAdvanced ? 'Advanced Kill Switch Active' : 'Kill Switch Active';
    }
    return 'Network Protected';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📡';
    if (isActive) return '🛡️';
    return '✅';
  };

  const getStatusColor = () => {
    if (!isOnline) return '#ff9800';
    if (isActive) return '#f44336';
    return '#4caf50';
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