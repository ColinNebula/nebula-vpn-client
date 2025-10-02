import React, { useState, useEffect } from 'react';
import './AINetworkOptimizer.css';

const AINetworkOptimizer = ({ servers, isConnected, onServerSelect }) => {
  const [aiMode, setAiMode] = useState('adaptive'); // adaptive, performance, efficiency
  const [optimizationData, setOptimizationData] = useState({
    currentScore: 87,
    predictedImprovement: 23,
    recommendedServer: null,
    learningProgress: 76
  });
  const [mlModels, setMlModels] = useState([
    { name: 'Server Selection', accuracy: 94.2, status: 'active', lastTrained: '2 hours ago' },
    { name: 'Traffic Routing', accuracy: 91.7, status: 'active', lastTrained: '4 hours ago' },
    { name: 'Bandwidth Prediction', accuracy: 88.9, status: 'training', lastTrained: '6 hours ago' },
    { name: 'Latency Optimization', accuracy: 96.1, status: 'active', lastTrained: '1 hour ago' }
  ]);
  const [predictions, setPredictions] = useState({
    nextHourTraffic: 156,
    peakLatency: 45,
    bandwidthUtilization: 73,
    connectionStability: 98
  });
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    autoServerSwitch: true,
    loadBalancing: true,
    trafficShaping: true,
    predictiveScaling: false
  });

  useEffect(() => {
    // Simulate AI optimization calculations
    const interval = setInterval(() => {
      setOptimizationData(prev => ({
        ...prev,
        currentScore: Math.min(100, prev.currentScore + (Math.random() - 0.4)),
        predictedImprovement: Math.floor(Math.random() * 30) + 10,
        learningProgress: Math.min(100, prev.learningProgress + 0.5)
      }));

      // Update predictions
      setPredictions(prev => ({
        nextHourTraffic: Math.floor(Math.random() * 200) + 100,
        peakLatency: Math.floor(Math.random() * 50) + 20,
        bandwidthUtilization: Math.floor(Math.random() * 40) + 60,
        connectionStability: Math.floor(Math.random() * 10) + 90
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // AI-powered server recommendation
    if (servers.length > 0) {
      const scores = servers.map(server => ({
        ...server,
        aiScore: calculateAIScore(server)
      }));
      const recommended = scores.reduce((best, current) => 
        current.aiScore > best.aiScore ? current : best
      );
      setOptimizationData(prev => ({ ...prev, recommendedServer: recommended }));
    }
  }, [servers]);

  const calculateAIScore = (server) => {
    // Simulate ML scoring algorithm
    const latencyScore = Math.max(0, 100 - parseInt(server.ping));
    const loadScore = Math.max(0, 100 - server.load);
    const reliabilityScore = Math.random() * 20 + 80;
    const historicalScore = Math.random() * 30 + 70;
    
    return Math.round((latencyScore * 0.3 + loadScore * 0.25 + reliabilityScore * 0.25 + historicalScore * 0.2));
  };

  const triggerAIOptimization = () => {
    alert('🤖 AI Network Optimization Initiated!\n\n• Analyzing current network conditions\n• Evaluating server performance metrics\n• Calculating optimal routing paths\n• Applying machine learning recommendations\n\nOptimization will complete in 30-45 seconds.');
  };

  const retrainModels = () => {
    alert('🧠 ML Model Retraining Started!\n\n• Collecting recent performance data\n• Updating neural network weights\n• Validating model accuracy\n• Deploying improved algorithms\n\nRetraining will complete in 5-10 minutes.');
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="ai-network-optimizer">
      <div className="optimizer-header">
        <h3>🤖 AI Network Optimizer</h3>
        <div className="ai-controls">
          <select 
            value={aiMode} 
            onChange={(e) => setAiMode(e.target.value)}
            className="ai-mode-selector"
          >
            <option value="adaptive">🧠 Adaptive Learning</option>
            <option value="performance">⚡ Performance Priority</option>
            <option value="efficiency">🔋 Efficiency Mode</option>
          </select>
          <button className="optimize-btn" onClick={triggerAIOptimization}>
            🚀 Optimize Now
          </button>
        </div>
      </div>

      {/* AI Performance Dashboard */}
      <div className="ai-dashboard">
        <div className="performance-score">
          <div className="score-visualization">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="12"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={getScoreColor(optimizationData.currentScore)}
                strokeWidth="12"
                strokeDasharray={`${optimizationData.currentScore * 5.02} 502`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
              <text
                x="100"
                y="95"
                textAnchor="middle"
                fontSize="36"
                fontWeight="bold"
                fill="var(--text-primary)"
              >
                {optimizationData.currentScore}
              </text>
              <text
                x="100"
                y="120"
                textAnchor="middle"
                fontSize="14"
                fill="var(--text-secondary)"
              >
                AI Performance Score
              </text>
            </svg>
          </div>
          <div className="score-details">
            <div className="score-metric">
              <span className="metric-label">Predicted Improvement</span>
              <span className="metric-value">+{optimizationData.predictedImprovement}%</span>
            </div>
            <div className="score-metric">
              <span className="metric-label">Learning Progress</span>
              <span className="metric-value">{optimizationData.learningProgress}%</span>
            </div>
            <div className="score-metric">
              <span className="metric-label">AI Mode</span>
              <span className="metric-value">{aiMode}</span>
            </div>
          </div>
        </div>

        {/* ML Models Status */}
        <div className="ml-models">
          <h4>🧠 Machine Learning Models</h4>
          <div className="models-list">
            {mlModels.map((model, index) => (
              <div key={index} className="model-card">
                <div className="model-header">
                  <span className="model-name">{model.name}</span>
                  <span className={`model-status ${model.status}`}>
                    {model.status === 'active' ? '🟢' : '🔄'} {model.status}
                  </span>
                </div>
                <div className="model-metrics">
                  <div className="accuracy-bar">
                    <span className="accuracy-label">Accuracy: {model.accuracy}%</span>
                    <div className="accuracy-fill" style={{ width: `${model.accuracy}%` }}></div>
                  </div>
                  <span className="last-trained">Last trained: {model.lastTrained}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="retrain-btn" onClick={retrainModels}>
            🔄 Retrain Models
          </button>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="ai-recommendations">
        <h4>💡 AI Recommendations</h4>
        <div className="recommendations-grid">
          {optimizationData.recommendedServer && (
            <div className="recommendation-card optimal-server">
              <div className="rec-header">
                <span className="rec-icon">🎯</span>
                <h5>Optimal Server Selection</h5>
              </div>
              <div className="rec-content">
                <div className="server-recommendation">
                  <span className="server-flag">{optimizationData.recommendedServer.flag}</span>
                  <div className="server-details">
                    <span className="server-name">{optimizationData.recommendedServer.name}</span>
                    <span className="ai-score">AI Score: {calculateAIScore(optimizationData.recommendedServer)}/100</span>
                  </div>
                  <button 
                    className="apply-rec-btn"
                    onClick={() => onServerSelect(optimizationData.recommendedServer)}
                  >
                    Apply
                  </button>
                </div>
                <p className="rec-reason">
                  Recommended based on current network conditions, historical performance, and predicted traffic patterns.
                </p>
              </div>
            </div>
          )}

          <div className="recommendation-card traffic-optimization">
            <div className="rec-header">
              <span className="rec-icon">📊</span>
              <h5>Traffic Optimization</h5>
            </div>
            <div className="rec-content">
              <p>Enable adaptive traffic shaping to improve performance by 12-18% during peak hours.</p>
              <label className="rec-toggle">
                <input 
                  type="checkbox"
                  checked={adaptiveSettings.trafficShaping}
                  onChange={(e) => setAdaptiveSettings(prev => ({...prev, trafficShaping: e.target.checked}))}
                />
                <span>Enable Adaptive Traffic Shaping</span>
              </label>
            </div>
          </div>

          <div className="recommendation-card load-balancing">
            <div className="rec-header">
              <span className="rec-icon">⚖️</span>
              <h5>Smart Load Balancing</h5>
            </div>
            <div className="rec-content">
              <p>AI-powered load distribution across multiple servers for optimal performance.</p>
              <label className="rec-toggle">
                <input 
                  type="checkbox"
                  checked={adaptiveSettings.loadBalancing}
                  onChange={(e) => setAdaptiveSettings(prev => ({...prev, loadBalancing: e.target.checked}))}
                />
                <span>Enable Smart Load Balancing</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="predictive-analytics">
        <h4>🔮 Predictive Analytics</h4>
        <div className="predictions-grid">
          <div className="prediction-card">
            <div className="prediction-icon">📈</div>
            <div className="prediction-content">
              <div className="prediction-value">{predictions.nextHourTraffic} MB</div>
              <div className="prediction-label">Predicted Traffic (Next Hour)</div>
              <div className="confidence">Confidence: 94%</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="prediction-icon">⏱️</div>
            <div className="prediction-content">
              <div className="prediction-value">{predictions.peakLatency}ms</div>
              <div className="prediction-label">Peak Latency Forecast</div>
              <div className="confidence">Confidence: 91%</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="prediction-icon">📊</div>
            <div className="prediction-content">
              <div className="prediction-value">{predictions.bandwidthUtilization}%</div>
              <div className="prediction-label">Bandwidth Utilization</div>
              <div className="confidence">Confidence: 87%</div>
            </div>
          </div>
          <div className="prediction-card">
            <div className="prediction-icon">🔗</div>
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
        <h4>⚙️ Adaptive Learning Settings</h4>
        <div className="settings-grid">
          <label className="setting-item">
            <input 
              type="checkbox"
              checked={adaptiveSettings.autoServerSwitch}
              onChange={(e) => setAdaptiveSettings(prev => ({...prev, autoServerSwitch: e.target.checked}))}
            />
            <div className="setting-content">
              <span className="setting-title">Auto Server Switching</span>
              <span className="setting-desc">Automatically switch to optimal servers based on AI analysis</span>
            </div>
          </label>
          <label className="setting-item">
            <input 
              type="checkbox"
              checked={adaptiveSettings.predictiveScaling}
              onChange={(e) => setAdaptiveSettings(prev => ({...prev, predictiveScaling: e.target.checked}))}
            />
            <div className="setting-content">
              <span className="setting-title">Predictive Scaling</span>
              <span className="setting-desc">Pre-allocate resources based on predicted demand</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AINetworkOptimizer;