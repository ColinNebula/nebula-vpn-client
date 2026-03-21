import React, { useState, useEffect } from 'react';
import './TrafficAnalytics.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

const TrafficAnalytics = ({ isConnected, connectionTime, trafficData }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [dataType, setDataType] = useState('bandwidth');
  const [stats, setStats] = useState({
    totalData: 0,
    uploadData: 0,
    downloadData: 0,
    peakSpeed: 0,
    avgSpeed: 0,
    sessions: 0
  });

  const [chartData, setChartData] = useState({
    bandwidth: [],
    upload: [],
    download: [],
    labels: []
  });

  const [realtimeData, setRealtimeData] = useState({
    currentUpload: 0,
    currentDownload: 0,
    currentTotal: 0
  });

  // Load historical connection data from the API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const resp = await fetch(`${API_BASE}/analytics/history`, {
          headers: authHeader(),
        });
        if (!resp.ok) throw new Error('Failed to fetch history');
        const data = await resp.json();
        const history = Array.isArray(data.history) ? data.history : (Array.isArray(data) ? data : []);

        if (history.length === 0) {
          // No history yet — leave chart empty with zero baselines
          setChartData({ labels: [], bandwidth: [], upload: [], download: [] });
          setStats({ totalData: '0.00', uploadData: '0.00', downloadData: '0.00', peakSpeed: '0.00', avgSpeed: '0.00', sessions: 0 });
          return;
        }

        // Bucket by time range
        const now = Date.now();
        const rangeCutoff = {
          '1h':  60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d':  7  * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
        }[timeRange] || 24 * 60 * 60 * 1000;

        const filtered = history.filter(e => {
          const ts = new Date(e.timestamp || e.createdAt || e.date || 0).getTime();
          return now - ts <= rangeCutoff;
        });

        const points = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
        const bucketMs = rangeCutoff / points;
        const labels = [];
        const download = [];
        const upload = [];

        for (let i = 0; i < points; i++) {
          const bucketStart = now - rangeCutoff + i * bucketMs;
          const bucketEnd   = bucketStart + bucketMs;
          const inBucket = filtered.filter(e => {
            const ts = new Date(e.timestamp || e.createdAt || e.date || 0).getTime();
            return ts >= bucketStart && ts < bucketEnd;
          });
          const dlSum = inBucket.reduce((s, e) => s + (e.downloadKB || e.download || 0) / 1024, 0); // → MB
          const ulSum = inBucket.reduce((s, e) => s + (e.uploadKB   || e.upload   || 0) / 1024, 0);
          download.push(parseFloat(dlSum.toFixed(2)));
          upload.push(parseFloat(ulSum.toFixed(2)));

          if (timeRange === '1h') labels.push(`${i * 5}m`);
          else if (timeRange === '24h') labels.push(`${i}h`);
          else labels.push(`Day ${i + 1}`);
        }

        const bandwidth = download.map((d, i) => d + upload[i]);
        setChartData({ labels, bandwidth, upload, download });

        const totalDl   = download.reduce((a, b) => a + b, 0);
        const totalUl   = upload.reduce((a, b) => a + b, 0);
        const totalBw   = totalDl + totalUl;
        const peak      = Math.max(...bandwidth, 0);
        const avg       = bandwidth.length > 0 ? totalBw / bandwidth.length : 0;

        setStats({
          totalData:    (totalBw   / 1024).toFixed(2),
          uploadData:   (totalUl   / 1024).toFixed(2),
          downloadData: (totalDl   / 1024).toFixed(2),
          peakSpeed:    peak.toFixed(2),
          avgSpeed:     avg.toFixed(2),
          sessions:     history.length,
        });
      } catch {
        // API unavailable — show zeros; don't show fake data
        setChartData({ labels: [], bandwidth: [], upload: [], download: [] });
      }
    };
    fetchHistory();
  }, [timeRange]);

  // Real-time stats from the trafficData prop (updated every second by App.js)
  useEffect(() => {
    if (!isConnected || !trafficData) {
      setRealtimeData({ currentUpload: 0, currentDownload: 0, currentTotal: 0 });
      return;
    }
    // trafficData.download / upload are already in KB/s — convert to MB/s for display
    const dl = (trafficData.download / 1024).toFixed(2);
    const ul = (trafficData.upload   / 1024).toFixed(2);
    setRealtimeData({
      currentDownload: dl,
      currentUpload:   ul,
      currentTotal:    ((trafficData.download + trafficData.upload) / 1024).toFixed(2),
    });
  }, [isConnected, trafficData]);

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} MB`;
    return `${(bytes / 1024).toFixed(2)} GB`;
  };

  const getMaxValue = () => {
    if (dataType === 'bandwidth') return Math.max(...chartData.bandwidth);
    if (dataType === 'upload') return Math.max(...chartData.upload);
    if (dataType === 'download') return Math.max(...chartData.download);
    return 100;
  };

  const getCurrentData = () => {
    if (dataType === 'bandwidth') return chartData.bandwidth;
    if (dataType === 'upload') return chartData.upload;
    if (dataType === 'download') return chartData.download;
    return [];
  };

  return (
    <div className="traffic-analytics">
      <div className="analytics-header">
        <h3>📊 Traffic Analytics</h3>
        <div className="analytics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <select 
            value={dataType} 
            onChange={(e) => setDataType(e.target.value)}
            className="data-type-selector"
          >
            <option value="bandwidth">Total Bandwidth</option>
            <option value="download">Download Only</option>
            <option value="upload">Upload Only</option>
          </select>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="realtime-stats">
        <div className="stat-card realtime">
          <div className="stat-icon">⬇️</div>
          <div className="stat-content">
            <div className="stat-value">{realtimeData.currentDownload} MB/s</div>
            <div className="stat-label">Download Speed</div>
          </div>
        </div>
        <div className="stat-card realtime">
          <div className="stat-icon">⬆️</div>
          <div className="stat-content">
            <div className="stat-value">{realtimeData.currentUpload} MB/s</div>
            <div className="stat-label">Upload Speed</div>
          </div>
        </div>
        <div className="stat-card realtime">
          <div className="stat-icon">📡</div>
          <div className="stat-content">
            <div className="stat-value">{realtimeData.currentTotal} MB/s</div>
            <div className="stat-label">Total Speed</div>
          </div>
        </div>
      </div>

      {/* Historical Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <div className="stat-value">{formatBytes(stats.totalData)}</div>
            <div className="stat-label">Total Data Used</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬇️</div>
          <div className="stat-content">
            <div className="stat-value">{formatBytes(stats.downloadData)}</div>
            <div className="stat-label">Downloaded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬆️</div>
          <div className="stat-content">
            <div className="stat-value">{formatBytes(stats.uploadData)}</div>
            <div className="stat-label">Uploaded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{stats.peakSpeed} MB/s</div>
            <div className="stat-label">Peak Speed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgSpeed} MB/s</div>
            <div className="stat-label">Average Speed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <div className="stat-value">{stats.sessions}</div>
            <div className="stat-label">Sessions</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <div className="chart-header">
          <h4>{dataType === 'bandwidth' ? 'Total Bandwidth' : dataType === 'upload' ? 'Upload Speed' : 'Download Speed'} Over Time</h4>
          <div className="chart-legend">
            {dataType === 'bandwidth' && (
              <>
                <span className="legend-item download">
                  <span className="legend-color"></span>
                  Download
                </span>
                <span className="legend-item upload">
                  <span className="legend-color"></span>
                  Upload
                </span>
              </>
            )}
          </div>
        </div>
        <div className="chart-canvas">
          <div className="y-axis">
            <span>{getMaxValue().toFixed(0)} MB/s</span>
            <span>{(getMaxValue() / 2).toFixed(0)} MB/s</span>
            <span>0 MB/s</span>
          </div>
          <div className="chart-bars">
            {getCurrentData().map((value, index) => {
              const height = (value / getMaxValue()) * 100;
              return (
                <div key={index} className="bar-container">
                  {dataType === 'bandwidth' ? (
                    <>
                      <div 
                        className="bar download-bar" 
                        style={{ height: `${(chartData.download[index] / getMaxValue()) * 100}%` }}
                        title={`${chartData.download[index].toFixed(2)} MB/s`}
                      ></div>
                      <div 
                        className="bar upload-bar" 
                        style={{ 
                          height: `${(chartData.upload[index] / getMaxValue()) * 100}%`,
                          bottom: `${(chartData.download[index] / getMaxValue()) * 100}%`
                        }}
                        title={`${chartData.upload[index].toFixed(2)} MB/s`}
                      ></div>
                    </>
                  ) : (
                    <div 
                      className={`bar ${dataType}-bar`}
                      style={{ height: `${height}%` }}
                      title={`${value.toFixed(2)} MB/s`}
                    ></div>
                  )}
                  <span className="bar-label">{chartData.labels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Breakdown */}
      <div className="data-breakdown">
        <h4>📈 Data Breakdown</h4>
        <div className="breakdown-bars">
          <div className="breakdown-item">
            <div className="breakdown-label">
              <span className="label-text">Download</span>
              <span className="label-value">{stats.downloadData} GB ({((stats.downloadData / stats.totalData) * 100).toFixed(1)}%)</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill download-fill"
                style={{ width: `${(stats.downloadData / stats.totalData) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">
              <span className="label-text">Upload</span>
              <span className="label-value">{stats.uploadData} GB ({((stats.uploadData / stats.totalData) * 100).toFixed(1)}%)</span>
            </div>
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill upload-fill"
                style={{ width: `${(stats.uploadData / stats.totalData) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-icon">🎯</div>
          <div className="insight-content">
            <div className="insight-title">Average Session Duration</div>
            <div className="insight-value">
              {Math.floor(Math.random() * 60) + 15} minutes
            </div>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">📅</div>
          <div className="insight-content">
            <div className="insight-title">Most Active Day</div>
            <div className="insight-value">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)]}
            </div>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">⏰</div>
          <div className="insight-content">
            <div className="insight-title">Peak Usage Time</div>
            <div className="insight-value">
              {Math.floor(Math.random() * 12) + 1}:00 {Math.random() > 0.5 ? 'PM' : 'AM'}
            </div>
          </div>
        </div>
        <div className="insight-card">
          <div className="insight-icon">💰</div>
          <div className="insight-content">
            <div className="insight-title">Data Saved</div>
            <div className="insight-value">
              {(Math.random() * 5 + 2).toFixed(1)} GB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficAnalytics;
