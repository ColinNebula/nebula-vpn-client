import React, { useState } from 'react';
import './ConnectionLog.css';

const ConnectionLog = ({ logs }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.type === filter;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const clearLogs = () => {
    // This would typically call a function passed from parent to clear logs
    console.log('Clear logs requested');
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nebula-vpn-logs.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="connection-log">
      <div className="log-header">
        <h3>📝 Connection Logs</h3>
        <div className="log-controls">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Logs</option>
            <option value="success">Success</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
          <button className="action-btn secondary" onClick={exportLogs}>
            Export
          </button>
          <button className="action-btn danger" onClick={clearLogs}>
            Clear
          </button>
        </div>
      </div>
      
      <div className="log-container">
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            <p>No logs to display</p>
            <span>Connect to a server to start logging</span>
          </div>
        ) : (
          <div className="log-list">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`log-entry ${log.type}`}
                style={{ borderLeftColor: getLogColor(log.type) }}
              >
                <div className="log-timestamp">{log.timestamp}</div>
                <div className="log-content">
                  <span className="log-icon">{getLogIcon(log.type)}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="log-footer">
        <span className="log-count">
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
      </div>
    </div>
  );
};

export default ConnectionLog;