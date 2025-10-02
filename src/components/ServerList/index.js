import React, { useState } from 'react';
import './ServerList.css';

const ServerList = ({ servers, onSelect, selectedServer, isConnected }) => {
  const [sortBy, setSortBy] = useState('name'); // name, ping, load
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterPurpose, setFilterPurpose] = useState('all'); // all, general, streaming, gaming, p2p
  const [showOptimal, setShowOptimal] = useState(false);

  const getLoadColor = (load) => {
    if (load < 30) return '#4CAF50'; // Green
    if (load < 70) return '#FF9800'; // Orange
    return '#f44336'; // Red
  };

  const getPurposeIcon = (purpose) => {
    switch (purpose) {
      case 'streaming': return '🎬';
      case 'gaming': return '🎮';
      case 'p2p': return '📁';
      default: return '🌐';
    }
  };

  const getPurposeColor = (purpose) => {
    switch (purpose) {
      case 'streaming': return '#e91e63';
      case 'gaming': return '#9c27b0';
      case 'p2p': return '#ff5722';
      default: return '#2196f3';
    }
  };

  const sortedServers = [...servers].sort((a, b) => {
    switch (sortBy) {
      case 'ping':
        return parseInt(a.ping) - parseInt(b.ping);
      case 'load':
        return a.load - b.load;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const filteredServers = sortedServers.filter(server => {
    const matchesCountry = filterCountry === 'all' || server.country === filterCountry;
    const matchesPurpose = filterPurpose === 'all' || server.purpose === filterPurpose;
    const matchesOptimal = !showOptimal || (server.load < 50 && parseInt(server.ping) < 100);
    return matchesCountry && matchesPurpose && matchesOptimal;
  });

  const countries = [...new Set(servers.map(s => s.country))];
  const purposes = ['general', 'streaming', 'gaming', 'p2p'];

  const getOptimalServer = () => {
    return servers.reduce((best, current) => {
      const currentScore = (100 - current.load) + (200 - parseInt(current.ping));
      const bestScore = (100 - best.load) + (200 - parseInt(best.ping));
      return currentScore > bestScore ? current : best;
    });
  };

  const optimalServer = getOptimalServer();

  return (
    <div className="server-list">
      <div className="server-list-header">
        <h3>🌍 Server Selection</h3>
        <div className="server-controls">
          <div className="control-row">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Sort by Name</option>
              <option value="ping">Sort by Ping</option>
              <option value="load">Sort by Load</option>
            </select>
            
            <select 
              value={filterCountry} 
              onChange={(e) => setFilterCountry(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          
          <div className="control-row">
            <select 
              value={filterPurpose} 
              onChange={(e) => setFilterPurpose(e.target.value)}
              className="purpose-select"
            >
              <option value="all">All Purposes</option>
              {purposes.map(purpose => (
                <option key={purpose} value={purpose}>
                  {getPurposeIcon(purpose)} {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                </option>
              ))}
            </select>
            
            <label className="optimal-toggle">
              <input
                type="checkbox"
                checked={showOptimal}
                onChange={(e) => setShowOptimal(e.target.checked)}
              />
              <span>⚡ Optimal Only</span>
            </label>
          </div>
        </div>
      </div>
      
      {!isConnected && (
        <div className="quick-connect">
          <button 
            className="optimal-connect-btn"
            onClick={() => onSelect(optimalServer)}
          >
            ⚡ Quick Connect to Optimal Server
            <span className="optimal-info">
              {optimalServer.flag} {optimalServer.name} ({optimalServer.ping}, {optimalServer.load}% load)
            </span>
          </button>
        </div>
      )}
      
      <div className="server-stats">
        <div className="stat-item">
          <span className="stat-label">Total Servers:</span>
          <span className="stat-value">{servers.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Filtered:</span>
          <span className="stat-value">{filteredServers.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Optimal:</span>
          <span className="stat-value">{servers.filter(s => s.load < 50 && parseInt(s.ping) < 100).length}</span>
        </div>
      </div>
      
      <div className="server-grid">
        {filteredServers.map((server) => (
          <div 
            key={server.id}
            className={`server-item ${
              selectedServer?.id === server.id ? 'selected' : ''
            } ${
              isConnected && selectedServer?.id !== server.id ? 'disabled' : ''
            } ${
              server.load < 30 ? 'optimal' : ''
            }`}
            onClick={() => !isConnected && onSelect(server)}
          >
            <div className="server-header">
              <div className="server-title">
                <span className="server-flag">{server.flag}</span>
                <div className="server-name">{server.name}</div>
                <div 
                  className="purpose-badge"
                  style={{ backgroundColor: getPurposeColor(server.purpose) }}
                >
                  {getPurposeIcon(server.purpose)}
                  <span>{server.purpose}</span>
                </div>
              </div>
              
              <div className="server-load">
                <div className="load-bar">
                  <div 
                    className="load-fill"
                    style={{ 
                      width: `${server.load}%`, 
                      background: getLoadColor(server.load) 
                    }}
                  ></div>
                </div>
                <span className="load-text">{server.load}%</span>
              </div>
            </div>
            
            <div className="server-details">
              <div className="server-location">{server.location}</div>
              <div className="server-stats">
                <span className="server-ping">{server.ping}</span>
                <div className="feature-indicators">
                  {server.streaming && <span className="feature-icon" title="Streaming">🎬</span>}
                  {server.gaming && <span className="feature-icon" title="Gaming">🎮</span>}
                  {server.p2p && <span className="feature-icon" title="P2P/Torrenting">📁</span>}
                </div>
              </div>
            </div>
            
            {server.load < 30 && parseInt(server.ping) < 100 && (
              <div className="optimal-indicator">⚡ Optimal</div>
            )}
          </div>
        ))}
      </div>
      
      {filteredServers.length === 0 && (
        <div className="no-servers">
          <p>No servers match your filters</p>
          <button 
            className="clear-filters-btn"
            onClick={() => {
              setFilterCountry('all');
              setFilterPurpose('all');
              setShowOptimal(false);
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ServerList;