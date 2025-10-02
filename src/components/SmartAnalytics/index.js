import React, { useState, useEffect } from 'react';
import './SmartAnalytics.css';

const SmartAnalytics = () => {
  const [insights, setInsights] = useState([
    { id: 1, type: 'performance', title: 'Server Switch Recommendation', description: 'AI detected 23% faster speeds available on Singapore server', priority: 'high', confidence: 94 },
    { id: 2, type: 'usage', title: 'Peak Usage Pattern', description: 'Your highest activity is 7-9 PM. Consider scheduling updates during low usage times.', priority: 'medium', confidence: 87 },
    { id: 3, type: 'security', title: 'Enhanced Protection Suggestion', description: 'Based on your browsing patterns, enabling ad blocking could improve speed by 15%', priority: 'medium', confidence: 76 }
  ]);

  const [predictions, setPredictions] = useState({
    nextWeekUsage: { value: 47.8, trend: 'up', confidence: 89 },
    averageSpeed: { value: 128.5, trend: 'stable', confidence: 92 },
    optimalTimes: ['7:00 AM - 9:00 AM', '1:00 PM - 3:00 PM', '11:00 PM - 1:00 AM']
  });

  const [kpiMetrics, setKpiMetrics] = useState([
    { name: 'Connection Reliability', value: 99.7, target: 99.5, status: 'exceeding' },
    { name: 'Average Speed (Mbps)', value: 128.5, target: 100, status: 'exceeding' },
    { name: 'Security Score', value: 96, target: 95, status: 'meeting' },
    { name: 'User Satisfaction', value: 4.8, target: 4.5, status: 'exceeding' }
  ]);

  const automatedReports = [
    { name: 'Weekly Performance', schedule: 'Every Monday 9:00 AM', enabled: true, lastSent: '2 days ago' },
    { name: 'Security Summary', schedule: 'Daily 6:00 PM', enabled: true, lastSent: '5 hours ago' },
    { name: 'Usage Analytics', schedule: 'Monthly 1st', enabled: false, lastSent: '2 weeks ago' },
    { name: 'Optimization Report', schedule: 'Bi-weekly Friday', enabled: true, lastSent: '4 days ago' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setKpiMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * 2)
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="smart-analytics">
      <div className="analytics-header">
        <h3>📊 Smart Analytics</h3>
        <div className="ai-status">
          <span className="ai-indicator">🤖</span>
          <span>AI Analysis Active</span>
        </div>
      </div>

      <div className="analytics-dashboard">
        <div className="insights-section">
          <h4>💡 AI-Driven Insights</h4>
          <div className="insights-list">
            {insights.map(insight => (
              <div key={insight.id} className={`insight-card ${insight.priority}`}>
                <div className="insight-header">
                  <span className="insight-type">
                    {insight.type === 'performance' && '🚀'}
                    {insight.type === 'usage' && '📈'}
                    {insight.type === 'security' && '🛡️'}
                  </span>
                  <span className="insight-title">{insight.title}</span>
                  <span className="insight-confidence">{insight.confidence}%</span>
                </div>
                <p className="insight-description">{insight.description}</p>
                <button className="apply-insight-btn">Apply Suggestion</button>
              </div>
            ))}
          </div>
        </div>

        <div className="predictions-section">
          <h4>🔮 ML Predictions</h4>
          <div className="predictions-grid">
            <div className="prediction-card">
              <h5>Next Week Usage</h5>
              <div className="prediction-value">
                <span className="value">{predictions.nextWeekUsage.value} GB</span>
                <span className={`trend ${predictions.nextWeekUsage.trend}`}>
                  {predictions.nextWeekUsage.trend === 'up' ? '📈' : '📉'} {predictions.nextWeekUsage.trend}
                </span>
              </div>
              <div className="confidence">Confidence: {predictions.nextWeekUsage.confidence}%</div>
            </div>

            <div className="prediction-card">
              <h5>Average Speed</h5>
              <div className="prediction-value">
                <span className="value">{predictions.averageSpeed.value} Mbps</span>
                <span className={`trend ${predictions.averageSpeed.trend}`}>
                  📊 {predictions.averageSpeed.trend}
                </span>
              </div>
              <div className="confidence">Confidence: {predictions.averageSpeed.confidence}%</div>
            </div>

            <div className="prediction-card optimal-times">
              <h5>Optimal Connection Times</h5>
              <div className="time-slots">
                {predictions.optimalTimes.map((time, index) => (
                  <span key={index} className="time-slot">{time}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="kpi-section">
          <h4>📈 Key Performance Indicators</h4>
          <div className="kpi-grid">
            {kpiMetrics.map((metric, index) => (
              <div key={index} className="kpi-card">
                <div className="kpi-name">{metric.name}</div>
                <div className="kpi-value">
                  {metric.name.includes('Satisfaction') 
                    ? `${metric.value.toFixed(1)}/5.0` 
                    : metric.name.includes('Score') 
                    ? `${metric.value.toFixed(1)}%`
                    : `${metric.value.toFixed(1)}${metric.name.includes('Speed') ? ' Mbps' : '%'}`
                  }
                </div>
                <div className="kpi-progress">
                  <div 
                    className="progress-bar"
                    style={{ 
                      width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
                      backgroundColor: metric.status === 'exceeding' ? '#10b981' : '#f59e0b'
                    }}
                  ></div>
                </div>
                <div className={`kpi-status ${metric.status}`}>
                  {metric.status === 'exceeding' ? '✅ Exceeding' : '✓ Meeting'} Target
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reports-section">
          <h4>📧 Automated Reports</h4>
          <div className="reports-list">
            {automatedReports.map((report, index) => (
              <div key={index} className="report-item">
                <div className="report-info">
                  <span className="report-name">{report.name}</span>
                  <span className="report-schedule">{report.schedule}</span>
                </div>
                <div className="report-controls">
                  <span className="last-sent">Last sent: {report.lastSent}</span>
                  <label className="report-toggle">
                    <input 
                      type="checkbox" 
                      checked={report.enabled}
                      onChange={() => {}}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAnalytics;