import React, { useState } from 'react';
import './MultiHop.css';

const MultiHop = ({ servers, selectedServers, onServersChange, isConnected }) => {
  const [availableServers, setAvailableServers] = useState(servers);
  const [draggedServer, setDraggedServer] = useState(null);

  const handleAddServer = (server) => {
    if (selectedServers.length < 3 && !selectedServers.find(s => s.id === server.id)) {
      const newServers = [...selectedServers, server];
      onServersChange(newServers);
    }
  };

  const handleRemoveServer = (serverId) => {
    const newServers = selectedServers.filter(s => s.id !== serverId);
    onServersChange(newServers);
  };

  const handleReorderServers = (fromIndex, toIndex) => {
    const newServers = [...selectedServers];
    const [movedServer] = newServers.splice(fromIndex, 1);
    newServers.splice(toIndex, 0, movedServer);
    onServersChange(newServers);
  };

  const calculateTotalLatency = () => {
    return selectedServers.reduce((total, server) => total + parseInt(server.ping), 0);
  };

  const getSecurityLevel = () => {
    if (selectedServers.length === 0) return { level: 'None', color: '#9e9e9e' };
    if (selectedServers.length === 1) return { level: 'Standard', color: '#ff9800' };
    if (selectedServers.length === 2) return { level: 'High', color: '#4caf50' };
    return { level: 'Maximum', color: '#2196f3' };
  };

  const securityLevel = getSecurityLevel();

  if (!isConnected && selectedServers.length === 0) {
    return (
      <div className="multi-hop">
        <div className="multi-hop-intro">
          <h3>🔗 Multi-Hop VPN</h3>
          <div className="intro-content">
            <p>Route your traffic through multiple VPN servers for enhanced privacy and security.</p>
            
            <div className="benefits">
              <h4>Benefits of Multi-Hop:</h4>
              <ul>
                <li><strong>Enhanced Anonymity:</strong> Each hop masks your previous location</li>
                <li><strong>Advanced Security:</strong> Multiple layers of encryption</li>
                <li><strong>Geo-Redundancy:</strong> Bypass regional restrictions effectively</li>
                <li><strong>Traffic Obfuscation:</strong> Harder to analyze connection patterns</li>
              </ul>
            </div>

            <div className="getting-started">
              <h4>Getting Started:</h4>
              <ol>
                <li>Select 2-3 servers from different regions</li>
                <li>Drag to reorder your connection chain</li>
                <li>Connect to establish the multi-hop tunnel</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-hop">
      <div className="multi-hop-header">
        <h3>🔗 Multi-Hop Configuration</h3>
        <div className="security-indicator">
          <span className="security-label">Security Level:</span>
          <span className="security-level" style={{ color: securityLevel.color }}>
            {securityLevel.level}
          </span>
        </div>
      </div>

      <div className="multi-hop-stats">
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-info">
            <div className="stat-label">Hops</div>
            <div className="stat-value">{selectedServers.length}/3</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📡</div>
          <div className="stat-info">
            <div className="stat-label">Total Latency</div>
            <div className="stat-value">{calculateTotalLatency()}ms</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-info">
            <div className="stat-label">Countries</div>
            <div className="stat-value">{new Set(selectedServers.map(s => s.country)).size}</div>
          </div>
        </div>
      </div>

      <div className="hop-chain-container">
        <h4>Connection Chain</h4>
        {selectedServers.length === 0 ? (
          <div className="empty-chain">
            <p>No servers selected. Add servers below to create your multi-hop chain.</p>
          </div>
        ) : (
          <div className="hop-chain">
            <div className="your-device">
              <div className="device-icon">💻</div>
              <span>Your Device</span>
            </div>
            
            {selectedServers.map((server, index) => (
              <React.Fragment key={server.id}>
                <div className="hop-arrow">→</div>
                <div className="hop-server">
                  <div className="hop-info">
                    <span className="hop-flag">{server.flag}</span>
                    <div className="hop-details">
                      <div className="hop-name">{server.name}</div>
                      <div className="hop-location">{server.location}</div>
                      <div className="hop-ping">{server.ping}</div>
                    </div>
                  </div>
                  {!isConnected && (
                    <button 
                      className="remove-hop"
                      onClick={() => handleRemoveServer(server.id)}
                      title="Remove from chain"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </React.Fragment>
            ))}
            
            <div className="hop-arrow">→</div>
            <div className="destination">
              <div className="destination-icon">🌐</div>
              <span>Internet</span>
            </div>
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="available-servers">
          <h4>Available Multi-Hop Servers</h4>
          <div className="server-grid">
            {availableServers.map(server => (
              <div 
                key={server.id}
                className={`server-card ${
                  selectedServers.find(s => s.id === server.id) ? 'selected' : ''
                } ${selectedServers.length >= 3 ? 'disabled' : ''}`}
                onClick={() => handleAddServer(server)}
              >
                <div className="server-header">
                  <span className="server-flag">{server.flag}</span>
                  <div className="server-name">{server.name}</div>
                  {selectedServers.find(s => s.id === server.id) && (
                    <span className="selected-indicator">✓</span>
                  )}
                </div>
                <div className="server-details">
                  <div className="server-location">{server.location}</div>
                  <div className="server-metrics">
                    <span className="server-ping">{server.ping}</span>
                    <span className="server-load">{server.load}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedServers.length > 0 && (
        <div className="multi-hop-info">
          <div className="info-card warning">
            <h5>⚠️ Important Notes:</h5>
            <ul>
              <li>Multi-hop connections have higher latency due to multiple server hops</li>
              <li>Connection speed may be reduced but security is significantly enhanced</li>
              <li>Each hop adds an additional layer of encryption and anonymity</li>
              <li>Recommended for maximum privacy and bypassing advanced censorship</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiHop;