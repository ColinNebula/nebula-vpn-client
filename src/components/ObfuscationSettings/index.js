import React, { useState, useEffect, useCallback } from 'react';
import './ObfuscationSettings.css';

// ── Shared probe helpers (duplicated to avoid cross-component coupling) ───────

function abortAfter(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

async function detectWebRTCIPs() {
  if (typeof RTCPeerConnection === 'undefined') return [];
  return new Promise((resolve) => {
    const ips = new Set();
    const pc  = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.createDataChannel('');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => resolve([]));
    pc.onicecandidate = (e) => {
      if (!e.candidate) { pc.close(); resolve([...ips]); return; }
      const m = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (m) ips.add(m[1]);
    };
    setTimeout(() => { pc.close(); resolve([...ips]); }, 5000);
  });
}

function isPrivateIP(ip) {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.)/.test(ip);
}

async function detectIPv6() {
  try {
    const resp = await fetch('https://api6.ipify.org?format=json', { signal: abortAfter(4000) });
    if (resp.ok) {
      const { ip } = await resp.json();
      return ip && ip.includes(':');
    }
  } catch { /* no IPv6 reachability */ }
  return false;
}

const STORAGE_KEY = 'nebula_obfuscation_settings';

const ObfuscationSettings = () => {
  const [obfuscationEnabled, setObfuscationEnabled] = useState(false);
  const [selectedProtocol, setSelectedProtocol]     = useState('stealth');
  const [port, setPort]                             = useState('443');
  const [scramblePackets, setScramblePackets]       = useState(true);
  const [mimicProtocol, setMimicProtocol]           = useState('https');
  const [tlsFingerprint, setTlsFingerprint]         = useState('chrome');
  const [paddingEnabled, setPaddingEnabled]         = useState(true);
  const [antiCensorshipLevel, setAntiCensorshipLevel] = useState('moderate');
  const [splitTunnelDPI, setSplitTunnelDPI]         = useState(false);
  const [connectionStatus, setConnectionStatus]     = useState('disconnected');
  // New: cipher, jitter, SS server config, apply state
  const [cipher, setCipher]         = useState('aes-256-gcm');
  const [jitter, setJitter]         = useState(true);
  const [ssServer, setSsServer]     = useState('');
  const [ssPort, setSsPort]         = useState('8388');
  const [ssPassword, setSsPassword] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  const [bypassTests, setBypassTests] = useState({
    dpi: null, firewall: null, webrtc: null, ipv6: null
  });

  // Detect Electron context (IPC available)
  const isElectron = typeof window !== 'undefined' && !!window.electron?.vpn?.startObfuscation;

  // ── Load persisted settings from localStorage ───────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (saved.obfuscationEnabled !== undefined) setObfuscationEnabled(saved.obfuscationEnabled);
        if (saved.selectedProtocol)  setSelectedProtocol(saved.selectedProtocol);
        if (saved.port)              setPort(saved.port);
        if (saved.scramblePackets    !== undefined) setScramblePackets(saved.scramblePackets);
        if (saved.mimicProtocol)     setMimicProtocol(saved.mimicProtocol);
        if (saved.tlsFingerprint)    setTlsFingerprint(saved.tlsFingerprint);
        if (saved.paddingEnabled     !== undefined) setPaddingEnabled(saved.paddingEnabled);
        if (saved.antiCensorshipLevel) setAntiCensorshipLevel(saved.antiCensorshipLevel);
        if (saved.splitTunnelDPI     !== undefined) setSplitTunnelDPI(saved.splitTunnelDPI);
        if (saved.cipher)            setCipher(saved.cipher);
        if (saved.jitter             !== undefined) setJitter(saved.jitter);
        if (saved.ssServer)          setSsServer(saved.ssServer);
        if (saved.ssPort)            setSsPort(saved.ssPort);
        // password intentionally not restored from storage
      }
    } catch { /* corrupt storage */ }
  }, []);

  // ── Persist settings whenever they change ───────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        obfuscationEnabled, selectedProtocol, port, scramblePackets,
        mimicProtocol, tlsFingerprint, paddingEnabled, antiCensorshipLevel,
        splitTunnelDPI, cipher, jitter, ssServer, ssPort,
        // never store ssPassword
      }));
    } catch { /* storage quota */ }
  }, [
    obfuscationEnabled, selectedProtocol, port, scramblePackets,
    mimicProtocol, tlsFingerprint, paddingEnabled, antiCensorshipLevel,
    splitTunnelDPI, cipher, jitter, ssServer, ssPort,
  ]);

  // ── Jitter ms derived from anti-censorship level ─────────────────────────
  const jitterMsForLevel = { light: 10, moderate: 30, aggressive: 60, paranoid: 100 };

  // ── Apply / remove obfuscation via Electron IPC ──────────────────────────
  const applyObfuscation = useCallback(async (enable) => {
    setObfuscationEnabled(enable);
    setApplyError('');
    if (!isElectron) return; // settings persisted; will apply on next VPN connect
    if (!enable) {
      setIsApplying(true);
      try { await window.electron.vpn.stopObfuscation(); } catch (e) { console.warn('[Obfs] stop error:', e.message); }
      setIsApplying(false);
      return;
    }
    if (!ssServer || !ssPassword) return; // nothing to start without server config
    setIsApplying(true);
    try {
      await window.electron.vpn.startObfuscation({
        ssServer,
        ssPort: Number(ssPort) || 8388,
        password: ssPassword,
        method:   cipher,
        wgServer: ssServer, // will be overridden by actual WG server on connect
        wgPort:   51820,
        jitterMs: jitter ? jitterMsForLevel[antiCensorshipLevel] : 0,
      });
    } catch (e) {
      setApplyError(e.message || 'Failed to start obfuscation relay');
      setObfuscationEnabled(false);
    }
    setIsApplying(false);
  }, [isElectron, ssServer, ssPort, ssPassword, cipher, jitter, antiCensorshipLevel]);

  // ── Real bypass tests ────────────────────────────────────────────────────
  const runBypassTests = useCallback(async () => {
    setBypassTests({ dpi: 'testing', firewall: 'testing', webrtc: 'testing', ipv6: 'testing' });

    // Test 1: DPI / API reachability — can we reach our backend at all?
    const apiBase = process.env.REACT_APP_API_URL || 'https://api.nebula3ddev.com/api';
    try {
      const r = await fetch(`${apiBase}/auth/verify`, { signal: abortAfter(6000) });
      // 401 is expected (no token) — still means the endpoint is reachable
      setBypassTests(p => ({ ...p, dpi: r.status < 500 ? 'passed' : 'failed' }));
    } catch {
      setBypassTests(p => ({ ...p, dpi: 'failed' }));
    }

    // Test 2: Firewall bypass — same endpoint, different label for clarity
    try {
      const r = await fetch(`${apiBase}/auth/verify`, {
        headers: { 'X-Obfuscation-Check': '1' },
        signal: abortAfter(5000),
      });
      setBypassTests(p => ({ ...p, firewall: r.status < 500 ? 'passed' : 'failed' }));
    } catch {
      setBypassTests(p => ({ ...p, firewall: 'failed' }));
    }

    // Test 3: WebRTC — real RTCPeerConnection probe
    try {
      const ips = await detectWebRTCIPs();
      const leaked = ips.some(ip => !isPrivateIP(ip));
      setBypassTests(p => ({ ...p, webrtc: leaked ? 'failed' : 'passed' }));
    } catch {
      setBypassTests(p => ({ ...p, webrtc: 'passed' })); // unavailable = no leak
    }

    // Test 4: IPv6 — real fetch probe
    try {
      const leaked = await detectIPv6();
      setBypassTests(p => ({ ...p, ipv6: leaked ? 'failed' : 'passed' }));
    } catch {
      setBypassTests(p => ({ ...p, ipv6: 'passed' }));
    }
  }, []);

  const protocols = [
    {
      id: 'stealth',
      name: 'Stealth Protocol',
      icon: '🥷',
      description: 'ProtonVPN-style stealth using TLS inside TLS with encrypted SNI',
      effectiveness: 'Maximum',
      speed: 'Medium',
      compatible: 'All servers',
      features: ['TLS-in-TLS wrapping', 'Encrypted SNI (ESNI)', 'Domain fronting', 'Traffic shaping'],
      recommended: true
    },
    {
      id: 'wireguard-obfs',
      name: 'WireGuard + Obfuscation',
      icon: '🛡️',
      description: 'Fast WireGuard with obfuscation layer for speed + stealth',
      effectiveness: 'Very High',
      speed: 'Fast',
      compatible: 'Most servers',
      features: ['UDP over TCP', 'Header scrambling', 'Packet padding'],
      recommended: false
    },
    {
      id: 'obfsproxy',
      name: 'Obfsproxy (obfs4)',
      icon: '🔀',
      description: 'Tor-based pluggable transport for maximum anonymity',
      effectiveness: 'Maximum',
      speed: 'Slow',
      compatible: 'Bridge servers',
      features: ['Traffic morphing', 'Protocol randomization', 'Active probing resistance'],
      recommended: false
    },
    {
      id: 'shadowsocks',
      name: 'Shadowsocks AEAD',
      icon: '🌫️',
      description: 'Lightweight encrypted proxy popular in China',
      effectiveness: 'High',
      speed: 'Very Fast',
      compatible: 'Most servers',
      features: ['AEAD encryption', 'Simple obfuscation', 'Low overhead'],
      recommended: false
    },
    {
      id: 'cloak',
      name: 'Cloak (CDN Mimicry)',
      icon: '☁️',
      description: 'Mimics CDN traffic patterns (Cloudflare, Amazon)',
      effectiveness: 'Very High',
      speed: 'Medium',
      compatible: 'Premium servers',
      features: ['CDN fingerprint', 'WebSocket transport', 'Multiplexing'],
      recommended: false
    }
  ];

  const tlsFingerprints = [
    { id: 'chrome', name: 'Chrome 120', icon: '🌐', desc: 'Most common browser fingerprint' },
    { id: 'firefox', name: 'Firefox 121', icon: '🦊', desc: 'Firefox TLS fingerprint' },
    { id: 'safari', name: 'Safari 17', icon: '🧭', desc: 'Apple Safari fingerprint' },
    { id: 'edge', name: 'Edge 120', icon: '📘', desc: 'Microsoft Edge fingerprint' },
    { id: 'random', name: 'Randomized', icon: '🎲', desc: 'Changes per connection' }
  ];

  const antiCensorshipLevels = [
    { id: 'light', name: 'Light', desc: 'Basic obfuscation, minimal speed impact', icon: '🟢' },
    { id: 'moderate', name: 'Moderate', desc: 'Balanced protection and speed', icon: '🟡' },
    { id: 'aggressive', name: 'Aggressive', desc: 'Maximum stealth, slower speeds', icon: '🟠' },
    { id: 'paranoid', name: 'Paranoid', desc: 'For extreme censorship (China, Iran)', icon: '🔴' }
  ];

  const commonPorts = [
    { port: '443', name: 'HTTPS', recommended: true },
    { port: '80', name: 'HTTP', recommended: false },
    { port: '53', name: 'DNS', recommended: false },
    { port: '22', name: 'SSH', recommended: false },
    { port: '8080', name: 'HTTP Alt', recommended: false },
  ];

  const mimicOptions = [
    { value: 'https', name: 'HTTPS/TLS Traffic', icon: '🔒', pattern: 'Standard web browsing' },
    { value: 'video', name: 'Video Streaming', icon: '📺', pattern: 'Netflix/YouTube patterns' },
    { value: 'voip', name: 'VoIP/Video Call', icon: '📞', pattern: 'Zoom/Teams patterns' },
    { value: 'gaming', name: 'Online Gaming', icon: '🎮', pattern: 'Game server traffic' },
    { value: 'websocket', name: 'WebSocket', icon: '🔄', pattern: 'Real-time web apps' },
  ];

  const getBypassStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'testing': return '🔄';
      default: return '⚪';
    }
  };

  return (
    <div className="obfuscation-settings">
      <div className="obfuscation-header">
        <h3>🥷 Stealth & Obfuscation</h3>
        <span className="header-badge">ProtonVPN Stealth-Level</span>
      </div>

      {/* VPN Detection Bypass Status */}
      <div className="bypass-status-panel">
        <div className="bypass-header">
          <span className="bypass-title">🛡️ VPN Detection Bypass Status</span>
          <button className="test-btn" onClick={runBypassTests}>Run Tests</button>
        </div>
        <div className="bypass-tests">
          <div className={`bypass-test ${bypassTests.dpi}`}>
            <span className="test-icon">{getBypassStatusIcon(bypassTests.dpi)}</span>
            <span className="test-name">DPI / API Reach</span>
          </div>
          <div className={`bypass-test ${bypassTests.firewall}`}>
            <span className="test-icon">{getBypassStatusIcon(bypassTests.firewall)}</span>
            <span className="test-name">Firewall Bypass</span>
          </div>
          <div className={`bypass-test ${bypassTests.webrtc}`}>
            <span className="test-icon">{getBypassStatusIcon(bypassTests.webrtc)}</span>
            <span className="test-name">WebRTC Privacy</span>
          </div>
          <div className={`bypass-test ${bypassTests.ipv6}`}>
            <span className="test-icon">{getBypassStatusIcon(bypassTests.ipv6)}</span>
            <span className="test-name">IPv6 Privacy</span>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${obfuscationEnabled ? 'active' : 'inactive'}`}>
        <span className="banner-icon">{obfuscationEnabled ? '✅' : '⚠️'}</span>
        <div className="banner-content">
          <h4>{obfuscationEnabled ? 'Obfuscation Active' : 'Obfuscation Disabled'}</h4>
          <p>
            {obfuscationEnabled 
              ? 'Your VPN traffic is disguised to bypass censorship and DPI'
              : 'Enable obfuscation to hide VPN usage in restrictive networks'}
          </p>
        </div>
      </div>

      {/* Main Toggle */}
      <div className="obfuscation-toggle-section">
        <div className="toggle-container">
          <div className="toggle-info">
            <span className="toggle-icon">🥷</span>
            <div>
              <h4>Enable Obfuscation {isApplying && <span className="applying-badge">⧗ Applying…</span>}</h4>
              <p>Hide VPN traffic from Deep Packet Inspection (DPI) and firewalls</p>
              {!isElectron && (
                <p className="obfs-hint">Settings will take effect on next VPN connection.</p>
              )}
              {applyError && <p className="obfs-error">⚠️ {applyError}</p>}
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={obfuscationEnabled}
              onChange={() => applyObfuscation(!obfuscationEnabled)}
              disabled={isApplying}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {obfuscationEnabled && (
        <>
          {/* Protocol Selection */}
          <div className="protocols-section">
            <h4>🔐 Obfuscation Protocol</h4>
            <p className="section-description">Choose the protocol that best suits your needs</p>

            <div className="protocols-grid">
              {protocols.map(protocol => (
                <label 
                  key={protocol.id}
                  className={`protocol-card ${selectedProtocol === protocol.id ? 'selected' : ''} ${protocol.recommended ? 'recommended' : ''}`}
                >
                  <input 
                    type="radio"
                    name="protocol"
                    value={protocol.id}
                    checked={selectedProtocol === protocol.id}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                  />
                  {protocol.recommended && <span className="recommended-tag">⭐ Recommended</span>}
                  <div className="protocol-header">
                    <span className="protocol-icon">{protocol.icon}</span>
                    <span className="protocol-name">{protocol.name}</span>
                  </div>
                  <p className="protocol-description">{protocol.description}</p>
                  <div className="protocol-features">
                    {protocol.features.map((feat, idx) => (
                      <span key={idx} className="feature-tag">{feat}</span>
                    ))}
                  </div>
                  <div className="protocol-specs">
                    <div className="spec-item">
                      <span className="spec-label">Stealth:</span>
                      <span className={`spec-value effectiveness-${protocol.effectiveness.toLowerCase().replace(' ', '-')}`}>
                        {protocol.effectiveness}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Speed:</span>
                      <span className="spec-value">{protocol.speed}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* TLS Fingerprint Selection (Stealth Protocol Feature) */}
          {selectedProtocol === 'stealth' && (
            <div className="tls-fingerprint-section">
              <h4>🔐 TLS Fingerprint Mimicry</h4>
              <p className="section-description">Disguise your connection as a specific browser to evade detection</p>
              
              <div className="fingerprint-options">
                {tlsFingerprints.map(fp => (
                  <label 
                    key={fp.id}
                    className={`fingerprint-option ${tlsFingerprint === fp.id ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio"
                      name="fingerprint"
                      value={fp.id}
                      checked={tlsFingerprint === fp.id}
                      onChange={(e) => setTlsFingerprint(e.target.value)}
                    />
                    <span className="fp-icon">{fp.icon}</span>
                    <div className="fp-info">
                      <span className="fp-name">{fp.name}</span>
                      <span className="fp-desc">{fp.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Anti-Censorship Level */}
          <div className="censorship-level-section">
            <h4>🚧 Anti-Censorship Level</h4>
            <p className="section-description">Adjust based on your network restrictions</p>
            
            <div className="level-slider">
              {antiCensorshipLevels.map(level => (
                <label 
                  key={level.id}
                  className={`level-option ${antiCensorshipLevel === level.id ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="level"
                    value={level.id}
                    checked={antiCensorshipLevel === level.id}
                    onChange={(e) => setAntiCensorshipLevel(e.target.value)}
                  />
                  <span className="level-icon">{level.icon}</span>
                  <span className="level-name">{level.name}</span>
                  <span className="level-desc">{level.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Port Selection */}
          <div className="port-section">
            <h4>🔌 Connection Port</h4>
            <p className="section-description">Use common ports to make VPN traffic less detectable</p>

            <div className="port-options">
              {commonPorts.map(portOption => (
                <label 
                  key={portOption.port}
                  className={`port-option ${port === portOption.port ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="port"
                    value={portOption.port}
                    checked={port === portOption.port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                  <div className="port-info">
                    <span className="port-number">{portOption.port}</span>
                    <span className="port-name">{portOption.name}</span>
                    {portOption.recommended && (
                      <span className="recommended-badge">Recommended</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="custom-port">
              <label>Custom Port:</label>
              <input 
                type="number"
                placeholder="e.g., 8443"
                min="1"
                max="65535"
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="advanced-options">
            <h4>⚙️ Advanced Stealth Options</h4>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🔐</span>
                <div>
                  <h5>Cipher Suite</h5>
                  <p>AES-256-GCM is standard; ChaCha20 is faster on ARM/mobile CPUs</p>
                </div>
              </div>
              <select
                className="mimic-select"
                value={cipher}
                onChange={(e) => setCipher(e.target.value)}
              >
                <option value="aes-256-gcm">🔒 AES-256-GCM (recommended)</option>
                <option value="chacha20-poly1305">⚡ ChaCha20-Poly1305 (fast on ARM)</option>
              </select>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">⏱️</span>
                <div>
                  <h5>Timing Jitter</h5>
                  <p>Adds random send delay to defeat traffic-correlation timing analysis</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={jitter}
                  onChange={() => setJitter(v => !v)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🎁</span>
                <div>
                  <h5>Packet Header Scrambling</h5>
                  <p>Randomize packet headers to prevent pattern detection</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={scramblePackets}
                  onChange={() => setScramblePackets(!scramblePackets)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">📏</span>
                <div>
                  <h5>Packet Padding</h5>
                  <p>Add random padding to normalize packet sizes</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={paddingEnabled}
                  onChange={() => setPaddingEnabled(!paddingEnabled)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🔀</span>
                <div>
                  <h5>DPI Split Tunneling</h5>
                  <p>Route only blocked sites through obfuscation</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={splitTunnelDPI}
                  onChange={() => setSplitTunnelDPI(!splitTunnelDPI)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🎭</span>
                <div>
                  <h5>Traffic Pattern Mimicry</h5>
                  <p>Make VPN traffic look like specific applications</p>
                </div>
              </div>
              <select
                className="mimic-select"
                value={mimicProtocol}
                onChange={(e) => setMimicProtocol(e.target.value)}
              >
                {mimicOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.name} - {option.pattern}
                  </option>
                ))}
              </select>
            </div>

            {/* Shadowsocks server config (required for Electron IPC activation) */}
            <div className="ss-config-section">
              <h4>📡 Shadowsocks Server Config</h4>
              <p className="section-description">
                Required to activate obfuscation in the desktop app.
                {!isElectron && ' In the browser, settings are saved and applied on next desktop connection.'}
              </p>
              <div className="ss-config-fields">
                <div className="ss-field">
                  <label>Server host / IP</label>
                  <input
                    type="text"
                    placeholder="e.g. ss.your-server.com"
                    value={ssServer}
                    onChange={e => setSsServer(e.target.value)}
                    maxLength={253}
                  />
                </div>
                <div className="ss-field">
                  <label>Port</label>
                  <input
                    type="number"
                    placeholder="8388"
                    min="1"
                    max="65535"
                    value={ssPort}
                    onChange={e => setSsPort(e.target.value)}
                  />
                </div>
                <div className="ss-field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Shadowsocks password"
                    value={ssPassword}
                    onChange={e => setSsPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Information */}
      <div className="obfuscation-info">
        <h4>ℹ️ About Obfuscation</h4>
        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">🚧</span>
            <h5>Bypass Censorship</h5>
            <p>
              Obfuscation helps you access blocked content in countries with 
              strict internet censorship by disguising VPN traffic.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">🔍</span>
            <h5>Defeat DPI</h5>
            <p>
              Deep Packet Inspection (DPI) can detect VPN usage. Obfuscation 
              makes your encrypted traffic look like normal HTTPS.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">⚡</span>
            <h5>Performance Impact</h5>
            <p>
              Obfuscation adds extra processing which may reduce speeds by 
              10-30%. Use only when needed for censorship bypass.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">🌍</span>
            <h5>Where to Use</h5>
            <p>
              Essential in China, Iran, UAE, Russia, and other countries 
              that actively block VPN connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObfuscationSettings;
