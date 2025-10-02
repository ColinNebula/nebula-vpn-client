import React, { useState } from 'react';
import './ObfuscationSettings.css';

const ObfuscationSettings = () => {
  const [obfuscationEnabled, setObfuscationEnabled] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState('stealth');
  const [port, setPort] = useState('443');
  const [scramblePackets, setScramblePackets] = useState(true);
  const [mimicProtocol, setMimicProtocol] = useState('https');

  const protocols = [
    {
      id: 'stealth',
      name: 'Stealth Mode',
      icon: '🥷',
      description: 'Makes VPN traffic look like regular HTTPS traffic',
      effectiveness: 'High',
      speed: 'Medium',
      compatible: 'All servers'
    },
    {
      id: 'obfsproxy',
      name: 'Obfsproxy',
      icon: '🔀',
      description: 'Tor-based obfuscation for maximum anonymity',
      effectiveness: 'Very High',
      speed: 'Slow',
      compatible: 'Advanced servers'
    },
    {
      id: 'shadowsocks',
      name: 'Shadowsocks',
      icon: '🌫️',
      description: 'Lightweight protocol popular in restrictive regions',
      effectiveness: 'High',
      speed: 'Fast',
      compatible: 'Most servers'
    },
    {
      id: 'stunnel',
      name: 'Stunnel',
      icon: '🔐',
      description: 'Wraps traffic in SSL/TLS encryption',
      effectiveness: 'Medium',
      speed: 'Fast',
      compatible: 'All servers'
    }
  ];

  const commonPorts = [
    { port: '443', name: 'HTTPS', recommended: true },
    { port: '80', name: 'HTTP', recommended: false },
    { port: '53', name: 'DNS', recommended: false },
    { port: '22', name: 'SSH', recommended: false },
    { port: '8080', name: 'HTTP Alt', recommended: false },
  ];

  const mimicOptions = [
    { value: 'https', name: 'HTTPS Traffic', icon: '🔒' },
    { value: 'http', name: 'HTTP Traffic', icon: '🌐' },
    { value: 'skype', name: 'Skype Video', icon: '📞' },
    { value: 'bittorrent', name: 'BitTorrent', icon: '📦' },
  ];

  return (
    <div className="obfuscation-settings">
      <div className="obfuscation-header">
        <h3>🥷 Obfuscation Settings</h3>
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
                  className={`protocol-card ${selectedProtocol === protocol.id ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="protocol"
                    value={protocol.id}
                    checked={selectedProtocol === protocol.id}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                  />
                  <div className="protocol-header">
                    <span className="protocol-icon">{protocol.icon}</span>
                    <span className="protocol-name">{protocol.name}</span>
                  </div>
                  <p className="protocol-description">{protocol.description}</p>
                  <div className="protocol-specs">
                    <div className="spec-item">
                      <span className="spec-label">Effectiveness:</span>
                      <span className={`spec-value ${protocol.effectiveness.toLowerCase().replace(' ', '-')}`}>
                        {protocol.effectiveness}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Speed:</span>
                      <span className="spec-value">{protocol.speed}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Compatible:</span>
                      <span className="spec-value">{protocol.compatible}</span>
                    </div>
                  </div>
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
            <h4>⚙️ Advanced Options</h4>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🎲</span>
                <div>
                  <h5>Scramble Packet Headers</h5>
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
                <span className="option-icon">🎭</span>
                <div>
                  <h5>Traffic Mimicking</h5>
                  <p>Make VPN traffic appear as another protocol</p>
                </div>
              </div>
              <select 
                className="mimic-select"
                value={mimicProtocol}
                onChange={(e) => setMimicProtocol(e.target.value)}
              >
                {mimicOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.name}
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
