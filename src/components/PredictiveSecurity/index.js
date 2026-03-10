import React, { useState, useEffect, useRef } from 'react';
import './PredictiveSecurity.css';

// ─── Threat definitions ───────────────────────────────────────────────────────
const THREAT_TYPES = [
  { type: 'Anomalous Traffic Pattern', category: 'network',    baseSeverity: 'high',   action: 'blocked'   },
  { type: 'Suspicious DNS Query',       category: 'network',    baseSeverity: 'medium', action: 'monitored' },
  { type: 'Unusual Connection Timing',  category: 'behavioral', baseSeverity: 'low',    action: 'flagged'   },
  { type: 'Port Scan Detected',         category: 'network',    baseSeverity: 'high',   action: 'blocked'   },
  { type: 'Unencrypted Traffic Leak',   category: 'network',    baseSeverity: 'medium', action: 'blocked'   },
  { type: 'Behavioral Deviation',       category: 'behavioral', baseSeverity: 'medium', action: 'monitored' },
  { type: 'Geo-Location Mismatch',      category: 'behavioral', baseSeverity: 'low',    action: 'flagged'   },
  { type: 'Known Malware Signature',    category: 'network',    baseSeverity: 'high',   action: 'blocked'   },
];

const fmtTs = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const RiskSparkline = ({ data, width = 200, height = 50 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.max(0, Math.min(...data) - 3);
  const max = Math.min(100, Math.max(...data) + 3);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastVal = data[data.length - 1];
  const color = lastVal > 70 ? '#ef4444' : lastVal > 40 ? '#f59e0b' : '#10b981';
  const lastX = width;
  const lastY = height - ((lastVal - min) / range) * (height - 6) - 3;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85" />
      <circle cx={lastX} cy={lastY} r="3.5" fill={color} />
    </svg>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const PredictiveSecurity = () => {
  const nextIdRef = useRef(10);

  const [riskScore, setRiskScore] = useState(23);
  const [riskHistory, setRiskHistory] = useState([28, 26, 25, 24, 22, 23, 24, 21, 22, 23]);
  const [threatLevel, setThreatLevel] = useState('low');

  // Initial detection feed with real timestamps
  const [aiDetections, setAiDetections] = useState(() => [
    { id: 1, ...THREAT_TYPES[0], confidence: 94, ts: Date.now() - 120000, escalated: false },
    { id: 2, ...THREAT_TYPES[1], confidence: 87, ts: Date.now() - 300000, escalated: false },
    { id: 3, ...THREAT_TYPES[2], confidence: 76, ts: Date.now() - 720000, escalated: false },
  ]);

  const [behaviorAnalysis, setBehaviorAnalysis] = useState({
    normalityScore: 89,
    deviationAlert: false,
    learnedPatterns: 156,
    anomalyCount: 3,
  });

  // Track repeated threat types for escalation logic
  const threatCountsRef = useRef({});

  const [blockedToday, setBlockedToday] = useState(14);
  const [categoryStats, setCategoryStats] = useState({
    network: 8,
    behavioral: 4,
    environmental: 2,
  });

  // Compute threat level from score
  useEffect(() => {
    setThreatLevel(riskScore > 70 ? 'high' : riskScore > 35 ? 'medium' : 'low');
  }, [riskScore]);

  // Risk score drift + occasional new detections
  useEffect(() => {
    const interval = setInterval(() => {
      setRiskScore((prev) => {
        const next = Math.max(5, Math.min(90, prev + (Math.random() - 0.6) * 5));
        setRiskHistory((h) => [...h.slice(-29), Math.round(next)]);
        return Math.round(next);
      });
      setBehaviorAnalysis((prev) => ({
        ...prev,
        normalityScore: Math.max(70, Math.min(100, prev.normalityScore + (Math.random() - 0.3) * 0.8)),
        deviationAlert: Math.random() < 0.08,
      }));

      // ~15% chance of a new detection event
      if (Math.random() < 0.15) {
        const tpl = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
        const severity = tpl.baseSeverity;
        const counts = threatCountsRef.current;
        counts[tpl.type] = (counts[tpl.type] || 0) + 1;
        // Escalate severity if same type seen 3+ times
        const escalated = counts[tpl.type] >= 3;
        const finalSeverity = escalated && severity === 'low' ? 'medium'
          : escalated && severity === 'medium' ? 'high' : severity;

        setAiDetections((prev) => [
          {
            id: nextIdRef.current++,
            ...tpl,
            baseSeverity: finalSeverity,
            confidence: Math.floor(Math.random() * 18) + 75,
            ts: Date.now(),
            escalated,
          },
          ...prev.slice(0, 9),
        ]);
        setBlockedToday((n) => n + (tpl.action === 'blocked' ? 1 : 0));
        setCategoryStats((s) => ({
          ...s,
          [tpl.category]: s[tpl.category] + 1,
        }));
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const predictiveModels = [
    { name: 'Threat Prediction',  accuracy: 96.3, type: 'Neural Network',  status: 'active'   },
    { name: 'Anomaly Detection',  accuracy: 92.7, type: 'Machine Learning', status: 'active'   },
    { name: 'Behavior Analysis',  accuracy: 88.9, type: 'Deep Learning',   status: 'training' },
    { name: 'Risk Assessment',    accuracy: 94.1, type: 'Ensemble Model',  status: 'active'   },
  ];

  return (
    <div className="predictive-security">
      <div className="security-header">
        <h3>🔮 Predictive Security</h3>
        <div className={`threat-indicator ${threatLevel}`}>
          {threatLevel === 'low' && '🟢'}
          {threatLevel === 'medium' && '🟡'}
          {threatLevel === 'high' && '🔴'}
          Threat Level: {threatLevel.toUpperCase()}
        </div>
      </div>

      {/* Stats bar */}
      <div className="security-stats-bar">
        <div className="stat-pill">
          <span className="stat-pill-value">{blockedToday}</span>
          <span className="stat-pill-label">Threats Blocked Today</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{categoryStats.network}</span>
          <span className="stat-pill-label">Network Threats</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{categoryStats.behavioral}</span>
          <span className="stat-pill-label">Behavioral Anomalies</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill-value">{behaviorAnalysis.learnedPatterns}</span>
          <span className="stat-pill-label">Learned Patterns</span>
        </div>
      </div>

      <div className="security-dashboard">
        <div className="risk-assessment">
          <h4>⚠️ AI Risk Assessment</h4>
          <div className="risk-meter">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <path d="M 20 160 A 70 70 0 0 1 160 160" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
              <path d="M 20 160 A 70 70 0 0 1 160 160" fill="none"
                stroke={riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981'}
                strokeWidth="12"
                strokeDasharray={`${riskScore * 2.2} 220`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }}
              />
              <text x="90" y="128" textAnchor="middle" fontSize="28" fontWeight="bold" fill="white">
                {riskScore}%
              </text>
              <text x="90" y="148" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.7)">
                Risk Score
              </text>
            </svg>
          </div>
          <div className="sparkline-wrapper">
            <div className="sparkline-title">30-reading risk trend</div>
            <RiskSparkline data={riskHistory} />
          </div>
          <div className="risk-details">
            <div className="risk-factors">
              <div className="factor">Network Exposure: {riskScore > 50 ? 'Elevated' : 'Low'}</div>
              <div className="factor">Behavioral Anomalies: {behaviorAnalysis.anomalyCount}</div>
              <div className="factor">Threat Intelligence: Active</div>
            </div>
          </div>
        </div>

        <div className="ai-detections">
          <h4>🤖 Live Threat Feed</h4>
          <div className="detections-list">
            {aiDetections.slice(0, 6).map((detection) => (
              <div key={detection.id} className={`detection-item ${detection.baseSeverity}`}>
                <div className="detection-header">
                  <span className="detection-type">
                    {detection.escalated && <span className="escalated-badge">↑ ESCALATED</span>}
                    {detection.type}
                  </span>
                  <span className="detection-confidence">{detection.confidence}%</span>
                </div>
                <div className="detection-details">
                  <span className="detection-time">{fmtTs(detection.ts)}</span>
                  <span className={`detection-action ${detection.action}`}>
                    {detection.action.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="behavior-analysis">
          <h4>🧠 Behavioral Analysis</h4>
          <div className="behavior-metrics">
            <div className="behavior-score">
              <span className="behavior-value">{behaviorAnalysis.normalityScore.toFixed(1)}%</span>
              <span className="behavior-label">Normal Behavior</span>
            </div>
            <div className="behavior-stats">
              <div className="stat-item">
                <span className="stat-value">{behaviorAnalysis.learnedPatterns}</span>
                <span className="stat-label">Learned Patterns</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{behaviorAnalysis.anomalyCount}</span>
                <span className="stat-label">Anomalies (24h)</span>
              </div>
            </div>
            {behaviorAnalysis.deviationAlert && (
              <div className="deviation-alert">
                ⚠️ Behavioral deviation detected — Enhanced monitoring active
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ml-models-security">
        <h4>🧠 Predictive Models</h4>
        <div className="models-grid">
          {predictiveModels.map((model, index) => (
            <div key={index} className="model-card">
              <div className="model-info">
                <span className="model-name">{model.name}</span>
                <span className="model-type">{model.type}</span>
              </div>
              <div className="model-metrics">
                <span className="model-accuracy">{model.accuracy}%</span>
                <span className={`model-status ${model.status}`}>
                  {model.status === 'active' ? '🟢' : '🔄'} {model.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictiveSecurity;
