import React from 'react';
import './StatusIndicator.css';

const StatusIndicator = ({ isConnected, selectedServer, multiHopServers, connectionTime, killSwitchActive, protectionState }) => {
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isMultiHop = multiHopServers && multiHopServers.length > 0;
  const statusLevel = protectionState?.state || (isConnected ? 'connected' : 'disconnected');
  const isVerified = statusLevel === 'verified';
  const isSimulated = statusLevel === 'simulated';
  const isActive = isConnected;
  const barVariant = isVerified ? 'connected' : isSimulated ? 'warning' : 'disconnected';
  const statusLabel = isVerified
    ? 'Tunnel Verified'
    : isSimulated
      ? 'Simulated'
      : isActive
        ? 'Connected'
        : 'Unprotected';
  const statusNote = isVerified
    ? 'WireGuard handshake verified'
    : isSimulated
      ? 'Browser/PWA UI only — no OS tunnel'
      : 'Your traffic is exposed';

  return (
    <div className={`status-bar ${barVariant}`}>
      {/* Status dot + label */}
      <div className="status-pill">
        <span className={`status-dot-sm ${isVerified ? 'dot-green' : isSimulated ? 'dot-amber' : 'dot-red'}`}></span>
        <span className="status-label">{statusLabel}</span>
      </div>

      {/* Divider */}
      <span className="status-divider"></span>

      {/* Server info */}
      {isActive && selectedServer ? (
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
      {isActive && <span className="status-divider"></span>}

      {/* Session timer */}
      {isActive && connectionTime > 0 && (
        <div className="status-timer">
          <span className="status-timer-icon">⏱</span>
          <span className="status-timer-value">{formatTime(connectionTime)}</span>
        </div>
      )}

      {isActive && <span className="status-divider"></span>}

      <span className={`status-note ${isVerified ? 'verified' : isSimulated ? 'simulated' : 'warning'}`}>
        {statusNote}
      </span>

      {/* Kill switch badge */}
      {killSwitchActive && (
        <span className="status-ks-badge">🔒 Kill Switch</span>
      )}
    </div>
  );
};

export default StatusIndicator;
