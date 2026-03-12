import React, { useState, useRef, useEffect } from 'react';
import './ServerList.css';

// Normalize ping to a plain number regardless of whether it arrived as
// a numeric 25 (from API) or a string "25ms" (from static data).
const normalizePingMs = (ping) => {
  if (typeof ping === 'number') return ping;
  return parseInt(String(ping)) || 0;
};

const getPingColor = (ms) => {
  if (ms < 50)  return '#4ade80';
  if (ms < 100) return '#a3e635';
  if (ms < 200) return '#facc15';
  return '#f87171';
};

const getPingBars = (ms) => {
  if (ms < 50)  return 4;
  if (ms < 100) return 3;
  if (ms < 200) return 2;
  return 1;
};

// Signal-strength bars component
const PingSignal = ({ ping }) => {
  const ms    = normalizePingMs(ping);
  const bars  = getPingBars(ms);
  const color = getPingColor(ms);
  return (
    <div className="ping-signal">
      <div className="ping-bars">
        {[1, 2, 3, 4].map(b => (
          <span
            key={b}
            className="ping-bar"
            style={{
              height: `${b * 4}px`,
              background: b <= bars ? color : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
      <span className="ping-ms" style={{ color }}>{ms}ms</span>
    </div>
  );
};

const ServerList = ({ servers, onSelect, selectedServer, isConnected, onRefresh, isRefreshing = false }) => {
  const [sortBy, setSortBy] = useState('name'); // name, ping, load
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterPurpose, setFilterPurpose] = useState('all'); // all, general, streaming, gaming, p2p
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [showOptimal, setShowOptimal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const searchRef = useRef(null);

  // Track when a refresh completes to show "Updated just now"
  useEffect(() => {
    if (!isRefreshing) setLastRefreshed(Date.now());
  }, [isRefreshing]);

  const getSecondsAgo = () => {
    const s = Math.floor((Date.now() - lastRefreshed) / 1000);
    if (s < 5)   return 'just now';
    if (s < 60)  return `${s}s ago`;
    return `${Math.floor(s / 60)}m ago`;
  };

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

  const getSpecialtyBadge = (specialty) => {
    switch (specialty) {
      case 'tor':         return { label: 'Onion over VPN', icon: '🧅', color: '#7b5ea7' };
      case 'double':      return { label: 'Double VPN',     icon: '🔐', color: '#1976d2' };
      case 'obfuscated':  return { label: 'Obfuscated',     icon: '🥷', color: '#455a64' };
      case 'p2p':         return { label: 'P2P',            icon: '📁', color: '#ff5722' };
      case 'streaming':   return { label: 'Streaming',      icon: '🎬', color: '#e91e63' };
      case 'gaming':      return { label: 'Gaming',         icon: '🎮', color: '#9c27b0' };
      case 'privacy':     return { label: 'Privacy+',       icon: '🛡️', color: '#2e7d32' };
      default:            return null;
    }
  };

  const normalise = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

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
    const matchesSpecialty = filterSpecialty === 'all' || server.specialty === filterSpecialty;
    const matchesOptimal = !showOptimal || (server.load < 50 && parseInt(server.ping) < 100);
    const q = normalise(searchQuery);
    const matchesSearch = !q || [server.name, server.location, server.country].some(
      f => normalise(f).includes(q)
    );
    return matchesCountry && matchesPurpose && matchesSpecialty && matchesOptimal && matchesSearch;
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
        <div className="server-list-title-row">
          <h3>🌍 Server Selection</h3>
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">⊞</button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view">☰</button>
          </div>
          <div className="server-refresh-row">
            <span className="last-refresh-label">{isRefreshing ? 'Refreshing…' : `Updated ${getSecondsAgo()}`}</span>
            {onRefresh && (
              <button
                className={`server-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh server list"
              >↺</button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="server-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            className="server-search-input"
            placeholder="Search by country, city or server name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="server-controls">
          <div className="control-row">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="name">Sort: Name</option>
              <option value="ping">Sort: Ping</option>
              <option value="load">Sort: Load</option>
            </select>
            
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="filter-select">
              <option value="all">All Countries</option>
              {countries.sort().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          
          <div className="control-row">
            <select value={filterPurpose} onChange={(e) => setFilterPurpose(e.target.value)} className="purpose-select">
              <option value="all">All Uses</option>
              {purposes.map(purpose => (
                <option key={purpose} value={purpose}>
                  {getPurposeIcon(purpose)} {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                </option>
              ))}
            </select>

            <select value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)} className="specialty-select">
              <option value="all">All Types</option>
              <option value="privacy">🛡️ Privacy+</option>
              <option value="streaming">🎬 Streaming</option>
              <option value="gaming">🎮 Gaming</option>
              <option value="p2p">📁 P2P</option>
              <option value="obfuscated">🥷 Obfuscated</option>
              <option value="double">🔐 Double VPN</option>
              <option value="tor">🧅 Tor over VPN</option>
            </select>
            
            <label className="optimal-toggle">
              <input type="checkbox" checked={showOptimal} onChange={(e) => setShowOptimal(e.target.checked)} />
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
          <span className="stat-label">Total:</span>
          <span className="stat-value">{servers.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Shown:</span>
          <span className="stat-value">{filteredServers.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Optimal:</span>
          <span className="stat-value">{servers.filter(s => s.load < 50 && parseInt(s.ping) < 100).length}</span>
        </div>
        {(searchQuery || filterCountry !== 'all' || filterPurpose !== 'all' || filterSpecialty !== 'all' || showOptimal) && (
          <button className="clear-filters-btn-small" onClick={() => {
            setSearchQuery('');
            setFilterCountry('all');
            setFilterPurpose('all');
            setFilterSpecialty('all');
            setShowOptimal(false);
          }}>✕ Clear</button>
        )}
      </div>
      
      <div className={`server-grid ${viewMode === 'list' ? 'list-mode' : ''}`}>
        {filteredServers.map((server) => {
          const badge = getSpecialtyBadge(server.specialty);
          return (
            <div 
              key={server.id}
              className={`server-item ${selectedServer?.id === server.id ? 'selected' : ''} ${isConnected && selectedServer?.id !== server.id ? 'disabled' : ''} ${server.load < 30 ? 'optimal' : ''}`}
              onClick={() => !isConnected && onSelect(server)}
            >
              <div className="server-header">
                <div className="server-title">
                  <span className="server-flag">{server.flag}</span>
                  <div className="server-name">{server.name}</div>
                  <div className="purpose-badge" style={{ backgroundColor: getPurposeColor(server.purpose) }}>
                    {getPurposeIcon(server.purpose)}
                    <span>{server.purpose}</span>
                  </div>
                </div>
                
                <div className="server-load">
                  <div className="load-bar">
                    <div className="load-fill" style={{ width: `${server.load}%`, background: getLoadColor(server.load) }}></div>
                  </div>
                  <span className="load-text">{server.load}%</span>
                </div>
              </div>
              
              <div className="server-details">
                <div className="server-location">{server.location}</div>
                <div className="server-stats-row">
                  <PingSignal ping={server.ping} />
                  <div className="feature-indicators">
                    {server.streaming && <span className="feature-icon" title="Streaming">🎬</span>}
                    {server.gaming && <span className="feature-icon" title="Gaming">🎮</span>}
                    {server.p2p && <span className="feature-icon" title="P2P/Torrenting">📁</span>}
                    {server.multiHopSupport && <span className="feature-icon" title="Multi-Hop">🔗</span>}
                  </div>
                </div>
              </div>

              {badge && (
                <div className="specialty-badge" style={{ backgroundColor: badge.color }}>
                  {badge.icon} {badge.label}
                </div>
              )}
              
              {server.load < 30 && parseInt(server.ping) < 100 && (
                <div className="optimal-indicator">⚡ Optimal</div>
              )}
            </div>
          );
        })}
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