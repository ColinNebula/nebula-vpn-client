import React, { useState, useEffect } from 'react';
import './AdaptiveLearning.css';

const AdaptiveLearning = () => {
  const [learningStatus, setLearningStatus] = useState({
    totalPatterns: 2847,
    newPatternsToday: 23,
    adaptationScore: 94,
    learningEfficiency: 87
  });

  const [userPreferences, setUserPreferences] = useState([
    { category: 'Server Selection', learned: 'Prefers low-latency servers (< 25ms)', confidence: 96, actions: 127 },
    { category: 'Usage Timing', learned: 'Peak usage 7-9 PM weekdays', confidence: 89, actions: 89 },
    { category: 'Security Level', learned: 'Values high security over speed', confidence: 92, actions: 156 },
    { category: 'App Preferences', learned: 'Frequently uses split tunneling', confidence: 84, actions: 67 }
  ]);

  const [adaptiveActions, setAdaptiveActions] = useState([
    { id: 1, action: 'Auto-switched to Singapore server', reason: 'Lower latency detected (18ms vs 45ms)', time: '5 min ago', impact: 'positive' },
    { id: 2, action: 'Enabled enhanced encryption', reason: 'Banking app detected', time: '12 min ago', impact: 'neutral' },
    { id: 3, action: 'Activated kill switch', reason: 'Connection instability predicted', time: '1 hour ago', impact: 'positive' },
    { id: 4, action: 'Adjusted bandwidth allocation', reason: 'Streaming activity detected', time: '2 hours ago', impact: 'positive' }
  ]);

  const [learningModules, setLearningModules] = useState([
    { name: 'Usage Pattern Recognition', progress: 94, status: 'active', accuracy: 91.2 },
    { name: 'Preference Extraction', progress: 87, status: 'learning', accuracy: 88.7 },
    { name: 'Predictive Optimization', progress: 78, status: 'training', accuracy: 85.3 },
    { name: 'Behavioral Adaptation', progress: 92, status: 'active', accuracy: 93.1 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLearningStatus(prev => ({
        ...prev,
        adaptationScore: Math.max(85, Math.min(100, prev.adaptationScore + (Math.random() - 0.3))),
        learningEfficiency: Math.max(75, Math.min(95, prev.learningEfficiency + (Math.random() - 0.4)))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="adaptive-learning">
      <div className="learning-header">
        <h3>🧠 Adaptive Learning</h3>
        <div className="learning-indicator">
          <span className="learning-pulse">🔄</span>
          <span>Continuously Learning</span>
        </div>
      </div>

      <div className="learning-dashboard">
        <div className="learning-overview">
          <div className="overview-card">
            <h4>🎯 Learning Performance</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-value">{learningStatus.adaptationScore}%</span>
                <span className="metric-label">Adaptation Score</span>
              </div>
              <div className="metric">
                <span className="metric-value">{learningStatus.learningEfficiency}%</span>
                <span className="metric-label">Learning Efficiency</span>
              </div>
              <div className="metric">
                <span className="metric-value">{learningStatus.totalPatterns.toLocaleString()}</span>
                <span className="metric-label">Total Patterns</span>
              </div>
              <div className="metric">
                <span className="metric-value">+{learningStatus.newPatternsToday}</span>
                <span className="metric-label">New Today</span>
              </div>
            </div>
          </div>
        </div>

        <div className="user-preferences">
          <h4>🎨 Learned Preferences</h4>
          <div className="preferences-list">
            {userPreferences.map((pref, index) => (
              <div key={index} className="preference-item">
                <div className="preference-header">
                  <span className="preference-category">{pref.category}</span>
                  <div className="preference-confidence">
                    <span className="confidence-value">{pref.confidence}%</span>
                    <span className="confidence-label">confidence</span>
                  </div>
                </div>
                <div className="preference-learned">{pref.learned}</div>
                <div className="preference-stats">
                  <span className="actions-count">{pref.actions} actions analyzed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="adaptive-actions">
          <h4>⚡ Recent Adaptive Actions</h4>
          <div className="actions-timeline">
            {adaptiveActions.map(action => (
              <div key={action.id} className={`action-item ${action.impact}`}>
                <div className="action-indicator">
                  {action.impact === 'positive' && '✅'}
                  {action.impact === 'neutral' && 'ℹ️'}
                  {action.impact === 'negative' && '⚠️'}
                </div>
                <div className="action-content">
                  <div className="action-description">{action.action}</div>
                  <div className="action-reason">{action.reason}</div>
                  <div className="action-time">{action.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="learning-modules">
          <h4>🔧 Learning Modules</h4>
          <div className="modules-grid">
            {learningModules.map((module, index) => (
              <div key={index} className="module-card">
                <div className="module-header">
                  <span className="module-name">{module.name}</span>
                  <span className={`module-status ${module.status}`}>
                    {module.status === 'active' && '🟢'}
                    {module.status === 'learning' && '🟡'}
                    {module.status === 'training' && '🔵'}
                    {module.status}
                  </span>
                </div>
                <div className="module-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${module.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{module.progress}%</span>
                </div>
                <div className="module-accuracy">
                  Accuracy: {module.accuracy}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="learning-controls">
          <h4>⚙️ Learning Settings</h4>
          <div className="controls-grid">
            <div className="control-item">
              <label>Auto-Optimization</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="control-item">
              <label>Predictive Actions</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="control-item">
              <label>Behavior Learning</label>
              <input type="checkbox" defaultChecked />
            </div>
            <div className="control-item">
              <label>Preference Tracking</label>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveLearning;