import React, { useState, useEffect, useCallback, useRef } from 'react';
import './RotatingIP.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function abortAfter(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

/**
 * Fetch real public IP + ISP + location.
 * Primary:  our backend proxy (/api/security/ip-info) — no CORS / mixed-content issues.
 * Fallback: ipwho.is directly over HTTPS.
 */
async function fetchPublicIP() {
  // Primary: backend proxy
  try {
    const resp = await fetch(`${API_BASE_URL}/security/ip-info`, {
      signal: abortAfter(8000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.ip) return { ip: data.ip, org: data.org || null, city: data.city || null, country: data.country_name || null };
    }
  } catch { /* fall through */ }

  // Fallback: ipwho.is — HTTPS, CORS-enabled, 10k req/month free
  const resp = await fetch('https://ipwho.is/', {
    headers: { Accept: 'application/json' },
    signal: abortAfter(8000),
  });
  if (!resp.ok) throw new Error(`IP lookup returned ${resp.status}`);
  const d = await resp.json();
  if (!d.ip) throw new Error('No IP in response');
  return {
    ip:      d.ip,
    org:     d.connection?.isp || d.org || null,
    city:    d.city            || null,
    country: d.country         || null,
  };
}

const RotatingIP = ({ 
  isConnected, 
  isEnabled = false, 
  onToggle, 
  rotationInterval = 10, // minutes
  onIntervalChange 
}) => {
  const [ipInfo, setIpInfo]                     = useState(null);   // { ip, org, city, country }
  const [ipError, setIpError]                   = useState(null);
  const [ipHistory, setIPHistory]               = useState([]);
  const [nextRotation, setNextRotation]         = useState(null);
  const [timeUntilRotation, setTimeUntilRotation] = useState(0);
  const [isRotating, setIsRotating]             = useState(false);
  const [rotationCount, setRotationCount]       = useState(0);
  const prevConnected                           = useRef(false);

  // Fetch the real public IP and update state
  const refreshIP = useCallback(async (recordHistory = false) => {
    setIpError(null);
    try {
      const info = await fetchPublicIP();
      setIpInfo(prev => {
        if (recordHistory && prev?.ip && prev.ip !== info.ip) {
          setIPHistory(hist => [{ ip: prev.ip, org: prev.org, timestamp: new Date() }, ...hist.slice(0, 9)]);
          setRotationCount(c => c + 1);
        }
        return info;
      });
    } catch (err) {
      setIpError('Unable to fetch IP');
    }
  }, []);

  // Rotate: ask the VPN tunnel to reconnect (Electron), then re-fetch real IP
  const rotateIP = useCallback(() => {
    setIsRotating(true);

    const doRotate = async () => {
      // Signal VPN layer to reconnect so a new exit IP is assigned
      if (window.electron?.vpn?.reconnect) {
        try { await window.electron.vpn.reconnect(); } catch { /* best-effort */ }
      }
      // Brief delay to let the new tunnel come up before querying the exit IP
      await new Promise(r => setTimeout(r, 2000));
      await refreshIP(true);

      setIsRotating(false);
      if (isEnabled && isConnected) {
        setNextRotation(new Date(Date.now() + rotationInterval * 60 * 1000));
        setTimeUntilRotation(rotationInterval * 60);
      }
    };

    doRotate();
  }, [refreshIP, isEnabled, isConnected, rotationInterval]);

  // Fetch real IP when VPN connects (and reset when it disconnects)
  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      setRotationCount(0);
      setIPHistory([]);
      refreshIP(false);
    }
    if (!isConnected) {
      setIpInfo(null);
      setIpError(null);
    }
    prevConnected.current = isConnected;
  }, [isConnected, refreshIP]);

  // Rotation countdown timer
  useEffect(() => {
    if (!isConnected || !isEnabled) {
      setNextRotation(null);
      setTimeUntilRotation(0);
      return;
    }

    if (!nextRotation) {
      setNextRotation(new Date(Date.now() + rotationInterval * 60 * 1000));
      setTimeUntilRotation(rotationInterval * 60);
    }

    const interval = setInterval(() => {
      setTimeUntilRotation(prev => {
        if (prev <= 1) {
          rotateIP();
          return rotationInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, isEnabled, rotationInterval, nextRotation, rotateIP]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = rotationInterval * 60;
    return ((totalSeconds - timeUntilRotation) / totalSeconds) * 100;
  };

  const intervalOptions = [5, 10, 15, 30, 60];

  if (!isConnected) {
    return (
      <div className="rotating-ip-container disabled">
        <div className="rotating-ip-header">
          <span className="feature-icon">🔄</span>
          <span className="feature-title">Rotating IP</span>
        </div>
        <div className="disabled-message">
          Connect to VPN to enable IP rotation
        </div>
      </div>
    );
  }

  return (
    <div className={`rotating-ip-container ${isEnabled ? 'enabled' : ''}`}>
      {/* Header with Toggle */}
      <div className="rotating-ip-header">
        <div className="header-left">
          <span className="feature-icon">🔄</span>
          <div className="header-text">
            <span className="feature-title">Rotating IP</span>
            <span className="feature-subtitle">
              {isEnabled ? 'Auto-rotating enabled' : 'Click to enable'}
            </span>
          </div>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={() => onToggle && onToggle(!isEnabled)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Current IP Display */}
      <div className={`current-ip-display ${isRotating ? 'rotating' : ''}`}>
        <div className="ip-label">Current Exit IP Address</div>
        <div className="ip-address">
          {isRotating ? (
            <span className="rotating-text">Rotating…</span>
          ) : !ipInfo && !ipError ? (
            <span className="rotating-text">Fetching…</span>
          ) : ipError ? (
            <span className="ip-error">{ipError}</span>
          ) : (
            <>
              <span className="ip-value">{ipInfo.ip}</span>
              <button 
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(ipInfo.ip)}
                title="Copy IP"
              >
                📋
              </button>
            </>
          )}
        </div>
        {ipInfo && !isRotating && (
          <div className="ip-meta">
            {ipInfo.org && <span className="ip-isp">{ipInfo.org}</span>}
            {(ipInfo.city || ipInfo.country) && (
              <span className="ip-location">
                {[ipInfo.city, ipInfo.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        )}
        {rotationCount > 0 && (
          <div className="rotation-count">
            Rotated {rotationCount} time{rotationCount !== 1 ? 's' : ''} this session
          </div>
        )}
      </div>

      {/* Rotation Timer (when enabled) */}
      {isEnabled && (
        <div className="rotation-timer">
          <div className="timer-header">
            <span>Next rotation in</span>
            <span className="time-display">{formatTime(timeUntilRotation)}</span>
          </div>
          <div className="timer-progress">
            <div 
              className="progress-bar"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <button 
            className="rotate-now-button"
            onClick={rotateIP}
            disabled={isRotating}
          >
            <span className="button-icon">🔄</span>
            Rotate Now
          </button>
        </div>
      )}

      {/* Rotation Interval Selector */}
      {isEnabled && (
        <div className="interval-selector">
          <div className="selector-label">Rotation interval:</div>
          <div className="interval-options">
            {intervalOptions.map(mins => (
              <button
                key={mins}
                className={`interval-option ${rotationInterval === mins ? 'active' : ''}`}
                onClick={() => onIntervalChange && onIntervalChange(mins)}
              >
                {mins < 60 ? `${mins}m` : '1h'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* IP History */}
      {ipHistory.length > 0 && (
        <div className="ip-history">
          <div className="history-header">
            <span className="history-icon">📜</span>
            <span>Recent IP Addresses</span>
          </div>
          <div className="history-list">
            {ipHistory.slice(0, 5).map((entry, index) => (
              <div key={index} className="history-item">
                <div className="history-ip-group">
                  <span className="history-ip">{entry.ip}</span>
                  {entry.org && <span className="history-isp">{entry.org}</span>}
                </div>
                <span className="history-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="security-note">
        <span className="note-icon">🛡️</span>
        <span>IP rotation makes tracking nearly impossible by changing your public exit IP periodically without dropping the VPN connection.</span>
      </div>
    </div>
  );
};

export default RotatingIP;
