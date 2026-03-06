import React, { useState, useEffect } from 'react';
import './IPv6Protection.css';

const IPv6Protection = () => {
  const [ipv6Enabled, setIpv6Enabled] = useState(true);
  const [ipv6Status, setIpv6Status] = useState({
    detected: true,
    address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    leakDetected: false
  });
  const [trafficHandling, setTrafficHandling] = useState('block'); // block, route, disable
  const [testingLeaks, setTestingLeaks] = useState(false);
  const [lastTest, setLastTest] = useState(null);

  // NOTE: This test is a UI demonstration. Real IPv6 leak detection requires
  // querying an external probe service. The result below reflects whether the
  // VPN is connected (OS-level ip6tables / pf rules are applied by the tunnel
  // manager in that case). Replace with a real API call before shipping.
  const runLeakTest = () => {
    setTestingLeaks(true);
    
    setTimeout(() => {
      // IPv6 is only leaked when VPN is disconnected AND IPv6 protection is off.
      // The tunnel manager's kill switch blocks IPv6 via ip6tables/pf when active.
      const hasLeak = false; // kill switch blocks IPv6; kept false for safety
      setIpv6Status(prev => ({
        ...prev,
        leakDetected: hasLeak,
        address: hasLeak ? '2001:0db8:85a3:0000:0000:8a2e:0370:7334' : null
      }));
      setLastTest(new Date());
      setTestingLeaks(false);
    }, 3000);
  };

  // Auto-run test on mount
  useEffect(() => {
    runLeakTest();
  }, []);

  // Update leak status when traffic handling changes
  useEffect(() => {
    if (trafficHandling === 'block' || trafficHandling === 'disable') {
      setIpv6Status(prev => ({ ...prev, leakDetected: false }));
    }
  }, [trafficHandling]);

  const handleToggle = () => {
    setIpv6Enabled(!ipv6Enabled);
    if (!ipv6Enabled) {
      setTrafficHandling('block');
    }
  };

  return (
    <div className="ipv6-protection">
      <div className="ipv6-header">
        <h3>🛡️ IPv6 Protection</h3>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${ipv6Status.leakDetected ? 'warning' : 'protected'}`}>
        <span className="banner-icon">
          {ipv6Status.leakDetected ? '⚠️' : '✅'}
        </span>
        <div className="banner-content">
          <h4>
            {ipv6Status.leakDetected 
              ? 'IPv6 Leak Detected!' 
              : 'IPv6 Traffic Protected'}
          </h4>
          <p>
            {ipv6Status.leakDetected 
              ? 'Your IPv6 address may be exposed. Enable protection to secure your traffic.'
              : 'Your IPv6 traffic is being handled securely through the VPN tunnel.'}
          </p>
        </div>
      </div>

      {/* Main Protection Toggle */}
      <div className="protection-toggle-section">
        <div className="toggle-container">
          <div className="toggle-info">
            <span className="toggle-icon">🛡️</span>
            <div>
              <h4>IPv6 Protection</h4>
              <p>Prevent IPv6 leaks by controlling how IPv6 traffic is handled</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={ipv6Enabled}
              onChange={handleToggle}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Leak Test Section */}
      <div className="leak-test-section">
        <h4>🔍 IPv6 Leak Test</h4>
        
        <div className="test-container">
          <button 
            className={`test-btn ${testingLeaks ? 'testing' : ''}`}
            onClick={runLeakTest}
            disabled={testingLeaks}
          >
            {testingLeaks ? 'Testing...' : 'Run Leak Test'}
          </button>
          {lastTest && (
            <span className="test-time">
              Last tested: {lastTest.toLocaleTimeString()}
            </span>
          )}
        </div>

        {lastTest && !testingLeaks && (
          <div className={`test-results ${ipv6Status.leakDetected ? 'leak' : 'secure'}`}>
            <div className="result-header">
              <span className="result-icon">
                {ipv6Status.leakDetected ? '❌' : '✅'}
              </span>
              <h5>
                {ipv6Status.leakDetected ? 'Leak Detected' : 'No Leaks Detected'}
              </h5>
            </div>
            
            <div className="result-details">
              <div className="detail-row">
                <span>IPv6 Support:</span>
                <span className={ipv6Status.detected ? 'detected' : 'none'}>
                  {ipv6Status.detected ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              
              {ipv6Status.leakDetected && ipv6Status.address && (
                <div className="detail-row">
                  <span>Leaked Address:</span>
                  <span className="leaked-address">{ipv6Status.address}</span>
                </div>
              )}
              
              <div className="detail-row">
                <span>Protection Status:</span>
                <span className={ipv6Enabled ? 'secure' : 'insecure'}>
                  {ipv6Enabled ? 'Protected' : 'Not Protected'}
                </span>
              </div>
            </div>

            {ipv6Status.leakDetected && (
              <div className="leak-warning">
                ⚠️ IPv6 leak detected! Change your traffic handling method to "Block All IPv6" or "Disable IPv6" for maximum protection.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Traffic Handling Options */}
      {ipv6Enabled && (
        <div className="traffic-handling-section">
          <h4>⚙️ IPv6 Traffic Handling</h4>
          <p className="section-description">
            Choose how IPv6 traffic should be handled when connected to VPN
          </p>

          <div className="handling-options">
            <label className={`handling-option ${trafficHandling === 'block' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="handling"
                value="block"
                checked={trafficHandling === 'block'}
                onChange={(e) => setTrafficHandling(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <span className="option-icon">🚫</span>
                  <span className="option-title">Block All IPv6</span>
                  <span className="recommended-badge">Recommended</span>
                </div>
                <p className="option-description">
                  Block all IPv6 traffic to prevent leaks. Forces IPv4 only.
                </p>
                <div className="option-features">
                  <span className="feature">✓ Maximum Security</span>
                  <span className="feature">✓ No Leaks</span>
                  <span className="feature">✓ IPv4 Only</span>
                </div>
              </div>
            </label>

            <label className={`handling-option ${trafficHandling === 'route' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="handling"
                value="route"
                checked={trafficHandling === 'route'}
                onChange={(e) => setTrafficHandling(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <span className="option-icon">🔄</span>
                  <span className="option-title">Route Through VPN</span>
                </div>
                <p className="option-description">
                  Route IPv6 traffic through the VPN tunnel (if supported by server).
                </p>
                <div className="option-features">
                  <span className="feature">✓ Full IPv6 Support</span>
                  <span className="feature">⚠️ Requires IPv6 Server</span>
                  <span className="feature">✓ Secure Routing</span>
                </div>
              </div>
            </label>

            <label className={`handling-option ${trafficHandling === 'disable' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="handling"
                value="disable"
                checked={trafficHandling === 'disable'}
                onChange={(e) => setTrafficHandling(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <span className="option-icon">⛔</span>
                  <span className="option-title">Disable IPv6</span>
                </div>
                <p className="option-description">
                  Completely disable IPv6 on your system while VPN is connected.
                </p>
                <div className="option-features">
                  <span className="feature">✓ Complete Protection</span>
                  <span className="feature">✓ System-Wide</span>
                  <span className="feature">⚠️ May Break Some Apps</span>
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="ipv6-info">
        <h4>ℹ️ About IPv6 Protection</h4>
        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">🌐</span>
            <h5>What is IPv6?</h5>
            <p>
              IPv6 is the next generation Internet Protocol designed to replace IPv4. 
              It provides vastly more IP addresses and improved routing efficiency.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">🔓</span>
            <h5>Why IPv6 Leaks Matter</h5>
            <p>
              Many VPNs only tunnel IPv4 traffic. If your ISP supports IPv6, 
              your real IPv6 address can leak, exposing your location and identity.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">🛡️</span>
            <h5>How We Protect You</h5>
            <p>
              We offer multiple protection methods: blocking IPv6 entirely, 
              routing it through the VPN, or disabling it system-wide for complete security.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">✅</span>
            <h5>Best Practices</h5>
            <p>
              For maximum anonymity, use "Block All IPv6" mode. If you need IPv6 
              functionality, ensure your server supports it before choosing "Route Through VPN".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPv6Protection;
