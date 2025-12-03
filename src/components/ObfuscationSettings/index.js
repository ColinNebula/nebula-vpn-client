import React, { useState, useEffect } from 'react';
import './ObfuscationSettings.css';

const ObfuscationSettings = () => {
  const [obfuscationEnabled, setObfuscationEnabled] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState('stealth');
  const [port, setPort] = useState('443');
  const [scramblePackets, setScramblePackets] = useState(true);
  const [mimicProtocol, setMimicProtocol] = useState('https');
  const [tlsFingerprint, setTlsFingerprint] = useState('chrome');
  const [paddingEnabled, setPaddingEnabled] = useState(true);
  const [antiCensorshipLevel, setAntiCensorshipLevel] = useState('moderate');
  const [splitTunnelDPI, setSplitTunnelDPI] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [bypassTests, setBypassTests] = useState({
    dpi: null,
    firewall: null,
    netflix: null,
    banking: null
  });

  // Simulate bypass detection test
  const runBypassTests = () => {
    setBypassTests({ dpi: 'testing', firewall: 'testing', netflix: 'testing', banking: 'testing' });
    
    setTimeout(() => setBypassTests(prev => ({ ...prev, dpi: 'passed' })), 800);
    setTimeout(() => setBypassTests(prev => ({ ...prev, firewall: 'passed' })), 1400);
    setTimeout(() => setBypassTests(prev => ({ ...prev, netflix: obfuscationEnabled ? 'passed' : 'failed' })), 2000);
    setTimeout(() => setBypassTests(prev => ({ ...prev, banking: 'passed' })), 2600);
  };

  useEffect(() => {
    if (obfuscationEnabled) {
      runBypassTests();
    }
  }, [obfuscationEnabled, selectedProtocol]);

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
            <span className="test-name">DPI Detection</span>
          </div>
          <div className={`bypass-test ${bypassTests.firewall}`}>
            <span className="test-icon">{getBypassStatusIcon(bypassTests.firewall)}</span>
            <span className="test-name">Firewall Bypass</span>
          </div>
          <div className={`bypass-test ${bypassTests.netflix}`}>
            <span className="test-icon">{getBypassStatusIcon(bypassTests.netflix)}</span>
            <span className="test-name">Streaming Access</span>
          </div>
          <div className={`bypass-test ${bypassTests.banking}`}>
            <span className="test-icon">{getBypassStatusIcon(bypassTests.banking)}</span>
            <span className="test-name">Banking Sites</span>
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
              <h4>Enable Obfuscation</h4>
              <p>Hide VPN traffic from Deep Packet Inspection (DPI) and firewalls</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={obfuscationEnabled}
              onChange={() => setObfuscationEnabled(!obfuscationEnabled)}
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
                <span className="option-icon">🎲</span>
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
