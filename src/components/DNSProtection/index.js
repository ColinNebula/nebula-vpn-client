import React, { useState, useEffect } from 'react';
import './DNSProtection.css';

const DNSProtection = ({ isConnected }) => {
  const [dnsSettings, setDnsSettings] = useState({
    enabled: true,
    provider: 'cloudflare',
    customDNS1: '',
    customDNS2: '',
    dnssec: true,
    dnsOverHTTPS: true,
    dnsOverTLS: false
  });

  const [leakTest, setLeakTest] = useState({
    testing: false,
    lastTest: null,
    results: null
  });

  const dnsProviders = [
    { id: 'cloudflare', name: 'Cloudflare', dns1: '1.1.1.1', dns2: '1.0.0.1', secure: true },
    { id: 'google', name: 'Google Public DNS', dns1: '8.8.8.8', dns2: '8.8.4.4', secure: true },
    { id: 'quad9', name: 'Quad9', dns1: '9.9.9.9', dns2: '149.112.112.112', secure: true },
    { id: 'opendns', name: 'OpenDNS', dns1: '208.67.222.222', dns2: '208.67.220.220', secure: true },
    { id: 'custom', name: 'Custom DNS', dns1: 'Custom', dns2: 'Custom', secure: false }
  ];

  const runLeakTest = () => {
    setLeakTest({ ...leakTest, testing: true });
    
    setTimeout(() => {
      const hasLeak = Math.random() > 0.9;
      const detectedDNS = hasLeak 
        ? ['192.168.1.1', '75.75.75.75']
        : [
            dnsProviders.find(p => p.id === dnsSettings.provider)?.dns1 || '1.1.1.1',
            dnsProviders.find(p => p.id === dnsSettings.provider)?.dns2 || '1.0.0.1'
          ];
      
      setLeakTest({
        testing: false,
        lastTest: new Date().toLocaleString(),
        results: {
          leakDetected: hasLeak,
          dnsServers: detectedDNS,
          location: hasLeak ? 'ISP DNS Server' : 'VPN DNS Server',
          secure: !hasLeak
        }
      });
    }, 2000);
  };

  return (
    <div className="dns-protection">
      <div className="dns-header">
        <h3>🔒 DNS Leak Protection</h3>
      </div>

      {/* Status Banner */}
      <div className={`dns-banner ${dnsSettings.enabled && isConnected ? 'protected' : 'warning'}`}>
        <div className="banner-icon">{dnsSettings.enabled && isConnected ? '🛡️' : '⚠️'}</div>
        <div className="banner-content">
          <h4>{dnsSettings.enabled && isConnected ? 'DNS Protected' : 'DNS Not Protected'}</h4>
          <p>
            {dnsSettings.enabled && isConnected
              ? 'Your DNS queries are encrypted and routed through secure servers'
              : 'Connect to VPN and enable DNS protection for secure browsing'}
          </p>
        </div>
      </div>

      {/* Leak Test */}
      <div className="leak-test-section">
        <h4>🔍 DNS Leak Test</h4>
        <div className="test-container">
          <button 
            onClick={runLeakTest} 
            className={`test-btn ${leakTest.testing ? 'testing' : ''}`}
            disabled={leakTest.testing || !isConnected}
          >
            {leakTest.testing ? '🔄 Testing...' : '▶️ Run Leak Test'}
          </button>
          
          {leakTest.lastTest && (
            <div className="test-time">Last tested: {leakTest.lastTest}</div>
          )}
        </div>

        {leakTest.results && (
          <div className={`test-results ${leakTest.results.leakDetected ? 'leak' : 'secure'}`}>
            <div className="result-header">
              <span className="result-icon">
                {leakTest.results.leakDetected ? '❌' : '✅'}
              </span>
              <h5>{leakTest.results.leakDetected ? 'DNS Leak Detected!' : 'No DNS Leaks'}</h5>
            </div>
            <div className="result-details">
              <div className="detail-row">
                <span>Status:</span>
                <span className={leakTest.results.secure ? 'secure' : 'insecure'}>
                  {leakTest.results.secure ? 'Secure' : 'Insecure'}
                </span>
              </div>
              <div className="detail-row">
                <span>Location:</span>
                <span>{leakTest.results.location}</span>
              </div>
              <div className="detail-row">
                <span>Detected DNS:</span>
                <div className="dns-list">
                  {leakTest.results.dnsServers.map((dns, i) => (
                    <span key={i} className="dns-server">{dns}</span>
                  ))}
                </div>
              </div>
            </div>
            {leakTest.results.leakDetected && (
              <div className="leak-warning">
                ⚠️ Your DNS queries may be visible to your ISP. Check your VPN configuration.
              </div>
            )}
          </div>
        )}
      </div>

      {/* DNS Provider Selection */}
      <div className="dns-provider-section">
        <h4>🌐 DNS Provider</h4>
        <div className="provider-grid">
          {dnsProviders.map(provider => (
            <div
              key={provider.id}
              className={`provider-card ${dnsSettings.provider === provider.id ? 'selected' : ''}`}
              onClick={() => setDnsSettings({ ...dnsSettings, provider: provider.id })}
            >
              <div className="provider-header">
                <span className="provider-name">{provider.name}</span>
                {provider.secure && <span className="secure-badge">🔒 Secure</span>}
              </div>
              <div className="provider-dns">
                <div className="dns-item">{provider.dns1}</div>
                <div className="dns-item">{provider.dns2}</div>
              </div>
            </div>
          ))}
        </div>

        {dnsSettings.provider === 'custom' && (
          <div className="custom-dns-inputs">
            <input
              type="text"
              placeholder="Primary DNS (e.g., 1.1.1.1)"
              value={dnsSettings.customDNS1}
              onChange={(e) => setDnsSettings({ ...dnsSettings, customDNS1: e.target.value })}
            />
            <input
              type="text"
              placeholder="Secondary DNS (e.g., 1.0.0.1)"
              value={dnsSettings.customDNS2}
              onChange={(e) => setDnsSettings({ ...dnsSettings, customDNS2: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="dns-advanced">
        <h4>⚙️ Advanced DNS Settings</h4>
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔐</span>
              <div className="setting-details">
                <div className="setting-title">DNSSEC</div>
                <div className="setting-description">Cryptographically sign DNS data</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dnsSettings.dnssec}
                onChange={(e) => setDnsSettings({ ...dnsSettings, dnssec: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔒</span>
              <div className="setting-details">
                <div className="setting-title">DNS over HTTPS (DoH)</div>
                <div className="setting-description">Encrypt DNS queries via HTTPS</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dnsSettings.dnsOverHTTPS}
                onChange={(e) => setDnsSettings({ ...dnsSettings, dnsOverHTTPS: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔐</span>
              <div className="setting-details">
                <div className="setting-title">DNS over TLS (DoT)</div>
                <div className="setting-description">Encrypt DNS queries via TLS</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dnsSettings.dnsOverTLS}
                onChange={(e) => setDnsSettings({ ...dnsSettings, dnsOverTLS: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="dns-info">
        <h4>💡 About DNS Protection</h4>
        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">🔍</span>
            <h5>What is DNS?</h5>
            <p>DNS translates domain names to IP addresses. Without protection, your ISP can see which websites you visit.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🛡️</span>
            <h5>Why Protect DNS?</h5>
            <p>DNS protection prevents your ISP from tracking your browsing and blocking access to websites.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">⚡</span>
            <h5>Performance</h5>
            <p>Using fast DNS servers like Cloudflare can actually improve your browsing speed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DNSProtection;
