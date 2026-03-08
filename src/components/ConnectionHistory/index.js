import React, { useState, useEffect } from 'react';
import './ConnectionHistory.css';
import apiService from '../../services/api';

const ConnectionHistory = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    apiService.getConnectionHistory()
      .then(data => setConnections(data.connections || []))
      .catch(err => setFetchError(err.message || 'Failed to load connection history'))
      .finally(() => setLoading(false));
  }, []);

  const getFilteredConnections = () => {
    let filtered = connections;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(conn => conn.status === filter);
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(conn =>
        conn.server.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conn.ip.includes(searchTerm)
      );
    }

    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else if (sortBy === 'duration') {
      filtered.sort((a, b) => {
        const durationA = a.duration === 'Ongoing' ? Infinity : parseInt(a.duration);
        const durationB = b.duration === 'Ongoing' ? Infinity : parseInt(b.duration);
        return durationB - durationA;
      });
    } else if (sortBy === 'data') {
      filtered.sort((a, b) => parseFloat(b.dataUsed) - parseFloat(a.dataUsed));
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Server', 'Protocol', 'Status', 'Start Time', 'End Time', 'Duration', 'Data Used (GB)', 'Avg Speed (MB/s)', 'IP Address'];
    const rows = getFilteredConnections().map(conn => [
      conn.id,
      conn.server,
      conn.protocol,
      conn.status,
      formatDate(conn.startTime),
      conn.endTime ? formatDate(conn.endTime) : 'N/A',
      conn.duration,
      conn.dataUsed,
      conn.avgSpeed,
      conn.ip
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpn-connection-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(getFilteredConnections(), null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpn-connection-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const total = connections.length;
    const completed = connections.filter(c => c.status === 'completed').length;
    const failed = connections.filter(c => c.status === 'failed').length;
    const active = connections.filter(c => c.status === 'active').length;
    const totalData = connections.reduce((sum, c) => sum + parseFloat(c.dataUsed), 0).toFixed(2);
    const avgDuration = Math.floor(
      connections.filter(c => c.duration !== 'Ongoing').reduce((sum, c) => sum + parseInt(c.duration), 0) / 
      connections.filter(c => c.duration !== 'Ongoing').length
    );

    return { total, completed, failed, active, totalData, avgDuration };
  };

  const stats = getStats();
  const filteredConnections = getFilteredConnections();

  if (loading) return <div className="connection-history" style={{ padding: '2rem', textAlign: 'center' }}>Loading connection history...</div>;
  if (fetchError) return <div className="connection-history" style={{ padding: '2rem', color: '#d32f2f' }}>⚠️ {fetchError}</div>;

  return (
    <div className="connection-history">
      <div className="history-header">
        <h3>📜 Connection History</h3>
        <div className="export-buttons">
          <button onClick={exportToCSV} className="export-btn csv">
            📄 Export CSV
          </button>
          <button onClick={exportToJSON} className="export-btn json">
            📦 Export JSON
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-overview">
        <div className="stat-item">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Connections</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">Failed</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">💾</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalData} GB</div>
            <div className="stat-label">Total Data</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">{stats.avgDuration} min</div>
            <div className="stat-label">Avg Duration</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="controls-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by server, protocol, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="failed">Failed</option>
            <option value="disconnected">Disconnected</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">By Duration</option>
            <option value="data">By Data Usage</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        Showing {filteredConnections.length} of {connections.length} connections
      </div>

      {/* Connections Table */}
      <div className="connections-table">
        <div className="table-header">
          <div className="col col-status">Status</div>
          <div className="col col-server">Server</div>
          <div className="col col-protocol">Protocol</div>
          <div className="col col-time">Start Time</div>
          <div className="col col-duration">Duration</div>
          <div className="col col-data">Data Used</div>
          <div className="col col-speed">Avg Speed</div>
          <div className="col col-action">Details</div>
        </div>
        <div className="table-body">
          {filteredConnections.map(conn => (
            <div key={conn.id} className={`table-row ${conn.status}`}>
              <div className="col col-status">
                <span className={`status-badge ${getStatusClass(conn.status)}`}>
                  {conn.status === 'completed' && '✅'}
                  {conn.status === 'active' && '🔄'}
                  {conn.status === 'failed' && '❌'}
                  {conn.status === 'disconnected' && '⚠️'}
                  {conn.status}
                </span>
              </div>
              <div className="col col-server">
                <div className="server-info">
                  <span className="server-flag">🌍</span>
                  <span>{conn.server}</span>
                </div>
              </div>
              <div className="col col-protocol">
                <span className="protocol-badge">{conn.protocol}</span>
              </div>
              <div className="col col-time">{formatDate(conn.startTime)}</div>
              <div className="col col-duration">{conn.duration}</div>
              <div className="col col-data">{conn.dataUsed} GB</div>
              <div className="col col-speed">{conn.avgSpeed} MB/s</div>
              <div className="col col-action">
                <button onClick={() => setSelectedConnection(conn)} className="details-btn">
                  👁️ View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Details Modal */}
      {selectedConnection && (
        <div className="modal-overlay" onClick={() => setSelectedConnection(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Connection Details</h4>
              <button onClick={() => setSelectedConnection(null)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Connection ID:</span>
                  <span className="detail-value">{selectedConnection.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-${selectedConnection.status}`}>
                    {selectedConnection.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Server Location:</span>
                  <span className="detail-value">{selectedConnection.server}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Protocol:</span>
                  <span className="detail-value">{selectedConnection.protocol}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">IP Address:</span>
                  <span className="detail-value">{selectedConnection.ip}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Encryption:</span>
                  <span className="detail-value">{selectedConnection.encryption}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Start Time:</span>
                  <span className="detail-value">{formatDate(selectedConnection.startTime)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">End Time:</span>
                  <span className="detail-value">
                    {selectedConnection.endTime ? formatDate(selectedConnection.endTime) : 'Still active'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{selectedConnection.duration}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Data Used:</span>
                  <span className="detail-value">{selectedConnection.dataUsed} GB</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Average Speed:</span>
                  <span className="detail-value">{selectedConnection.avgSpeed} MB/s</span>
                </div>
                {selectedConnection.status === 'failed' && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Error Code:</span>
                    <span className="detail-value error">{selectedConnection.exitCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionHistory;
