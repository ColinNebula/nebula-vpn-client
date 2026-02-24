import React from 'react';
import './StatusIndicator.css';

const StatusIndicator = ({ isConnected, selectedServer, multiHopServers, connectionTime, killSwitchActive }) => {
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isMultiHop = multiHopServers && multiHopServers.length > 0;

  return (
    <div className={`status-bar ${isConnected ? 'connected' : 'disconnected'}`}>
      {/* Status dot + label */}
      <div className="status-pill">
        <span className={`status-dot-sm ${isConnected ? 'dot-green' : 'dot-red'}`}></span>
        <span className="status-label">{isConnected ? 'Protected' : 'Unprotected'}</span>
      </div>

      {/* Divider */}
      <span className="status-divider"></span>

      {/* Server info */}
      {isConnected && selectedServer ? (
        <div className="status-server">
          <span className="status-flag">{selectedServer.flag}</span>
          <span className="status-server-name">
            {isMultiHop
              ? `${multiHopServers[0]?.flag ?? ''} → ${selectedServer.flag} Multi-Hop`
              : selectedServer.name}
          </span>
          {selectedServer.ping && (
            <span className="status-ping">{selectedServer.ping}</span>
          )}
        </div>
      ) : (
        <span className="status-no-server">No server selected</span>
      )}

      {/* Divider */}
      {isConnected && <span className="status-divider"></span>}

      {/* Session timer */}
      {isConnected && connectionTime > 0 && (
        <div className="status-timer">
          <span className="status-timer-icon">⏱</span>
          <span className="status-timer-value">{formatTime(connectionTime)}</span>
        </div>
      )}

      {/* Kill switch badge */}
      {killSwitchActive && (
        <span className="status-ks-badge">🔒 Kill Switch</span>
      )}

      {/* Disconnected warning */}
      {!isConnected && (
        <span className="status-warning">Your traffic is exposed</span>
      )}
    </div>
  );
};

export default StatusIndicator;
