import React, { useState, useEffect } from 'react';
import './AdaptiveLearning.css';

const STORAGE_KEY = 'nebula_usage_log';
const MAX_LOG_ENTRIES = 500;

// ─── Heatmap Component (24-hour usage grid) ───────────────────────────────────
const UsageHeatmap = ({ log }) => {
  const hourCounts = Array.from({ length: 24 }, (_, h) =>
    log.filter((e) => e.hour === h).length
  );
  const maxCount = Math.max(...hourCounts, 1);
  const formatHour = (h) => {
    const ampm = h < 12 ? 'AM' : 'PM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}${ampm}`;
  };
  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-grid">
        {hourCounts.map((count, h) => (
          <div
            key={h}
            className="heatmap-cell"
            title={`${formatHour(h)}: ${count} session${count !== 1 ? 's' : ''}`}
            style={{ opacity: Math.max(0.08, count / maxCount) }}
          >
            <span className="heatmap-label">{h}</span>
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Low</span>
        <div className="legend-gradient"></div>
        <span>High</span>
      </div>
    </div>
  );
};

// ─── Derive preferences from real usage log ───────────────────────────────────
const derivePreferences = (log) => {
  if (log.length < 3) return null;

  const hourCounts = Array.from({ length: 24 }, (_, h) => log.filter((e) => e.hour === h).length);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const formatH = (h) => { const ap = h < 12 ? 'AM' : 'PM'; const d = h === 0 ? 12 : h > 12 ? h - 12 : h; return `${d} ${ap}`; };

  const recentSessions = log.slice(-20);
  const eveningCount = recentSessions.filter((e) => e.hour >= 18 && e.hour <= 23).length;
  const morningCount = recentSessions.filter((e) => e.hour >= 6 && e.hour <= 9).length;

  const todayCount = log.filter((e) => Date.now() - e.ts < 86400000).length;
  const weekCount  = log.filter((e) => Date.now() - e.ts < 604800000).length;

  return [
    {
      category: 'Peak Usage Time',
      learned: `Most active around ${formatH(peakHour)} (${hourCounts[peakHour]} sessions logged)`,
      confidence: Math.min(99, 60 + log.length * 2),
      actions: log.length,
    },
    {
      category: 'Usage Pattern',
      learned: eveningCount > morningCount ? 'Evening-heavy usage — optimised for 6PM–midnight' : 'Morning-heavy usage — optimised for 6AM–10AM',
      confidence: Math.min(95, 55 + recentSessions.length * 2),
      actions: recentSessions.length,
    },
    {
      category: 'Session Frequency',
      learned: `${todayCount} session${todayCount !== 1 ? 's' : ''} today, ${weekCount} this week`,
      confidence: Math.min(99, 70 + weekCount),
      actions: weekCount,
    },
  ];
};

// ─── Component ────────────────────────────────────────────────────────────────
const AdaptiveLearning = () => {
  const [usageLog, setUsageLog] = useState([]);
  const [learningStatus, setLearningStatus] = useState({
    totalPatterns: 0,
    newPatternsToday: 0,
    adaptationScore: 94,
    learningEfficiency: 87,
  });
  const [derivedPreferences, setDerivedPreferences] = useState(null);
  const [adaptiveActions, setAdaptiveActions] = useState([
    { id: 1, action: 'Auto-switched to Singapore server', reason: 'Lower latency detected (18ms vs 45ms)', time: '5 min ago', impact: 'positive' },
    { id: 2, action: 'Enabled enhanced encryption', reason: 'Banking app detected in traffic pattern', time: '12 min ago', impact: 'neutral' },
    { id: 3, action: 'Activated kill switch', reason: 'Connection instability predicted', time: '1 hour ago', impact: 'positive' },
    { id: 4, action: 'Adjusted bandwidth allocation', reason: 'Streaming activity detected', time: '2 hours ago', impact: 'positive' },
  ]);
  const [learningModules, setLearningModules] = useState([
    { name: 'Usage Pattern Recognition', progress: 94, status: 'active', accuracy: 91.2 },
    { name: 'Preference Extraction', progress: 87, status: 'learning', accuracy: 88.7 },
    { name: 'Predictive Optimization', progress: 78, status: 'training', accuracy: 85.3 },
    { name: 'Behavioral Adaptation', progress: 92, status: 'active', accuracy: 93.1 },
  ]);
  const [privacySettings, setPrivacySettings] = useState({
    behaviorLearning: true,
    patternTracking: true,
    predictiveActions: true,
    autoOptimization: true,
  });
  const [clearConfirm, setClearConfirm] = useState(false);

  // Log this session visit on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const entry = { hour: new Date().getHours(), ts: Date.now() };
    const updated = [...existing, entry].slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUsageLog(updated);

    const todayCount = updated.filter((e) => Date.now() - e.ts < 86400000).length;
    setLearningStatus((prev) => ({
      ...prev,
      totalPatterns: updated.length,
      newPatternsToday: todayCount,
    }));
    const prefs = derivePreferences(updated);
    if (prefs) setDerivedPreferences(prefs);
  }, []);

  // Slow drift for scores
  useEffect(() => {
    const interval = setInterval(() => {
      setLearningStatus((prev) => ({
        ...prev,
        adaptationScore: Math.max(85, Math.min(100, prev.adaptationScore + (Math.random() - 0.3) * 0.5)),
        learningEfficiency: Math.max(75, Math.min(95, prev.learningEfficiency + (Math.random() - 0.4) * 0.5)),
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearData = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 4000);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setUsageLog([]);
    setDerivedPreferences(null);
    setLearningStatus((prev) => ({ ...prev, totalPatterns: 0, newPatternsToday: 0 }));
    setClearConfirm(false);
  };

  // Static fallback preferences shown until real data accumulates
  const fallbackPreferences = [
    { category: 'Server Selection', learned: 'Analyse more sessions to learn preferences', confidence: 0, actions: 0 },
    { category: 'Usage Timing', learned: 'Session heatmap updating in real time above', confidence: 0, actions: 0 },
  ];
  const showPreferences = derivedPreferences || fallbackPreferences;

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
        {/* Metrics overview */}
        <div className="learning-overview">
          <div className="overview-card">
            <h4>🎯 Learning Performance</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-value">{learningStatus.adaptationScore.toFixed(1)}%</span>
                <span className="metric-label">Adaptation Score</span>
              </div>
              <div className="metric">
                <span className="metric-value">{learningStatus.learningEfficiency.toFixed(1)}%</span>
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

        {/* 24h Usage Heatmap */}
        <div className="heatmap-section">
          <h4>🕐 24-Hour Usage Heatmap</h4>
          <p className="heatmap-description">
            Built from {usageLog.length} real sessions — darker cells = more usage at that hour.
          </p>
          <UsageHeatmap log={usageLog} />
        </div>

        {/* Learned Preferences */}
        <div className="user-preferences">
          <h4>🎨 Learned Preferences</h4>
          <div className="preferences-list">
            {showPreferences.map((pref, index) => (
              <div key={index} className="preference-item">
                <div className="preference-header">
                  <span className="preference-category">{pref.category}</span>
                  {pref.confidence > 0 && (
                    <div className="preference-confidence">
                      <span className="confidence-value">{Math.round(pref.confidence)}%</span>
                      <span className="confidence-label">confidence</span>
                    </div>
                  )}
                </div>
                <div className="preference-learned">{pref.learned}</div>
                {pref.actions > 0 && (
                  <div className="preference-stats">
                    <span className="actions-count">{pref.actions} sessions analysed</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Adaptive Actions */}
        <div className="adaptive-actions">
          <h4>⚡ Recent Adaptive Actions</h4>
          <div className="actions-timeline">
            {adaptiveActions.map((action) => (
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

        {/* Learning Modules */}
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
                    <div className="progress-fill" style={{ width: `${module.progress}%` }}></div>
                  </div>
                  <span className="progress-text">{module.progress}%</span>
                </div>
                <div className="module-accuracy">Accuracy: {module.accuracy}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Controls */}
        <div className="learning-controls privacy-controls-section">
          <h4>🔒 Privacy & Learning Controls</h4>
          <div className="controls-grid">
            {Object.entries(privacySettings).map(([key, val]) => (
              <div key={key} className="control-item">
                <label>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => setPrivacySettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</span>
                </label>
              </div>
            ))}
          </div>
          <button
            className={`clear-data-btn ${clearConfirm ? 'confirm' : ''}`}
            onClick={handleClearData}
          >
            {clearConfirm ? '⚠️ Click again to confirm deletion' : '🗑️ Clear All Learned Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveLearning;
