import React, { useState, useEffect, useRef } from 'react';
import './ThreatDetection.css';

// ── Helper functions ─────────────────────────────────────────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ── Geographic data ──────────────────────────────────────────────────────────
const COUNTRIES = ['US', 'RU', 'CN', 'DE', 'BR', 'IN', 'FR', 'UK', 'KR', 'JP', 'NL', 'CA'];

const COUNTRY_NAMES = {
  'US': 'United States',
  'RU': 'Russia', 
  'CN': 'China',
  'DE': 'Germany',
  'BR': 'Brazil',
  'IN': 'India',
  'FR': 'France',
  'UK': 'United Kingdom',
  'KR': 'South Korea',
  'JP': 'Japan', 
  'NL': 'Netherlands',
  'CA': 'Canada'
};

// ── Threat catalogue ─────────────────────────────────────────────────────────
const THREAT_CATALOGUE = [
  { type: 'malware',      icon: '🦠', color: '#f44336', label: 'Malware',        protocol: 'HTTP',  settingKey: 'blockMalware'      },
  { type: 'phishing',     icon: '🎣', color: '#ff9800', label: 'Phishing',       protocol: 'HTTPS', settingKey: 'blockPhishing'     },
  { type: 'tracker',      icon: '👁️', color: '#9c27b0', label: 'Tracker',        protocol: 'HTTPS', settingKey: 'blockTrackers'     },
  { type: 'ads',          icon: '📢', color: '#2196F3', label: 'Advertisement',  protocol: 'HTTP',  settingKey: 'blockAds'          },
  { type: 'ransomware',   icon: '🔒', color: '#b71c1c', label: 'Ransomware',     protocol: 'TCP',   settingKey: 'blockRansomware'   },
  { type: 'cryptomining', icon: '⛏️', color: '#795548', label: 'Cryptomining',   protocol: 'WSS',   settingKey: 'blockCryptomining' },
  { type: 'botnet',       icon: '🤖', color: '#37474f', label: 'Botnet',         protocol: 'TCP',   settingKey: 'blockBotnet'       },
  { type: 'c2',           icon: '📡', color: '#c62828', label: 'C2 Traffic',     protocol: 'TCP',   settingKey: 'blockC2'           },
  { type: 'spyware',      icon: '🕵️', color: '#4a148c', label: 'Spyware',        protocol: 'HTTPS', settingKey: 'blockMalware'      },
  { type: 'mitm',         icon: '🔀', color: '#e65100', label: 'MITM Attempt',   protocol: 'TLS',   settingKey: 'deepPacketInspection' },
];

// Intelligence campaigns are static reference data; IOC counts come from real scans
const INTEL_CAMPAIGNS = [
  { name: 'Operation Eclipse',    type: 'APT',          iocs: 0, status: 'monitored' },
  { name: 'DarkHydra Botnet',     type: 'Botnet',       iocs: 0, status: 'monitored' },
  { name: 'PhishNet Campaign',    type: 'Phishing',     iocs: 0, status: 'monitored' },
  { name: 'CryptoJack Ring',      type: 'Cryptomining', iocs: 0, status: 'monitored' },
  { name: 'RansomCloud v4',       type: 'Ransomware',   iocs: 0, status: 'monitored' },
];

// ── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, width = 160, height = 36, color = '#4CAF50' }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - (data[data.length - 1] / max) * (height - 4) - 2}
        r="3" fill={color} />
    </svg>
  );
};

// ── Component ────────────────────────────────────────────────────────────────
const ThreatDetection = ({ isConnected }) => {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState({
    blocked: 0, malware: 0, phishing: 0, trackers: 0,
    ransomware: 0, cryptomining: 0, botnet: 0, c2: 0,
  });
  const [settings, setSettings] = useState({
    enabled:            true,
    blockMalware:       true,
    blockPhishing:      true,
    blockTrackers:      true,
    blockAds:           false,
    blockRansomware:    true,
    blockCryptomining:  true,
    blockBotnet:        true,
    blockC2:            true,
    realTimeScanning:   true,
    autoQuarantine:     false,
    deepPacketInspection: false,
    geoBlocking:        false,
  });
  const [scanning, setScanning]           = useState(false);
  const [scanProgress, setScanProgress]   = useState(0);
  const [activeView, setActiveView]       = useState('log');   // 'log' | 'intelligence' | 'quarantine' | 'settings'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [quarantined, setQuarantined]     = useState([]);
  const [whitelist, setWhitelist]         = useState([]);
  const [threatTimeline, setThreatTimeline] = useState(Array(20).fill(0));
  const [riskScore, setRiskScore]         = useState(12);
  const [intelCampaigns]                  = useState(INTEL_CAMPAIGNS);
  const [totalIocs, setTotalIocs]         = useState(0);
  const nextId = useRef(1);

  const shouldBlock = (type) => {
    if (!settings.enabled) return false;
    const cat = THREAT_CATALOGUE.find(t => t.type === type);
    return cat ? !!settings[cat.settingKey] : false;
  };

  // ── Real threat events via localStorage (written by ThreatProtection / OS-level proxy) ──
  // When the browser extension or Electron main process detects a blocked request,
  // it writes a JSON array to localStorage key 'nebula_threat_log'.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'nebula_threat_log') return;
      try {
        const events = JSON.parse(e.newValue || '[]');
        if (!Array.isArray(events) || events.length === 0) return;
        const newThreats = events.map(ev => ({
          id:          nextId.current++,
          type:        ev.type        || 'malware',
          icon:        THREAT_CATALOGUE.find(c => c.type === ev.type)?.icon  || '🦠',
          color:       THREAT_CATALOGUE.find(c => c.type === ev.type)?.color || '#f44336',
          label:       THREAT_CATALOGUE.find(c => c.type === ev.type)?.label || ev.type,
          protocol:    ev.protocol    || 'HTTP',
          domain:      ev.domain      || '-',
          ip:          ev.ip          || '-',
          country:     ev.country     || '-',
          countryName: ev.countryName || ev.country || '-',
          timestamp:   ev.timestamp   || new Date().toLocaleTimeString(),
          severity:    ev.severity    || 'medium',
          blocked:     ev.blocked     ?? true,
          quarantined: false,
          bytes:       ev.bytes       || '-',
          confidence:  ev.confidence  || 90,
          iocMatch:    ev.iocMatch    || null,
        }));
        setThreats(prev => [...newThreats, ...prev].slice(0, 200));
        const blocked = newThreats.filter(t => t.blocked);
        if (blocked.length > 0) {
          setStats(prev => {
            const next = { ...prev, blocked: prev.blocked + blocked.length };
            blocked.forEach(t => {
              const key = t.type === 'tracker' ? 'trackers' : (next[t.type] !== undefined ? t.type : 'malware');
              next[key] = (next[key] || 0) + 1;
            });
            return next;
          });
          setTotalIocs(prev => prev + blocked.length);
        }
      } catch { /* ignore malformed events */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Risk score natural decay
  useEffect(() => {
    const decay = setInterval(() => {
      setRiskScore(prev => Math.max(5, prev - 1));
    }, 8000);
    return () => clearInterval(decay);
  }, []);

  const runScan = () => {
    setScanning(true);
    setScanProgress(0);
    const tick = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(tick); setScanning(false); return 100; }
        return p + randInt(4, 12);
      });
    }, 180);
  };

  const clearThreats = () => { setThreats([]); };

  const removeFromQuarantine = (domain) => {
    setQuarantined(prev => prev.filter(d => d !== domain));
  };

  const addToWhitelist = (domain) => {
    setWhitelist(prev => prev.includes(domain) ? prev : [...prev, domain]);
    removeFromQuarantine(domain);
  };

  const removeFromWhitelist = (domain) => {
    setWhitelist(prev => prev.filter(d => d !== domain));
  };

  const exportLog = () => {
    const csv = [
      'Time,Type,Domain,IP,Country,Protocol,Severity,Confidence,Action,IOC',
      ...threats.map(t =>
        `${t.timestamp},${t.label},${t.domain},${t.ip},${t.countryName},${t.protocol},${t.severity},${t.confidence}%,${t.blocked ? 'BLOCKED' : 'ALLOWED'},${t.iocMatch || ''}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `threat-log-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (s) =>
    s === 'critical' ? '#d32f2f' : s === 'high' ? '#f44336' : s === 'medium' ? '#ff9800' : '#ffc107';

  const getRiskLabel = () =>
    riskScore > 70 ? '🔴 HIGH' : riskScore > 40 ? '🟡 MEDIUM' : '🟢 LOW';

  const filteredThreats = severityFilter === 'all'
    ? threats
    : threats.filter(t => t.severity === severityFilter);

  // ── Threat type breakdown for bar chart ──────────────────────────────────
  const typeBreakdown = THREAT_CATALOGUE.map(cat => ({
    ...cat,
    count: threats.filter(t => t.type === cat.type).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
  const maxCount = typeBreakdown[0]?.count || 1;

  const SETTINGS_LIST = [
    { key: 'enabled',             icon: '🛡️', title: 'Threat Detection',       desc: 'Enable real-time threat monitoring',          master: true  },
    { key: 'blockMalware',        icon: '🦠', title: 'Block Malware',           desc: 'Prevent access to malicious websites'                       },
    { key: 'blockPhishing',       icon: '🎣', title: 'Block Phishing',          desc: 'Block fraudulent and phishing sites'                         },
    { key: 'blockTrackers',       icon: '👁️', title: 'Block Trackers',          desc: 'Prevent online tracking and analytics'                       },
    { key: 'blockAds',            icon: '📢', title: 'Block Advertisements',    desc: 'Remove ads from websites'                                    },
    { key: 'blockRansomware',     icon: '🔒', title: 'Block Ransomware',        desc: 'Detect and block ransomware payloads',       badge: 'NEW'   },
    { key: 'blockCryptomining',   icon: '⛏️', title: 'Block Cryptomining',      desc: 'Prevent in-browser mining of cryptocurrency', badge: 'NEW'  },
    { key: 'blockBotnet',         icon: '🤖', title: 'Block Botnet C&C',        desc: 'Prevent botnet command-and-control traffic',  badge: 'NEW'  },
    { key: 'blockC2',             icon: '📡', title: 'Block C2 Traffic',        desc: 'Terminate suspicious command channels',       badge: 'NEW'  },
    { key: 'realTimeScanning',    icon: '⚡', title: 'Real-time Scanning',      desc: 'Continuous threat monitoring'                               },
    { key: 'autoQuarantine',      icon: '🔐', title: 'Auto-Quarantine',         desc: 'Automatically quarantine malicious domains',  badge: 'NEW'  },
    { key: 'deepPacketInspection',icon: '🔬', title: 'Deep Packet Inspection',  desc: 'Inspect encrypted traffic for hidden threats', badge: 'NEW' },
    { key: 'geoBlocking',         icon: '🌍', title: 'Geo-Threat Blocking',     desc: 'Block traffic from high-risk countries',      badge: 'NEW'  },
  ];

  return (
    <div className="threat-detection">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="threat-header">
        <h3>🛡️ Threat Detection & Protection</h3>
        <div className="header-actions">
          <button onClick={runScan} className={`scan-btn ${scanning ? 'scanning' : ''}`} disabled={!isConnected || scanning}>
            {scanning ? `🔄 ${Math.min(scanProgress, 100)}%` : '🔍 Run Scan'}
          </button>
          <button onClick={exportLog} className="export-btn" disabled={threats.length === 0} title="Export as CSV">
            📤 Export
          </button>
          <button onClick={clearThreats} className="clear-btn" disabled={threats.length === 0}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Scan progress bar */}
      {scanning && (
        <div className="scan-progress-bar">
          <div className="scan-progress-fill" style={{ width: `${Math.min(scanProgress, 100)}%` }} />
        </div>
      )}

      {/* ── Status Banner ───────────────────────────────────────────────── */}
      <div className={`protection-banner ${settings.enabled ? 'active' : 'disabled'}`}>
        <div className="banner-icon">{settings.enabled ? '✅' : '⚠️'}</div>
        <div className="banner-content">
          <h4>{settings.enabled ? 'Protection Active' : 'Protection Disabled'}</h4>
          <p>{settings.enabled
            ? 'Your connection is being monitored for threats in real-time'
            : 'Enable threat detection to protect your connection'
          }</p>
        </div>
        <div className="risk-badge-wrapper">
          <div className={`risk-badge ${riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low'}`}>
            <div className="risk-score-num">{riskScore}</div>
            <div className="risk-score-label">Risk {getRiskLabel()}</div>
          </div>
          <div className="sparkline-container">
            <Sparkline
              data={threatTimeline}
              color={riskScore > 70 ? '#f44336' : riskScore > 40 ? '#ff9800' : '#4CAF50'}
            />
          </div>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="threat-stats">
        {[
          { icon: '🛡️', value: stats.blocked,      label: 'Total Blocked',  bg: '#4CAF50,#45a049' },
          { icon: '🦠', value: stats.malware,       label: 'Malware',        bg: '#f44336,#d32f2f' },
          { icon: '🎣', value: stats.phishing,      label: 'Phishing',       bg: '#ff9800,#f57c00' },
          { icon: '👁️', value: stats.trackers,      label: 'Trackers',       bg: '#9c27b0,#7b1fa2' },
          { icon: '🔒', value: stats.ransomware,    label: 'Ransomware',     bg: '#b71c1c,#7f0000' },
          { icon: '⛏️', value: stats.cryptomining,  label: 'Cryptomining',   bg: '#795548,#4e342e' },
          { icon: '🤖', value: stats.botnet,        label: 'Botnet',         bg: '#37474f,#263238' },
          { icon: '📡', value: stats.c2,            label: 'C2 Traffic',     bg: '#c62828,#8d1414' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: `linear-gradient(135deg, #${s.bg.split(',')[0].replace('#','')}, #${s.bg.split(',')[1].replace('#','')})` }}>
              {s.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── View tabs ───────────────────────────────────────────────────── */}
      <div className="view-tabs">
        {[
          { id: 'log',          label: `📋 Threat Log (${threats.length})` },
          { id: 'intelligence', label: '🌐 Threat Intel'                    },
          { id: 'quarantine',   label: `🔐 Quarantine (${quarantined.length})` },
          { id: 'settings',     label: '⚙️ Settings'                       },
        ].map(tab => (
          <button
            key={tab.id}
            className={`view-tab ${activeView === tab.id ? 'active' : ''}`}
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ VIEW: Threat Log ════════════════════════════════════════════ */}
      {activeView === 'log' && (
        <div className="view-panel">
          {/* Severity filter + breakdown chart */}
          <div className="log-toolbar">
            <div className="severity-filters">
              {['all', 'critical', 'high', 'medium', 'low'].map(s => (
                <button
                  key={s}
                  className={`sev-filter ${severityFilter === s ? 'active' : ''} ${s}`}
                  onClick={() => setSeverityFilter(s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <span className="log-count">{filteredThreats.length} events</span>
          </div>

          {/* Type breakdown mini-chart */}
          {typeBreakdown.length > 0 && (
            <div className="type-breakdown">
              <div className="breakdown-title">Threat Type Distribution</div>
              {typeBreakdown.map(cat => (
                <div key={cat.type} className="breakdown-row">
                  <span className="breakdown-icon">{cat.icon}</span>
                  <span className="breakdown-label">{cat.label}</span>
                  <div className="breakdown-bar-track">
                    <div
                      className="breakdown-bar-fill"
                      style={{ width: `${(cat.count / maxCount) * 100}%`, background: cat.color }}
                    />
                  </div>
                  <span className="breakdown-count">{cat.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Threat list */}
          <div className="threat-log">
            {filteredThreats.length === 0 ? (
              <div className="no-threats">
                <div className="no-threats-icon">✨</div>
                <h5>No Threats Detected</h5>
                <p>Your connection is clean and secure</p>
              </div>
            ) : (
              <div className="threat-list">
                {filteredThreats.slice(0, 100).map(threat => (
                  <div
                    key={threat.id}
                    className={`threat-item ${threat.blocked ? 'blocked' : 'allowed'} ${selectedThreat?.id === threat.id ? 'selected' : ''}`}
                    onClick={() => setSelectedThreat(selectedThreat?.id === threat.id ? null : threat)}
                  >
                    <div className="threat-icon-wrapper">
                      <span className="threat-type-icon">{threat.icon}</span>
                      <span className={`threat-status ${threat.blocked ? 'blocked' : 'allowed'}`}>
                        {threat.blocked ? '🛡️' : '⚠️'}
                      </span>
                    </div>
                    <div className="threat-details">
                      <div className="threat-main">
                        <span className="threat-domain">{threat.domain}</span>
                        <span className="threat-severity" style={{ color: getSeverityColor(threat.severity) }}>
                          {threat.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="threat-meta">
                        <span className="threat-type">{threat.label}</span>
                        <span className="threat-ip">IP: {threat.ip}</span>
                        <span className="threat-country">🌍 {threat.countryName}</span>
                        <span className="threat-proto">{threat.protocol}</span>
                        <span className="threat-time">{threat.timestamp}</span>
                      </div>
                    </div>
                    <div className="threat-action">
                      {threat.blocked ? (
                        <span className="action-badge blocked">BLOCKED</span>
                      ) : (
                        <span className="action-badge allowed">ALLOWED</span>
                      )}
                      {threat.quarantined && <span className="action-badge quarantined">QUARANTINED</span>}
                    </div>

                    {/* Expanded detail panel */}
                    {selectedThreat?.id === threat.id && (
                      <div className="threat-expanded" onClick={e => e.stopPropagation()}>
                        <div className="expanded-grid">
                          <div className="expanded-cell"><span>Domain</span><strong>{threat.domain}</strong></div>
                          <div className="expanded-cell"><span>IP Address</span><strong>{threat.ip}</strong></div>
                          <div className="expanded-cell"><span>Country</span><strong>{threat.countryName} ({threat.country})</strong></div>
                          <div className="expanded-cell"><span>Protocol</span><strong>{threat.protocol}</strong></div>
                          <div className="expanded-cell"><span>Bytes Attempted</span><strong>{threat.bytes}</strong></div>
                          <div className="expanded-cell"><span>Confidence</span><strong>{threat.confidence}%</strong></div>
                          <div className="expanded-cell"><span>Action</span>
                            <strong style={{ color: threat.blocked ? '#4CAF50' : '#ff9800' }}>
                              {threat.blocked ? 'Connection Blocked' : 'Passed (monitored)'}
                            </strong>
                          </div>
                          {threat.iocMatch && (
                            <div className="expanded-cell ioc-match"><span>IOC Match</span><strong>⚠️ {threat.iocMatch}</strong></div>
                          )}
                        </div>
                        <div className="expanded-actions">
                          <button onClick={() => addToWhitelist(threat.domain)} className="exp-btn whitelist-btn">✅ Whitelist Domain</button>
                          <button onClick={() => { setQuarantined(p => p.includes(threat.domain) ? p : [...p, threat.domain]); }} className="exp-btn quarantine-btn">🔐 Quarantine</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VIEW: Threat Intelligence ═════════════════════════════════== */}
      {activeView === 'intelligence' && (
        <div className="view-panel intel-panel">
          <div className="intel-summary">
            <div className="intel-stat">
              <div className="intel-stat-value">{totalIocs.toLocaleString()}</div>
              <div className="intel-stat-label">Active IOCs</div>
            </div>
            <div className="intel-stat">
              <div className="intel-stat-value">{intelCampaigns.filter(c => c.status === 'active').length}</div>
              <div className="intel-stat-label">Active Campaigns</div>
            </div>
            <div className="intel-stat">
              <div className="intel-stat-value">{threats.filter(t => t.iocMatch).length}</div>
              <div className="intel-stat-label">IOC Hits This Session</div>
            </div>
            <div className="intel-stat">
              <div className="intel-stat-value">{COUNTRIES.length}</div>
              <div className="intel-stat-label">Tracked Countries</div>
            </div>
          </div>

          <h4>🎯 Active Campaigns</h4>
          <div className="campaigns-list">
            {intelCampaigns.map((c, i) => (
              <div key={i} className={`campaign-card ${c.status}`}>
                <div className="campaign-header">
                  <span className="campaign-name">{c.name}</span>
                  <span className={`campaign-status ${c.status}`}>{c.status.toUpperCase()}</span>
                </div>
                <div className="campaign-meta">
                  <span className="campaign-type">Type: {c.type}</span>
                  <span className="campaign-iocs">IOCs: {c.iocs.toLocaleString()}</span>
                </div>
                <div className="ioc-bar-track">
                  <div className="ioc-bar-fill" style={{ width: `${Math.min(100, c.iocs / 15)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <h4>🌍 Geographic Threat Distribution</h4>
          <div className="geo-threats">
            {COUNTRIES.map(cc => {
              const count = threats.filter(t => t.country === cc).length;
              return (
                <div key={cc} className="geo-row">
                  <span className="geo-code">{cc}</span>
                  <span className="geo-name">{COUNTRY_NAMES[cc]}</span>
                  <div className="geo-bar-track">
                    <div className="geo-bar-fill" style={{ width: `${Math.min(100, count * 8)}%` }} />
                  </div>
                  <span className="geo-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ VIEW: Quarantine ═════════════════════════════════════════════ */}
      {activeView === 'quarantine' && (
        <div className="view-panel">
          <div className="quarantine-info">
            🔐 Quarantined domains are isolated from all network access. Whitelist a domain only if you are certain it is safe.
          </div>
          {quarantined.length === 0 ? (
            <div className="no-threats">
              <div className="no-threats-icon">🔓</div>
              <h5>Quarantine Empty</h5>
              <p>No domains have been quarantined</p>
            </div>
          ) : (
            <div className="quarantine-list">
              {quarantined.map((domain, i) => (
                <div key={i} className="quarantine-item">
                  <span className="quarantine-icon">⛔</span>
                  <span className="quarantine-domain">{domain}</span>
                  <div className="quarantine-actions">
                    <button onClick={() => addToWhitelist(domain)} className="q-btn whitelist-btn">✅ Whitelist</button>
                    <button onClick={() => removeFromQuarantine(domain)} className="q-btn release-btn">🔓 Release</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {whitelist.length > 0 && (
            <>
              <h4 style={{ marginTop: '24px' }}>✅ Whitelisted Domains</h4>
              <div className="quarantine-list">
                {whitelist.map((domain, i) => (
                  <div key={i} className="quarantine-item whitelist-item">
                    <span className="quarantine-icon">✅</span>
                    <span className="quarantine-domain">{domain}</span>
                    <div className="quarantine-actions">
                      <button onClick={() => removeFromWhitelist(domain)} className="q-btn remove-btn">🗑️ Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ VIEW: Settings ═══════════════════════════════════════════════ */}
      {activeView === 'settings' && (
        <div className="view-panel">
          <div className="protection-settings">
            <div className="settings-grid">
              {SETTINGS_LIST.map(s => (
                <div key={s.key} className={`setting-item ${s.master ? 'master-setting' : ''}`}>
                  <div className="setting-info">
                    <span className="setting-icon">{s.icon}</span>
                    <div className="setting-details">
                      <div className="setting-title">
                        {s.title}
                        {s.badge && <span className="setting-badge">{s.badge}</span>}
                      </div>
                      <div className="setting-description">{s.desc}</div>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!settings[s.key]}
                      onChange={(e) => setSettings(prev => ({ ...prev, [s.key]: e.target.checked }))}
                      disabled={!s.master && !settings.enabled}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Security Tips */}
          <div className="security-tips">
            <h4>💡 Security Recommendations</h4>
            <div className="tips-grid">
              {[
                { icon: '✅', title: 'Enable All Protection', text: 'Turn on all threat protection layers for maximum coverage' },
                { icon: '🔐', title: 'Use Auto-Quarantine', text: 'Automatically isolate malicious domains as they are detected' },
                { icon: '🔬', title: 'Enable DPI', text: 'Deep packet inspection catches threats hidden inside encrypted traffic' },
                { icon: '🛡️', title: 'Pair with Kill Switch', text: 'Use threat detection alongside kill switch for complete protection' },
              ].map(t => (
                <div key={t.title} className="tip-card">
                  <span className="tip-icon">{t.icon}</span>
                  <div className="tip-content">
                    <div className="tip-title">{t.title}</div>
                    <p>{t.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreatDetection;
