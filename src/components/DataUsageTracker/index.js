import React, { useState, useEffect } from 'react';
import './DataUsageTracker.css';

const DataUsageTracker = ({ isConnected }) => {
  const [timeRange, setTimeRange] = useState('today');
  const [sortBy, setSortBy] = useState('usage');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  
  const [apps, setApps] = useState([
    { id: 1, name: 'Chrome', icon: '🌐', category: 'Browser', upload: 245, download: 1834, total: 2079, limit: null, color: '#4285F4' },
    { id: 2, name: 'Netflix', icon: '🎬', category: 'Streaming', upload: 12, download: 4521, total: 4533, limit: 5000, color: '#E50914' },
    { id: 3, name: 'Spotify', icon: '🎵', category: 'Music', upload: 8, download: 876, total: 884, limit: null, color: '#1DB954' },
    { id: 4, name: 'Steam', icon: '🎮', category: 'Gaming', upload: 156, download: 3245, total: 3401, limit: 10000, color: '#171a21' },
    { id: 5, name: 'Zoom', icon: '📹', category: 'Communication', upload: 432, download: 234, total: 666, limit: null, color: '#2D8CFF' },
    { id: 6, name: 'YouTube', icon: '📺', category: 'Streaming', upload: 34, download: 2187, total: 2221, limit: null, color: '#FF0000' },
    { id: 7, name: 'Discord', icon: '💬', category: 'Communication', upload: 89, download: 145, total: 234, limit: null, color: '#5865F2' },
    { id: 8, name: 'Slack', icon: '💼', category: 'Productivity', upload: 67, download: 123, total: 190, limit: null, color: '#4A154B' },
    { id: 9, name: 'Dropbox', icon: '☁️', category: 'Cloud Storage', upload: 543, download: 321, total: 864, limit: 2000, color: '#0061FF' },
    { id: 10, name: 'Twitch', icon: '🎮', category: 'Streaming', upload: 23, download: 1456, total: 1479, limit: null, color: '#9146FF' },
    { id: 11, name: 'WhatsApp', icon: '📱', category: 'Communication', upload: 45, download: 67, total: 112, limit: null, color: '#25D366' },
    { id: 12, name: 'Other', icon: '📦', category: 'Miscellaneous', upload: 234, download: 456, total: 690, limit: null, color: '#9E9E9E' }
  ]);

  const [totalStats, setTotalStats] = useState({
    totalData: 0,
    totalUpload: 0,
    totalDownload: 0,
    appsWithLimits: 0
  });

  useEffect(() => {
    const total = apps.reduce((sum, app) => sum + app.total, 0);
    const upload = apps.reduce((sum, app) => sum + app.upload, 0);
    const download = apps.reduce((sum, app) => sum + app.download, 0);
    const withLimits = apps.filter(app => app.limit !== null).length;

    setTotalStats({
      totalData: total,
      totalUpload: upload,
      totalDownload: download,
      appsWithLimits: withLimits
    });
  }, [apps]);

  // Simulate real-time data updates
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setApps(prevApps => prevApps.map(app => {
        const uploadInc = Math.random() * 2;
        const downloadInc = Math.random() * 5;
        return {
          ...app,
          upload: parseFloat((app.upload + uploadInc).toFixed(2)),
          download: parseFloat((app.download + downloadInc).toFixed(2)),
          total: parseFloat((app.total + uploadInc + downloadInc).toFixed(2))
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const getSortedApps = () => {
    let sorted = [...apps];
    
    if (sortBy === 'usage') {
      sorted.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => a.category.localeCompare(b.category));
    } else if (sortBy === 'upload') {
      sorted.sort((a, b) => b.upload - a.upload);
    } else if (sortBy === 'download') {
      sorted.sort((a, b) => b.download - a.download);
    }
    
    return sorted;
  };

  const formatBytes = (mb) => {
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const getUsagePercentage = (used, limit) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getLimitStatus = (used, limit) => {
    if (!limit) return 'none';
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 80) return 'warning';
    return 'safe';
  };

  const setLimit = (appId, limitValue) => {
    setApps(prevApps => prevApps.map(app => 
      app.id === appId ? { ...app, limit: limitValue } : app
    ));
    setShowLimitModal(false);
    setSelectedApp(null);
  };

  const removeLimit = (appId) => {
    setApps(prevApps => prevApps.map(app => 
      app.id === appId ? { ...app, limit: null } : app
    ));
  };

  const categoryColors = {
    'Browser': '#4285F4',
    'Streaming': '#E50914',
    'Music': '#1DB954',
    'Gaming': '#171a21',
    'Communication': '#2D8CFF',
    'Productivity': '#4A154B',
    'Cloud Storage': '#0061FF',
    'Miscellaneous': '#9E9E9E'
  };

  const getCategoryStats = () => {
    const categories = {};
    apps.forEach(app => {
      if (!categories[app.category]) {
        categories[app.category] = 0;
      }
      categories[app.category] += app.total;
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="data-usage-tracker">
      <div className="tracker-header">
        <h3>📊 Data Usage Tracker</h3>
        <div className="tracker-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-selector"
          >
            <option value="usage">By Total Usage</option>
            <option value="name">By Name</option>
            <option value="category">By Category</option>
            <option value="upload">By Upload</option>
            <option value="download">By Download</option>
          </select>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="usage-stats">
        <div className="stat-card primary">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <div className="stat-value">{formatBytes(totalStats.totalData)}</div>
            <div className="stat-label">Total Data Used</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬆️</div>
          <div className="stat-content">
            <div className="stat-value">{formatBytes(totalStats.totalUpload)}</div>
            <div className="stat-label">Uploaded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⬇️</div>
          <div className="stat-content">
            <div className="stat-value">{formatBytes(totalStats.totalDownload)}</div>
            <div className="stat-label">Downloaded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{totalStats.appsWithLimits}</div>
            <div className="stat-label">Apps with Limits</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="category-breakdown">
        <h4>📈 Usage by Category</h4>
        <div className="category-chart">
          {getCategoryStats().map(([category, usage]) => {
            const percentage = (usage / totalStats.totalData) * 100;
            return (
              <div key={category} className="category-bar">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-usage">{formatBytes(usage)} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="category-progress">
                  <div 
                    className="category-fill"
                    style={{ 
                      width: `${percentage}%`,
                      background: categoryColors[category]
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Apps List */}
      <div className="apps-section">
        <h4>📱 Applications</h4>
        <div className="apps-grid">
          {getSortedApps().map(app => {
            const limitStatus = getLimitStatus(app.total, app.limit);
            const usagePercentage = getUsagePercentage(app.total, app.limit);
            
            return (
              <div key={app.id} className={`app-usage-card ${limitStatus}`}>
                <div className="app-header">
                  <div className="app-info">
                    <span className="app-icon-large">{app.icon}</span>
                    <div className="app-details">
                      <div className="app-name">{app.name}</div>
                      <div className="app-category">{app.category}</div>
                    </div>
                  </div>
                  <button 
                    className="limit-btn"
                    onClick={() => {
                      setSelectedApp(app);
                      setShowLimitModal(true);
                    }}
                  >
                    {app.limit ? '✏️' : '➕'}
                  </button>
                </div>

                <div className="usage-details">
                  <div className="usage-row">
                    <span className="usage-label">Total:</span>
                    <span className="usage-value">{formatBytes(app.total)}</span>
                  </div>
                  <div className="usage-row">
                    <span className="usage-label">⬆️ Upload:</span>
                    <span className="usage-value">{formatBytes(app.upload)}</span>
                  </div>
                  <div className="usage-row">
                    <span className="usage-label">⬇️ Download:</span>
                    <span className="usage-value">{formatBytes(app.download)}</span>
                  </div>
                </div>

                {app.limit && (
                  <>
                    <div className="limit-bar">
                      <div 
                        className={`limit-fill ${limitStatus}`}
                        style={{ width: `${usagePercentage}%` }}
                      ></div>
                    </div>
                    <div className="limit-info">
                      <span className="limit-text">
                        Limit: {formatBytes(app.limit)} 
                        {limitStatus === 'exceeded' && ' - EXCEEDED!'}
                        {limitStatus === 'warning' && ' - Near Limit'}
                      </span>
                      <button 
                        className="remove-limit-btn"
                        onClick={() => removeLimit(app.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Set Limit Modal */}
      {showLimitModal && selectedApp && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Set Data Limit for {selectedApp.name}</h4>
              <button onClick={() => setShowLimitModal(false)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Set a daily data usage limit for {selectedApp.name}. You'll receive a warning when usage approaches the limit.
              </p>
              <div className="limit-options">
                <button onClick={() => setLimit(selectedApp.id, 500)} className="limit-option">500 MB</button>
                <button onClick={() => setLimit(selectedApp.id, 1024)} className="limit-option">1 GB</button>
                <button onClick={() => setLimit(selectedApp.id, 2048)} className="limit-option">2 GB</button>
                <button onClick={() => setLimit(selectedApp.id, 5120)} className="limit-option">5 GB</button>
                <button onClick={() => setLimit(selectedApp.id, 10240)} className="limit-option">10 GB</button>
              </div>
              <div className="custom-limit">
                <input 
                  type="number" 
                  placeholder="Custom limit (MB)"
                  className="custom-limit-input"
                  id="customLimit"
                />
                <button 
                  onClick={() => {
                    const value = document.getElementById('customLimit').value;
                    if (value) setLimit(selectedApp.id, parseInt(value));
                  }}
                  className="set-custom-btn"
                >
                  Set Custom Limit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUsageTracker;
