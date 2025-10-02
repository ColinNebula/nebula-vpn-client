import React from 'react';
import './StatusIndicator.css';

const StatusIndicator = ({ isConnected, selectedServer, connectionTime }) => {
  const getStatusText = () => {
    if (isConnected && selectedServer) {
      return `Connected to ${selectedServer.name}`;
    }
    return 'Disconnected';
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-dot"></div>
      <div className="status-info">
        <div className="status-text">{getStatusText()}</div>
        {isConnected && connectionTime && (
          <div className="connection-time">Connected for: {formatTime(connectionTime)}</div>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;