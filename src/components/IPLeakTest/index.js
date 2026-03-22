import React, { useState, useCallback, useEffect } from 'react';
import './IPLeakTest.css';

// ── Real probe helpers ────────────────────────────────────────────────────────

/** AbortSignal with a timeout (works in all supported runtimes). */
function abortAfter(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.nebula3ddev.com/api';

/**
 * Fetch public IP + ISP + location.
 * Routed exclusively through our own backend proxy so the client's real IP
 * is never sent directly to a third-party service.
 */
async function fetchIPInfo() {
  const resp = await fetch(`${API_BASE_URL}/security/ip-info`, {
    signal: abortAfter(8000),
  });
  if (!resp.ok) throw new Error(`IP info proxy returned ${resp.status}`);
  const data = await resp.json();
  if (!data.ip) throw new Error('IP info proxy returned no data');
  return data;
}

/**
 * Detect public IPs exposed via WebRTC by creating an offer/answer exchange
 * against a STUN server and harvesting ICE candidates.
 * Returns an array of unique IP strings.
 */
async function detectWebRTCIPs() {
  if (typeof RTCPeerConnection === 'undefined') return [];
  return new Promise((resolve) => {
    const ips = new Set();
    const pc  = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] });
    pc.createDataChannel('');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => resolve([]));
    pc.onicecandidate = (e) => {
      if (!e.candidate) { pc.close(); resolve([...ips]); return; }
      const m = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (m) ips.add(m[1]);
    };
    // Resolve after 5 s even if gathering isn't complete
    setTimeout(() => { pc.close(); resolve([...ips]); }, 5000);
  });
}

/**
 * DNS-leak test.
 * Primary:  dnsleaktest.com API - works reliably on iOS Safari.
 * Fallback: bash.ws - fewer restrictions but occasionally blocked.
 * Returns an array of { ip, country_name } objects.
 */
async function runDNSLeakProbe() {
  // Primary: dnsleaktest.com
  try {
    const tokenResp = await fetch('https://www.dnsleaktest.com/api/v1/test/start', {
      signal: abortAfter(6000),
    });
    if (tokenResp.ok) {
      const { token } = await tokenResp.json();
      if (token) {
        console.log('[DNS Leak] dnsleaktest.com token:', token);
        // Trigger MORE DNS lookups with multiple techniques
        const fetchPromises = Array.from({ length: 10 }, (_, i) =>
          fetch(`https://${i}.${token}.test.dnsleaktest.com`, {
            mode: 'no-cors',
            cache: 'no-store',
          }).catch(() => {})
        );
        
        // Also use image loading technique
        const imgPromises = Array.from({ length: 3 }, (_, i) =>
          new Promise(resolve => {
            const img = new Image();
            img.onload = img.onerror = resolve;
            img.src = `https://img${i}.${token}.test.dnsleaktest.com/pixel.png?t=${Date.now()}`;
            setTimeout(resolve, 3000);
          })
        );
        
        await Promise.allSettled([...fetchPromises, ...imgPromises]);
        await new Promise(r => setTimeout(r, 3500)); // Wait longer

        const resultsResp = await fetch(
          `https://www.dnsleaktest.com/api/v1/test/${token}/results`,
          { signal: abortAfter(6000) }
        );
        if (resultsResp.ok) {
          const data = await resultsResp.json();
          console.log('[DNS Leak] dnsleaktest.com results:', data);
          if (Array.isArray(data) && data.length > 0) return data;
        }
      }
    }
  } catch (e) {
    console.log('[DNS Leak] dnsleaktest.com failed:', e.message);
  }

  // Fallback: bash.ws (ipleak.net backend)
  try {
    const id = (typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

    console.log('[DNS Leak] bash.ws ID:', id);
    
    // Trigger MORE DNS queries with multiple techniques
    const fetchPromises = Array.from({ length: 10 }, (_, i) =>
      fetch(`https://${id}.${i}.bash.ws`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
    );
    
    const imgPromises = Array.from({ length: 3 }, (_, i) =>
      new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = resolve;
        img.src = `https://${id}.img${i}.bash.ws/pixel.png?t=${Date.now()}`;
        setTimeout(resolve, 3000);
      })
    );
    
    await Promise.allSettled([...fetchPromises, ...imgPromises]);
    await new Promise(r => setTimeout(r, 4000)); // Wait longer for capture

    const resp = await fetch(`https://bash.ws/dnsleak/test/${id}?json`, {
      signal: abortAfter(10000),
    });
    if (!resp.ok) {
      console.log('[DNS Leak] bash.ws fetch failed:', resp.status);
      return [];
    }
    const data = await resp.json();
    console.log('[DNS Leak] bash.ws results:', data);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.log('[DNS Leak] bash.ws failed:', e.message);
    return [];
  }
}

/**
 * Attempt a fetch to an IPv6-only endpoint.
 * If it succeeds and returns an IPv6 address the user's IPv6 is exposed.
 */
async function detectIPv6() {
  try {
    const resp = await fetch('https://api6.ipify.org?format=json', {
      signal: abortAfter(4000),
    });
    if (resp.ok) {
      const { ip } = await resp.json();
      if (ip && ip.includes(':')) return { leaked: true, address: ip };
    }
  } catch { /* no IPv6 reachability - no leak */ }
  return { leaked: false, address: null };
}

/** True for RFC-1918 / link-local / loopback addresses. */
function isPrivateIP(ip) {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.)/.test(ip);
}

/**
 * Returns true if `ip` belongs to a known VPN or privacy-friendly DNS provider.
 * Adjust this list to match the DNS servers configured in your WireGuard setup.
 */
function isExpectedDNS(ip) {
  const trusted = [
    '1.1.1.1', '1.0.0.1',           // Cloudflare (default Nebula DNS)
    '9.9.9.9', '149.112.112.112',   // Quad9
    '8.8.8.8', '8.8.4.4',           // Google
    '208.67.222.222', '208.67.220.220', // OpenDNS
  ];
  return trusted.some(t => ip === t || ip.startsWith(t));
}

// ── Component ────────────────────────────────────────────────────────────────

const IPLeakTest = ({ isConnected, isProtectionVerified = false, isSimulated = false }) => {
  const [status, setStatus]         = useState('idle'); // idle | running | done | error
  const [results, setResults]       = useState(null);
  const [progress, setProgress]     = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [showRealIP, setShowRealIP] = useState(false);
  const canRunExternalProbeSuite = isConnected && isProtectionVerified && !isSimulated;

  useEffect(() => {
    if (!canRunExternalProbeSuite) {
      setStatus('idle');
      setResults(null);
      setProgress(0);
      setCurrentStep('');
      setErrorMsg('');
      setShowRealIP(false);
    }
  }, [canRunExternalProbeSuite]);

  const runTest = useCallback(async () => {
    if (!canRunExternalProbeSuite) {
      setStatus('error');
      setResults(null);
      setProgress(0);
      setCurrentStep('');
      setErrorMsg('External probe services are disabled until a verified desktop WireGuard tunnel is active.');
      setShowRealIP(false);
      return;
    }

    setStatus('running');
    setResults(null);
    setErrorMsg('');
    setProgress(0);
    setShowRealIP(false);

    try {
      // Step 1: Public IP
      setCurrentStep('Detecting your public IP address…');
      setProgress(10);
      let ipData;
      try {
        ipData = await fetchIPInfo();
      } catch (e) {
        throw new Error(`IP lookup failed: ${e.message}. Check your connection and try again.`);
      }
      setProgress(25);

      // Step 2: WebRTC
      setCurrentStep('Checking WebRTC for IP leaks…');
      let webRtcIPs = [];
      try {
        webRtcIPs = await detectWebRTCIPs();
      } catch { /* WebRTC unavailable - treat as no data */ }
      setProgress(50);

      // Step 3: DNS
      setCurrentStep('Testing DNS resolvers for leaks…');
      let dnsServers = [];
      try {
        dnsServers = await runDNSLeakProbe();
      } catch { /* DNS probe failed - report as inconclusive */ }
      setProgress(75);

      // Step 4: IPv6
      setCurrentStep('Checking IPv6 exposure…');
      let ipv6Result = { leaked: false, address: null };
      try {
        ipv6Result = await detectIPv6();
      } catch { /* IPv6 check failed - treat as no leak */ }
      setProgress(90);

      // ── Analyse ──
      setCurrentStep('Analysing results…');
      const publicIP = ipData.ip || 'Unknown';

      // WebRTC leak: any non-private IP found via RTCPeerConnection
      const webRtcLeakedIPs = webRtcIPs.filter(ip => !isPrivateIP(ip));
      const webRtcLeaked    = webRtcLeakedIPs.length > 0;

      // DNS leak: any returned resolver is NOT a known VPN/trusted DNS
      // If dnsServers is empty the probe was inconclusive - don't flag as leaked
      const dnsLeaked = dnsServers.length > 0 &&
        dnsServers.some(d => d.ip && !isExpectedDNS(d.ip));
      const dnsInconclusive = dnsServers.length === 0;

      const ipv6Leaked  = ipv6Result.leaked;
      const ipv6Address = ipv6Result.address;

      const leakCount = [webRtcLeaked, dnsLeaked, ipv6Leaked].filter(Boolean).length;
      const score     = Math.max(0, 100 - leakCount * 25 - (!isConnected ? 25 : 0));

      setProgress(100);
      setResults({
        visibleIP:  publicIP,
        visibleISP: ipData.org     || 'Unknown ISP',
        visibleLoc: [ipData.city, ipData.country_name].filter(Boolean).join(', ') || 'Unknown',
        // Legacy field names kept for JSX compatibility
        realIP:  publicIP,
        realISP: ipData.org     || 'Unknown ISP',
        realLoc: [ipData.city, ipData.country_name].filter(Boolean).join(', ') || 'Unknown',
        vpnIP:   publicIP,
        vpnLoc:  [ipData.city, ipData.country_name].filter(Boolean).join(', ') || 'Unknown',
        vpnISP:  ipData.org     || 'Unknown ISP',
        dnsLeaked,
        dnsInconclusive,
        dnsServers: dnsServers.map(d =>
          `${d.ip}${d.country_name ? ` (${d.country_name})` : ''}`
        ),
        webRtcLeaked,
        webRtcIP: webRtcLeakedIPs[0] || null,
        ipv6Leaked,
        ipv6Address,
        score,
      });
      setStatus('done');
    } catch (err) {
      console.error('[IPLeakTest] test failed:', err);
      setErrorMsg(err.message || 'Test failed - check your connection and try again.');
      setStatus('error');
    }
    setCurrentStep('');
  }, [canRunExternalProbeSuite, isConnected]);

  const getScoreLabel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#388e3c' };
    if (score >= 70) return { label: 'Good',      color: '#f57c00' };
    if (score >= 50) return { label: 'Fair',      color: '#ff9800' };
    return                  { label: 'At Risk',   color: '#d32f2f' };
  };

  const renderCheck = (passed, passText, failText, detail = null) => (
    <div className={`ilt-check ${passed === null ? 'inconclusive' : passed ? 'pass' : 'fail'}`}>
      <span className="ilt-check-icon">{passed === null ? '❓' : passed ? '✅' : '⚠️'}</span>
      <div className="ilt-check-body">
        <span className="ilt-check-text">{passed === null ? failText : passed ? passText : failText}</span>
        {detail && <span className="ilt-check-detail">{detail}</span>}
      </div>
    </div>
  );

  return (
    <div className="ilt-container">
      {/* Header */}
      <div className="ilt-header">
        <div className="ilt-header-left">
          <span className="ilt-icon">🔬</span>
          <div>
            <h2 className="ilt-title">IP &amp; DNS Leak Test</h2>
            <p className="ilt-subtitle">Verify your VPN is protecting your real identity</p>
          </div>
        </div>
        <button
          className={`ilt-run-btn ${status === 'running' ? 'running' : ''}`}
          onClick={runTest}
          disabled={status === 'running' || !canRunExternalProbeSuite}
        >
          {status === 'running'
            ? '⏳ Testing…'
            : canRunExternalProbeSuite
              ? status === 'done' ? '🔄 Re-run Test' : '▶ Run Test'
              : '🔒 Requires Verified Desktop Tunnel'}
        </button>
      </div>

      {/* VPN status banner */}
      <div className={`ilt-status-banner ${isConnected ? 'connected' : 'disconnected'}`}>
        {canRunExternalProbeSuite
          ? '🛡️ Verified desktop tunnel active - external leak probes are allowed'
          : isSimulated
            ? '🧪 Browser/PWA simulation - external leak probes are blocked until a real tunnel is verified'
            : isConnected
              ? '🟡 Connected but not verified - external leak probes are blocked until the desktop tunnel is proven'
              : '⚠️ VPN is not connected - external leak probes are blocked and your real IP and DNS may be exposed'}
      </div>

      {!canRunExternalProbeSuite && (
        <div className="ilt-error-banner" style={{ marginBottom: '18px' }}>
          Leak-test probes that depend on third-party services stay disabled until the Electron app reports a verified WireGuard handshake.
        </div>
      )}

      {/* Progress */}
      {status === 'running' && (
        <div className="ilt-progress-section">
          <div className="ilt-progress-bar-wrap">
            <div className="ilt-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="ilt-progress-label">{currentStep}</p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && results && (
        <div className="ilt-results">
          {/* Score */}
          <div className="ilt-score-card">
            <div className="ilt-score-ring" style={{ '--score-color': getScoreLabel(results.score).color }}>
              <span className="ilt-score-number">{results.score}</span>
              <span className="ilt-score-out-of">/100</span>
            </div>
            <div className="ilt-score-info">
              <div className="ilt-score-label" style={{ color: getScoreLabel(results.score).color }}>
                {getScoreLabel(results.score).label}
              </div>
              <p className="ilt-score-desc">
                {results.score >= 90
                  ? 'Your connection is fully protected. No leaks detected.'
                  : isSimulated
                    ? 'Browser/PWA mode is only a UI simulation. Some or all of your identity may still be exposed.'
                    : 'Some leaks were detected. Connect to VPN to protect your identity.'}
              </p>
            </div>
          </div>

          {/* IP Section */}
          <div className="ilt-section">
            <h3 className="ilt-section-title">
              🌐 IP Addresses
              <button
                className="ilt-reveal-btn ilt-reveal-global"
                onClick={() => setShowRealIP(v => !v)}
                title={showRealIP ? 'Hide all sensitive data' : 'Reveal all sensitive data'}
              >
                {showRealIP ? '🙈 Hide all' : '👁 Reveal all'}
              </button>
            </h3>
            <div className="ilt-ip-grid">
              <div className="ilt-ip-card real">
                <div className="ilt-ip-card-label">Your Real IP</div>
                <div className={`ilt-ip-value${showRealIP ? '' : ' ilt-ip-redacted'}`}>
                  {showRealIP ? results.realIP : '••••••••••••'}
                </div>
                <div className={`ilt-ip-meta${showRealIP ? '' : ' ilt-ip-redacted'}`}>
                  {showRealIP ? `${results.realISP} · ${results.realLoc}` : '•••••••••••• · ••••••••'}
                </div>

              </div>
              <div className={`ilt-ip-card ${isProtectionVerified ? 'protected' : 'real'}`}>
                <div className="ilt-ip-card-label">Visible IP (what sites see)</div>
                <div className={`ilt-ip-value${showRealIP ? '' : ' ilt-ip-redacted'}`}>
                  {showRealIP ? results.vpnIP : '••••••••••••'}
                </div>
                <div className={`ilt-ip-meta${showRealIP ? '' : ' ilt-ip-redacted'}`}>
                  {showRealIP ? `${results.vpnISP} · ${results.vpnLoc}` : '•••••••••••• · ••••••••'}
                </div>
                {isProtectionVerified && <div className="ilt-ip-shield">🛡️ Verified</div>}
              </div>
            </div>
          </div>

          {/* Checks */}
          <div className="ilt-section">
            <h3 className="ilt-section-title">🔍 Leak Tests</h3>
            <div className="ilt-checks">
              {results.dnsInconclusive
                ? renderCheck(
                    null,
                    '',
                    'DNS - Inconclusive',
                    'DNS probe could not reach the test server. Try again on a different network.'
                  )
                : renderCheck(
                    !results.dnsLeaked,
                    'DNS - No Leak',
                    'DNS Leak Detected',
                    results.dnsLeaked
                      ? `Leaking to: ${results.dnsServers.join(', ')}`
                      : `Using: ${results.dnsServers.join(', ')}`
                  )
              }
              {renderCheck(
                !results.webRtcLeaked,
                'WebRTC - No Leak',
                'WebRTC Leak Detected',
                results.webRtcLeaked
                  ? (showRealIP ? `Exposed IP: ${results.webRtcIP}` : 'Real IP exposed - click Reveal to see address')
                  : 'WebRTC traffic is masked'
              )}
              {renderCheck(
                !results.ipv6Leaked,
                'IPv6 - No Leak',
                'IPv6 Leak Detected',
                results.ipv6Leaked
                  ? (showRealIP ? `Exposed: ${results.ipv6Address}` : 'IPv6 address exposed - click Reveal to see address')
                  : 'IPv6 traffic is blocked or tunnelled'
              )}
              {renderCheck(
                isProtectionVerified,
                'VPN Tunnel - Handshake Verified',
                'VPN Tunnel - Not Verified',
                isProtectionVerified
                  ? 'WireGuard handshake was observed from the desktop tunnel'
                  : isSimulated
                    ? 'Browser/PWA mode is simulated only - no OS tunnel was created'
                    : 'Connect to the desktop app to create and verify a real tunnel'
              )}
            </div>
          </div>

          {/* Recommendations */}
          {(!isProtectionVerified || results.dnsLeaked || results.webRtcLeaked) && (
            <div className="ilt-section">
              <h3 className="ilt-section-title">💡 Recommendations</h3>
              <div className="ilt-recommendations">
                {!isProtectionVerified && (
                  <div className="ilt-rec-item">
                    <span className="ilt-rec-icon">🔌</span>
                    <span>Connect to Nebula VPN to hide your real IP and encrypt DNS queries.</span>
                  </div>
                )}
                {results.webRtcLeaked && (
                  <div className="ilt-rec-item">
                    <span className="ilt-rec-icon">🌐</span>
                    <span>Disable WebRTC in your browser or install a WebRTC leak protection extension.</span>
                  </div>
                )}
                {results.dnsLeaked && (
                  <div className="ilt-rec-item">
                    <span className="ilt-rec-icon">🔒</span>
                    <span>Enable DNS Leak Protection in Settings to force all DNS through the VPN tunnel.</span>
                  </div>
                )}
                {results.ipv6Leaked && (
                  <div className="ilt-rec-item">
                    <span className="ilt-rec-icon">🌐</span>
                    <span>Enable IPv6 Protection in Settings → Security to prevent IPv6 address exposure.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="ilt-idle">
          <div className="ilt-idle-icon">⚠️</div>
          <p style={{ color: '#d32f2f' }}>{errorMsg}</p>
        </div>
      )}

      {/* Idle state */}
      {status === 'idle' && (
        <div className="ilt-idle">
          <div className="ilt-idle-icon">🔍</div>
          <p>Run the test to check if your VPN is leaking your real IP, DNS queries, or WebRTC information.</p>
          <div className="ilt-test-list">
            <span>✔ IP Address</span>
            <span>✔ DNS Servers</span>
            <span>✔ WebRTC</span>
            <span>✔ IPv6</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPLeakTest;
