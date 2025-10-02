import React, { useState, useEffect } from 'react';
import './PrivacyAudit.css';

const PrivacyAudit = () => {
  const [privacyScore, setPrivacyScore] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState(null);

  const [leakTests, setLeakTests] = useState({
    dns: { status: 'pass', risk: 'low', detail: 'No DNS leaks detected' },
    ipv6: { status: 'pass', risk: 'low', detail: 'IPv6 properly disabled' },
    webrtc: { status: 'warning', risk: 'medium', detail: 'WebRTC enabled - may leak local IP' },
    timeZone: { status: 'pass', risk: 'low', detail: 'Timezone properly masked' },
  });

  const [fingerprint, setFingerprint] = useState({
    browser: { score: 85, uniqueness: 'Medium', details: 'User agent and canvas fingerprint detected' },
    system: { score: 92, uniqueness: 'Low', details: 'System fonts and timezone properly masked' },
    network: { score: 78, uniqueness: 'High', details: 'Network fingerprinting possible via RTT analysis' },
    cookies: { score: 95, uniqueness: 'Low', details: 'Third-party cookies blocked' },
  });

  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      priority: 'high',
      icon: '🔴',
      title: 'Disable WebRTC',
      description: 'WebRTC can leak your real IP address even when using a VPN',
      action: 'Configure Browser',
      completed: false
    },
    {
      id: 2,
      priority: 'medium',
      icon: '🟡',
      title: 'Enable Browser Fingerprint Protection',
      description: 'Your browser fingerprint is somewhat unique and trackable',
      action: 'Enable Protection',
      completed: false
    },
    {
      id: 3,
      priority: 'low',
      icon: '🟢',
      title: 'Clear Tracking Cookies',
      description: 'Some tracking cookies detected from previous sessions',
      action: 'Clear Cookies',
      completed: false
    },
  ]);

  const [threatLevel, setThreatLevel] = useState({
    tracking: 'medium',
    fingerprinting: 'low',
    leaks: 'low',
    exposure: 'medium'
  });

  const calculatePrivacyScore = () => {
    // Calculate based on leak tests and fingerprint scores
    const leakScore = Object.values(leakTests).reduce((sum, test) => {
      if (test.status === 'pass') return sum + 25;
      if (test.status === 'warning') return sum + 15;
      return sum + 5;
    }, 0);

    const fingerprintAvg = Object.values(fingerprint).reduce((sum, fp) => sum + fp.score, 0) / 4;
    
    return Math.round((leakScore + fingerprintAvg) / 2);
  };

  const runPrivacyScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setPrivacyScore(calculatePrivacyScore());
          setLastScan(new Date().toLocaleString());
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const toggleRecommendation = (id) => {
    setRecommendations(recommendations.map(rec =>
      rec.id === id ? { ...rec, completed: !rec.completed } : rec
    ));
  };

  useEffect(() => {
    // Initial score calculation
    setPrivacyScore(calculatePrivacyScore());
    setLastScan('Never');
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const getStatusIcon = (status) => {
    if (status === 'pass') return '✅';
    if (status === 'warning') return '⚠️';
    return '❌';
  };

  const getRiskColor = (risk) => {
    if (risk === 'low') return 'var(--success-color, #10b981)';
    if (risk === 'medium') return 'var(--warning-color, #f59e0b)';
    return 'var(--danger-color, #ef4444)';
  };

  return (
    <div className="privacy-audit">
      <div className="audit-header">
        <h3>🔒 Privacy Audit</h3>
        <button 
          className="scan-btn"
          onClick={runPrivacyScan}
          disabled={isScanning}
        >
          {isScanning ? '⏳ Scanning...' : '🔍 Run Privacy Scan'}
        </button>
      </div>

      {/* Privacy Score */}
      <div className="score-section">
        <div className="score-card">
          <div className="score-visual">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="15"
              />
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke={getScoreColor(privacyScore)}
                strokeWidth="15"
                strokeDasharray={`${privacyScore * 5.34} 534`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
              <text
                x="100"
                y="95"
                textAnchor="middle"
                fontSize="48"
                fontWeight="bold"
                fill="var(--text-primary)"
              >
                {privacyScore}
              </text>
              <text
                x="100"
                y="120"
                textAnchor="middle"
                fontSize="16"
                fill="var(--text-secondary)"
              >
                / 100
              </text>
            </svg>
          </div>
          <div className="score-info">
            <h4 style={{ color: getScoreColor(privacyScore) }}>
              {getScoreLabel(privacyScore)} Privacy
            </h4>
            <p className="last-scan">Last scan: {lastScan}</p>
            {isScanning && (
              <div className="scan-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{scanProgress}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Threat Level Overview */}
        <div className="threat-overview">
          <h5>🎯 Threat Level Overview</h5>
          <div className="threat-grid">
            <div className="threat-item">
              <span className="threat-label">Tracking</span>
              <span className={`threat-badge threat-${threatLevel.tracking}`}>
                {threatLevel.tracking}
              </span>
            </div>
            <div className="threat-item">
              <span className="threat-label">Fingerprinting</span>
              <span className={`threat-badge threat-${threatLevel.fingerprinting}`}>
                {threatLevel.fingerprinting}
              </span>
            </div>
            <div className="threat-item">
              <span className="threat-label">Leaks</span>
              <span className={`threat-badge threat-${threatLevel.leaks}`}>
                {threatLevel.leaks}
              </span>
            </div>
            <div className="threat-item">
              <span className="threat-label">Exposure</span>
              <span className={`threat-badge threat-${threatLevel.exposure}`}>
                {threatLevel.exposure}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Leak Tests */}
      <div className="tests-section">
        <h4>💧 Leak Detection Tests</h4>
        <div className="tests-grid">
          <div className="test-card">
            <div className="test-header">
              <span className="test-icon">{getStatusIcon(leakTests.dns.status)}</span>
              <div className="test-info">
                <h5>DNS Leak Test</h5>
                <span 
                  className="risk-badge"
                  style={{ color: getRiskColor(leakTests.dns.risk) }}
                >
                  {leakTests.dns.risk} risk
                </span>
              </div>
            </div>
            <p className="test-detail">{leakTests.dns.detail}</p>
          </div>

          <div className="test-card">
            <div className="test-header">
              <span className="test-icon">{getStatusIcon(leakTests.ipv6.status)}</span>
              <div className="test-info">
                <h5>IPv6 Leak Test</h5>
                <span 
                  className="risk-badge"
                  style={{ color: getRiskColor(leakTests.ipv6.risk) }}
                >
                  {leakTests.ipv6.risk} risk
                </span>
              </div>
            </div>
            <p className="test-detail">{leakTests.ipv6.detail}</p>
          </div>

          <div className="test-card">
            <div className="test-header">
              <span className="test-icon">{getStatusIcon(leakTests.webrtc.status)}</span>
              <div className="test-info">
                <h5>WebRTC Leak Test</h5>
                <span 
                  className="risk-badge"
                  style={{ color: getRiskColor(leakTests.webrtc.risk) }}
                >
                  {leakTests.webrtc.risk} risk
                </span>
              </div>
            </div>
            <p className="test-detail">{leakTests.webrtc.detail}</p>
          </div>

          <div className="test-card">
            <div className="test-header">
              <span className="test-icon">{getStatusIcon(leakTests.timeZone.status)}</span>
              <div className="test-info">
                <h5>Timezone Leak Test</h5>
                <span 
                  className="risk-badge"
                  style={{ color: getRiskColor(leakTests.timeZone.risk) }}
                >
                  {leakTests.timeZone.risk} risk
                </span>
              </div>
            </div>
            <p className="test-detail">{leakTests.timeZone.detail}</p>
          </div>
        </div>
      </div>

      {/* Fingerprint Analysis */}
      <div className="fingerprint-section">
        <h4>👤 Fingerprint Analysis</h4>
        <div className="fingerprint-grid">
          {Object.entries(fingerprint).map(([key, data]) => (
            <div key={key} className="fingerprint-card">
              <div className="fp-header">
                <h5>{key.charAt(0).toUpperCase() + key.slice(1)}</h5>
                <span className="fp-score" style={{ color: getScoreColor(data.score) }}>
                  {data.score}/100
                </span>
              </div>
              <div className="fp-bar">
                <div 
                  className="fp-fill"
                  style={{ 
                    width: `${data.score}%`,
                    background: getScoreColor(data.score)
                  }}
                ></div>
              </div>
              <p className="fp-uniqueness">
                Uniqueness: <strong>{data.uniqueness}</strong>
              </p>
              <p className="fp-details">{data.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h4>💡 Privacy Recommendations</h4>
        <div className="recommendations-list">
          {recommendations.map(rec => (
            <div 
              key={rec.id} 
              className={`recommendation-card priority-${rec.priority} ${rec.completed ? 'completed' : ''}`}
            >
              <div className="rec-icon">{rec.icon}</div>
              <div className="rec-content">
                <h5>{rec.title}</h5>
                <p>{rec.description}</p>
              </div>
              <button 
                className="rec-action-btn"
                onClick={() => toggleRecommendation(rec.id)}
              >
                {rec.completed ? '✓ Done' : rec.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Tips */}
      <div className="tips-section">
        <h4>🛡️ Privacy Best Practices</h4>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">🌐</span>
            <h5>Use Privacy-Focused Browser</h5>
            <p>Switch to browsers like Firefox or Brave with enhanced privacy features</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔒</span>
            <h5>Enable HTTPS Everywhere</h5>
            <p>Install browser extensions that force HTTPS connections</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🚫</span>
            <h5>Block Third-Party Cookies</h5>
            <p>Prevent cross-site tracking by disabling third-party cookies</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🎭</span>
            <h5>Use Anti-Fingerprinting Tools</h5>
            <p>Install extensions that randomize or block browser fingerprinting</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">📧</span>
            <h5>Email Relay Services</h5>
            <p>Use disposable email addresses to prevent email tracking</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔐</span>
            <h5>Regular Security Audits</h5>
            <p>Run privacy scans weekly to detect new vulnerabilities</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyAudit;
