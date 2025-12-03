import React, { useState } from 'react';
import './Meshnet.css';

const Meshnet = () => {
  const [meshnetEnabled, setMeshnetEnabled] = useState(false);
  const [devices, setDevices] = useState([
    { id: 1, name: 'Gaming PC', type: 'desktop', ip: '10.5.0.1', status: 'online', os: 'Windows 11', lastSeen: 'Now' },
    { id: 2, name: 'Work Laptop', type: 'laptop', ip: '10.5.0.2', status: 'online', os: 'macOS', lastSeen: 'Now' },
    { id: 3, name: 'iPhone 15', type: 'phone', ip: '10.5.0.3', status: 'offline', os: 'iOS 17', lastSeen: '2h ago' },
  ]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [networkName, setNetworkName] = useState('My Nebula Network');
  const [allowLanAccess, setAllowLanAccess] = useState(true);
  const [allowFileSharing, setAllowFileSharing] = useState(true);
  const [routeTraffic, setRouteTraffic] = useState(false);
  const [externalDevices, setExternalDevices] = useState([]);

  const deviceIcons = {
    desktop: '🖥️',
    laptop: '💻',
    phone: '📱',
    tablet: '📲',
    server: '🖧',
    router: '📡'
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#9e9e9e';
      case 'connecting': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const handleInvite = () => {
    if (inviteEmail) {
      setExternalDevices([
        ...externalDevices,
        { id: Date.now(), email: inviteEmail, status: 'pending', invited: new Date().toLocaleDateString() }
      ]);
      setInviteEmail('');
      setShowInvite(false);
    }
  };

  const removeDevice = (id) => {
    setDevices(devices.filter(d => d.id !== id));
  };

  const useCases = [
    {
      icon: '🎮',
      title: 'LAN Gaming',
      desc: 'Play local multiplayer games with friends anywhere in the world',
      popular: true
    },
    {
      icon: '📁',
      title: 'File Sharing',
      desc: 'Share files directly between devices without cloud services'
    },
    {
      icon: '🖨️',
      title: 'Remote Printing',
      desc: 'Print to your home printer from anywhere'
    },
    {
      icon: '🎬',
      title: 'Media Streaming',
      desc: 'Access your home media server while traveling'
    },
    {
      icon: '🔧',
      title: 'Remote Access',
      desc: 'SSH, RDP, VNC to your devices securely'
    },
    {
      icon: '🏠',
      title: 'Smart Home',
      desc: 'Control smart home devices from outside your network'
    }
  ];

  return (
    <div className="meshnet">
      <div className="meshnet-header">
        <div className="header-left">
          <h3>🔗 Meshnet / Private Network</h3>
          <span className="header-badge">NordVPN-Style</span>
        </div>
        <div className="network-info">
          <span className="network-name">{networkName}</span>
          <span className="device-count">{devices.filter(d => d.status === 'online').length}/{devices.length} online</span>
        </div>
      </div>

      {/* Network Visualization */}
      <div className={`network-visual ${meshnetEnabled ? 'active' : ''}`}>
        <div className="central-hub">
          <div className="hub-icon">🌐</div>
          <span className="hub-label">Nebula Mesh</span>
          {meshnetEnabled && <div className="hub-pulse"></div>}
        </div>
        
        <div className="device-nodes">
          {devices.map((device, index) => (
            <div 
              key={device.id}
              className={`device-node ${device.status} ${selectedDevice === device.id ? 'selected' : ''}`}
              style={{ 
                '--angle': `${(index * 360 / devices.length) - 90}deg`,
                '--delay': `${index * 0.1}s`
              }}
              onClick={() => setSelectedDevice(device.id === selectedDevice ? null : device.id)}
            >
              <div className="node-connector" style={{ background: meshnetEnabled ? getStatusColor(device.status) : '#ccc' }}></div>
              <div className="node-content">
                <span className="node-icon">{deviceIcons[device.type]}</span>
                <span className="node-name">{device.name}</span>
                <span className="node-status" style={{ background: getStatusColor(device.status) }}></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Toggle */}
      <div className="toggle-section">
        <div className="toggle-container">
          <div className="toggle-info">
            <span className="toggle-icon">🔗</span>
            <div>
              <h4>Enable Meshnet</h4>
              <p>Create encrypted private network between your devices</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={meshnetEnabled}
              onChange={() => setMeshnetEnabled(!meshnetEnabled)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {meshnetEnabled && (
        <>
          {/* Device List */}
          <div className="devices-section">
            <div className="section-header">
              <h4>📱 My Devices</h4>
              <button className="add-device-btn" onClick={() => {}}>
                + Link Device
              </button>
            </div>

            <div className="devices-list">
              {devices.map(device => (
                <div 
                  key={device.id} 
                  className={`device-card ${device.status} ${selectedDevice === device.id ? 'expanded' : ''}`}
                  onClick={() => setSelectedDevice(device.id === selectedDevice ? null : device.id)}
                >
                  <div className="device-main">
                    <span className="device-icon">{deviceIcons[device.type]}</span>
                    <div className="device-info">
                      <span className="device-name">{device.name}</span>
                      <span className="device-meta">{device.os} • {device.ip}</span>
                    </div>
                    <div className="device-status-badge" style={{ background: getStatusColor(device.status) }}>
                      {device.status}
                    </div>
                  </div>
                  
                  {selectedDevice === device.id && (
                    <div className="device-details">
                      <div className="detail-row">
                        <span className="detail-label">Mesh IP:</span>
                        <span className="detail-value code">{device.ip}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Last Seen:</span>
                        <span className="detail-value">{device.lastSeen}</span>
                      </div>
                      <div className="device-actions">
                        <button className="action-btn">📋 Copy IP</button>
                        <button className="action-btn">🔌 Connect</button>
                        <button className="action-btn danger" onClick={(e) => { e.stopPropagation(); removeDevice(device.id); }}>
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* External Devices / Invites */}
          <div className="external-section">
            <div className="section-header">
              <h4>👥 External Devices</h4>
              <button className="invite-btn" onClick={() => setShowInvite(true)}>
                ✉️ Invite
              </button>
            </div>

            {externalDevices.length > 0 ? (
              <div className="external-list">
                {externalDevices.map(ext => (
                  <div key={ext.id} className="external-card">
                    <span className="ext-email">{ext.email}</span>
                    <span className={`ext-status ${ext.status}`}>{ext.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="external-empty">
                <span className="empty-icon">👥</span>
                <p>Invite friends to share your mesh network securely</p>
              </div>
            )}

            {showInvite && (
              <div className="invite-modal">
                <div className="invite-content">
                  <h4>Invite to Meshnet</h4>
                  <p>Send an invitation to connect their device to your private network</p>
                  <input 
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <div className="invite-actions">
                    <button className="btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleInvite}>Send Invite</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Permissions & Settings */}
          <div className="permissions-section">
            <h4>⚙️ Network Permissions</h4>

            <div className="permission-item">
              <div className="permission-info">
                <span className="permission-icon">🌐</span>
                <div>
                  <h5>Allow LAN Access</h5>
                  <p>Let connected devices access your local network</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={allowLanAccess}
                  onChange={() => setAllowLanAccess(!allowLanAccess)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="permission-item">
              <div className="permission-info">
                <span className="permission-icon">📁</span>
                <div>
                  <h5>File Sharing</h5>
                  <p>Enable direct file transfer between devices</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={allowFileSharing}
                  onChange={() => setAllowFileSharing(!allowFileSharing)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="permission-item">
              <div className="permission-info">
                <span className="permission-icon">🔀</span>
                <div>
                  <h5>Route Traffic</h5>
                  <p>Route external devices' traffic through your connection</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={routeTraffic}
                  onChange={() => setRouteTraffic(!routeTraffic)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Use Cases */}
          <div className="use-cases-section">
            <h4>💡 What You Can Do</h4>
            <div className="use-cases-grid">
              {useCases.map((useCase, idx) => (
                <div key={idx} className={`use-case-card ${useCase.popular ? 'popular' : ''}`}>
                  {useCase.popular && <span className="popular-badge">Popular</span>}
                  <span className="use-case-icon">{useCase.icon}</span>
                  <h5>{useCase.title}</h5>
                  <p>{useCase.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Info Banner */}
      <div className="meshnet-info">
        <div className="info-icon">🔒</div>
        <div className="info-content">
          <strong>End-to-End Encrypted</strong>
          <p>All traffic between mesh devices is encrypted with WireGuard. No one, including Nebula, can see your data.</p>
        </div>
      </div>
    </div>
  );
};

export default Meshnet;
