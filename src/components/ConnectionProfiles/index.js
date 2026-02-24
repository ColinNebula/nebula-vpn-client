import React, { useState } from 'react';
import './ConnectionProfiles.css';

const DEFAULT_PROFILES = [
  {
    id: 'work',
    name: 'Work',
    icon: '💼',
    description: 'Maximum security for corporate browsing',
    color: '#1976d2',
    settings: { protocol: 'WireGuard', killSwitch: true, splitTunneling: false, dnsLeakProtection: true, obfuscation: false },
    preferredPurpose: 'general',
    preferCountry: 'US',
    builtIn: true,
  },
  {
    id: 'streaming',
    name: 'Streaming',
    icon: '🎬',
    description: 'Fast servers optimised for video streaming',
    color: '#e91e63',
    settings: { protocol: 'WireGuard', killSwitch: false, splitTunneling: true, dnsLeakProtection: true, obfuscation: false },
    preferredPurpose: 'streaming',
    preferCountry: 'GB',
    builtIn: true,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    description: 'Low-latency servers for online gaming',
    color: '#9c27b0',
    settings: { protocol: 'WireGuard', killSwitch: false, splitTunneling: true, dnsLeakProtection: false, obfuscation: false },
    preferredPurpose: 'gaming',
    preferCountry: 'SG',
    builtIn: true,
  },
  {
    id: 'privacy',
    name: 'Max Privacy',
    icon: '🛡️',
    description: 'Hardened settings for sensitive browsing',
    color: '#2e7d32',
    settings: { protocol: 'OpenVPN', killSwitch: true, splitTunneling: false, dnsLeakProtection: true, obfuscation: true },
    preferredPurpose: 'general',
    preferCountry: 'CH',
    builtIn: true,
  },
  {
    id: 'p2p',
    name: 'P2P / Torrents',
    icon: '📁',
    description: 'P2P-optimised servers with port flexibility',
    color: '#ff5722',
    settings: { protocol: 'OpenVPN', killSwitch: true, splitTunneling: false, dnsLeakProtection: true, obfuscation: false },
    preferredPurpose: 'p2p',
    preferCountry: 'NL',
    builtIn: true,
  },
];

const PROTOCOLS       = ['WireGuard', 'OpenVPN', 'IKEv2'];
const COUNTRY_OPTIONS = ['US', 'GB', 'DE', 'NL', 'SG', 'JP', 'CA', 'CH', 'SE', 'AU'];
const PURPOSE_OPTIONS = ['general', 'streaming', 'gaming', 'p2p'];

const ConnectionProfiles = ({ onActivate, isConnected, currentSettings }) => {
  const [profiles, setProfiles]           = useState(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [editingId, setEditingId]         = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [draft, setDraft]                 = useState(null);

  const startEdit = (profile) => {
    setDraft({ ...profile, settings: { ...profile.settings } });
    setEditingId(profile.id);
    setShowCreate(false);
  };

  const startCreate = () => {
    setDraft({
      id: `custom_${Date.now()}`,
      name: '',
      icon: '⚡',
      description: '',
      color: '#667eea',
      settings: { protocol: 'WireGuard', killSwitch: true, splitTunneling: false, dnsLeakProtection: true, obfuscation: false },
      preferredPurpose: 'general',
      preferCountry: 'US',
      builtIn: false,
    });
    setEditingId(null);
    setShowCreate(true);
  };

  const saveDraft = () => {
    if (!draft.name.trim()) return;
    if (showCreate) {
      setProfiles(prev => [...prev, { ...draft }]);
    } else {
      setProfiles(prev => prev.map(p => p.id === draft.id ? { ...draft } : p));
    }
    setDraft(null);
    setEditingId(null);
    setShowCreate(false);
  };

  const deleteProfile = (id) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfileId === id) setActiveProfileId(null);
  };

  const activateProfile = (profile) => {
    setActiveProfileId(profile.id);
    if (onActivate) onActivate(profile);
  };

  const toggleSetting = (key) => {
    setDraft(prev => ({ ...prev, settings: { ...prev.settings, [key]: !prev.settings[key] } }));
  };

  const ICON_OPTIONS = ['⚡', '🔒', '💼', '🎬', '🎮', '📁', '🛡️', '🚀', '🌍', '🔐', '🧅', '🥷'];
  const COLOR_OPTIONS = ['#667eea', '#e91e63', '#9c27b0', '#ff5722', '#1976d2', '#2e7d32', '#f57c00', '#455a64'];

  return (
    <div className="cp-container">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-left">
          <span className="cp-icon">⚡</span>
          <div>
            <h2 className="cp-title">Connection Profiles</h2>
            <p className="cp-subtitle">One-click presets for different browsing needs</p>
          </div>
        </div>
        <button className="cp-create-btn" onClick={startCreate}>+ New Profile</button>
      </div>

      {/* Active indicator */}
      {activeProfileId && (
        <div className="cp-active-banner">
          ✅ Profile active: <strong>{profiles.find(p => p.id === activeProfileId)?.name}</strong>
          {isConnected && ' — settings applied to current session'}
        </div>
      )}

      {/* Create / Edit form */}
      {(showCreate || editingId) && draft && (
        <div className="cp-form">
          <h3 className="cp-form-title">{showCreate ? '✨ Create Profile' : '✏️ Edit Profile'}</h3>

          <div className="cp-form-row">
            <div className="cp-form-group">
              <label>Name</label>
              <input
                className="cp-input"
                value={draft.name}
                placeholder="e.g. Office VPN"
                onChange={(e) => setDraft(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="cp-form-group">
              <label>Description</label>
              <input
                className="cp-input"
                value={draft.description}
                placeholder="Short description"
                onChange={(e) => setDraft(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="cp-form-row">
            <div className="cp-form-group">
              <label>Icon</label>
              <div className="cp-icon-picker">
                {ICON_OPTIONS.map(ic => (
                  <button
                    key={ic}
                    className={`cp-icon-opt ${draft.icon === ic ? 'selected' : ''}`}
                    onClick={() => setDraft(p => ({ ...p, icon: ic }))}
                  >{ic}</button>
                ))}
              </div>
            </div>
            <div className="cp-form-group">
              <label>Colour</label>
              <div className="cp-color-picker">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    className={`cp-color-opt ${draft.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setDraft(p => ({ ...p, color: c }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="cp-form-row cp-form-row-3">
            <div className="cp-form-group">
              <label>Protocol</label>
              <select className="cp-select" value={draft.settings.protocol} onChange={(e) => setDraft(p => ({ ...p, settings: { ...p.settings, protocol: e.target.value } }))}>
                {PROTOCOLS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
              </select>
            </div>
            <div className="cp-form-group">
              <label>Preferred Region</label>
              <select className="cp-select" value={draft.preferCountry} onChange={(e) => setDraft(p => ({ ...p, preferCountry: e.target.value }))}>
                {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="cp-form-group">
              <label>Server Purpose</label>
              <select className="cp-select" value={draft.preferredPurpose} onChange={(e) => setDraft(p => ({ ...p, preferredPurpose: e.target.value }))}>
                {PURPOSE_OPTIONS.map(pu => <option key={pu} value={pu}>{pu.charAt(0).toUpperCase() + pu.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="cp-form-group">
            <label>Security Settings</label>
            <div className="cp-toggles">
              {[
                { key: 'killSwitch',        label: 'Kill Switch',          icon: '🔪' },
                { key: 'splitTunneling',    label: 'Split Tunnelling',     icon: '📱' },
                { key: 'dnsLeakProtection', label: 'DNS Leak Protection',  icon: '🔒' },
                { key: 'obfuscation',       label: 'Obfuscation',          icon: '🥷' },
              ].map(({ key, label, icon }) => (
                <label key={key} className="cp-toggle-item">
                  <span>{icon} {label}</span>
                  <div className={`cp-mini-toggle ${draft.settings[key] ? 'on' : ''}`} onClick={() => toggleSetting(key)}>
                    <div className="cp-mini-knob" />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="cp-form-actions">
            <button className="cp-save-btn" onClick={saveDraft} disabled={!draft.name.trim()}>
              💾 Save Profile
            </button>
            <button className="cp-cancel-btn" onClick={() => { setDraft(null); setEditingId(null); setShowCreate(false); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile grid */}
      <div className="cp-grid">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`cp-card ${activeProfileId === profile.id ? 'active' : ''}`}
            style={{ '--profile-color': profile.color }}
          >
            <div className="cp-card-top">
              <div className="cp-card-icon" style={{ background: profile.color }}>{profile.icon}</div>
              <div className="cp-card-info">
                <h4 className="cp-card-name">{profile.name}</h4>
                <p className="cp-card-desc">{profile.description}</p>
              </div>
              {activeProfileId === profile.id && <span className="cp-active-dot">●</span>}
            </div>

            <div className="cp-card-meta">
              <span className="cp-meta-tag">🔌 {profile.settings.protocol}</span>
              <span className="cp-meta-tag">🌍 {profile.preferCountry}</span>
              <span className="cp-meta-tag">📂 {profile.preferredPurpose}</span>
            </div>

            <div className="cp-card-flags">
              {profile.settings.killSwitch        && <span className="cp-flag">🔪 Kill Switch</span>}
              {profile.settings.splitTunneling    && <span className="cp-flag">📱 Split</span>}
              {profile.settings.dnsLeakProtection && <span className="cp-flag">🔒 DNS</span>}
              {profile.settings.obfuscation       && <span className="cp-flag">🥷 Obfuscated</span>}
            </div>

            <div className="cp-card-actions">
              <button
                className={`cp-activate-btn ${activeProfileId === profile.id ? 'deactivate' : ''}`}
                onClick={() => activeProfileId === profile.id ? setActiveProfileId(null) : activateProfile(profile)}
              >
                {activeProfileId === profile.id ? '⏹ Deactivate' : '▶ Activate'}
              </button>
              {!profile.builtIn && (
                <>
                  <button className="cp-edit-btn" onClick={() => startEdit(profile)}>✏️</button>
                  <button className="cp-delete-btn" onClick={() => deleteProfile(profile.id)}>🗑️</button>
                </>
              )}
              {profile.builtIn && (
                <button className="cp-edit-btn" onClick={() => startEdit(profile)} title="Customise">✏️</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionProfiles;
