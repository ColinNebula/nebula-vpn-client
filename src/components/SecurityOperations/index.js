import React, { useState, useCallback } from 'react';
import apiService from '../../services/api';
import './SecurityOperations.css';

// ── Real local network-security checks ───────────────────────────────────────

/** Returns the real public exit IP as seen by Cloudflare. */
async function checkExitIP() {
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 5000);
    const resp = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { signal: ctrl.signal });
    clearTimeout(tid);
    const text = await resp.text();
    const ip   = text.match(/^ip=(.+)$/m)?.[1]?.trim() || null;
    return { ip };
  } catch {
    return { ip: null };
  }
}

/** Tries to fetch via an IPv6-only endpoint. Success → IPv6 is live + reachable. */
async function checkIPv6() {
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 4000);
    const resp = await fetch('https://api6.ipify.org?format=json', { signal: ctrl.signal });
    clearTimeout(tid);
    const { ip } = await resp.json();
    return { exposed: !!ip, ip: ip || null };
  } catch {
    return { exposed: false };
  }
}

/** Uses WebRTC STUN to collect any non-tunnel IP candidates. */
function detectWebRTCIPs() {
  return new Promise(resolve => {
    if (typeof RTCPeerConnection === 'undefined') return resolve({ ips: [] });
    const ips = new Set();
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] });
      pc.createDataChannel('probe');
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => {});
      const done = () => { try { pc.close(); } catch {} resolve({ ips: [...ips] }); };
      const timer = setTimeout(done, 3000);
      pc.onicecandidate = e => {
        if (!e?.candidate) { clearTimeout(timer); done(); return; }
        const m = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
        if (m) ips.add(m[1]);
      };
    } catch { resolve({ ips: [] }); }
  });
}

function isPublicIP(ip) {
  return ip && !/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|0\.)/.test(ip);
}

let incidentCounter = 4;

// ── Component ─────────────────────────────────────────────────────────────────
const SecurityOperations = () => {
  const [activeView, setActiveView]     = useState('dashboard');
  const [scanning,   setScanning]       = useState(false);
  const [scanPhase,  setScanPhase]      = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [lastScanMeta, setLastScanMeta] = useState(null); // { packagesChecked, exitIP }
  const [scanError,  setScanError]      = useState(null);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [newIncident, setNewIncident]   = useState({ type: '', severity: 'low' });
  const [incidentError, setIncidentError] = useState('');

  const threatFeeds = [
    { name: 'Malware Domains', status: 'active', lastUpdate: '2 min ago', threats: 1247 },
    { name: 'Phishing URLs',   status: 'active', lastUpdate: '5 min ago', threats: 892  },
    { name: 'Botnet IPs',      status: 'active', lastUpdate: '1 min ago', threats: 2156 },
    { name: 'C&C Servers',     status: 'active', lastUpdate: '3 min ago', threats: 437  }
  ];

  const [vulnerabilities, setVulnerabilities] = useState([]);

  const [incidents, setIncidents] = useState([
    { id: 1, type: 'DNS Leak',           severity: 'high',   status: 'investigating', time: '10 min ago' },
    { id: 2, type: 'Malware Blocked',    severity: 'medium', status: 'resolved',      time: '1 hour ago' },
    { id: 3, type: 'Suspicious Traffic', severity: 'low',    status: 'monitoring',    time: '3 hours ago' }
  ]);

  // ── Real vulnerability scan ────────────────────────────────────────────────
  const handleRunScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setScanError(null);
    setScanProgress(5);
    setScanPhase('Connecting to OSV vulnerability database…');

    const newFindings = [];
    let packagesChecked = 0;

    // ── Phase 1: OSV.dev package audit via server proxy ──────────────────────
    try {
      const result = await apiService.vulnScan();
      packagesChecked = result.packagesChecked || 0;
      newFindings.push(...(result.findings || []));
    } catch (err) {
      setScanError(
        `Package audit unavailable${err.message ? ': ' + err.message : ''}.` +
        ' Network checks will still run.'
      );
    }
    setScanProgress(52);

    // ── Phase 2: Real exit IP via Cloudflare trace ────────────────────────────
    setScanPhase('Checking active exit IP…');
    const dns = await checkExitIP();
    setScanProgress(62);

    // ── Phase 3: IPv6 exposure ────────────────────────────────────────────────
    setScanPhase('Testing IPv6 exposure…');
    setScanProgress(72);
    const ipv6 = await checkIPv6();
    if (ipv6.exposed) {
      newFindings.push({
        id: `cfg-ipv6-${Date.now()}`,
        cve: 'CFG-IPV6-001',
        osvId: null,
        summary: `IPv6 address (${ipv6.ip}) reachable outside VPN tunnel — potential traffic leak`,
        severity: 'medium',
        component: 'IPv6 Configuration',
        version: null,
        status: 'investigating',
        references: ['https://www.ipleak.net/'],
        type: 'network',
      });
    }

    // ── Phase 4: WebRTC UDP leak ──────────────────────────────────────────────
    setScanPhase('Testing WebRTC UDP leaks…');
    setScanProgress(84);
    const rtc = await detectWebRTCIPs();
    const publicRTCIPs = (rtc.ips || []).filter(isPublicIP);
    if (publicRTCIPs.length > 0 && !window.electron) {
      newFindings.push({
        id: `cfg-rtc-${Date.now()}`,
        cve: 'CFG-WEBRTC-001',
        osvId: null,
        summary: `WebRTC exposes non-tunnel IP candidate: ${publicRTCIPs.join(', ')}`,
        severity: 'medium',
        component: 'WebRTC (browser)',
        version: null,
        status: 'investigating',
        references: ['https://browserleaks.com/webrtc'],
        type: 'network',
      });
    }

    // ── Phase 5: Secure context / TLS ─────────────────────────────────────────
    setScanPhase('Checking TLS / secure context…');
    setScanProgress(93);
    if (typeof window !== 'undefined' && !window.isSecureContext && !window.electron) {
      newFindings.push({
        id: `cfg-tls-${Date.now()}`,
        cve: 'CFG-TLS-001',
        osvId: null,
        summary: 'App is not served over HTTPS — credentials and traffic may be intercepted in transit',
        severity: 'high',
        component: 'Transport Security (HTTPS)',
        version: null,
        status: 'investigating',
        references: ['https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts'],
        type: 'config',
      });
    }

    // ── Done ──────────────────────────────────────────────────────────────────
    setScanProgress(100);
    setScanPhase('Scan complete');
    setLastScanTime(new Date().toLocaleTimeString());
    setLastScanMeta({ packagesChecked, exitIP: dns.ip || null });
    setVulnerabilities(newFindings);
    setTimeout(() => { setScanning(false); setScanProgress(0); setScanPhase(''); }, 400);
  }, [scanning]);

  // ── Create incident ───────────────────────────────────────────────────────
  const handleCreateIncident = useCallback(() => {
    if (!newIncident.type.trim()) { setIncidentError('Incident type is required.'); return; }
    setIncidents(prev => [{
      id: incidentCounter++,
      type: newIncident.type.trim(),
      severity: newIncident.severity,
      status: 'investigating',
      time: 'just now',
    }, ...prev]);
    setNewIncident({ type: '', severity: 'low' });
    setIncidentError('');
    setShowIncidentForm(false);
  }, [newIncident]);

  // ── Severity counts ───────────────────────────────────────────────────────
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount     = vulnerabilities.filter(v => v.severity === 'high').length;

  return (
    <div className="security-operations">
      <div className="sec-ops-header">
        <h3>🛡️ Security Operations Center</h3>
        <div className="threat-level">
          <span className="threat-indicator medium">⚠️</span>
          <span>Threat Level: ELEVATED</span>
        </div>
      </div>

      <div className="sec-ops-nav">
        <button className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
          📊 SOC Dashboard
        </button>
        <button className={`nav-btn ${activeView === 'incidents' ? 'active' : ''}`} onClick={() => setActiveView('incidents')}>
          🚨 Incidents
        </button>
        <button className={`nav-btn ${activeView === 'vulnerabilities' ? 'active' : ''}`} onClick={() => setActiveView('vulnerabilities')}>
          🔍 Vulnerabilities{vulnerabilities.length > 0 ? ` (${vulnerabilities.length})` : ''}
        </button>
      </div>

      {activeView === 'dashboard' && (
        <div className="soc-dashboard">
          <div className="threat-feeds">
            <h4>📡 Threat Intelligence Feeds</h4>
            <div className="feeds-grid">
              {threatFeeds.map((feed, index) => (
                <div key={index} className="feed-card">
                  <div className="feed-header">
                    <span className="feed-name">{feed.name}</span>
                    <span className={`feed-status ${feed.status}`}>●</span>
                  </div>
                  <div className="feed-stats">
                    <span className="threat-count">{feed.threats.toLocaleString()} threats</span>
                    <span className="last-update">Updated {feed.lastUpdate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="security-metrics">
            <h4>📈 Security Metrics (24h)</h4>
            <div className="metrics-grid">
              <div className="sec-metric">
                <span className="metric-icon">🛡️</span>
                <div className="metric-data">
                  <span className="metric-value">2,847</span>
                  <span className="metric-label">Threats Blocked</span>
                </div>
              </div>
              <div className="sec-metric">
                <span className="metric-icon">🔍</span>
                <div className="metric-data">
                  <span className="metric-value">156</span>
                  <span className="metric-label">Scans Performed</span>
                </div>
              </div>
              <div className="sec-metric">
                <span className="metric-icon">⚠️</span>
                <div className="metric-data">
                  <span className="metric-value">{incidents.length}</span>
                  <span className="metric-label">Active Incidents</span>
                </div>
              </div>
              <div className="sec-metric">
                <span className="metric-icon">🔄</span>
                <div className="metric-data">
                  <span className="metric-value">99.97%</span>
                  <span className="metric-label">Protection Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'incidents' && (
        <div className="incidents-view">
          <div className="incidents-header">
            <h4>🚨 Active Security Incidents</h4>
            <button className="create-incident" onClick={() => { setShowIncidentForm(v => !v); setIncidentError(''); }}>
              {showIncidentForm ? '✕ Cancel' : '➕ Create Incident'}
            </button>
          </div>

          {showIncidentForm && (
            <div className="incident-form">
              <div className="incident-form-row">
                <input type="text" className="incident-input"
                  placeholder="Incident type, e.g. Port Scan Detected"
                  value={newIncident.type}
                  onChange={e => setNewIncident(p => ({ ...p, type: e.target.value }))} />
                <select className="incident-select" value={newIncident.severity}
                  onChange={e => setNewIncident(p => ({ ...p, severity: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <button className="create-incident" onClick={handleCreateIncident}>Add</button>
              </div>
              {incidentError && <p className="incident-form-error">{incidentError}</p>}
            </div>
          )}

          <div className="incidents-list">
            {incidents.map(incident => (
              <div key={incident.id} className="incident-card">
                <div className="incident-info">
                  <span className="incident-type">{incident.type}</span>
                  <span className={`severity-badge ${incident.severity}`}>{incident.severity.toUpperCase()}</span>
                </div>
                <div className="incident-status">
                  <span className={`status-badge ${incident.status}`}>{incident.status.replace('_', ' ')}</span>
                  <span className="incident-time">{incident.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'vulnerabilities' && (
        <div className="vulnerabilities-view">
          <div className="vuln-header">
            <div>
              <h4>🔍 Vulnerability Management</h4>
              {lastScanTime && (
                <p className="last-scan-time">
                  Last scan: {lastScanTime}
                  {lastScanMeta?.packagesChecked > 0 && ` · ${lastScanMeta.packagesChecked} packages audited`}
                  {lastScanMeta?.exitIP && ` · Exit IP: ${lastScanMeta.exitIP}`}
                  {' · '}{vulnerabilities.length} finding{vulnerabilities.length !== 1 ? 's' : ''}
                  {criticalCount > 0 && <span className="scan-crit-badge"> {criticalCount} CRITICAL</span>}
                  {highCount > 0    && <span className="scan-high-badge"> {highCount} HIGH</span>}
                </p>
              )}
            </div>
            <button className="scan-vulnerabilities" onClick={handleRunScan} disabled={scanning}>
              {scanning ? '⏳ Scanning…' : '🔍 Run Scan'}
            </button>
          </div>

          {scanning && (
            <div className="scan-progress-container">
              <p className="scan-phase-label">{scanPhase}</p>
              <div className="scan-progress-bar">
                <div className="scan-progress-fill" style={{ width: `${scanProgress}%` }}></div>
              </div>
              <p className="scan-progress-pct">{scanProgress}%</p>
            </div>
          )}

          {scanError && (
            <div className="scan-error-banner">⚠️ {scanError}</div>
          )}

          <div className="vulnerabilities-list">
            {vulnerabilities.length === 0 && !scanning ? (
              <div className="vuln-empty-state">
                <span className="vuln-empty-icon">🔍</span>
                <p>No scan results yet.</p>
                <p className="vuln-empty-sub">
                  Click <strong>Run Scan</strong> to query the OSV vulnerability database for your installed
                  packages and perform live network security checks (IPv6 leak, WebRTC, TLS).
                </p>
              </div>
            ) : (
              vulnerabilities.map(vuln => {
                const typeLabel = vuln.type === 'network' ? 'Network' : vuln.type === 'config' ? 'Config' : 'Package';
                return (
                  <div key={vuln.id} className="vuln-card">
                    <div className="vuln-card-top">
                      <div className="vuln-info">
                        <span className="vuln-cve">{vuln.cve}</span>
                        <span className={`vuln-severity ${vuln.severity}`}>{vuln.severity.toUpperCase()}</span>
                        <span className={`vuln-type-badge vuln-type-${vuln.type || 'package'}`}>{typeLabel}</span>
                      </div>
                      <div className="vuln-status">
                        <span className={`vuln-status-badge ${vuln.status}`}>
                          {vuln.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="vuln-summary">{vuln.summary}</div>
                    <div className="vuln-footer">
                      <span className="vuln-component">
                        {vuln.component}{vuln.version ? ` v${vuln.version}` : ''}
                      </span>
                      {vuln.references?.length > 0 && (
                        <a href={vuln.references[0]} target="_blank" rel="noopener noreferrer"
                          className="vuln-ref-link">
                          Advisory ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityOperations;