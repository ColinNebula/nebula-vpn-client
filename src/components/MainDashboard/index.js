import React, { useState, useEffect, useRef } from 'react';
import './MainDashboard.css';

// ─── helpers ────────────────────────────────────────────────────────────────
// Collision-safe ID: timestamp + random suffix so two calls in the same
// millisecond (e.g. React StrictMode double-invoke) never produce the same key.
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const fmtTime = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

const fmtBytes = (kb) => {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  if (kb >= 1024)        return `${(kb / 1024).toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
};

const fmtSpeed = (kbps) => {
  if (kbps >= 1024) return `${(kbps / 1024).toFixed(1)} MB/s`;
  return `${Math.round(kbps)} KB/s`;
};

const getLoadColor = (load) =>
  load < 40 ? '#4ade80' : load < 70 ? '#facc15' : '#f87171';

// ─── Mini sparkline chart ────────────────────────────────────────────────────
const Sparkline = ({ data, color = '#4ade80', height = 42 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    })
    .join(' ');
  const fill = `${pts} ${w},${height} 0,${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="sparkline">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Security arc meter ──────────────────────────────────────────────────────
const ScoreArc = ({ score }) => {
  const r = 48, cx = 60, cy = 60;
  const circ = Math.PI * r; // only semicircle
  const strokeDash = (score / 100) * circ;
  const color = score >= 80 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171';
  return (
    <svg viewBox="0 0 120 70" className="score-arc-svg">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="10" strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1), stroke 0.5s' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" className="score-text">{Math.round(score)}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="score-label">/ 100</text>
    </svg>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
const MainDashboard = ({
  isConnected,
  isConnecting,
  selectedServer,
  connectionTime,
  trafficData,
  multiHopServers = [],
  servers = [],
  onConnect,
  onDisconnect,
  onServerChange,
  isVPNPaused,
  onPause,
  onResume,
  rotatingIPEnabled,
  onToggleRotatingIP,
  user,
  killSwitchActive,
  settings = {},
  isElectron = false,
  protectionState,
}) => {
  // ── local state ──
  const [downHistory,   setDownHistory]   = useState(Array(30).fill(0));
  const [upHistory,     setUpHistory]     = useState(Array(30).fill(0));
  const [threatsBlocked, setThreatsBlocked] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('nebula_tp_stats') || 'null');
      if (stored && typeof stored === 'object') return stored;
    } catch { /* ignore */ }
    return { malware: 0, ads: 0, trackers: 0, phishing: 0 };
  });
  const [securityScore, setSecurityScore] = useState(0);
  const [pingMs,        setPingMs]        = useState(null);
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [activityFeed,  setActivityFeed]  = useState([
    { id: 1, icon: '🛡️', msg: 'DNS Protection active', time: 'just now', type: 'good' },
    { id: 2, icon: '🔬', msg: 'IP Leak test passed',   time: '2m ago',   type: 'good' },
  ]);
  const actRef = useRef(activityFeed);
  actRef.current  = activityFeed;

  const isVerifiedConnection = protectionState?.state === 'verified';
  const isSimulatedConnection = protectionState?.state === 'simulated';
  const activeConnection = isConnected && !isVPNPaused;
  const displayServer    = multiHopServers.length > 0
    ? { name: multiHopServers.map(s => s.name).join(' → '), flag: '🔐', location: 'Multi-Hop', ping: '--', load: 20 }
    : selectedServer;

  // ── security score calc ──
  useEffect(() => {
    const base = isVerifiedConnection ? 55 : isSimulatedConnection ? 24 : 18;
    const extras = [
      settings.killSwitch,
      settings.dnsLeakProtection,
      settings.ipv6Protection,
      isConnected,
      rotatingIPEnabled,
    ].filter(Boolean).length;
    setSecurityScore(Math.min(100, base + extras * 9));
  }, [isSimulatedConnection, isVerifiedConnection, settings, rotatingIPEnabled]);

  // ── speed history ──
  useEffect(() => {
    if (!isConnected) {
      setDownHistory(Array(30).fill(0));
      setUpHistory(Array(30).fill(0));
      return;
    }
    setDownHistory(p => [...p.slice(1), trafficData.download || 0]);
    setUpHistory(p   => [...p.slice(1), trafficData.upload   || 0]);
  }, [trafficData, isConnected]);

  // ── real ping (use server's measured RTT value; no random jitter) ──
  useEffect(() => {
    if (!isConnected || !displayServer) { setPingMs(null); return; }
    setPingMs(parseInt(displayServer.ping) || null);
  }, [isConnected, displayServer]);

  // ── sync threat counts from localStorage written by ThreatProtection component ──
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'nebula_tp_stats') return;
      try {
        const val = JSON.parse(e.newValue || 'null');
        if (val && typeof val === 'object') setThreatsBlocked(val);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── activity feed ──
  const pushActivity = (icon, msg, type = 'neutral') => {
    setActivityFeed(prev => [{ id: uid(), icon, msg, time: 'just now', type }, ...prev.slice(0, 8)]);
  };
  useEffect(() => {
    if (isConnected && displayServer) {
      pushActivity(
        isVerifiedConnection ? '✅' : '🧪',
        isVerifiedConnection
          ? `WireGuard handshake verified on ${displayServer.name}`
          : `Browser simulation active for ${displayServer.name}`,
        isVerifiedConnection ? 'good' : 'warn'
      );
    } else if (!isConnected && actRef.current.length) {
      pushActivity('🔴', 'VPN disconnected', 'warn');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isVerifiedConnection, displayServer]);

  // ── connect handler ──
  const handleConnect = () => {
    if (isConnected) { onDisconnect(); return; }
    if (displayServer) { onConnect(displayServer); return; }
    // pick best server by combined load + ping score (lower load & lower ping = better)
    const score = s => (100 - s.load) + (500 - parseInt(s.ping, 10));
    const best = servers.reduce((b, s) => !b || score(s) > score(b) ? s : b, null);
    if (best) onConnect(best);
  };

  const recentServers = servers.slice(0, 5);

  // ── pause durations ──
  const PAUSE_OPTS = [
    { label: '5 min',  secs: 300  },
    { label: '15 min', secs: 900  },
    { label: '30 min', secs: 1800 },
    { label: '1 hour', secs: 3600 },
  ];

  const quickActionCards = [
    {
      id: 'killswitch',
      icon: '🛡️',
      label: 'Kill Switch',
      active: settings.killSwitch,
      locked: false,
      desc: settings.killSwitch ? 'Active' : 'Off',
    },
    {
      id: 'dns',
      icon: '🔐',
      label: 'DNS Guard',
      active: settings.dnsLeakProtection,
      locked: false,
      desc: settings.dnsLeakProtection ? 'Protected' : 'Off',
    },
    {
      id: 'ipv6',
      icon: '🌐',
      label: 'IPv6 Block',
      active: settings.ipv6Protection,
      locked: false,
      desc: settings.ipv6Protection ? 'Blocking' : 'Off',
    },
    {
      id: 'rotate',
      icon: '🔄',
      label: 'Rotating IP',
      active: rotatingIPEnabled,
      locked: !isConnected,
      desc: rotatingIPEnabled ? 'Rotating' : 'Static',
      onClick: () => onToggleRotatingIP && onToggleRotatingIP(!rotatingIPEnabled),
    },
  ];

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="md-root">

      {/* ── Hero ── */}
      <div className={`md-hero ${activeConnection ? 'connected' : ''} ${isConnecting ? 'connecting' : ''}`}>

        {/* Ambient glow rings */}
        <div className="md-glow-ring ring-1" />
        <div className="md-glow-ring ring-2" />
        <div className="md-glow-ring ring-3" />

        {/* Orb + button */}
        <button
          className={`md-orb ${activeConnection ? 'on' : ''} ${isConnecting ? 'spin' : ''}`}
          onClick={handleConnect}
          disabled={isConnecting}
          aria-label={isConnected ? 'Disconnect VPN' : 'Connect VPN'}
        >
          <div className="md-orb-inner">
            {isConnecting
              ? <span className="md-orb-icon pulse">⟳</span>
              : <span className="md-orb-icon">{activeConnection ? '🛡️' : '⚡'}</span>
            }
            <span className="md-orb-label">
              {isConnecting ? 'Connecting…' : isVerifiedConnection ? 'Tunnel Verified' : isSimulatedConnection ? 'Simulated' : activeConnection ? 'Connected' : 'Connect'}
            </span>
          </div>
        </button>

        {/* Status text */}
        <div className="md-hero-status">
          {isVPNPaused && isConnected
            ? <span className="status-chip paused">⏸  VPN Paused</span>
            : isVerifiedConnection
            ? <span className="status-chip on">🔒 Handshake Verified</span>
            : isSimulatedConnection
            ? <span className="status-chip paused">🧪 Browser Simulation</span>
            : activeConnection
            ? <span className="status-chip paused">🟡 Connected, Unverified</span>
            : <span className="status-chip off">⚠ Unprotected</span>
          }
          {settings.protocol && (
            <span className="proto-chip">{settings.protocol.toUpperCase()}</span>
          )}
        </div>

        {/* Server info */}
        <div className="md-hero-server" onClick={() => !isConnecting && setShowServerPicker(p => !p)}>
          {displayServer
            ? <>
                <span className="hero-flag">{displayServer.flag || '🌍'}</span>
                <div className="hero-server-text">
                  <span className="hero-server-name">{displayServer.name}</span>
                  <span className="hero-server-loc">{displayServer.location}</span>
                </div>
                <span className="hero-chevron">▾</span>
              </>
            : <span className="hero-no-server">Tap to select a server ▾</span>
          }
        </div>

        {/* Inline server picker */}
        {showServerPicker && (
          <div className="md-server-picker">
            {recentServers.map(s => (
              <button key={s.id} className="server-pick-row" onClick={() => { onServerChange(s); setShowServerPicker(false); }}>
                <span>{s.flag}</span>
                <span className="sp-name">{s.name}</span>
                <span className="sp-ping">{s.ping}</span>
                <span className="sp-load" style={{ color: getLoadColor(s.load) }}>{s.load}%</span>
              </button>
            ))}
            <button className="sp-more" onClick={() => setShowServerPicker(false)}>More servers →</button>
          </div>
        )}

        {/* Pause / Resume */}
        {isConnected && (
          <div className="md-pause-wrap">
            {isVPNPaused
              ? <button className="md-resume-btn" onClick={onResume}>▶ Resume VPN</button>
              : <>
                  <button className="md-pause-btn" onClick={() => setPauseMenuOpen(p => !p)}>
                    ⏸ Pause VPN ▾
                  </button>
                  {pauseMenuOpen && (
                    <div className="md-pause-menu">
                      {PAUSE_OPTS.map(o => (
                        <button key={o.secs} className="pause-opt" onClick={() => { onPause(o.secs); setPauseMenuOpen(false); }}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
            }
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="md-stats-row">
        <div className="md-stat-card">
          <div className="msc-top">
            <span className="msc-icon down">↓</span>
            <Sparkline data={downHistory} color="#4ade80" />
          </div>
          <div className="msc-value">{activeConnection ? fmtSpeed(trafficData.download) : '—'}</div>
          <div className="msc-label">Download</div>
        </div>

        <div className="md-stat-card">
          <div className="msc-top">
            <span className="msc-icon up">↑</span>
            <Sparkline data={upHistory} color="#60a5fa" />
          </div>
          <div className="msc-value">{activeConnection ? fmtSpeed(trafficData.upload) : '—'}</div>
          <div className="msc-label">Upload</div>
        </div>

        <div className="md-stat-card">
          <div className="msc-ping-display">
            <span className="msc-ping-val" style={{ color: pingMs && pingMs < 80 ? '#4ade80' : pingMs && pingMs < 150 ? '#facc15' : '#f87171' }}>
              {activeConnection && pingMs ? `${pingMs}` : '—'}
            </span>
            <span className="msc-ping-unit">{activeConnection && pingMs ? 'ms' : ''}</span>
          </div>
          <div className="msc-label">Latency</div>
        </div>

        <div className="md-stat-card">
          <div className="msc-timer">{activeConnection ? fmtTime(connectionTime) : '——:——:——'}</div>
          <div className="msc-label">Session Time</div>
        </div>

        <div className="md-stat-card">
          <div className="msc-value">{fmtBytes(trafficData.totalDownload || 0)}</div>
          <div className="msc-label">Data Down</div>
        </div>

        <div className="md-stat-card">
          <div className="msc-value">{fmtBytes(trafficData.totalUpload || 0)}</div>
          <div className="msc-label">Data Up</div>
        </div>
      </div>

      {/* ── Middle row: Security + Threats ── */}
      <div className="md-mid-row">

        {/* Security score */}
        <div className="md-card md-security-card">
          <h3 className="md-card-title">Security Score</h3>
          <ScoreArc score={securityScore} />
          <p className="md-security-note">
            {securityScore >= 80 ? '🟢 Excellent protection' : securityScore >= 50 ? '🟡 Moderate — improve below' : '🔴 Low — verified tunnel recommended'}
          </p>
          <div className="md-shield-grid">
            {[
              { label: 'Kill Switch',  on: settings.killSwitch },
              { label: 'DNS Guard',    on: settings.dnsLeakProtection },
              { label: 'IPv6 Block',   on: settings.ipv6Protection },
              { label: 'Rotating IP',  on: rotatingIPEnabled },
              { label: 'VPN Tunnel',   on: isVerifiedConnection },
              { label: 'Multi-Hop',    on: multiHopServers.length > 0 },
            ].map(f => (
              <div key={f.label} className={`shield-pill ${f.on ? 'on' : 'off'}`}>
                {f.on ? '✓' : '✗'} {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Threats blocked */}
        <div className="md-card md-threats-card">
          <h3 className="md-card-title">Threats Blocked</h3>
          <div className="md-threat-grid">
            {[
              { icon: '🦠', label: 'Malware',   count: threatsBlocked.malware,  color: '#f87171' },
              { icon: '🚫', label: 'Ads',        count: threatsBlocked.ads,      color: '#fb923c' },
              { icon: '👁', label: 'Trackers',   count: threatsBlocked.trackers, color: '#a78bfa' },
              { icon: '🎣', label: 'Phishing',   count: threatsBlocked.phishing, color: '#f472b6' },
            ].map(t => (
              <div key={t.label} className="threat-chip">
                <span className="tc-icon">{t.icon}</span>
                <span className="tc-count" style={{ color: t.color }}>{t.count}</span>
                <span className="tc-label">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="md-total-blocked">
            <span className="tbl-n">{threatsBlocked.malware + threatsBlocked.ads + threatsBlocked.trackers + threatsBlocked.phishing}</span>
            <span className="tbl-text"> total blocked this session</span>
          </div>
        </div>

        {/* IP info */}
        <div className="md-card md-ip-card">
          <h3 className="md-card-title">IP Visibility</h3>
          {isSimulatedConnection && (
            <div style={{ background: '#7c2d12', color: '#fca5a5', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', lineHeight: '1.4' }}>
              <strong>⚠ Browser mode:</strong> No real VPN tunnel is active. Your actual IP and location are still visible to websites. Download the desktop app for real protection.
            </div>
          )}
          {isVerifiedConnection && (
            <div style={{ background: '#052e2b', color: '#a7f3d0', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', lineHeight: '1.4' }}>
              <strong>Desktop proof:</strong> WireGuard handshake verified. This confirms tunnel establishment, but leak tests are still the stronger end-to-end proof.
            </div>
          )}
          <div className="md-ip-row">
            <span className="ip-row-label">Visible IP</span>
            <span className={`ip-row-val ${isVerifiedConnection ? 'masked' : 'exposed'}`}>
              {isVerifiedConnection
                ? '🛡 Hidden via verified tunnel'
                : '⚠ Your real IP'}
            </span>
          </div>
          <div className="md-ip-row">
            <span className="ip-row-label">Location</span>
            <span className="ip-row-val">
              {isVerifiedConnection && displayServer
                ? `${displayServer.flag || ''} ${displayServer.location}`
                : '📍 Real location exposed'}
            </span>
          </div>
          <div className="md-ip-row">
            <span className="ip-row-label">ISP</span>
            <span className="ip-row-val">
              {isVerifiedConnection ? '🛡 Nebula VPN Network' : '⚠ Visible to websites'}
            </span>
          </div>
          <div className={`ip-status-banner ${isVerifiedConnection ? 'safe' : 'danger'}`}>
            {isVerifiedConnection ? '🔒 Handshake-Verified Tunnel' : isSimulatedConnection ? '🧪 Simulation Only — Identity Exposed' : '🚨 Identity Exposed'}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="md-section-heading">Quick Actions</div>
      <div className="md-actions-row">
        {quickActionCards.map(card => (
          <div
            key={card.id}
            className={`md-action-card ${card.active ? 'active' : ''} ${card.locked ? 'locked' : ''}`}
            onClick={card.locked ? undefined : card.onClick}
            title={card.locked ? 'Connect VPN first' : ''}
          >
            <span className="mac-icon">{card.icon}</span>
            <span className="mac-label">{card.label}</span>
            <span className={`mac-badge ${card.active ? 'on' : 'off'}`}>{card.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Bottom row: Server list + Activity ── */}
      <div className="md-bottom-row">

        {/* Server browser */}
        <div className="md-card md-servers-card">
          <h3 className="md-card-title">Top Servers</h3>
          <div className="server-list-mini">
            {servers.slice(0, 6).map(s => (
              <div
                key={s.id}
                className={`slm-row ${selectedServer?.id === s.id ? 'selected' : ''}`}
                onClick={() => !isConnected && onServerChange(s)}
              >
                <span className="slm-flag">{s.flag}</span>
                <div className="slm-info">
                  <span className="slm-name">{s.name}</span>
                  <span className="slm-loc">{s.location}</span>
                </div>
                <div className="slm-meta">
                  <span className="slm-ping">{s.ping}</span>
                  <div className="slm-load-bar">
                    <div className="slm-load-fill" style={{ width: `${s.load}%`, background: getLoadColor(s.load) }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="md-card md-activity-card">
          <h3 className="md-card-title">Activity</h3>
          <div className="activity-feed">
            {activityFeed.map(a => (
              <div key={a.id} className={`af-row ${a.type}`}>
                <span className="af-icon">{a.icon}</span>
                <span className="af-msg">{a.msg}</span>
                <span className="af-time">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
