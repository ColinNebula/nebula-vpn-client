import React, { useState, useEffect } from 'react';
import './TrafficAnalytics.css';

const TrafficAnalytics = ({ isConnected, connectionTime }) => {
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

  // Generate mock analytics data
  useEffect(() => {
    const generateData = () => {
      const points = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
      const labels = [];
      const bandwidth = [];
      const upload = [];
      const download = [];

      for (let i = 0; i < points; i++) {
        if (timeRange === '1h') {
          labels.push(`${i * 5}m`);
        } else if (timeRange === '24h') {
          labels.push(`${i}h`);
        } else if (timeRange === '7d') {
          labels.push(`Day ${i + 1}`);
        } else {
          labels.push(`Day ${i + 1}`);
        }

        const downloadVal = Math.random() * 50 + 10;
        const uploadVal = Math.random() * 20 + 5;
        
        download.push(downloadVal);
        upload.push(uploadVal);
        bandwidth.push(downloadVal + uploadVal);
      }

      setChartData({ labels, bandwidth, upload, download });

      // Calculate stats
      const totalBandwidth = bandwidth.reduce((a, b) => a + b, 0);
      const totalUpload = upload.reduce((a, b) => a + b, 0);
      const totalDownload = download.reduce((a, b) => a + b, 0);
      
      setStats({
        totalData: (totalBandwidth / 1024).toFixed(2),
        uploadData: (totalUpload / 1024).toFixed(2),
        downloadData: (totalDownload / 1024).toFixed(2),
        peakSpeed: Math.max(...bandwidth).toFixed(2),
        avgSpeed: (totalBandwidth / points).toFixed(2),
        sessions: Math.floor(Math.random() * 50) + 10
      });
    };

    generateData();
  }, [timeRange]);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isConnected) {
      setRealtimeData({ currentUpload: 0, currentDownload: 0, currentTotal: 0 });
      return;
    }

    const interval = setInterval(() => {
      const download = Math.random() * 15 + 5;
      const upload = Math.random() * 8 + 2;
      
      setRealtimeData({
        currentDownload: download.toFixed(2),
        currentUpload: upload.toFixed(2),
        currentTotal: (download + upload).toFixed(2)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

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
