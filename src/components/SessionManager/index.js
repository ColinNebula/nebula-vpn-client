import React, { useState } from 'react';
import './SessionManager.css';

const SessionManager = ({ onLoadProfile }) => {
  const [profiles, setProfiles] = useState([
    {
      id: 1,
      name: '💼 Work Profile',
      description: 'Optimized for productivity and security',
      server: 'US East',
      multiHop: false,
      splitTunnel: true,
      killSwitch: true,
      apps: ['Slack', 'Zoom', 'Browser'],
      lastUsed: '2 hours ago',
      icon: '💼'
    },
    {
      id: 2,
      name: '🎮 Gaming Mode',
      description: 'Low latency servers and optimized routing',
      server: 'Singapore Gaming',
      multiHop: false,
      splitTunnel: true,
      killSwitch: false,
      apps: ['Steam', 'Discord'],
      lastUsed: 'Yesterday',
      icon: '🎮'
    },
    {
      id: 3,
      name: '📺 Streaming',
      description: 'Fast servers for 4K streaming',
      server: 'UK London',
      multiHop: false,
      splitTunnel: false,
      killSwitch: true,
      apps: [],
      lastUsed: '3 days ago',
      icon: '📺'
    },
    {
      id: 4,
      name: '🔒 Maximum Privacy',
      description: 'Multi-hop with strict security',
      server: 'Multi-hop chain',
      multiHop: true,
      splitTunnel: false,
      killSwitch: true,
      apps: [],
      lastUsed: '1 week ago',
      icon: '🔒'
    },
  ]);

  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    icon: '⭐',
    server: '',
    multiHop: false,
    splitTunnel: false,
    killSwitch: true,
    apps: []
  });

  const quickProfiles = [
    { id: 'work', name: '💼 Work', desc: 'Balanced security for work' },
    { id: 'gaming', name: '🎮 Gaming', desc: 'Low latency priority' },
    { id: 'streaming', name: '📺 Streaming', desc: 'High speed servers' },
    { id: 'travel', name: '✈️ Travel', desc: 'Location-based switching' },
    { id: 'privacy', name: '🔒 Privacy', desc: 'Maximum anonymity' },
    { id: 'home', name: '🏠 Home', desc: 'Comfortable browsing' },
    { id: 'publicwifi', name: '📶 Public WiFi', desc: 'Auto-connect on unsafe networks' },
    { id: 'torrenting', name: '⬇️ Torrenting', desc: 'P2P-optimized servers' },
  ];

  const loadProfile = (profile) => {
    if (onLoadProfile) {
      onLoadProfile(profile);
    }
    alert(`✓ Loaded "${profile.name}" profile!`);
  };

  const deleteProfile = (id) => {
    if (window.confirm('Delete this profile?')) {
      setProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const createProfile = () => {
    if (!newProfile.name) {
      alert('Please enter a profile name');
      return;
    }
    
    const profile = {
      ...newProfile,
      id: Date.now(),
      lastUsed: 'Never'
    };
    
    setProfiles([...profiles, profile]);
    setShowCreateProfile(false);
    setNewProfile({
      name: '',
      description: '',
      icon: '⭐',
      server: '',
      multiHop: false,
      splitTunnel: false,
      killSwitch: true,
      apps: []
    });
    
    alert('✓ Profile created successfully!');
  };

  const exportProfiles = () => {
    const dataStr = JSON.stringify(profiles, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nebula-vpn-profiles.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importProfiles = () => {
    alert('Import functionality would open a file picker here');
  };

  return (
    <div className="session-manager">
      <div className="manager-header">
        <h3>💾 Session Manager</h3>
        <div className="header-actions">
          <button className="header-btn" onClick={exportProfiles}>
            📤 Export
          </button>
          <button className="header-btn" onClick={importProfiles}>
            📥 Import
          </button>
          <button 
            className="header-btn create"
            onClick={() => setShowCreateProfile(!showCreateProfile)}
          >
            ➕ New Profile
          </button>
        </div>
      </div>

      {/* Quick Profiles */}
      <div className="quick-profiles-section">
        <h4>⚡ Quick Profiles</h4>
        <div className="quick-profiles-grid">
          {quickProfiles.map(profile => (
            <button key={profile.id} className="quick-profile-card">
              <span className="quick-profile-name">{profile.name}</span>
              <span className="quick-profile-desc">{profile.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Profile Form */}
      {showCreateProfile && (
        <div className="create-profile-form">
          <h4>➕ Create New Profile</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Profile Icon</label>
              <select 
                value={newProfile.icon}
                onChange={(e) => setNewProfile({...newProfile, icon: e.target.value})}
                className="form-select"
              >
                <option>⭐</option>
                <option>💼</option>
                <option>🎮</option>
                <option>📺</option>
                <option>🔒</option>
                <option>✈️</option>
                <option>🏠</option>
                <option>📶</option>
                <option>⬇️</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Profile Name *</label>
              <input 
                type="text"
                value={newProfile.name}
                onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                placeholder="e.g., My Custom Profile"
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <input 
                type="text"
                value={newProfile.description}
                onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                placeholder="Optional description"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Server</label>
              <input 
                type="text"
                value={newProfile.server}
                onChange={(e) => setNewProfile({...newProfile, server: e.target.value})}
                placeholder="e.g., US East"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={newProfile.multiHop}
                  onChange={(e) => setNewProfile({...newProfile, multiHop: e.target.checked})}
                />
                Multi-Hop Enabled
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={newProfile.splitTunnel}
                  onChange={(e) => setNewProfile({...newProfile, splitTunnel: e.target.checked})}
                />
                Split Tunneling
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={newProfile.killSwitch}
                  onChange={(e) => setNewProfile({...newProfile, killSwitch: e.target.checked})}
                />
                Kill Switch
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button className="create-btn" onClick={createProfile}>
              💾 Create Profile
            </button>
            <button className="cancel-btn" onClick={() => setShowCreateProfile(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Profiles */}
      <div className="saved-profiles-section">
        <h4>💾 Saved Profiles ({profiles.length})</h4>
        <div className="profiles-grid">
          {profiles.map(profile => (
            <div key={profile.id} className="profile-card">
              <div className="profile-icon-large">{profile.icon}</div>
              <div className="profile-info">
                <h5>{profile.name}</h5>
                <p className="profile-desc">{profile.description}</p>
                <div className="profile-details">
                  <span className="detail-item">
                    <span className="detail-icon">🌍</span>
                    {profile.server}
                  </span>
                  {profile.multiHop && (
                    <span className="detail-badge">🔗 Multi-Hop</span>
                  )}
                  {profile.splitTunnel && (
                    <span className="detail-badge">📱 Split Tunnel</span>
                  )}
                  {profile.killSwitch && (
                    <span className="detail-badge">🛡️ Kill Switch</span>
                  )}
                </div>
                {profile.apps.length > 0 && (
                  <div className="profile-apps">
                    <span className="apps-label">Apps:</span>
                    {profile.apps.map((app, i) => (
                      <span key={i} className="app-tag">{app}</span>
                    ))}
                  </div>
                )}
                <p className="profile-last-used">Last used: {profile.lastUsed}</p>
              </div>
              <div className="profile-actions">
                <button 
                  className="load-btn"
                  onClick={() => loadProfile(profile)}
                >
                  ▶️ Load
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteProfile(profile.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Switch Rules */}
      <div className="auto-switch-section">
        <h4>🤖 Auto-Switch Rules</h4>
        <p className="section-desc">
          Automatically switch profiles based on conditions (coming soon)
        </p>
        <div className="rules-preview">
          <div className="rule-item">
            <span className="rule-icon">⏰</span>
            <span>Switch to "Work Profile" on weekdays 9AM-5PM</span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">📶</span>
            <span>Switch to "Public WiFi" on unsecured networks</span>
          </div>
          <div className="rule-item">
            <span className="rule-icon">🌍</span>
            <span>Switch to "Travel" when location changes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
