import React, { useState, useMemo } from 'react';
import './QuickConnect.css';

// Specialty servers (Tor, Double VPN, Obfuscated) are intentionally slower — skip for Quick Connect
const SKIP_SPECIALTIES = new Set(['tor', 'double', 'obfuscated']);

/**
 * Score a server for "safest + closest" quick-connect.
 * Returns a value in [0, 100] — higher is better.
 *   50 % weight → safety  (inverted load:  100 - load)
 *   50 % weight → proximity (inverted normalised ping)
 * Ping is normalised against MAX_PING_MS so it sits on the same 0-100 scale.
 */
const MAX_PING_MS = 300;

const scoreServer = (server) => {
  const pingMs   = Math.min(parseInt(server.ping) || MAX_PING_MS, MAX_PING_MS);
  const safetyPct    = 100 - server.load;                   // 0-100
  const proximityPct = ((MAX_PING_MS - pingMs) / MAX_PING_MS) * 100; // 0-100
  return safetyPct * 0.5 + proximityPct * 0.5;
};

const QuickConnect = ({ 
  servers, 
  isConnected, 
  currentServer, 
  onConnect, 
  onDisconnect,
  recentServers = [],
  favoriteServers = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectMode, setConnectMode] = useState('smart'); // smart, fastest, nearest, favorite, recent

  // Pre-filter: exclude specialty-only servers for quick connect
  const generalServers = useMemo(() => {
    if (!servers || servers.length === 0) return [];
    const filtered = servers.filter(s => !SKIP_SPECIALTIES.has(s.specialty));
    return filtered.length > 0 ? filtered : servers; // fallback to all if somehow empty
  }, [servers]);

  const getBestServer = () => {
    if (!servers || servers.length === 0) return null;

    switch (connectMode) {
      case 'smart': {
        // Safest + closest: composite score balancing load and ping
        return generalServers.reduce((best, server) => {
          return !best || scoreServer(server) > scoreServer(best) ? server : best;
        }, null);
      }

      case 'fastest':
        return generalServers.reduce((best, server) => {
          return !best || server.load < best.load ? server : best;
        }, null);

      case 'nearest':
        return generalServers.reduce((best, server) => {
          return !best || parseInt(server.ping) < parseInt(best.ping) ? server : best;
        }, null);

      case 'favorite':
        return favoriteServers.length > 0
          ? servers.find(s => favoriteServers.includes(s.id)) || getBestSmartServer()
          : getBestSmartServer();

      case 'recent':
        return recentServers.length > 0
          ? servers.find(s => s.id === recentServers[0]) || getBestSmartServer()
          : getBestSmartServer();

      default:
        return getBestSmartServer();
    }
  };

  const getBestSmartServer = () =>
    generalServers.reduce((best, server) =>
      !best || scoreServer(server) > scoreServer(best) ? server : best
    , null);

  const handleQuickConnect = () => {
    if (isConnected) {
      onDisconnect();
    } else {
      const bestServer = getBestServer();
      if (bestServer) {
        onConnect(bestServer);
      }
    }
  };

  const getModeIcon = () => {
    switch (connectMode) {
      case 'smart':    return '🛡️';
      case 'fastest':  return '⚡';
      case 'nearest':  return '📍';
      case 'favorite': return '⭐';
      case 'recent':   return '🕐';
      default:         return '🛡️';
    }
  };

  const getModeLabel = () => {
    switch (connectMode) {
      case 'smart':    return 'Safest & Closest';
      case 'fastest':  return 'Fastest Server';
      case 'nearest':  return 'Nearest Server';
      case 'favorite': return 'Favorite Server';
      case 'recent':   return 'Recent Server';
      default:         return 'Safest & Closest';
    }
  };

  const bestServer = getBestServer();
  const smartScore = bestServer ? Math.round(scoreServer(bestServer)) : null;

  return (
    <div className={`quick-connect-container ${isConnected ? 'connected' : ''}`}>
      {/* Main Quick Connect Button */}
      <div className="quick-connect-main">
        <button 
          className={`quick-connect-button ${isConnected ? 'connected' : ''}`}
          onClick={handleQuickConnect}
        >
          <div className="button-content">
            <div className={`power-icon ${isConnected ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v10M18.36 6.64a9 9 0 1 1-12.73 0" />
              </svg>
            </div>
            <div className="button-text">
              <span className="main-text">
                {isConnected ? 'Disconnect' : 'Quick Connect'}
              </span>
              <span className="sub-text">
                {isConnected 
                  ? `Connected to ${currentServer?.name || 'VPN'}`
                  : bestServer
                    ? `${getModeIcon()} ${bestServer.flag} ${bestServer.name} — ${bestServer.ping}, ${bestServer.load}% load`
                    : `${getModeIcon()} ${getModeLabel()}`
                }
              </span>
            </div>
          </div>
          
          {isConnected && (
            <div className="connection-pulse"></div>
          )}
        </button>

        {/* Expand toggle for options */}
        {!isConnected && (
          <button 
            className="expand-options-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
          </button>
        )}
      </div>

      {/* Connection Mode Options */}
      {isExpanded && !isConnected && (
        <div className="connect-options">
          <div className="options-title">Connection Mode</div>
          <div className="mode-options">
            <button 
              className={`mode-option ${connectMode === 'smart' ? 'active' : ''}`}
              onClick={() => setConnectMode('smart')}
            >
              <span className="mode-icon">🛡️</span>
              <span className="mode-label">Smart</span>
              <span className="mode-desc">Safest &amp; closest</span>
            </button>

            <button 
              className={`mode-option ${connectMode === 'fastest' ? 'active' : ''}`}
              onClick={() => setConnectMode('fastest')}
            >
              <span className="mode-icon">⚡</span>
              <span className="mode-label">Fastest</span>
              <span className="mode-desc">Lowest load</span>
            </button>

            <button 
              className={`mode-option ${connectMode === 'nearest' ? 'active' : ''}`}
              onClick={() => setConnectMode('nearest')}
            >
              <span className="mode-icon">📍</span>
              <span className="mode-label">Nearest</span>
              <span className="mode-desc">Lowest ping</span>
            </button>

            <button 
              className={`mode-option ${connectMode === 'favorite' ? 'active' : ''}`}
              onClick={() => setConnectMode('favorite')}
              disabled={favoriteServers.length === 0}
            >
              <span className="mode-icon">⭐</span>
              <span className="mode-label">Favorite</span>
              <span className="mode-desc">
                {favoriteServers.length > 0 ? 'Your preferred' : 'None set'}
              </span>
            </button>

            <button 
              className={`mode-option ${connectMode === 'recent' ? 'active' : ''}`}
              onClick={() => setConnectMode('recent')}
              disabled={recentServers.length === 0}
            >
              <span className="mode-icon">🕐</span>
              <span className="mode-label">Recent</span>
              <span className="mode-desc">
                {recentServers.length > 0 ? 'Last connected' : 'None yet'}
              </span>
            </button>
          </div>

          {/* Preview of selected server */}
          {bestServer && (
            <div className="server-preview">
              <div className="preview-header">Will connect to:</div>
              <div className="preview-server">
                <span className="server-flag">{bestServer.flag}</span>
                <div className="server-info">
                  <span className="server-name">{bestServer.name}</span>
                  <span className="server-location">{bestServer.location}</span>
                </div>
                <div className="server-stats">
                  <span className="stat ping">{bestServer.ping}</span>
                  <span className="stat load">{bestServer.load}% load</span>
                  {connectMode === 'smart' && smartScore !== null && (
                    <span className="stat score">Score {smartScore}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connected Status */}
      {isConnected && currentServer && (
        <div className="connected-info">
          <div className="info-row">
            <span className="info-label">Server</span>
            <span className="info-value">
              {currentServer.flag} {currentServer.name}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Location</span>
            <span className="info-value">{currentServer.location}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className="info-value status-protected">
              <span className="protected-dot"></span>
              Protected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickConnect;
