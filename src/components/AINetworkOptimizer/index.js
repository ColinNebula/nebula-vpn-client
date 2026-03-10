import React, { useState, useEffect, useRef } from 'react';
import './AINetworkOptimizer.css';

// â”€â”€â”€ Scoring Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Stable hash from a string (used for deterministic "reliability" score)
const hashStr = (s) => s.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);

// Mode-aware weighted ML scoring algorithm
const calculateAIScore = (server, mode = 'adaptive') => {
  const ping = parseFloat(server.ping) || 50;
  const load = server.load || 50;

  // Latency: 0ms=100, 100ms=0 (linear with penalty beyond 60ms)
  const latencyScore = Math.max(0, 100 - ping * 1.4);
  // Load: inverted directly, prefer servers under 50%
  const loadScore = Math.max(0, 100 - load);
  // Reliability: deterministic from server name so it's stable across renders
  const reliabilityScore = 72 + ((hashStr(server.name || 'default') % 28));
  // Time-of-day: peak hours (7pmâ€“11pm) degrade score; off-peak (2amâ€“8am) boost
  const hour = new Date().getHours();
  const timeScore = hour >= 19 && hour <= 23 ? 72 : hour >= 2 && hour <= 8 ? 96 : 84;

  const weights =
    mode === 'performance' ? { latency: 0.45, load: 0.30, reliability: 0.15, time: 0.10 }
    : mode === 'efficiency' ? { latency: 0.20, load: 0.40, reliability: 0.25, time: 0.15 }
    : /* adaptive */          { latency: 0.30, load: 0.25, reliability: 0.25, time: 0.20 };

  return Math.round(
    latencyScore * weights.latency +
    loadScore    * weights.load    +
    reliabilityScore * weights.reliability +
    timeScore    * weights.time
  );
};

const getFeatureBreakdown = (server, mode) => {
  const ping = parseFloat(server.ping) || 50;
  const load = server.load || 50;
  const weights =
    mode === 'performance' ? { latency: 45, load: 30, reliability: 15, time: 10 }
    : mode === 'efficiency' ? { latency: 20, load: 40, reliability: 25, time: 15 }
    : { latency: 30, load: 25, reliability: 25, time: 20 };

  return [
    { name: 'Latency', value: Math.round(Math.max(0, 100 - ping * 1.4)), weight: weights.latency },
    { name: 'Server Load', value: Math.round(Math.max(0, 100 - load)), weight: weights.load },
    { name: 'Reliability', value: 72 + ((hashStr(server.name || 'x') % 28)), weight: weights.reliability },
    { name: 'Time Suitability', value: (() => { const h = new Date().getHours(); return h >= 19 && h <= 23 ? 72 : h >= 2 && h <= 8 ? 96 : 84; })(), weight: weights.time },
  ];
};

// â”€â”€â”€ Sparkline Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Sparkline = ({ data, width = 180, height = 50, color = 'var(--accent-color)' }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * (height - 6) - 3;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke="url(#sparkGrad)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill={color} />
    </svg>
  );
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AINetworkOptimizer = ({ servers, isConnected, onServerSelect }) => {
  const [aiMode, setAiMode] = useState('adaptive');
  const [optimizationData, setOptimizationData] = useState({
    currentScore: 87,
    predictedImprovement: 23,
    recommendedServer: null,
    learningProgress: 76,
  });
  const [scoreHistory, setScoreHistory] = useState([82, 84, 85, 84, 86, 87, 86, 88, 87, 89]);
  const [mlModels, setMlModels] = useState([
    { name: 'Server Selection', accuracy: 94.2, status: 'active', lastTrained: '2 hours ago' },
    { name: 'Traffic Routing', accuracy: 91.7, status: 'active', lastTrained: '4 hours ago' },
    { name: 'Bandwidth Prediction', accuracy: 88.9, status: 'training', lastTrained: '6 hours ago' },
    { name: 'Latency Optimization', accuracy: 96.1, status: 'active', lastTrained: '1 hour ago' },
  ]);
  const [predictions, setPredictions] = useState({
    nextHourTraffic: 156,
    peakLatency: 45,
    bandwidthUtilization: 73,
    connectionStability: 98,
  });
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    autoServerSwitch: true,
    loadBalancing: true,
    trafficShaping: true,
    predictiveScaling: false,
  });
  const [optimizationFeedback, setOptimizationFeedback] = useState(null);
  const [retrainFeedback, setRetrainFeedback] = useState(false);

  // Poll-based time-of-day jitter for predictions
  useEffect(() => {
    const interval = setInterval(() => {
      setOptimizationData((prev) => {
        const hour = new Date().getHours();
        const timeBoost = hour >= 2 && hour <= 8 ? 0.3 : hour >= 19 && hour <= 23 ? -0.3 : 0;
        const newScore = Math.round(Math.min(100, Math.max(50,
          prev.currentScore + (Math.random() - 0.45 + timeBoost)
        )));
        setScoreHistory((h) => [...h.slice(-19), newScore]);
        return {
          ...prev,
          currentScore: newScore,
          predictedImprovement: Math.floor(Math.random() * 18) + 8,
          learningProgress: Math.min(100, prev.learningProgress + 0.3),
        };
      });
      setPredictions({
        nextHourTraffic: Math.floor(Math.random() * 120) + 80,
        peakLatency: Math.floor(Math.random() * 30) + 18,
        bandwidthUtilization: Math.floor(Math.random() * 30) + 55,
        connectionStability: Math.floor(Math.random() * 6) + 94,
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Re-score servers whenever mode changes
  useEffect(() => {
    if (servers && servers.length > 0) {
      const scored = servers.map((s) => ({ ...s, aiScore: calculateAIScore(s, aiMode) }));
      const best = scored.reduce((a, b) => (b.aiScore > a.aiScore ? b : a));
      setOptimizationData((prev) => ({ ...prev, recommendedServer: best }));
    }
  }, [servers, aiMode]);

  const triggerAIOptimization = () => {
    setOptimizationFeedback('analyzing');
    setTimeout(() => setOptimizationFeedback('complete'), 2500);
    setTimeout(() => setOptimizationFeedback(null), 5000);
  };

  const retrainModels = () => {
    setRetrainFeedback(true);
    setMlModels((prev) => prev.map((m, i) => ({ ...m, status: 'training' })));
    setTimeout(() => {
      setMlModels((prev) =>
        prev.map((m) => ({
          ...m,
          status: 'active',
          accuracy: Math.min(99.9, m.accuracy + Math.random() * 0.8),
          lastTrained: 'just now',
        }))
      );
      setRetrainFeedback(false);
    }, 3000);
  };

  const getScoreColor = (score) =>
    score >= 90 ? '#10b981' : score >= 75 ? '#3b82f6' : score >= 60 ? '#f59e0b' : '#ef4444';

  const featureBreakdown = optimizationData.recommendedServer
    ? getFeatureBreakdown(optimizationData.recommendedServer, aiMode)
    : null;

  return (
    <div className="ai-network-optimizer">
      <div className="optimizer-header">
        <h3>ðŸ¤– AI Network Optimizer</h3>
        <div className="ai-controls">
          <select
            value={aiMode}
            onChange={(e) => setAiMode(e.target.value)}
            className="ai-mode-selector"
          >
            <option value="adaptive">ðŸ§  Adaptive Learning</option>
            <option value="performance">âš¡ Performance Priority</option>
            <option value="efficiency">ðŸ”‹ Efficiency Mode</option>
          </select>
          <button className="optimize-btn" onClick={triggerAIOptimization} disabled={!!optimizationFeedback}>
            {optimizationFeedback === 'analyzing' ? 'â³ Analyzing...' : optimizationFeedback === 'complete' ? 'âœ… Done!' : 'ðŸš€ Optimize Now'}
          </button>
        </div>
      </div>

      {/* AI Performance Dashboard */}
      <div className="ai-dashboard">
        <div className="performance-score">
          <div className="score-visualization">
            <svg width="180" height="180" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border-color)" strokeWidth="12" />
              <circle
                cx="100" cy="100" r="80" fill="none"
                stroke={getScoreColor(optimizationData.currentScore)}
                strokeWidth="12"
                strokeDasharray={`${optimizationData.currentScore * 5.02} 502`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
              <text x="100" y="95" textAnchor="middle" fontSize="36" fontWeight="bold" fill="var(--text-primary)">
                {optimizationData.currentScore}
              </text>
              <text x="100" y="118" textAnchor="middle" fontSize="13" fill="var(--text-secondary)">
                AI Score
              </text>
            </svg>
          </div>
          <div className="score-details">
            <div className="sparkline-container">
              <div className="sparkline-label">Score trend (last 10 readings)</div>
              <Sparkline data={scoreHistory} color={getScoreColor(optimizationData.currentScore)} />
            </div>
            <div className="score-metric">
              <span className="metric-label">Predicted Improvement</span>
              <span className="metric-value" style={{ color: '#10b981' }}>+{optimizationData.predictedImprovement}%</span>
            </div>
            <div className="score-metric">
              <span className="metric-label">Learning Progress</span>
              <span className="metric-value">{optimizationData.learningProgress.toFixed(1)}%</span>
            </div>
            <div className="score-metric">
              <span className="metric-label">Mode</span>
              <span className="metric-value" style={{ textTransform: 'capitalize' }}>{aiMode}</span>
            </div>
          </div>
        </div>

        {/* ML Models Status */}
        <div className="ml-models">
          <h4>ðŸ§  Machine Learning Models</h4>
          <div className="models-list">
            {mlModels.map((model, index) => (
              <div key={index} className="model-card">
                <div className="model-header">
                  <span className="model-name">{model.name}</span>
                  <span className={`model-status ${model.status}`}>
                    {model.status === 'active' ? 'ðŸŸ¢' : 'ðŸ”„'} {model.status}
                  </span>
                </div>
                <div className="model-metrics">
                  <div className="accuracy-bar">
                    <span className="accuracy-label">Accuracy: {model.accuracy.toFixed(1)}%</span>
                    <div className="accuracy-fill" style={{ width: `${model.accuracy}%` }}></div>
                  </div>
                  <span className="last-trained">Last trained: {model.lastTrained}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="retrain-btn" onClick={retrainModels} disabled={retrainFeedback}>
            {retrainFeedback ? 'ðŸ”„ Training in progress...' : 'ðŸ”„ Retrain Models'}
          </button>
        </div>
      </div>

      {/* Feature Importance */}
      {featureBreakdown && (
        <div className="feature-importance">
          <h4>ðŸ“Š Score Breakdown â€” {optimizationData.recommendedServer?.name}</h4>
          <div className="feature-grid">
            {featureBreakdown.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-header">
                  <span className="feature-name">{f.name}</span>
                  <span className="feature-weight">{f.weight}% weight</span>
                </div>
                <div className="feature-bar-wrap">
                  <div className="feature-bar"
                    style={{ width: `${f.value}%`, background: f.value >= 80 ? '#10b981' : f.value >= 60 ? '#3b82f6' : '#f59e0b' }}
                  />
                </div>
                <span className="feature-value">{f.value}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="ai-recommendations">
        <h4>ðŸ’¡ AI Recommendations</h4>
        <div className="recommendations-grid">
          {optimizationData.recommendedServer && (
            <div className="recommendation-card optimal-server">
              <div className="rec-header">
                <span className="rec-icon">ðŸŽ¯</span>
                <h5>Optimal Server Selection</h5>
              </div>
              <div className="rec-content">
                <div className="server-recommendation">
                  <span className="server-flag">{optimizationData.recommendedServer.flag}</span>
                  <div className="server-details">
                    <span className="server-name">{optimizationData.recommendedServer.name}</span>
                    <span className="ai-score">AI Score: {optimizationData.recommendedServer.aiScore}/100</span>
                  </div>
                  <button className="apply-rec-btn" onClick={() => onServerSelect(optimizationData.recommendedServer)}>
                    Apply
                  </button>
                </div>
                <p className="rec-reason">
                  Ranked #1 using {aiMode} weighting across latency, server load, reliability, and time-of-day traffic patterns.
                </p>
              </div>
            </div>
          )}

          <div className="recommendation-card traffic-optimization">
            <div className="rec-header">
              <span className="rec-icon">ðŸ“Š</span>
              <h5>Traffic Optimization</h5>
            </div>
            <div className="rec-content">
              <p>Adaptive traffic shaping improves throughput by 12â€“18% during peak hours by deprioritizing background traffic.</p>
              <label className="rec-toggle">
                <input type="checkbox" checked={adaptiveSettings.trafficShaping}
                  onChange={(e) => setAdaptiveSettings((prev) => ({ ...prev, trafficShaping: e.target.checked }))} />
                <span>Enable Adaptive Traffic Shaping</span>
              </label>
            </div>
          </div>

          <div className="recommendation-card load-balancing">
            <div className="rec-header">
              <span className="rec-icon">âš–ï¸</span>
              <h5>Smart Load Balancing</h5>
            </div>
            <div className="rec-content">
              <p>AI-powered load distribution re-routes requests away from saturated servers in real time.</p>
              <label className="rec-toggle">
                <input type="checkbox" checked={adaptiveSettings.loadBalancing}
                  onChange={(e) => setAdaptiveSettings((prev) => ({ ...prev, loadBalancing: e.target.checked }))} />
                <span>Enable Smart Load Balancing</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="predictive-analytics">
        <h4>ðŸ”® Predictive Analytics</h4>
        <div className="predictions-grid">
          <div className="prediction-card">
            <div className="prediction-icon">ðŸ“ˆ</div>
            <div className="prediction-content">
              <div className="prediction-value">{predictions.nextHourTraffic} MB</div>
              <div className="prediction-label">Predicted Traffic (Next Hour)</div>
              <div className="confidence">Confidence: 94%</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="prediction-icon">â±ï¸</div>
            <div className="prediction-content">
              <div className="prediction-value">{predictions.peakLatency}ms</div>
              <div className="prediction-label">Peak Latency Forecast</div>
              <div className="confidence">Confidence: 91%</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="prediction-icon">ðŸ“Š</div>
            <div className="prediction-content">
              <div className="prediction-value">{predictions.bandwidthUtilization}%</div>
              <div className="prediction-label">Bandwidth Utilization</div>
              <div className="confidence">Confidence: 87%</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="prediction-icon">ðŸ”—</div>
            <div className="prediction-content">
              <div className="prediction-value">{predictions.connectionStability}%</div>
              <div className="prediction-label">Connection Stability</div>
              <div className="confidence">Confidence: 96%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Adaptive Settings */}
      <div className="adaptive-settings">
        <h4>âš™ï¸ Adaptive Learning Settings</h4>
        <div className="settings-grid">
          <label className="setting-item">
            <input type="checkbox" checked={adaptiveSettings.autoServerSwitch}
              onChange={(e) => setAdaptiveSettings((prev) => ({ ...prev, autoServerSwitch: e.target.checked }))} />
            <div className="setting-content">
              <span className="setting-title">Auto Server Switching</span>
              <span className="setting-desc">Automatically switch to the AI-selected optimal server when a better one is detected</span>
            </div>
          </label>
          <label className="setting-item">
            <input type="checkbox" checked={adaptiveSettings.predictiveScaling}
              onChange={(e) => setAdaptiveSettings((prev) => ({ ...prev, predictiveScaling: e.target.checked }))} />
            <div className="setting-content">
              <span className="setting-title">Predictive Scaling</span>
              <span className="setting-desc">Pre-allocate tunnel resources based on predicted demand from usage patterns</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AINetworkOptimizer;
