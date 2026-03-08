import React, { useState, useEffect } from 'react';
import './DarkWebMonitor.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const SEVERITY_CONFIG = {
  critical: { color: '#d32f2f', bg: 'rgba(211,47,47,0.12)', label: '🚨 Critical', icon: '🚨' },
  high:     { color: '#f57c00', bg: 'rgba(245,124,0,0.12)', label: '⚠️ High',     icon: '⚠️' },
  medium:   { color: '#fbc02d', bg: 'rgba(251,192,45,0.12)', label: '🔶 Medium',   icon: '🔶' },
  low:      { color: '#388e3c', bg: 'rgba(56,142,60,0.12)',  label: '✅ Low',       icon: '✅' },
};

const DarkWebMonitor = () => {
  const [emails, setEmails]               = useState([]);
  const [inputEmail, setInputEmail]       = useState('');
  const [scanning, setScanning]           = useState(false);
  const [scanResults, setScanResults]     = useState({}); // email → breaches[]
  const [activeEmail, setActiveEmail]     = useState(null);
  const [monitorEnabled, setMonitorEnabled] = useState(true);
  const [lastScan, setLastScan]           = useState(null);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [emailError, setEmailError]       = useState('');

  // Auto-scan monitored emails every 5 minutes
  useEffect(() => {
    if (emails.length > 0 && monitorEnabled) {
      const id = setInterval(() => runScan(emails[0].address, true), 60000 * 5);
      return () => clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emails, monitorEnabled]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addEmail = () => {
    const trimmed = inputEmail.trim().toLowerCase();
    if (!validateEmail(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (emails.some(e => e.address === trimmed)) {
      setEmailError('This email is already being monitored.');
      return;
    }
    setEmailError('');
    const newEntry = { id: Date.now(), address: trimmed, addedAt: new Date().toLocaleDateString() };
    setEmails(prev => [...prev, newEntry]);
    setInputEmail('');
    setShowAddForm(false);
    runScan(trimmed);
  };

  const removeEmail = (id) => {
    const entry = emails.find(e => e.id === id);
    setEmails(prev => prev.filter(e => e.id !== id));
    if (entry) {
      setScanResults(prev => { const c = { ...prev }; delete c[entry.address]; return c; });
    }
    if (activeEmail === entry?.address) setActiveEmail(null);
  };

  const runScan = async (emailAddress, silent = false) => {
    if (!silent) setScanning(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/security/breaches?email=${encodeURIComponent(emailAddress)}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setScanResults(prev => ({ ...prev, [emailAddress]: data.breaches }));
      setLastScan(new Date().toLocaleTimeString());
      if (!activeEmail) setActiveEmail(emailAddress);
    } catch (err) {
      setScanResults(prev => ({ ...prev, [emailAddress]: { error: err.message } }));
    } finally {
      if (!silent) setScanning(false);
    }
  };

  const getTotalBreaches = () =>
    Object.values(scanResults).reduce((sum, arr) => sum + arr.length, 0);

  const getWorstSeverity = (breaches) => {
    const order = ['critical', 'high', 'medium', 'low'];
    for (const s of order) {
      if (breaches.some(b => b.severity === s)) return s;
    }
    return null;
  };

  const activeBreaches = activeEmail ? (scanResults[activeEmail] || null) : null;

  return (
    <div className="dwm-container">
      {/* Header */}
      <div className="dwm-header">
        <div className="dwm-header-left">
          <span className="dwm-icon">🕵️</span>
          <div>
            <h2 className="dwm-title">Dark Web Monitor</h2>
            <p className="dwm-subtitle">Get alerted if your email appears in a data breach</p>
          </div>
        </div>
        <div className="dwm-header-right">
          <label className="dwm-toggle-wrap">
            <span className="dwm-toggle-label">Auto-Monitor</span>
            <div
              className={`dwm-toggle ${monitorEnabled ? 'on' : ''}`}
              onClick={() => setMonitorEnabled(p => !p)}
            >
              <div className="dwm-toggle-knob" />
            </div>
          </label>
        </div>
      </div>

      {/* Stats bar */}
      <div className="dwm-stats">
        <div className="dwm-stat">
          <div className="dwm-stat-value">{emails.length}</div>
          <div className="dwm-stat-label">Monitored Emails</div>
        </div>
        <div className="dwm-stat">
          <div className={`dwm-stat-value ${getTotalBreaches() > 0 ? 'danger' : 'safe'}`}>
            {getTotalBreaches()}
          </div>
          <div className="dwm-stat-label">Breaches Found</div>
        </div>
        <div className="dwm-stat">
          <div className="dwm-stat-value">{lastScan || '—'}</div>
          <div className="dwm-stat-label">Last Scan</div>
        </div>
        <div className="dwm-stat">
          <div className={`dwm-stat-value ${monitorEnabled ? 'safe' : 'muted'}`}>
            {monitorEnabled ? '🟢 Active' : '⭕ Off'}
          </div>
          <div className="dwm-stat-label">Status</div>
        </div>
      </div>

      <div className="dwm-body">
        {/* Email list panel */}
        <div className="dwm-panel dwm-email-panel">
          <div className="dwm-panel-header">
            <h3>Monitored Addresses</h3>
            <button className="dwm-add-btn" onClick={() => setShowAddForm(p => !p)}>
              {showAddForm ? '✕ Cancel' : '+ Add Email'}
            </button>
          </div>

          {showAddForm && (
            <div className="dwm-add-form">
              <input
                type="email"
                className={`dwm-email-input ${emailError ? 'error' : ''}`}
                placeholder="you@example.com"
                value={inputEmail}
                onChange={(e) => { setInputEmail(e.target.value); setEmailError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
              />
              {emailError && <p className="dwm-input-error">{emailError}</p>}
              <button className="dwm-scan-btn" onClick={addEmail} disabled={!inputEmail.trim()}>
                🔍 Scan &amp; Monitor
              </button>
            </div>
          )}

          {emails.length === 0 ? (
            <div className="dwm-empty">
              <div className="dwm-empty-icon">📭</div>
              <p>No emails added yet.</p>
              <p>Add your email to start monitoring.</p>
            </div>
          ) : (
            <div className="dwm-email-list">
              {emails.map(entry => {
                const breaches = scanResults[entry.address];
                const isScanning = scanning && activeEmail === entry.address;
                const worst = breaches ? getWorstSeverity(breaches) : null;
                const cfg = worst ? SEVERITY_CONFIG[worst] : null;
                return (
                  <div
                    key={entry.id}
                    className={`dwm-email-item ${activeEmail === entry.address ? 'active' : ''}`}
                    onClick={() => setActiveEmail(entry.address)}
                  >
                    <div className="dwm-email-item-left">
                      <span className="dwm-email-address">{entry.address}</span>
                      <span className="dwm-email-added">Added {entry.addedAt}</span>
                    </div>
                    <div className="dwm-email-item-right">
                      {isScanning ? (
                        <span className="dwm-scanning-badge">⏳ Scanning…</span>
                      ) : breaches === undefined ? (
                        <button
                          className="dwm-rescan-btn"
                          onClick={(e) => { e.stopPropagation(); runScan(entry.address); }}
                        >Scan</button>
                      ) : breaches.length === 0 ? (
                        <span className="dwm-safe-badge">✅ Clear</span>
                      ) : (
                        <span className="dwm-breach-badge" style={{ background: cfg?.color }}>
                          {cfg?.icon} {breaches.length} breach{breaches.length > 1 ? 'es' : ''}
                        </span>
                      )}
                      <button
                        className="dwm-remove-btn"
                        onClick={(e) => { e.stopPropagation(); removeEmail(entry.id); }}
                        title="Remove"
                      >✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Breach detail panel */}
        <div className="dwm-panel dwm-detail-panel">
          {!activeEmail ? (
            <div className="dwm-detail-empty">
              <div className="dwm-detail-empty-icon">🔍</div>
              <p>Add an email address to check if it appeared in any known data breaches.</p>
            </div>
          ) : scanning && !scanResults[activeEmail] ? (
            <div className="dwm-scanning-state">
              <div className="dwm-pulse-ring" />
              <p>Scanning the dark web…</p>
              <p className="dwm-scan-note">Checking against 15+ billion records</p>
            </div>
          ) : activeBreaches && activeBreaches.length === 0 ? (
            <div className="dwm-clear-state">
              <div className="dwm-clear-icon">✅</div>
              <h3>No Breaches Found</h3>
              <p><strong>{activeEmail}</strong> was not found in any known data breaches.</p>
              <p className="dwm-scan-note">Last scanned: {lastScan}</p>
              <button className="dwm-rescan-btn-lg" onClick={() => runScan(activeEmail)}>
                🔄 Re-scan Now
              </button>
            </div>
          ) : activeBreaches ? (
            <div className="dwm-breach-list">
              <div className="dwm-breach-list-header">
                <span className="dwm-breach-count">
                  {activeBreaches.length} breach{activeBreaches.length > 1 ? 'es' : ''} found for{' '}
                  <strong>{activeEmail}</strong>
                </span>
                <button className="dwm-rescan-btn" onClick={() => runScan(activeEmail)}>
                  🔄 Re-scan
                </button>
              </div>
              {activeBreaches.map(breach => {
                const cfg = SEVERITY_CONFIG[breach.severity];
                return (
                  <div key={breach.id} className="dwm-breach-card" style={{ borderLeftColor: cfg.color, background: cfg.bg }}>
                    <div className="dwm-breach-card-header">
                      <span className="dwm-breach-site">{breach.site}</span>
                      <span className="dwm-severity-badge" style={{ background: cfg.color }}>
                        {cfg.icon} {breach.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="dwm-breach-meta">
                      <span>📅 {breach.date}</span>
                      <span>👥 {breach.count}</span>
                    </div>
                    <div className="dwm-exposed-data">
                      <span className="dwm-exposed-label">Exposed data: </span>
                      {breach.exposedData.map(d => (
                        <span key={d} className="dwm-exposed-tag">{d}</span>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="dwm-recommendations">
                <h4>🛡️ Recommended Actions</h4>
                <ul>
                  <li>Change your password on all affected sites immediately</li>
                  <li>Enable two-factor authentication where possible</li>
                  <li>Use a unique, strong password for each service</li>
                  <li>Check if payment cards were exposed and contact your bank</li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DarkWebMonitor;
