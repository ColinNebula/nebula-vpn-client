import React, { useState, useEffect } from 'react';
import './PredictiveSecurity.css';

const PredictiveSecurity = () => {
  const [threatLevel, setThreatLevel] = useState('medium');
  const [aiDetections, setAiDetections] = useState([
    { id: 1, type: 'Anomalous Traffic Pattern', severity: 'high', confidence: 94, timestamp: '2 min ago', action: 'blocked' },
    { id: 2, type: 'Suspicious DNS Query', severity: 'medium', confidence: 87, timestamp: '5 min ago', action: 'monitored' },
    { id: 3, type: 'Unusual Connection Timing', severity: 'low', confidence: 76, timestamp: '12 min ago', action: 'flagged' }
  ]);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState({
    normalityScore: 89,
    deviationAlert: false,
    learnedPatterns: 156,
    anomalyCount: 3
  });
  const [riskScore, setRiskScore] = useState(23);

  useEffect(() => {
    const interval = setInterval(() => {
      setRiskScore(prev => Math.max(0, Math.min(100, prev + (Math.random() - 0.6) * 5)));
      setBehaviorAnalysis(prev => ({
        ...prev,
        normalityScore: Math.max(70, Math.min(100, prev.normalityScore + (Math.random() - 0.3))),
        deviationAlert: Math.random() < 0.1
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const predictiveModels = [
    { name: 'Threat Prediction', accuracy: 96.3, type: 'Neural Network', status: 'active' },
    { name: 'Anomaly Detection', accuracy: 92.7, type: 'Machine Learning', status: 'active' },
    { name: 'Behavior Analysis', accuracy: 88.9, type: 'Deep Learning', status: 'training' },
    { name: 'Risk Assessment', accuracy: 94.1, type: 'Ensemble Model', status: 'active' }
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

      <div className="security-dashboard">
        <div className="risk-assessment">
          <h4>⚠️ AI Risk Assessment</h4>
          <div className="risk-meter">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <path
                d="M 20 160 A 70 70 0 0 1 160 160"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="12"
              />
              <path
                d="M 20 160 A 70 70 0 0 1 160 160"
                fill="none"
                stroke={riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981'}
                strokeWidth="12"
                strokeDasharray={`${riskScore * 2.2} 220`}
                strokeLinecap="round"
              />
              <text x="90" y="130" textAnchor="middle" fontSize="28" fontWeight="bold" fill="var(--text-primary)">
                {riskScore}%
              </text>
              <text x="90" y="150" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
                Risk Score
              </text>
            </svg>
          </div>
          <div className="risk-details">
            <div className="risk-factors">
              <div className="factor">Network Exposure: Low</div>
              <div className="factor">Behavioral Anomalies: {behaviorAnalysis.anomalyCount}</div>
              <div className="factor">Threat Intelligence: Active</div>
            </div>
          </div>
        </div>

        <div className="ai-detections">
          <h4>🤖 AI Threat Detections</h4>
          <div className="detections-list">
            {aiDetections.map(detection => (
              <div key={detection.id} className={`detection-item ${detection.severity}`}>
                <div className="detection-header">
                  <span className="detection-type">{detection.type}</span>
                  <span className="detection-confidence">{detection.confidence}% confidence</span>
                </div>
                <div className="detection-details">
                  <span className="detection-time">{detection.timestamp}</span>
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
              <span className="behavior-value">{behaviorAnalysis.normalityScore}%</span>
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
                ⚠️ Behavioral deviation detected - Enhanced monitoring active
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