import React, { useState, useEffect } from 'react';
import './DNSProtection.css';

const DNSProtection = ({ isConnected, isProtectionVerified = false, isSimulated = false }) => {
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
  
  const [autoTrustedDns, setAutoTrustedDns] = useState({
    enabled: true,
    servers: ['1.1.1.1', '1.0.0.1'],
    loading: false
  });

  const dnsProviders = [
    { id: 'cloudflare', name: 'Cloudflare', dns1: '1.1.1.1', dns2: '1.0.0.1', secure: true },
    { id: 'google', name: 'Google Public DNS', dns1: '8.8.8.8', dns2: '8.8.4.4', secure: true },
    { id: 'quad9', name: 'Quad9', dns1: '9.9.9.9', dns2: '149.112.112.112', secure: true },
    { id: 'opendns', name: 'OpenDNS', dns1: '208.67.222.222', dns2: '208.67.220.220', secure: true },
    { id: 'custom', name: 'Custom DNS', dns1: 'Custom', dns2: 'Custom', secure: false }
  ];

  const canRunExternalLeakTest = isConnected && isProtectionVerified && !isSimulated;

  // Load current DNS configuration on mount
  useEffect(() => {
    const loadDnsConfig = async () => {
      if (window.electron?.vpn?.getDnsConfig) {
        try {
          const result = await window.electron.vpn.getDnsConfig();
          if (result.success && result.config) {
            setAutoTrustedDns({
              enabled: result.config.autoTrustedDns,
              servers: result.config.trustedServers || ['1.1.1.1', '1.0.0.1'],
              loading: false
            });
            console.log('[DNS Config] Loaded:', result.config);
          }
        } catch (error) {
          console.error('[DNS Config] Failed to load:', error);
        }
      }
    };
    loadDnsConfig();
  }, []);

  useEffect(() => {
    if (!canRunExternalLeakTest) {
      setLeakTest({
        testing: false,
        lastTest: null,
        results: null,
      });
    }
  }, [canRunExternalLeakTest]);
  
  const handleAutoTrustedDnsToggle = async (enabled) => {
    if (!window.electron?.vpn?.configureDns) {
      console.error('[DNS Config] Electron API not available');
      return;
    }
    
    setAutoTrustedDns(prev => ({ ...prev, loading: true }));
    try {
      const result = await window.electron.vpn.configureDns({
        enabled,
        servers: autoTrustedDns.servers
      });
      
      if (result.success) {
        setAutoTrustedDns({
          enabled: result.config.enabled,
          servers: result.config.servers,
          loading: false
        });
        console.log('[DNS Config] Updated:', result.config);
      } else {
        console.error('[DNS Config] Failed:', result.error);
        setAutoTrustedDns(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('[DNS Config] Error:', error);
      setAutoTrustedDns(prev => ({ ...prev, loading: false }));
    }
  };
  
  const handleTrustedDnsChange = async (providerId) => {
    if (!window.electron?.vpn?.configureDns) return;
    
    const provider = dnsProviders.find(p => p.id === providerId);
    if (!provider || provider.id === 'custom') return;
    
    const servers = [provider.dns1, provider.dns2];
    setAutoTrustedDns(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await window.electron.vpn.configureDns({
        enabled: autoTrustedDns.enabled,
        servers
      });
      
      if (result.success) {
        setAutoTrustedDns({
          enabled: result.config.enabled,
          servers: result.config.servers,
          loading: false
        });
        console.log('[DNS Config] Provider changed to:', providerId, servers);
      } else {
        setAutoTrustedDns(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('[DNS Config] Error:', error);
      setAutoTrustedDns(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * Real DNS-leak test using bash.ws (same backend as ipleak.net).
   * Triggers DNS queries from the browser then asks the server which
   * resolvers answered — those are the user's active DNS servers.
   * 
   * UPDATED: Now uses backend API to query Windows DNS settings directly,
   * with bash.ws/dnsleaktest.com as fallback.
   */
  const runLeakTest = async () => {
    if (!canRunExternalLeakTest) {
      setLeakTest({
        testing: false,
        lastTest: null,
        results: {
          leakDetected: false,
          dnsServers: ['External DNS probes are disabled until a verified desktop tunnel is active'],
          location: 'Unavailable',
          secure: false,
          error: 'Desktop handshake verification required',
        },
      });
      return;
    }

    setLeakTest({ ...leakTest, testing: true });
    
    try {
      // PRIMARY: Query Windows DNS settings directly via backend API
      console.log('[DNS Leak Test] Querying system DNS configuration...');
      const backendResp = await fetch('http://localhost:3001/api/security/dns-servers', {
        signal: AbortSignal.timeout(8000)
      });
      
      if (backendResp.ok) {
        const data = await backendResp.json();
        console.log('[DNS Leak Test] Backend results:', data);
        
        if (data.servers && data.servers.length > 0) {
          setLeakTest({
            testing: false,
            lastTest: new Date().toLocaleString(),
            results: {
              leakDetected: data.leakDetected,
              dnsServers: data.servers.map(dns => 
                `${dns.ip} (${dns.provider}${dns.isPrivate ? ' - Local' : ''})`
              ),
              location: data.leakDetected ? 'ISP / Untrusted DNS' : 'Trusted DNS',
              secure: data.secure,
            },
          });
          return;
        }
      }
      
      console.log('[DNS Leak Test] Backend failed, trying bash.ws fallback...');
    } catch (err) {
      console.log('[DNS Leak Test] Backend error:', err.message);
    }

    // FALLBACK: Use bash.ws DNS leak detection
    try {
      const id = (typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

      console.log('[DNS Leak Test] Starting bash.ws test with ID:', id);

      // Trigger MORE DNS lookups with multiple techniques to ensure capture
      // Use fetch with no-cors (standard method)
      const fetchPromises = Array.from({ length: 10 }, (_, i) =>
        fetch(`https://${id}.${i}.bash.ws`, { mode: 'no-cors', cache: 'no-store' })
          .then(() => console.log(`[DNS Leak Test] Query ${i} completed`))
          .catch(e => console.log(`[DNS Leak Test] Query ${i} failed:`, e.message))
      );
      
      // Also trigger via image loading (alternative technique that forces DNS)
      const imgPromises = Array.from({ length: 3 }, (_, i) => 
        new Promise(resolve => {
          const img = new Image();
          img.onload = img.onerror = () => {
            console.log(`[DNS Leak Test] Image query ${i} completed`);
            resolve();
          };
          img.src = `https://${id}.img${i}.bash.ws/pixel.png?t=${Date.now()}`;
          setTimeout(resolve, 3000); // Timeout fallback
        })
      );

      await Promise.allSettled([...fetchPromises, ...imgPromises]);
      
      // Wait longer to ensure DNS queries are captured by bash.ws backend
      console.log('[DNS Leak Test] Waiting 4 seconds for DNS capture...');
      await new Promise(r => setTimeout(r, 4000));

      console.log('[DNS Leak Test] Fetching results from bash.ws...');
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10000);
      const resp = await fetch(`https://bash.ws/dnsleak/test/${id}?json`, { signal: ctrl.signal });
      
      if (!resp.ok) {
        console.error('[DNS Leak Test] Results fetch failed:', resp.status);
        throw new Error(`bash.ws returned status ${resp.status}`);
      }
      
      const data = await resp.json();
      console.log('[DNS Leak Test] Results received:', data);
      const servers = Array.isArray(data) ? data : [];

      const trustedDNS = ['1.1.1.1', '1.0.0.1', '9.9.9.9', '149.112.112.112',
                          '8.8.8.8', '8.8.4.4', '208.67.222.222', '208.67.220.220'];
      const hasLeak = servers.length > 0 &&
        servers.some(d => d.ip && !trustedDNS.some(t => d.ip === t || d.ip.startsWith(t)));

      setLeakTest({
        testing: false,
        lastTest: new Date().toLocaleString(),
        results: {
          leakDetected: hasLeak,
          dnsServers: servers.length > 0
            ? servers.map(d => `${d.ip}${d.country_name ? ` (${d.country_name})` : ''}`)
            : ['No DNS servers detected — DNS may be encrypted or test failed. Try running again.'],
          location: hasLeak ? 'ISP / Unknown DNS Server' : (servers.length > 0 ? 'Trusted DNS Server' : 'Unknown'),
          secure: !hasLeak && servers.length > 0,
        },
      });
    } catch (err) {
      console.error('[DNS Leak Test] Test failed:', err);
      setLeakTest({
        testing: false,
        lastTest: new Date().toLocaleString(),
        results: {
          leakDetected: false,
          dnsServers: [`Test error: ${err.message}. Check connection and try again.`],
          location: 'Unknown',
          secure: false,
          error: err.message,
        },
      });
    }
  };

  return (
    <div className="dns-protection">
      <div className="dns-header">
        <h3>🔒 DNS Leak Protection</h3>
      </div>

      {/* Status Banner */}
      <div className={`dns-banner ${dnsSettings.enabled && isProtectionVerified ? 'protected' : 'warning'}`}>
        <div className="banner-icon">{dnsSettings.enabled && isProtectionVerified ? '🛡️' : '⚠️'}</div>
        <div className="banner-content">
          <h4>{dnsSettings.enabled && isProtectionVerified ? 'DNS Protected' : isSimulated ? 'DNS Unverified in Browser' : 'DNS Not Protected'}</h4>
          <p>
            {dnsSettings.enabled && isProtectionVerified
              ? 'Your DNS queries are encrypted and routed through secure servers'
              : isSimulated
                ? 'Browser/PWA mode is only a UI simulation. DNS still follows your normal network unless leak tests prove otherwise.'
                : 'Connect to VPN and enable DNS protection for secure browsing'}
          </p>
        </div>
      </div>

      {/* Automatic Trusted DNS Configuration */}
      <div className="dns-config-section">
        <h4>⚙️ DNS Configuration</h4>
        <div className="config-card">
          <div className="config-header">
            <div className="config-title">
              <span className="config-icon">🛡️</span>
              <div>
                <strong>Automatic Trusted DNS</strong>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', opacity: 0.8 }}>
                  Automatically use trusted DNS servers to prevent DNS leaks
                </p>
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={autoTrustedDns.enabled}
                onChange={(e) => handleAutoTrustedDnsToggle(e.target.checked)}
                disabled={autoTrustedDns.loading}
              />
              <span className="slider"></span>
            </label>
          </div>
          
          {autoTrustedDns.enabled && (
            <div className="config-details">
              <div className="dns-provider-select">
                <label>Trusted DNS Provider:</label>
                <select 
                  onChange={(e) => handleTrustedDnsChange(e.target.value)}
                  disabled={autoTrustedDns.loading}
                  value={
                    autoTrustedDns.servers[0] === '1.1.1.1' ? 'cloudflare' :
                    autoTrustedDns.servers[0] === '8.8.8.8' ? 'google' :
                    autoTrustedDns.servers[0] === '9.9.9.9' ? 'quad9' :
                    autoTrustedDns.servers[0] === '208.67.222.222' ? 'opendns' : 'cloudflare'
                  }
                >
                  <option value="cloudflare">Cloudflare (1.1.1.1, 1.0.0.1)</option>
                  <option value="google">Google DNS (8.8.8.8, 8.8.4.4)</option>
                  <option value="quad9">Quad9 (9.9.9.9, 149.112.112.112)</option>
                  <option value="opendns">OpenDNS (208.67.222.222, 208.67.220.220)</option>
                </select>
              </div>
              <div className="current-dns">
                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                  Currently using: {autoTrustedDns.servers.join(', ')}
                </span>
              </div>
              <div className="dns-info" style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,200,0,0.1)', borderRadius: '8px', fontSize: '13px' }}>
                ✅ Your VPN will automatically use these trusted DNS servers instead of your ISP's DNS, preventing DNS leaks and improving privacy.
              </div>
            </div>
          )}
          
          {!autoTrustedDns.enabled && (
            <div className="dns-warning" style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,150,0,0.15)', borderRadius: '8px', fontSize: '13px' }}>
              ⚠️ When disabled, your VPN will use the DNS servers provided by the VPN server, which may not be privacy-focused. This could lead to DNS leaks.
            </div>
          )}
        </div>
      </div>

      {/* Leak Test */}
      <div className="leak-test-section">
        <h4>🔍 DNS Leak Test</h4>
        {!canRunExternalLeakTest && (
          <div className="leak-warning" style={{ marginBottom: '12px' }}>
            External DNS probe services are disabled until the Electron app has a verified WireGuard tunnel.
          </div>
        )}
        <div className="test-container">
          <button 
            onClick={runLeakTest} 
            className={`test-btn ${leakTest.testing ? 'testing' : ''}`}
            disabled={leakTest.testing || !canRunExternalLeakTest}
          >
            {leakTest.testing ? '🔄 Testing...' : canRunExternalLeakTest ? '▶️ Run Leak Test' : '🔒 Requires Verified Desktop Tunnel'}
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
