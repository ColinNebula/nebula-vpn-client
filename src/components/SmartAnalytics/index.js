import React, { useState, useEffect } from 'react';
import './SmartAnalytics.css';

// â”€â”€â”€ Mini Sparkline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MiniSparkline = ({ data, width = 80, height = 28, color = '#60a5fa' }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SmartAnalytics = () => {
  const [insights, setInsights] = useState([
    { id: 1, type: 'performance', title: 'Server Switch Recommendation', description: 'AI detected 23% faster speeds available on Singapore server. Latency difference: 18ms vs 45ms current.', priority: 'high', confidence: 94, dismissed: false },
    { id: 2, type: 'usage', title: 'Peak Usage Pattern Detected', description: 'Your highest activity is 7â€“9 PM. AI recommends scheduling bandwidth-heavy tasks for 2â€“6 AM (off-peak).', priority: 'medium', confidence: 87, dismissed: false },
    { id: 3, type: 'security', title: 'Enhanced Protection Available', description: 'DNS-over-HTTPS not enabled. Activating it would prevent ISP DNS logging and add a privacy layer.', priority: 'medium', confidence: 81, dismissed: false },
    { id: 4, type: 'performance', title: 'Split Tunneling Opportunity', description: 'Streaming apps detected in traffic. Using split tunneling for Netflix/Spotify could improve VPN speed by 19%.', priority: 'low', confidence: 76, dismissed: false },
  ]);

  const [predictions, setPredictions] = useState({
    nextWeekUsage: { value: 47.8, trend: 'up', confidence: 89 },
    averageSpeed: { value: 128.5, trend: 'stable', confidence: 92 },
    optimalTimes: ['7:00 AM â€“ 9:00 AM', '1:00 PM â€“ 3:00 PM', '11:00 PM â€“ 1:00 AM'],
  });

  // KPI metrics with history arrays for sparklines
  const [kpiMetrics, setKpiMetrics] = useState([
    { name: 'Connection Reliability', value: 99.7, target: 99.5, status: 'exceeding', history: [99.2, 99.4, 99.5, 99.6, 99.7, 99.5, 99.7, 99.7] },
    { name: 'Average Speed (Mbps)',   value: 128.5, target: 100, status: 'exceeding', history: [115, 120, 118, 125, 128, 122, 130, 128] },
    { name: 'Security Score',         value: 96,    target: 95,  status: 'meeting',   history: [92, 93, 94, 95, 95, 96, 95, 96] },
    { name: 'Threat Response Time',   value: 1.8,   target: 2.0, status: 'exceeding', history: [2.2, 2.1, 2.0, 1.9, 1.9, 1.8, 1.8, 1.8] },
  ]);

  const [reports, setReports] = useState([
    { id: 1, name: 'Weekly Performance', schedule: 'Every Monday 9:00 AM', enabled: true, lastSent: '2 days ago' },
    { id: 2, name: 'Security Summary',   schedule: 'Daily 6:00 PM',         enabled: true, lastSent: '5 hours ago' },
    { id: 3, name: 'Usage Analytics',    schedule: 'Monthly 1st',           enabled: false, lastSent: '2 weeks ago' },
    { id: 4, name: 'Optimization Report', schedule: 'Bi-weekly Friday',     enabled: true, lastSent: '4 days ago' },
  ]);

  const [exporting, setExporting] = useState(false);

  // Drift KPI values and extend history
  useEffect(() => {
    const interval = setInterval(() => {
      setKpiMetrics((prev) =>
        prev.map((metric) => {
          const delta = (Math.random() - 0.48) * 1.5;
          const next = Math.max(0, metric.value + delta);
          return {
            ...metric,
            value: Math.round(next * 10) / 10,
            status: next >= metric.target ? 'exceeding' : 'meeting',
            history: [...metric.history.slice(-19), Math.round(next * 10) / 10],
          };
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleReport = (id) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const dismissInsight = (id) => {
    setInsights((prev) => prev.map((ins) => ins.id === id ? { ...ins, dismissed: true } : ins));
  };

  const applyInsight = (id) => {
    setInsights((prev) => prev.map((ins) => ins.id === id ? { ...ins, applied: true } : ins));
  };

  const exportData = () => {
    setExporting(true);
    const payload = {
      exported: new Date().toISOString(),
      kpiMetrics: kpiMetrics.map(({ name, value, target, status }) => ({ name, value, target, status })),
      predictions,
      reports: reports.map(({ name, enabled }) => ({ name, enabled })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nebula-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 1500);
  };

  const formatKpiValue = (metric) => {
    if (metric.name.includes('Satisfaction')) return `${metric.value.toFixed(1)}/5.0`;
    if (metric.name.includes('Score'))       return `${metric.value.toFixed(1)}%`;
    if (metric.name.includes('Response'))    return `${metric.value.toFixed(1)}s`;
    if (metric.name.includes('Speed'))       return `${metric.value.toFixed(1)} Mbps`;
    return `${metric.value.toFixed(1)}%`;
  };

  const getSparklineColor = (metric) =>
    metric.status === 'exceeding' ? '#10b981' : '#f59e0b';

  const activeInsights = insights.filter((i) => !i.dismissed);

  return (
    <div className="smart-analytics">
      <div className="analytics-header">
        <h3>ðŸ“Š Smart Analytics</h3>
        <div className="analytics-header-right">
          <div className="ai-status">
            <span className="ai-indicator">ðŸ¤–</span>
            <span>AI Analysis Active</span>
          </div>
          <button className="export-btn" onClick={exportData} disabled={exporting}>
            {exporting ? 'â³ Exporting...' : 'ðŸ“¥ Export Data'}
          </button>
        </div>
      </div>

      <div className="analytics-dashboard">
        {/* AI-Driven Insights */}
        <div className="insights-section">
          <h4>ðŸ’¡ AI-Driven Insights ({activeInsights.length} active)</h4>
          <div className="insights-list">
            {activeInsights.map((insight) => (
              <div key={insight.id} className={`insight-card ${insight.priority} ${insight.applied ? 'applied' : ''}`}>
                <div className="insight-header">
                  <span className="insight-type">
                    {insight.type === 'performance' && 'ðŸš€'}
                    {insight.type === 'usage' && 'ðŸ“ˆ'}
                    {insight.type === 'security' && 'ðŸ›¡ï¸'}
                  </span>
                  <span className="insight-title">{insight.title}</span>
                  <span className="insight-confidence">{insight.confidence}%</span>
                </div>
                <p className="insight-description">{insight.description}</p>
                <div className="insight-actions">
                  {!insight.applied
                    ? <button className="apply-insight-btn" onClick={() => applyInsight(insight.id)}>âœ… Apply</button>
                    : <span className="applied-label">âœ… Applied</span>
                  }
                  <button className="dismiss-btn" onClick={() => dismissInsight(insight.id)}>âœ•</button>
                </div>
              </div>
            ))}
            {activeInsights.length === 0 && (
              <div className="no-insights">âœ… All insights addressed â€” you're fully optimised!</div>
            )}
          </div>
        </div>

        {/* ML Predictions */}
        <div className="predictions-section">
          <h4>ðŸ”® ML Predictions</h4>
          <div className="predictions-grid">
            <div className="prediction-card">
              <h5>Next Week Usage</h5>
              <div className="prediction-value">
                <span className="value">{predictions.nextWeekUsage.value} GB</span>
                <span className={`trend ${predictions.nextWeekUsage.trend}`}>
                  {predictions.nextWeekUsage.trend === 'up' ? 'ðŸ“ˆ' : 'ðŸ“‰'} {predictions.nextWeekUsage.trend}
                </span>
              </div>
              <div className="confidence">Confidence: {predictions.nextWeekUsage.confidence}%</div>
            </div>
            <div className="prediction-card">
              <h5>Average Speed</h5>
              <div className="prediction-value">
                <span className="value">{predictions.averageSpeed.value} Mbps</span>
                <span className={`trend ${predictions.averageSpeed.trend}`}>
                  ðŸ“Š {predictions.averageSpeed.trend}
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

        {/* KPI metrics with sparklines */}
        <div className="kpi-section">
          <h4>ðŸ“ˆ Key Performance Indicators</h4>
          <div className="kpi-grid">
            {kpiMetrics.map((metric, index) => (
              <div key={index} className="kpi-card">
                <div className="kpi-name">{metric.name}</div>
                <div className="kpi-top-row">
                  <div className="kpi-value">{formatKpiValue(metric)}</div>
                  <MiniSparkline data={metric.history} color={getSparklineColor(metric)} />
                </div>
                <div className="kpi-progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
                      backgroundColor: metric.status === 'exceeding' ? '#10b981' : '#f59e0b',
                    }}
                  ></div>
                </div>
                <div className={`kpi-status ${metric.status}`}>
                  {metric.status === 'exceeding' ? 'âœ… Exceeding' : 'âœ“ Meeting'} Target ({metric.target}{metric.name.includes('Speed') ? ' Mbps' : metric.name.includes('Response') ? 's' : '%'})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automated Reports */}
        <div className="reports-section">
          <h4>ðŸ“§ Automated Reports</h4>
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report.id} className={`report-item ${report.enabled ? 'enabled' : 'disabled'}`}>
                <div className="report-info">
                  <span className="report-name">{report.name}</span>
                  <span className="report-schedule">{report.schedule}</span>
                </div>
                <div className="report-controls">
                  <span className="last-sent">Last: {report.lastSent}</span>
                  <label className="report-toggle">
                    <input
                      type="checkbox"
                      checked={report.enabled}
                      onChange={() => toggleReport(report.id)}
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
