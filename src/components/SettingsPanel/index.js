import React from 'react';
import './SettingsPanel.css';

const SettingsPanel = ({ settings, onSettingsChange }) => {
  const handleSettingChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="settings-panel">
      <h3>⚙️ Settings</h3>
      
      <div className="settings-section">
        <h4>Appearance</h4>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Dark Mode</label>
            <span className="setting-description">Switch between light and dark themes</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Connection</h4>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Auto-connect</label>
            <span className="setting-description">Automatically connect to the last used server on startup</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.autoConnect}
              onChange={(e) => handleSettingChange('autoConnect', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Kill Switch</label>
            <span className="setting-description">Block internet access if VPN connection drops</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.killSwitch}
              onChange={(e) => handleSettingChange('killSwitch', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>VPN Protocol</label>
            <span className="setting-description">Choose your preferred VPN protocol</span>
          </div>
          <select
            value={settings.protocol}
            onChange={(e) => handleSettingChange('protocol', e.target.value)}
            className="setting-select"
          >
            <option value="OpenVPN">OpenVPN</option>
            <option value="WireGuard">WireGuard</option>
            <option value="IKEv2">IKEv2</option>
          </select>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Notifications</h4>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Enable Notifications</label>
            <span className="setting-description">Get notified about connection status changes</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>Advanced</h4>
        
        <div className="setting-item">
          <button className="action-btn secondary">Clear Cache</button>
          <button className="action-btn secondary">Reset Settings</button>
        </div>
        
        <div className="setting-item">
          <button className="action-btn danger">Export Logs</button>
        </div>
      </div>
      
      <div className="settings-footer">
        <p>Nebula VPN Client v1.0.0</p>
        <p>For support, contact: support@nebula.com</p>
      </div>
    </div>
  );
};

export default SettingsPanel;