import React, { useState, useEffect, useCallback, useRef } from 'react';
import './AutoConnectWiFi.css';

const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;

/** Classify network threat level from scan result + captive portal result. */
function assessThreat(scan, captive) {
  if (!scan) return { level: 'unknown', reasons: [] };
  const reasons = [];
  let score = 0; // higher = more dangerous

  if (scan.isOpen) {
    score += 3;
    reasons.push('Open network â€” traffic is unencrypted at the WiFi layer');
  }
  if (captive === true) {
    score += 3;
    reasons.push('Captive portal detected â€” network is intercepting your connections');
  }
  if (scan.security && /wep/i.test(scan.security)) {
    score += 2;
    reasons.push('WEP encryption is broken and trivially cracked');
  }
  if (scan.signal !== null && scan.signal < 20) {
    score += 1;
    reasons.push('Very weak signal â€” may indicate a rogue / evil-twin AP nearby');
  }

  if (score === 0) return { level: 'safe',     reasons };
  if (score <= 1)  return { level: 'low',      reasons };
  if (score <= 3)  return { level: 'moderate', reasons };
  return              { level: 'high',     reasons };
}

const THREAT_META = {
  unknown:  { label: 'Unknown',       color: '#9e9e9e', icon: 'â“' },
  safe:     { label: 'Low Risk',      color: '#43a047', icon: 'âœ…' },
  low:      { label: 'Low Risk',      color: '#7cb342', icon: 'ðŸŸ¡' },
  moderate: { label: 'Moderate Risk', color: '#f57c00', icon: 'âš ï¸' },
  high:     { label: 'High Risk',     color: '#d32f2f', icon: 'ðŸš¨' },
};

const AutoConnectWiFi = ({
  isEnabled = false,
  onToggle,
  onConnect,
  trustedNetworks = [],
  onAddTrustedNetwork,
  onRemoveTrustedNetwork,
}) => {
  const [scan, setScan]               = useState(null);   // wifi-scan result
  const [captive, setCaptive]         = useState(null);   // true/false/null
  const [captiveUrl, setCaptiveUrl]   = useState(null);
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [scanning, setScanning]       = useState(false);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [newNetworkName, setNewNetworkName] = useState('');
  const [autoConnectLog, setAutoConnectLog] = useState([]);
  const [lastScanTime, setLastScanTime]     = useState(null);
  const scanInterval = useRef(null);
  const prevSsid     = useRef(null);

  // â”€â”€ Real network scan (Electron) or browser fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const doScan = useCallback(async () => {
    setScanning(true);
    try {
      if (isElectron) {
        const result = await window.electron.network.scan();
        setScan(result.success ? result : null);

        // Only run captive portal check when we have an active network
        if (result.success && result.ssid) {
          const cp = await window.electron.network.checkCaptivePortal();
          setCaptive(cp.captive);
          setCaptiveUrl(cp.redirectTo);
        } else {
          setCaptive(null);
          setCaptiveUrl(null);
        }
        setLastScanTime(new Date());
      } else {
        // Browser / PWA fallback â€” no OS access, use navigator APIs only
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        setScan({
          ssid:     'Current Network',
          bssid:    null,
          signal:   null,
          security: conn?.type === 'wifi' ? 'Unknown' : null,
          isOpen:   false,
          frequency: conn?.effectiveType || null,
        });
        setCaptive(null);
        setLastScanTime(new Date());
      }
    } catch { /* scan failed â€” leave previous result in place */ }
    setScanning(false);
  }, []);

  // â”€â”€ Auto-connect logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!scan?.ssid) return;
    const ssid = scan.ssid;

    // Network changed â€” re-evaluate
    if (ssid !== prevSsid.current) {
      prevSsid.current = ssid;

      const isTrusted = trustedNetworks.some(
        n => n.name.toLowerCase() === ssid.toLowerCase()
      );

      if (!isTrusted && isEnabled) {
        const entry = {
          timestamp: new Date(),
          network: ssid,
          action: 'Auto-connected VPN',
          reason: scan.isOpen ? 'Open (unencrypted) network' : 'Untrusted network',
        };
        setAutoConnectLog(prev => [entry, ...prev.slice(0, 9)]);
        if (onConnect) onConnect();
      }
    }
  }, [scan, isEnabled, trustedNetworks, onConnect]);

  // â”€â”€ Poll + event listeners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    doScan();
    scanInterval.current = setInterval(doScan, 30_000); // re-scan every 30 s

    // Online / offline
    const handleOnline  = () => { setIsOnline(true);  doScan(); };
    const handleOffline = () => { setIsOnline(false); setScan(null); setCaptive(null); };
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.connection) {
      navigator.connection.addEventListener('change', doScan);
    }

    // Electron-specific events
    let removeResume, removeNetStatus;
    if (isElectron) {
      // System woke from sleep â€” immediately re-scan and potentially reconnect
      removeResume = window.electron.network.onResume(() => {
        console.log('[AutoConnectWiFi] System resumed â€” re-scanning network');
        doScan();
        if (isEnabled && onConnect) onConnect();
      });
      // Network status polling from main process
      removeNetStatus = window.electron.network.onStatusChange(({ online }) => {
        setIsOnline(online);
        if (online) doScan();
      });
    }

    return () => {
      clearInterval(scanInterval.current);
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (navigator.connection) navigator.connection.removeEventListener('change', doScan);
      if (removeResume)    removeResume();
      if (removeNetStatus) removeNetStatus();
    };
  }, [doScan, isEnabled, onConnect]);

  const handleAddTrustedNetwork = () => {
    if (newNetworkName.trim() && onAddTrustedNetwork) {
      onAddTrustedNetwork({ id: Date.now().toString(), name: newNetworkName.trim(), addedAt: new Date() });
      setNewNetworkName('');
      setShowAddNetwork(false);
    }
  };

  const addCurrentAsTrusted = () => {
    if (scan?.ssid && onAddTrustedNetwork) {
      onAddTrustedNetwork({ id: Date.now().toString(), name: scan.ssid, addedAt: new Date() });
    }
  };

  const threat = assessThreat(scan, captive);
  const isTrusted = scan?.ssid
    ? trustedNetworks.some(n => n.name.toLowerCase() === scan.ssid.toLowerCase())
    : false;
  const tm = THREAT_META[threat.level];

  return (
    <div className={`auto-connect-wifi-container ${isEnabled ? 'enabled' : ''}`}>

      {/* Header */}
      <div className="auto-connect-header">
        <div className="header-left">
          <span className="feature-icon">ðŸ›¡ï¸</span>
          <div className="header-text">
            <span className="feature-title">Auto-Connect on WiFi</span>
            <span className="feature-subtitle">
              {isEnabled ? 'Active â€” will auto-connect on untrusted networks' : 'Enable to auto-protect on public WiFi'}
            </span>
          </div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={isEnabled} onChange={() => onToggle && onToggle(!isEnabled)} />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* â”€â”€ Captive portal warning â”€â”€ */}
      {captive === true && (
        <div className="captive-portal-warning">
          <span className="captive-icon">ðŸš¨</span>
          <div className="captive-body">
            <strong>Captive Portal Detected</strong>
            <p>
              This network is intercepting your connections â€” a common tactic on hotel, airport, and coffee shop WiFi.
              Your traffic is <em>not</em> private until you connect to the VPN.
              {captiveUrl && <> Login page: <code>{captiveUrl}</code></>}
            </p>
          </div>
          {isEnabled && (
            <button className="captive-connect-btn" onClick={() => onConnect && onConnect()}>
              Connect VPN Now
            </button>
          )}
        </div>
      )}

      {/* â”€â”€ Current network card â”€â”€ */}
      <div className="current-network-status">
        <div className="network-info">
          <span className="network-icon">{isOnline ? 'ðŸ“¶' : 'ðŸš«'}</span>
          <div className="network-details">
            <span className="network-name">{scan?.ssid || (isOnline ? 'Detectingâ€¦' : 'No Network')}</span>
            {scan?.bssid && <span className="network-bssid">{scan.bssid}</span>}
            <span className="network-type">
              {scan?.security || 'Unknown security'}
              {scan?.signal != null ? ` Â· Signal ${scan.signal}%` : ''}
              {scan?.isOpen ? ' Â· âš ï¸ OPEN' : ''}
            </span>
          </div>
          {scanning && <span className="scanning-indicator">ðŸ”„</span>}
        </div>

        {scan?.ssid && (
          <div className="network-trust-status">
            {isTrusted ? (
              <span className="trust-badge trusted">âœ“ Trusted Network</span>
            ) : (
              <div className="untrusted-actions">
                <span className="trust-badge untrusted">! Untrusted</span>
                <button className="trust-button" onClick={addCurrentAsTrusted}>Mark as Trusted</button>
              </div>
            )}
          </div>
        )}

        {lastScanTime && (
          <div className="last-scan-time">
            Last scan: {lastScanTime.toLocaleTimeString()}
            <button className="rescan-btn" onClick={doScan} disabled={scanning}>â†» Rescan</button>
          </div>
        )}
      </div>

      {/* â”€â”€ Threat assessment panel â”€â”€ */}
      <div className="threat-panel" style={{ borderColor: tm.color }}>
        <div className="threat-header">
          <span className="threat-icon">{tm.icon}</span>
          <div className="threat-info">
            <span className="threat-label" style={{ color: tm.color }}>Network Threat Level: {tm.label}</span>
            {threat.reasons.length === 0
              ? <span className="threat-detail">No threats detected on this network</span>
              : <ul className="threat-reasons">
                  {threat.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
            }
          </div>
        </div>

        <div className="protection-checklist">
          <div className={`check-row ${isEnabled ? 'pass' : 'fail'}`}>
            <span>{isEnabled ? 'âœ…' : 'âŒ'}</span>
            <span>Auto-connect VPN on untrusted networks</span>
          </div>
          <div className={`check-row ${scan?.isOpen === false ? 'pass' : 'warn'}`}>
            <span>{scan?.isOpen === false ? 'âœ…' : 'âš ï¸'}</span>
            <span>Network uses encryption (WPA2/WPA3)</span>
          </div>
          <div className={`check-row ${captive === false ? 'pass' : captive === null ? 'unknown' : 'fail'}`}>
            <span>{captive === false ? 'âœ…' : captive === null ? 'â“' : 'âŒ'}</span>
            <span>No captive portal / MitM interception</span>
          </div>
          <div className={`check-row ${isTrusted ? 'warn' : 'pass'}`}>
            <span>{isTrusted ? 'ðŸ ' : 'âœ…'}</span>
            <span>{isTrusted ? 'Trusted network â€” VPN auto-connect skipped' : 'Unknown network â€” VPN will auto-connect'}</span>
          </div>
        </div>
      </div>

      {/* â”€â”€ Behavior settings â”€â”€ */}
      {isEnabled && (
        <div className="behavior-settings">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">ðŸ”„</span>
              <div className="setting-text">
                <span className="setting-title">Auto-connect on untrusted</span>
                <span className="setting-desc">VPN connects automatically on public WiFi</span>
              </div>
            </div>
            <span className="setting-status active">Active</span>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">ðŸ˜´</span>
              <div className="setting-text">
                <span className="setting-title">Reconnect after sleep</span>
                <span className="setting-desc">Auto-connect when device wakes up on an untrusted network</span>
              </div>
            </div>
            <span className="setting-status active">Active</span>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">ðŸš¨</span>
              <div className="setting-text">
                <span className="setting-title">Captive portal alerts</span>
                <span className="setting-desc">Warn when a network is intercepting connections</span>
              </div>
            </div>
            <span className="setting-status active">Active</span>
          </div>
        </div>
      )}

      {/* â”€â”€ Trusted Networks â”€â”€ */}
      <div className="trusted-networks">
        <div className="section-header">
          <span className="section-title">Trusted Networks</span>
          <button className="add-network-btn" onClick={() => setShowAddNetwork(!showAddNetwork)}>
            {showAddNetwork ? 'âœ•' : '+'}
          </button>
        </div>

        {showAddNetwork && (
          <div className="add-network-form">
            <input
              type="text"
              placeholder="Enter network name (SSID)"
              value={newNetworkName}
              onChange={(e) => setNewNetworkName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTrustedNetwork()}
            />
            <button onClick={handleAddTrustedNetwork}>Add</button>
          </div>
        )}

        {trustedNetworks.length > 0 ? (
          <div className="networks-list">
            {trustedNetworks.map(network => (
              <div key={network.id} className="network-item">
                <div className="network-item-info">
                  <span className="network-item-icon">ðŸ“¶</span>
                  <span className="network-item-name">{network.name}</span>
                </div>
                <button className="remove-network-btn"
                  onClick={() => onRemoveTrustedNetwork && onRemoveTrustedNetwork(network.id)}>
                  âœ•
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-networks">
            <span className="no-networks-icon">ðŸ </span>
            <span className="no-networks-text">
              No trusted networks yet. Add your home or work WiFi to skip auto-connect.
            </span>
          </div>
        )}
      </div>

      {/* â”€â”€ Auto-connect log â”€â”€ */}
      {autoConnectLog.length > 0 && (
        <div className="auto-connect-log">
          <div className="log-header">
            <span className="log-icon">ðŸ“‹</span>
            <span>Recent Auto-Connections</span>
          </div>
          <div className="log-list">
            {autoConnectLog.slice(0, 5).map((entry, index) => (
              <div key={index} className="log-item">
                <span className="log-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span className="log-network">{entry.network}</span>
                <span className="log-action">{entry.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="info-note">
        <span className="note-icon">ðŸ’¡</span>
        <span>
          VPN auto-connects on untrusted and open WiFi. Captive portals, open networks,
          and wake-from-sleep events are all detected and handled automatically.
        </span>
      </div>
    </div>
  );
};

export default AutoConnectWiFi;
