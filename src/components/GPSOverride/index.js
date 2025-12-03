import React, { useState, useEffect } from 'react';
import './GPSOverride.css';

const GPSOverride = () => {
  const [gpsOverrideEnabled, setGpsOverrideEnabled] = useState(false);
  const [autoMatch, setAutoMatch] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [customCoords, setCustomCoords] = useState({ lat: '', lng: '' });
  const [spoofAccuracy, setSpoofAccuracy] = useState('high');
  const [realLocation, setRealLocation] = useState(null);
  const [spoofedLocation, setSpoofedLocation] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [timezone, setTimezone] = useState('auto');
  const [randomizeMovement, setRandomizeMovement] = useState(false);

  // Simulated VPN server locations
  const vpnServers = [
    { id: 'us-ny', name: 'New York, US', lat: 40.7128, lng: -74.0060, tz: 'America/New_York', flag: '🇺🇸' },
    { id: 'us-la', name: 'Los Angeles, US', lat: 34.0522, lng: -118.2437, tz: 'America/Los_Angeles', flag: '🇺🇸' },
    { id: 'uk-lon', name: 'London, UK', lat: 51.5074, lng: -0.1278, tz: 'Europe/London', flag: '🇬🇧' },
    { id: 'de-fra', name: 'Frankfurt, DE', lat: 50.1109, lng: 8.6821, tz: 'Europe/Berlin', flag: '🇩🇪' },
    { id: 'jp-tok', name: 'Tokyo, JP', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo', flag: '🇯🇵' },
    { id: 'au-syd', name: 'Sydney, AU', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney', flag: '🇦🇺' },
    { id: 'sg', name: 'Singapore', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore', flag: '🇸🇬' },
    { id: 'br-sao', name: 'São Paulo, BR', lat: -23.5505, lng: -46.6333, tz: 'America/Sao_Paulo', flag: '🇧🇷' },
  ];

  // Simulate getting real location
  useEffect(() => {
    setIsDetecting(true);
    // Simulated real location (would use Geolocation API in real app)
    setTimeout(() => {
      setRealLocation({
        lat: 37.7749,
        lng: -122.4194,
        city: 'San Francisco, CA',
        accuracy: 15
      });
      setIsDetecting(false);
    }, 1000);
  }, []);

  // Update spoofed location when VPN server changes
  useEffect(() => {
    if (autoMatch && selectedLocation) {
      const server = vpnServers.find(s => s.id === selectedLocation);
      if (server) {
        // Add slight randomization for realism
        const jitter = randomizeMovement ? (Math.random() - 0.5) * 0.01 : 0;
        setSpoofedLocation({
          lat: server.lat + jitter,
          lng: server.lng + jitter,
          city: server.name,
          accuracy: spoofAccuracy === 'high' ? 10 : spoofAccuracy === 'medium' ? 50 : 100
        });
      }
    }
  }, [selectedLocation, autoMatch, spoofAccuracy, randomizeMovement]);

  const handleCustomCoords = () => {
    if (customCoords.lat && customCoords.lng) {
      setSpoofedLocation({
        lat: parseFloat(customCoords.lat),
        lng: parseFloat(customCoords.lng),
        city: 'Custom Location',
        accuracy: 10
      });
      setAutoMatch(false);
    }
  };

  const accuracyOptions = [
    { id: 'high', name: 'High Precision', desc: '~10m accuracy', icon: '🎯' },
    { id: 'medium', name: 'Medium', desc: '~50m accuracy', icon: '📍' },
    { id: 'low', name: 'Low', desc: '~100m accuracy', icon: '🗺️' },
  ];

  return (
    <div className="gps-override">
      <div className="gps-header">
        <h3>📍 GPS Override</h3>
        <span className="header-subtitle">Surfshark-Style Location Spoofing</span>
      </div>

      {/* Status Panel */}
      <div className={`gps-status-panel ${gpsOverrideEnabled ? 'active' : ''}`}>
        <div className="status-row">
          <div className="location-card real">
            <span className="location-label">📍 Real Location</span>
            {isDetecting ? (
              <span className="detecting">Detecting...</span>
            ) : realLocation ? (
              <>
                <span className="location-city">{realLocation.city}</span>
                <span className="location-coords">
                  {realLocation.lat.toFixed(4)}, {realLocation.lng.toFixed(4)}
                </span>
              </>
            ) : (
              <span className="unknown">Unknown</span>
            )}
          </div>
          
          <div className="arrow-indicator">
            {gpsOverrideEnabled ? '➡️' : '⏸️'}
          </div>
          
          <div className={`location-card spoofed ${gpsOverrideEnabled ? 'active' : ''}`}>
            <span className="location-label">🎭 Spoofed Location</span>
            {gpsOverrideEnabled && spoofedLocation ? (
              <>
                <span className="location-city">{spoofedLocation.city}</span>
                <span className="location-coords">
                  {spoofedLocation.lat.toFixed(4)}, {spoofedLocation.lng.toFixed(4)}
                </span>
              </>
            ) : (
              <span className="disabled">Disabled</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Toggle */}
      <div className="toggle-section">
        <div className="toggle-container">
          <div className="toggle-info">
            <span className="toggle-icon">📍</span>
            <div>
              <h4>Enable GPS Override</h4>
              <p>Spoof your GPS location to match VPN server or custom coordinates</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={gpsOverrideEnabled}
              onChange={() => setGpsOverrideEnabled(!gpsOverrideEnabled)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {gpsOverrideEnabled && (
        <>
          {/* Auto-Match Toggle */}
          <div className="auto-match-section">
            <div className="toggle-container compact">
              <div className="toggle-info">
                <span className="toggle-icon">🔗</span>
                <div>
                  <h4>Auto-Match VPN Server</h4>
                  <p>Automatically set GPS to match connected VPN server location</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={autoMatch}
                  onChange={() => setAutoMatch(!autoMatch)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Server Location Selection */}
          <div className="location-section">
            <h4>🌍 Select Location</h4>
            <p className="section-description">
              {autoMatch ? 'Choose VPN server to match GPS location' : 'Select location to spoof'}
            </p>

            <div className="server-grid">
              {vpnServers.map(server => (
                <label 
                  key={server.id}
                  className={`server-option ${selectedLocation === server.id ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="server"
                    value={server.id}
                    checked={selectedLocation === server.id}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  />
                  <span className="server-flag">{server.flag}</span>
                  <div className="server-info">
                    <span className="server-name">{server.name}</span>
                    <span className="server-coords">{server.lat.toFixed(2)}, {server.lng.toFixed(2)}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Coordinates */}
          {!autoMatch && (
            <div className="custom-coords-section">
              <h4>🎯 Custom Coordinates</h4>
              <p className="section-description">Enter specific GPS coordinates</p>
              
              <div className="coords-input">
                <div className="coord-field">
                  <label>Latitude</label>
                  <input 
                    type="number"
                    placeholder="e.g., 40.7128"
                    step="0.0001"
                    min="-90"
                    max="90"
                    value={customCoords.lat}
                    onChange={(e) => setCustomCoords({ ...customCoords, lat: e.target.value })}
                  />
                </div>
                <div className="coord-field">
                  <label>Longitude</label>
                  <input 
                    type="number"
                    placeholder="e.g., -74.0060"
                    step="0.0001"
                    min="-180"
                    max="180"
                    value={customCoords.lng}
                    onChange={(e) => setCustomCoords({ ...customCoords, lng: e.target.value })}
                  />
                </div>
                <button className="apply-btn" onClick={handleCustomCoords}>
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Accuracy Settings */}
          <div className="accuracy-section">
            <h4>🎯 Spoof Accuracy</h4>
            <p className="section-description">Higher accuracy is more convincing but may be suspicious if moving</p>
            
            <div className="accuracy-options">
              {accuracyOptions.map(opt => (
                <label 
                  key={opt.id}
                  className={`accuracy-option ${spoofAccuracy === opt.id ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="accuracy"
                    value={opt.id}
                    checked={spoofAccuracy === opt.id}
                    onChange={(e) => setSpoofAccuracy(e.target.value)}
                  />
                  <span className="acc-icon">{opt.icon}</span>
                  <div className="acc-info">
                    <span className="acc-name">{opt.name}</span>
                    <span className="acc-desc">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="advanced-gps-options">
            <h4>⚙️ Advanced Options</h4>
            
            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🕐</span>
                <div>
                  <h5>Timezone Spoofing</h5>
                  <p>Match timezone to spoofed location</p>
                </div>
              </div>
              <select 
                className="timezone-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="auto">Auto (match location)</option>
                <option value="keep">Keep real timezone</option>
              </select>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🚶</span>
                <div>
                  <h5>Randomize Movement</h5>
                  <p>Add slight GPS jitter to simulate natural movement</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={randomizeMovement}
                  onChange={() => setRandomizeMovement(!randomizeMovement)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* Use Cases */}
          <div className="use-cases">
            <h4>💡 Common Use Cases</h4>
            <div className="use-case-grid">
              <div className="use-case-item">
                <span className="use-icon">🎮</span>
                <h5>Mobile Gaming</h5>
                <p>Play location-based games from anywhere</p>
              </div>
              <div className="use-case-item">
                <span className="use-icon">📱</span>
                <h5>App Testing</h5>
                <p>Test geo-restricted app features</p>
              </div>
              <div className="use-case-item">
                <span className="use-icon">🔒</span>
                <h5>Privacy</h5>
                <p>Prevent location tracking by apps</p>
              </div>
              <div className="use-case-item">
                <span className="use-icon">🛍️</span>
                <h5>Regional Pricing</h5>
                <p>Access region-specific deals</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Warning */}
      <div className="gps-warning">
        <span className="warning-icon">⚠️</span>
        <div className="warning-text">
          <strong>Important Notice</strong>
          <p>GPS spoofing may violate terms of service for some apps. Use responsibly and only for legitimate purposes.</p>
        </div>
      </div>
    </div>
  );
};

export default GPSOverride;
