import React, { useState } from 'react';
import './VPNChaining.css';

// ── Full server pool (module-level so applyPreset can always look up by name) ─
const ALL_SERVER_POOL = [
  { id: 1,  name: 'US East',     country: 'US', flag: '🇺🇸', latency: 25  },
  { id: 2,  name: 'UK London',   country: 'UK', flag: '🇬🇧', latency: 45  },
  { id: 3,  name: 'Germany',     country: 'DE', flag: '🇩🇪', latency: 65  },
  { id: 4,  name: 'US West',     country: 'US', flag: '🇺🇸', latency: 18  },
  { id: 5,  name: 'Canada',      country: 'CA', flag: '🇨🇦', latency: 30  },
  { id: 6,  name: 'France',      country: 'FR', flag: '🇫🇷', latency: 50  },
  { id: 7,  name: 'Netherlands', country: 'NL', flag: '🇳🇱', latency: 48  },
  { id: 8,  name: 'Switzerland', country: 'CH', flag: '🇨🇭', latency: 52  },
  { id: 9,  name: 'Singapore',   country: 'SG', flag: '🇸🇬', latency: 180 },
  { id: 10, name: 'Japan',       country: 'JP', flag: '🇯🇵', latency: 145 },
  { id: 11, name: 'Australia',   country: 'AU', flag: '🇦🇺', latency: 220 },
];

const VPNChaining = () => {
  const [chainingEnabled, setChainingEnabled] = useState(false);
  const [chainedServers, setChainedServers] = useState(
    ALL_SERVER_POOL.filter(s => s.id <= 3).map((s, i) => ({ ...s, position: i + 1 }))
  );

  // Servers not in the chain - recomputed so removed servers become re-addable
  const availableServers = ALL_SERVER_POOL.filter(s => !chainedServers.find(c => c.id === s.id));

  const chainPresets = [
    {
      id: 1,
      name: '🛡️ Maximum Privacy',
      description: 'Multiple jurisdictions for maximum anonymity',
      servers: ['US East', 'Switzerland', 'Singapore'],
      hops: 3
    },
    {
      id: 2,
      name: '⚡ Balanced Speed',
      description: 'Two hops with low latency servers',
      servers: ['US East', 'Canada'],
      hops: 2
    },
    {
      id: 3,
      name: '🌍 Global Route',
      description: 'Cross-continental chain for advanced obfuscation',
      servers: ['US West', 'UK London', 'Singapore', 'Australia'],
      hops: 4
    },
    {
      id: 4,
      name: '🇪🇺 European Circuit',
      description: 'EU-only servers for GDPR compliance',
      servers: ['France', 'Germany', 'Netherlands'],
      hops: 3
    },
  ];

  const [routingMode, setRoutingMode] = useState('cascade');
  // Derived directly from current chain - never stale when servers are added/removed
  const totalLatency = chainedServers.reduce((sum, s) => sum + s.latency, 0);

  const addServer = (server) => {
    if (chainedServers.length >= 5) {
      alert('Maximum 5 servers in a chain');
      return;
    }
    const newServer = { ...server, position: chainedServers.length + 1 };
    setChainedServers([...chainedServers, newServer]);
  };

  const removeServer = (id) => {
    setChainedServers(chainedServers
      .filter(s => s.id !== id)
      .map((s, index) => ({ ...s, position: index + 1 }))
    );
  };

  const moveServer = (id, direction) => {
    const index = chainedServers.findIndex(s => s.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === chainedServers.length - 1)) {
      return;
    }
    
    const newServers = [...chainedServers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newServers[index], newServers[targetIndex]] = [newServers[targetIndex], newServers[index]];
    setChainedServers(newServers.map((s, i) => ({ ...s, position: i + 1 })));
  };

  const applyPreset = (preset) => {
    const matched = preset.servers
      .map(name => ALL_SERVER_POOL.find(s => s.name === name))
      .filter(Boolean);
    if (matched.length === 0) {
      alert(`No matching servers found for preset "${preset.name}".`);
      return;
    }
    setChainedServers(matched.map((s, i) => ({ ...s, position: i + 1 })));
  };

  return (
    <div className="vpn-chaining">
      <div className="chaining-header">
        <h3>🔗 VPN Chaining</h3>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${chainingEnabled ? 'active' : 'inactive'}`}>
        <span className="banner-icon">{chainingEnabled ? '🔗' : '⛓️‍💥'}</span>
        <div className="banner-content">
          <h4>Multi-Hop {chainingEnabled ? 'Active' : 'Disabled'}</h4>
          <p>
            {chainingEnabled 
              ? `${chainedServers.length} servers chained • Total latency: ${totalLatency}ms`
              : 'Enable to route through multiple VPN servers'}
          </p>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={chainingEnabled}
            onChange={() => setChainingEnabled(!chainingEnabled)}
            disabled={chainedServers.length < 2}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {chainedServers.length < 2 && (
        <div className="warning-banner">
          ⚠️ Add at least 2 servers to enable VPN chaining
        </div>
      )}

      {/* Quick Presets */}
      <div className="presets-section">
        <h4>⚡ Quick Presets</h4>
        <div className="presets-grid">
          {chainPresets.map(preset => (
            <div key={preset.id} className="preset-card">
              <div className="preset-header">
                <span className="preset-name">{preset.name}</span>
                <span className="preset-hops">{preset.hops} hops</span>
              </div>
              <p className="preset-description">{preset.description}</p>
              <div className="preset-servers">
                {preset.servers.map((server, i) => (
                  <span key={i} className="preset-server">{server}</span>
                ))}
              </div>
              <button 
                className="apply-preset-btn"
                onClick={() => applyPreset(preset)}
              >
                Apply Preset
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chain Visualization */}
      <div className="chain-section">
        <div className="section-header">
          <h4>🔗 Server Chain ({chainedServers.length} hops)</h4>
          <div className="chain-info">
            <span className="info-item">Total Latency: <strong>{totalLatency}ms</strong></span>
            <span className="info-item">Speed Impact: <strong>{chainedServers.length * 15}%</strong></span>
          </div>
        </div>

        <div className="chain-flow">
          <div className="chain-start">
            <span className="chain-icon">💻</span>
            <span className="chain-label">Your Device</span>
          </div>

          {chainedServers.map((server, index) => (
            <React.Fragment key={server.id}>
              <div className="chain-arrow">→</div>
              <div className="chain-server">
                <div className="server-card">
                  <div className="server-header">
                    <span className="server-flag">{server.flag}</span>
                    <div className="server-info">
                      <span className="server-name">{server.name}</span>
                      <span className="server-latency">{server.latency}ms</span>
                    </div>
                    <span className="server-position">#{server.position}</span>
                  </div>
                  <div className="server-controls">
                    <button 
                      className="move-btn"
                      onClick={() => moveServer(server.id, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button 
                      className="move-btn"
                      onClick={() => moveServer(server.id, 'down')}
                      disabled={index === chainedServers.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => removeServer(server.id)}
                      title="Remove from chain"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

          <div className="chain-arrow">→</div>
          <div className="chain-end">
            <span className="chain-icon">🌐</span>
            <span className="chain-label">Internet</span>
          </div>
        </div>
      </div>

      {/* Routing Mode */}
      <div className="routing-section">
        <h4>⚙️ Routing Mode</h4>
        <div className="routing-options">
          <label className={`routing-option ${routingMode === 'cascade' ? 'selected' : ''}`}>
            <input 
              type="radio"
              name="routing"
              value="cascade"
              checked={routingMode === 'cascade'}
              onChange={(e) => setRoutingMode(e.target.value)}
            />
            <div className="routing-content">
              <span className="routing-icon">🔗</span>
              <div>
                <h5>Cascade</h5>
                <p>Sequential routing through each server</p>
              </div>
            </div>
          </label>
          <label className={`routing-option ${routingMode === 'parallel' ? 'selected' : ''}`}>
            <input 
              type="radio"
              name="routing"
              value="parallel"
              checked={routingMode === 'parallel'}
              onChange={(e) => setRoutingMode(e.target.value)}
            />
            <div className="routing-content">
              <span className="routing-icon">⚡</span>
              <div>
                <h5>Parallel</h5>
                <p>Split traffic across servers simultaneously</p>
              </div>
            </div>
          </label>
          <label className={`routing-option ${routingMode === 'random' ? 'selected' : ''}`}>
            <input 
              type="radio"
              name="routing"
              value="random"
              checked={routingMode === 'random'}
              onChange={(e) => setRoutingMode(e.target.value)}
            />
            <div className="routing-content">
              <span className="routing-icon">🎲</span>
              <div>
                <h5>Random</h5>
                <p>Randomize route for each connection</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Available Servers */}
      <div className="available-section">
        <h4>➕ Add Servers to Chain</h4>
        <div className="servers-grid">
          {availableServers
            .filter(s => !chainedServers.find(cs => cs.id === s.id))
            .map(server => (
              <div key={server.id} className="available-server">
                <span className="server-flag-large">{server.flag}</span>
                <div className="server-details">
                  <span className="server-name-large">{server.name}</span>
                  <span className="server-latency-small">{server.latency}ms</span>
                </div>
                <button 
                  className="add-server-btn"
                  onClick={() => addServer(server)}
                  title="Add to chain"
                >
                  +
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Information */}
      <div className="chaining-info">
        <h4>ℹ️ About VPN Chaining</h4>
        <div className="info-grid">
          <div className="info-card">
            <span className="info-icon">🛡️</span>
            <h5>Enhanced Privacy</h5>
            <p>Route through multiple jurisdictions to maximize anonymity and prevent tracking.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🐌</span>
            <h5>Speed Impact</h5>
            <p>Each hop adds latency (~15-20%). Use 2-3 hops for balance between speed and security.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🔒</span>
            <h5>Multi-Layer Encryption</h5>
            <p>Your data is encrypted multiple times, with each server only knowing the previous and next hop.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">⚖️</span>
            <h5>Legal Jurisdiction</h5>
            <p>Chain servers in different countries to cross legal jurisdictions and enhance protection.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VPNChaining;
