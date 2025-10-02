import React, { useState } from 'react';
import './AdvancedAnalytics.css';

const AdvancedAnalytics = () => {
  const [reportType, setReportType] = useState('executive');
  const [timeRange, setTimeRange] = useState('30d');

  const kpiData = {
    uptime: 99.97,
    avgSpeed: 87.3,
    dataTransfer: 2.4,
    threatBlocked: 147,
    compliance: 94
  };

  const reportTypes = [
    { id: 'executive', name: '📊 Executive Summary', desc: 'High-level KPIs and trends' },
    { id: 'technical', name: '⚙️ Technical Report', desc: 'Detailed metrics and performance' },
    { id: 'security', name: '🛡️ Security Analysis', desc: 'Threat detection and prevention' },
    { id: 'compliance', name: '📋 Compliance Report', desc: 'Regulatory compliance status' }
  ];

  const customMetrics = [
    { id: 1, name: 'Connection Success Rate', value: '98.7%', trend: 'up', change: '+0.3%' },
    { id: 2, name: 'Average Session Duration', value: '47 min', trend: 'up', change: '+12%' },
    { id: 3, name: 'Peak Concurrent Users', value: '1,247', trend: 'up', change: '+8%' },
    { id: 4, name: 'Data Cost Savings', value: '$12.4K', trend: 'up', change: '+15%' }
  ];

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <h3>📊 Advanced Analytics</h3>
        <div className="analytics-controls">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="time-selector">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="export-btn">📤 Export Report</button>
        </div>
      </div>

      <div className="report-selector">
        {reportTypes.map(type => (
          <button
            key={type.id}
            className={`report-type ${reportType === type.id ? 'active' : ''}`}
            onClick={() => setReportType(type.id)}
          >
            <span className="type-name">{type.name}</span>
            <span className="type-desc">{type.desc}</span>
          </button>
        ))}
      </div>

      <div className="kpi-dashboard">
        <div className="kpi-card">
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <div className="kpi-value">{kpiData.uptime}%</div>
            <div className="kpi-label">Service Uptime</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⚡</div>
          <div className="kpi-content">
            <div className="kpi-value">{kpiData.avgSpeed} Mbps</div>
            <div className="kpi-label">Avg Speed</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <div className="kpi-value">{kpiData.dataTransfer} TB</div>
            <div className="kpi-label">Data Transfer</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🛡️</div>
          <div className="kpi-content">
            <div className="kpi-value">{kpiData.threatBlocked}</div>
            <div className="kpi-label">Threats Blocked</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-content">
            <div className="kpi-value">{kpiData.compliance}%</div>
            <div className="kpi-label">Compliance</div>
          </div>
        </div>
      </div>

      <div className="custom-metrics">
        <h4>📈 Custom Metrics</h4>
        <div className="metrics-grid">
          {customMetrics.map(metric => (
            <div key={metric.id} className="metric-card">
              <div className="metric-header">
                <span className="metric-name">{metric.name}</span>
                <span className={`trend-indicator ${metric.trend}`}>
                  {metric.trend === 'up' ? '📈' : '📉'} {metric.change}
                </span>
              </div>
              <div className="metric-value">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="scheduled-reports">
        <h4>📅 Scheduled Reports</h4>
        <div className="reports-list">
          <div className="report-item">
            <span className="report-name">Weekly Executive Summary</span>
            <span className="report-schedule">Every Monday 9:00 AM</span>
            <span className="report-status active">Active</span>
          </div>
          <div className="report-item">
            <span className="report-name">Monthly Compliance Report</span>
            <span className="report-schedule">1st of every month</span>
            <span className="report-status active">Active</span>
          </div>
          <div className="report-item">
            <span className="report-name">Security Incident Summary</span>
            <span className="report-schedule">Daily 6:00 PM</span>
            <span className="report-status paused">Paused</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;