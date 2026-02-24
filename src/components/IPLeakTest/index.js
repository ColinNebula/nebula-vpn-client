import React, { useState, useCallback } from 'react';
import './IPLeakTest.css';

const SIMULATED_REAL_IP   = '203.0.113.42';     // RFC 5737 documentation range
const SIMULATED_REAL_ISP  = 'InternetXYZ Corp';
const SIMULATED_REAL_LOC  = 'Sydney, AU';
const SIMULATED_VPN_IP    = '185.220.101.12';
const SIMULATED_VPN_LOC   = 'Frankfurt, DE';
const SIMULATED_VPN_ISP   = 'Nebula VPN';

const DNS_SERVERS_CLEAN   = ['103.86.96.100 (Nebula)', '103.86.99.100 (Nebula)'];
const DNS_SERVERS_LEAKED  = ['203.0.113.1 (InternetXYZ)', '203.0.113.2 (InternetXYZ)'];

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const IPLeakTest = ({ isConnected }) => {
  const [status, setStatus]     = useState('idle'); // idle | running | done
  const [results, setResults]   = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const runTest = useCallback(async () => {
    setStatus('running');
    setResults(null);
    setProgress(0);

    const steps = [
      { label: 'Detecting your real IP address…',      pct: 15, ms: 700 },
      { label: 'Checking VPN tunnel IP…',              pct: 30, ms: 600 },
      { label: 'Testing DNS leak…',                    pct: 50, ms: 900 },
      { label: 'Checking WebRTC leak…',                pct: 70, ms: 700 },
      { label: 'IPv6 leak detection…',                 pct: 85, ms: 600 },
      { label: 'Analysing results…',                   pct: 100, ms: 500 },
    ];

    for (const step of steps) {
      setCurrentStep(step.label);
      await delay(step.ms);
      setProgress(step.pct);
    }

    // Simulate results — when connected VPN is clean; when not, leaks may appear.
    const webRtcLeaked = !isConnected; // WebRTC always leaks when disconnected
    const dnsLeaked    = !isConnected;
    const ipv6Leaked   = false;        // kill switch handles IPv6

    setResults({
      realIP:      SIMULATED_REAL_IP,
      realISP:     SIMULATED_REAL_ISP,
      realLoc:     SIMULATED_REAL_LOC,
      vpnIP:       isConnected ? SIMULATED_VPN_IP    : SIMULATED_REAL_IP,
      vpnLoc:      isConnected ? SIMULATED_VPN_LOC   : SIMULATED_REAL_LOC,
      vpnISP:      isConnected ? SIMULATED_VPN_ISP   : SIMULATED_REAL_ISP,
      dnsLeaked,
      dnsServers:  dnsLeaked ? DNS_SERVERS_LEAKED : DNS_SERVERS_CLEAN,
      webRtcLeaked,
      webRtcIP:    webRtcLeaked ? SIMULATED_REAL_IP : null,
      ipv6Leaked,
      ipv6Address: ipv6Leaked ? '2001:db8::1' : null,
      score:       isConnected ? 100 : 45,
    });
    setStatus('done');
    setCurrentStep('');
  }, [isConnected]);

  const getScoreLabel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#388e3c' };
    if (score >= 70) return { label: 'Good',      color: '#f57c00' };
    if (score >= 50) return { label: 'Fair',      color: '#ff9800' };
    return                  { label: 'At Risk',   color: '#d32f2f' };
  };

  const renderCheck = (passed, passText, failText, detail = null) => (
    <div className={`ilt-check ${passed ? 'pass' : 'fail'}`}>
      <span className="ilt-check-icon">{passed ? '✅' : '⚠️'}</span>
      <div className="ilt-check-body">
        <span className="ilt-check-text">{passed ? passText : failText}</span>
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
              {renderCheck(
                !results.dnsLeaked,
                'DNS — No Leak',
                'DNS Leak Detected',
                results.dnsLeaked
                  ? `Leaking to: ${results.dnsServers.join(', ')}`
                  : `Using: ${results.dnsServers.join(', ')}`
              )}
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
