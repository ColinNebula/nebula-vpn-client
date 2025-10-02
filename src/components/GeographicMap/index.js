import React, { useState } from 'react';
import './GeographicMap.css';

const GeographicMap = ({ servers, currentServer, onServerSelect }) => {
  const [hoveredServer, setHoveredServer] = useState(null);
  const [filterContinent, setFilterContinent] = useState('all');
  const [showConnectionPath, setShowConnectionPath] = useState(true);

  // Server locations with coordinates (simplified for demo)
  const serverLocations = [
    { id: 1, name: 'New York, USA', lat: 40.7128, lon: -74.0060, continent: 'North America', users: 12453, load: 65 },
    { id: 2, name: 'Los Angeles, USA', lat: 34.0522, lon: -118.2437, continent: 'North America', users: 9876, load: 72 },
    { id: 3, name: 'London, UK', lat: 51.5074, lon: -0.1278, continent: 'Europe', users: 15234, load: 58 },
    { id: 4, name: 'Paris, France', lat: 48.8566, lon: 2.3522, continent: 'Europe', users: 8765, load: 45 },
    { id: 5, name: 'Frankfurt, Germany', lat: 50.1109, lon: 8.6821, continent: 'Europe', users: 11234, load: 68 },
    { id: 6, name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, continent: 'Asia', users: 13456, load: 75 },
    { id: 7, name: 'Singapore', lat: 1.3521, lon: 103.8198, continent: 'Asia', users: 10987, load: 62 },
    { id: 8, name: 'Hong Kong', lat: 22.3193, lon: 114.1694, continent: 'Asia', users: 9543, load: 71 },
    { id: 9, name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, continent: 'Oceania', users: 7654, load: 55 },
    { id: 10, name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, continent: 'Asia', users: 8234, load: 69 },
    { id: 11, name: 'São Paulo, Brazil', lat: -23.5505, lon: -46.6333, continent: 'South America', users: 6789, load: 48 },
    { id: 12, name: 'Toronto, Canada', lat: 43.6532, lon: -79.3832, continent: 'North America', users: 8456, load: 52 },
    { id: 13, name: 'Amsterdam, Netherlands', lat: 52.3676, lon: 4.9041, continent: 'Europe', users: 9876, load: 59 },
    { id: 14, name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, continent: 'Asia', users: 7234, load: 63 },
    { id: 15, name: 'Stockholm, Sweden', lat: 59.3293, lon: 18.0686, continent: 'Europe', users: 6543, load: 41 }
  ];

  // Convert lat/lon to SVG coordinates (simple mercator-ish projection)
  const projectToSVG = (lat, lon) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const getFilteredServers = () => {
    if (filterContinent === 'all') return serverLocations;
    return serverLocations.filter(server => server.continent === filterContinent);
  };

  const getLoadColor = (load) => {
    if (load < 50) return '#4CAF50';
    if (load < 70) return '#ff9800';
    return '#f44336';
  };

  const getServerSize = (users) => {
    if (users > 12000) return 'large';
    if (users > 8000) return 'medium';
    return 'small';
  };

  const continents = ['all', 'North America', 'South America', 'Europe', 'Asia', 'Oceania'];

  const getContinentStats = () => {
    const stats = {};
    serverLocations.forEach(server => {
      if (!stats[server.continent]) {
        stats[server.continent] = { servers: 0, users: 0, avgLoad: 0 };
      }
      stats[server.continent].servers++;
      stats[server.continent].users += server.users;
      stats[server.continent].avgLoad += server.load;
    });

    Object.keys(stats).forEach(continent => {
      stats[continent].avgLoad = (stats[continent].avgLoad / stats[continent].servers).toFixed(0);
    });

    return stats;
  };

  const stats = getContinentStats();
  const filteredServers = getFilteredServers();

  // Your location (simulated)
  const yourLocation = { lat: 37.7749, lon: -122.4194 }; // San Francisco
  const yourLocationSVG = projectToSVG(yourLocation.lat, yourLocation.lon);

  return (
    <div className="geographic-map">
      <div className="map-header">
        <h3>🌍 Server Locations</h3>
        <div className="map-controls">
          <label className="show-path-toggle">
            <input
              type="checkbox"
              checked={showConnectionPath}
              onChange={(e) => setShowConnectionPath(e.target.checked)}
            />
            <span>Show Connection Path</span>
          </label>
          <select 
            value={filterContinent}
            onChange={(e) => setFilterContinent(e.target.value)}
            className="continent-filter"
          >
            {continents.map(continent => (
              <option key={continent} value={continent}>
                {continent === 'all' ? 'All Continents' : continent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Statistics */}
      <div className="global-stats">
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <div className="stat-value">{serverLocations.length}</div>
            <div className="stat-label">Total Servers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">
              {(serverLocations.reduce((sum, s) => sum + s.users, 0) / 1000).toFixed(1)}K
            </div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              {(serverLocations.reduce((sum, s) => sum + s.load, 0) / serverLocations.length).toFixed(0)}%
            </div>
            <div className="stat-label">Avg Server Load</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗺️</div>
          <div className="stat-content">
            <div className="stat-value">{Object.keys(stats).length}</div>
            <div className="stat-label">Continents</div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="map-container">
        <svg className="world-map" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Background */}
          <rect x="0" y="0" width="100" height="100" fill="var(--map-bg, #e0f2f7)" />
          
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--map-grid, #b0d4de)" strokeWidth="0.1" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Connection path from your location to current server */}
          {showConnectionPath && currentServer && (
            <>
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2196F3" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              {serverLocations.find(s => s.name === currentServer?.location) && (
                <>
                  {(() => {
                    const server = serverLocations.find(s => s.name === currentServer?.location);
                    const serverPos = projectToSVG(server.lat, server.lon);
                    return (
                      <>
                        <path
                          d={`M ${yourLocationSVG.x} ${yourLocationSVG.y} Q ${(yourLocationSVG.x + serverPos.x) / 2} ${Math.min(yourLocationSVG.y, serverPos.y) - 15} ${serverPos.x} ${serverPos.y}`}
                          fill="none"
                          stroke="url(#connectionGradient)"
                          strokeWidth="0.3"
                          strokeDasharray="1,1"
                          className="connection-path"
                        />
                        <circle
                          cx={yourLocationSVG.x}
                          cy={yourLocationSVG.y}
                          r="0.8"
                          fill="#4CAF50"
                          className="pulse-dot"
                        />
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}

          {/* Server markers */}
          {filteredServers.map(server => {
            const pos = projectToSVG(server.lat, server.lon);
            const size = getServerSize(server.users);
            const radius = size === 'large' ? 1.5 : size === 'medium' ? 1.2 : 0.9;
            const isConnected = currentServer?.location === server.name;
            const isHovered = hoveredServer?.id === server.id;
            
            return (
              <g key={server.id}>
                {(isConnected || isHovered) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius * 2}
                    fill={getLoadColor(server.load)}
                    opacity="0.2"
                    className="server-glow"
                  />
                )}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={getLoadColor(server.load)}
                  stroke={isConnected ? '#fff' : 'none'}
                  strokeWidth={isConnected ? '0.3' : '0'}
                  className={`server-marker ${isConnected ? 'connected' : ''} ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredServer(server)}
                  onMouseLeave={() => setHoveredServer(null)}
                  onClick={() => onServerSelect && onServerSelect(server)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredServer && (
          <div 
            className="map-tooltip"
            style={{
              left: `${projectToSVG(hoveredServer.lat, hoveredServer.lon).x}%`,
              top: `${projectToSVG(hoveredServer.lat, hoveredServer.lon).y}%`
            }}
          >
            <div className="tooltip-header">
              <span className="tooltip-name">{hoveredServer.name}</span>
              <span className={`tooltip-status ${hoveredServer.load < 70 ? 'available' : 'busy'}`}>
                {hoveredServer.load < 70 ? '🟢 Available' : '🟡 Busy'}
              </span>
            </div>
            <div className="tooltip-details">
              <div className="tooltip-row">
                <span>Load:</span>
                <span style={{ color: getLoadColor(hoveredServer.load) }}>{hoveredServer.load}%</span>
              </div>
              <div className="tooltip-row">
                <span>Users:</span>
                <span>{hoveredServer.users.toLocaleString()}</span>
              </div>
            </div>
            <button className="connect-tooltip-btn" onClick={() => onServerSelect && onServerSelect(hoveredServer)}>
              Connect →
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-marker" style={{ background: '#4CAF50' }}></div>
            <span>Low Load (&lt;50%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker" style={{ background: '#ff9800' }}></div>
            <span>Medium Load (50-70%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker" style={{ background: '#f44336' }}></div>
            <span>High Load (&gt;70%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker large" style={{ background: '#2196F3' }}></div>
            <span>Large Server (&gt;12K users)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker medium" style={{ background: '#2196F3' }}></div>
            <span>Medium Server (8-12K users)</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker small" style={{ background: '#2196F3' }}></div>
            <span>Small Server (&lt;8K users)</span>
          </div>
        </div>
      </div>

      {/* Continent Statistics */}
      <div className="continent-stats">
        <h4>📊 Statistics by Continent</h4>
        <div className="continent-grid">
          {Object.entries(stats).map(([continent, data]) => (
            <div key={continent} className="continent-card">
              <div className="continent-name">{continent}</div>
              <div className="continent-details">
                <div className="detail-row">
                  <span>Servers:</span>
                  <span className="detail-value">{data.servers}</span>
                </div>
                <div className="detail-row">
                  <span>Users:</span>
                  <span className="detail-value">{(data.users / 1000).toFixed(1)}K</span>
                </div>
                <div className="detail-row">
                  <span>Avg Load:</span>
                  <span className="detail-value" style={{ color: getLoadColor(data.avgLoad) }}>
                    {data.avgLoad}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeographicMap;
