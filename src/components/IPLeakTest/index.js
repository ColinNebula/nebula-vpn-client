import React, { useState, useCallback } from 'react';
import './IPLeakTest.css';

// ── Real probe helpers ────────────────────────────────────────────────────────

/** AbortSignal with a timeout (works in all supported runtimes). */
function abortAfter(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Fetch public IP + ISP + location.
 * Primary:  our own backend proxy (/api/security/ip-info) — avoids CORS and
 *           mixed-content blocks entirely.
 * Fallback: ipwho.is directly over HTTPS (free, CORS-enabled, no key needed).
 */
async function fetchIPInfo() {
  // Primary: backend proxy
  try {
    const resp = await fetch(`${API_BASE_URL}/security/ip-info`, {
      signal: abortAfter(8000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.ip) return data;
    }
  } catch { /* fall through to direct call */ }

  // Fallback: ipwho.is — HTTPS, CORS-enabled, 10k req/month free
  const resp = await fetch('https://ipwho.is/', {
    headers: { Accept: 'application/json' },
    signal: abortAfter(8000),
  });
  if (!resp.ok) throw new Error(`IP lookup returned ${resp.status}`);
  const d = await resp.json();
  if (!d.ip) throw new Error('IP lookup returned no data');
  return {
    ip:           d.ip,
    org:          d.connection?.isp || d.org || null,
    city:         d.city            || null,
    country_name: d.country         || null,
  };
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
    // Resolve after 5 s even if gathering isn't complete
    setTimeout(() => { pc.close(); resolve([...ips]); }, 5000);
  });
}

/**
 * DNS-leak test.
 * Primary:  dnsleaktest.com API — works reliably on iOS Safari.
 * Fallback: bash.ws — fewer restrictions but occasionally blocked.
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
        // Trigger DNS lookups
        await Promise.allSettled(
          Array.from({ length: 6 }, (_, i) =>
            fetch(`https://${i}.${token}.test.dnsleaktest.com`, {
              mode: 'no-cors',
              cache: 'no-store',
            }).catch(() => {})
          )
        );
        await new Promise(r => setTimeout(r, 2000));

        const resultsResp = await fetch(
          `https://www.dnsleaktest.com/api/v1/test/${token}/results`,
          { signal: abortAfter(6000) }
        );
        if (resultsResp.ok) {
          const data = await resultsResp.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      }
    }
  } catch { /* fall through to bash.ws */ }

  // Fallback: bash.ws (ipleak.net backend)
  try {
    const id = (typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

    await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) =>
        fetch(`https://${id}.${i}.bash.ws`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
      )
    );
    await new Promise(r => setTimeout(r, 2500));

    const resp = await fetch(`https://bash.ws/dnsleak/test/${id}?json`, {
      signal: abortAfter(8000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch {
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
  } catch { /* no IPv6 reachability — no leak */ }
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

const IPLeakTest = ({ isConnected }) => {
  const [status, setStatus]         = useState('idle'); // idle | running | done | error
  const [results, setResults]       = useState(null);
  const [progress, setProgress]     = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');

  const runTest = useCallback(async () => {
    setStatus('running');
    setResults(null);
    setErrorMsg('');
    setProgress(0);

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
      } catch { /* WebRTC unavailable — treat as no data */ }
      setProgress(50);

      // Step 3: DNS
      setCurrentStep('Testing DNS resolvers for leaks…');
      let dnsServers = [];
      try {
        dnsServers = await runDNSLeakProbe();
      } catch { /* DNS probe failed — report as inconclusive */ }
      setProgress(75);

      // Step 4: IPv6
      setCurrentStep('Checking IPv6 exposure…');
      let ipv6Result = { leaked: false, address: null };
      try {
        ipv6Result = await detectIPv6();
      } catch { /* IPv6 check failed — treat as no leak */ }
      setProgress(90);

      // ── Analyse ──
      setCurrentStep('Analysing results…');
      const publicIP = ipData.ip || 'Unknown';

      // WebRTC leak: any non-private IP found via RTCPeerConnection
      const webRtcLeakedIPs = webRtcIPs.filter(ip => !isPrivateIP(ip));
      const webRtcLeaked    = webRtcLeakedIPs.length > 0;

      // DNS leak: any returned resolver is NOT a known VPN/trusted DNS
      // If dnsServers is empty the probe was inconclusive — don't flag as leaked
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
      setErrorMsg(err.message || 'Test failed — check your connection and try again.');
      setStatus('error');
    }
    setCurrentStep('');
  }, [isConnected]);

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
          disabled={status === 'running'}
        >
          {status === 'running' ? '⏳ Testing…' : status === 'done' ? '🔄 Re-run Test' : '▶ Run Test'}
        </button>
      </div>

      {/* VPN status banner */}
      <div className={`ilt-status-banner ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected
          ? '🛡️ VPN is active — your traffic is encrypted and tunnelled through Nebula VPN'
          : '⚠️ VPN is not connected — your real IP and DNS may be exposed'}
      </div>

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
                  : 'Some leaks were detected. Connect to VPN to protect your identity.'}
              </p>
            </div>
          </div>

          {/* IP Section */}
          <div className="ilt-section">
            <h3 className="ilt-section-title">🌐 IP Addresses</h3>
            <div className="ilt-ip-grid">
              <div className="ilt-ip-card real">
                <div className="ilt-ip-card-label">Your Real IP</div>
                <div className="ilt-ip-value">{results.realIP}</div>
                <div className="ilt-ip-meta">{results.realISP} · {results.realLoc}</div>
              </div>
              <div className={`ilt-ip-card ${isConnected ? 'protected' : 'real'}`}>
                <div className="ilt-ip-card-label">Visible IP (what sites see)</div>
                <div className="ilt-ip-value">{results.vpnIP}</div>
                <div className="ilt-ip-meta">{results.vpnISP} · {results.vpnLoc}</div>
                {isConnected && <div className="ilt-ip-shield">🛡️ Protected</div>}
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
                    'DNS — Inconclusive',
                    'DNS probe could not reach the test server. Try again on a different network.'
                  )
                : renderCheck(
                    !results.dnsLeaked,
                    'DNS — No Leak',
                    'DNS Leak Detected',
                    results.dnsLeaked
                      ? `Leaking to: ${results.dnsServers.join(', ')}`
                      : `Using: ${results.dnsServers.join(', ')}`
                  )
              }
              {renderCheck(
                !results.webRtcLeaked,
                'WebRTC — No Leak',
                'WebRTC Leak Detected',
                results.webRtcLeaked ? `Exposed real IP: ${results.webRtcIP}` : 'WebRTC traffic is masked'
              )}
              {renderCheck(
                !results.ipv6Leaked,
                'IPv6 — No Leak',
                'IPv6 Leak Detected',
                results.ipv6Leaked ? `Exposed: ${results.ipv6Address}` : 'IPv6 traffic is blocked or tunnelled'
              )}
              {renderCheck(
                isConnected,
                'VPN Tunnel — Active',
                'VPN Tunnel — Not Active',
                isConnected ? 'All traffic is routed through Nebula VPN' : 'Connect to VPN to encrypt your connection'
              )}
            </div>
          </div>

          {/* Recommendations */}
          {(!isConnected || results.dnsLeaked || results.webRtcLeaked) && (
            <div className="ilt-section">
              <h3 className="ilt-section-title">💡 Recommendations</h3>
              <div className="ilt-recommendations">
                {!isConnected && (
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
