import React, { useState, useEffect, useCallback } from 'react';
import './RotatingIP.css';

const RotatingIP = ({ 
  isConnected, 
  isEnabled = false, 
  onToggle, 
  rotationInterval = 10, // minutes
  onIntervalChange 
}) => {
  const [currentIP, setCurrentIP] = useState('192.168.1.xxx');
  const [ipHistory, setIPHistory] = useState([]);
  const [nextRotation, setNextRotation] = useState(null);
  const [timeUntilRotation, setTimeUntilRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationCount, setRotationCount] = useState(0);

  // Generate a random IP address (simulated)
  const generateNewIP = useCallback(() => {
    const octets = [
      Math.floor(Math.random() * 155) + 100, // 100-254
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 254) + 1  // 1-254
    ];
    return octets.join('.');
  }, []);

  // Rotate IP address
  const rotateIP = useCallback(() => {
    setIsRotating(true);
    
    setTimeout(() => {
      const newIP = generateNewIP();
      setIPHistory(prev => [
        { ip: currentIP, timestamp: new Date() },
        ...prev.slice(0, 9) // Keep last 10
      ]);
      setCurrentIP(newIP);
      setRotationCount(prev => prev + 1);
      setIsRotating(false);
      
      if (isEnabled && isConnected) {
        setNextRotation(new Date(Date.now() + rotationInterval * 60 * 1000));
        setTimeUntilRotation(rotationInterval * 60);
      }
    }, 1500);
  }, [currentIP, generateNewIP, isEnabled, isConnected, rotationInterval]);

  // Initialize IP when connected
  useEffect(() => {
    if (isConnected && !currentIP.includes('xxx')) {
      return;
    }
    if (isConnected) {
      setCurrentIP(generateNewIP());
      setRotationCount(0);
      setIPHistory([]);
    }
  }, [isConnected, generateNewIP, currentIP]);

  // Handle rotation timer
  useEffect(() => {
    if (!isConnected || !isEnabled) {
      setNextRotation(null);
      setTimeUntilRotation(0);
      return;
    }

    // Set initial next rotation time
    if (!nextRotation) {
      setNextRotation(new Date(Date.now() + rotationInterval * 60 * 1000));
      setTimeUntilRotation(rotationInterval * 60);
    }

    const interval = setInterval(() => {
      setTimeUntilRotation(prev => {
        if (prev <= 1) {
          rotateIP();
          return rotationInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, isEnabled, rotationInterval, nextRotation, rotateIP]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = rotationInterval * 60;
    return ((totalSeconds - timeUntilRotation) / totalSeconds) * 100;
  };

  const intervalOptions = [5, 10, 15, 30, 60];

  if (!isConnected) {
    return (
      <div className="rotating-ip-container disabled">
        <div className="rotating-ip-header">
          <span className="feature-icon">🔄</span>
          <span className="feature-title">Rotating IP</span>
        </div>
        <div className="disabled-message">
          Connect to VPN to enable IP rotation
        </div>
      </div>
    );
  }

  return (
    <div className={`rotating-ip-container ${isEnabled ? 'enabled' : ''}`}>
      {/* Header with Toggle */}
      <div className="rotating-ip-header">
        <div className="header-left">
          <span className="feature-icon">🔄</span>
          <div className="header-text">
            <span className="feature-title">Rotating IP</span>
            <span className="feature-subtitle">
              {isEnabled ? 'Auto-rotating enabled' : 'Click to enable'}
            </span>
          </div>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={() => onToggle && onToggle(!isEnabled)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Current IP Display */}
      <div className={`current-ip-display ${isRotating ? 'rotating' : ''}`}>
        <div className="ip-label">Current IP Address</div>
        <div className="ip-address">
          {isRotating ? (
            <span className="rotating-text">Rotating...</span>
          ) : (
            <>
              <span className="ip-value">{currentIP}</span>
              <button 
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(currentIP)}
                title="Copy IP"
              >
                📋
              </button>
            </>
          )}
        </div>
        {rotationCount > 0 && (
          <div className="rotation-count">
            Rotated {rotationCount} time{rotationCount !== 1 ? 's' : ''} this session
          </div>
        )}
      </div>

      {/* Rotation Timer (when enabled) */}
      {isEnabled && (
        <div className="rotation-timer">
          <div className="timer-header">
            <span>Next rotation in</span>
            <span className="time-display">{formatTime(timeUntilRotation)}</span>
          </div>
          <div className="timer-progress">
            <div 
              className="progress-bar"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <button 
            className="rotate-now-button"
            onClick={rotateIP}
            disabled={isRotating}
          >
            <span className="button-icon">🔄</span>
            Rotate Now
          </button>
        </div>
      )}

      {/* Rotation Interval Selector */}
      {isEnabled && (
        <div className="interval-selector">
          <div className="selector-label">Rotation interval:</div>
          <div className="interval-options">
            {intervalOptions.map(mins => (
              <button
                key={mins}
                className={`interval-option ${rotationInterval === mins ? 'active' : ''}`}
                onClick={() => onIntervalChange && onIntervalChange(mins)}
              >
                {mins < 60 ? `${mins}m` : '1h'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* IP History */}
      {ipHistory.length > 0 && (
        <div className="ip-history">
          <div className="history-header">
            <span className="history-icon">📜</span>
            <span>Recent IP Addresses</span>
          </div>
          <div className="history-list">
            {ipHistory.slice(0, 5).map((entry, index) => (
              <div key={index} className="history-item">
                <span className="history-ip">{entry.ip}</span>
                <span className="history-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="security-note">
        <span className="note-icon">🛡️</span>
        <span>IP rotation makes tracking nearly impossible by changing your public IP periodically without dropping the VPN connection.</span>
      </div>
    </div>
  );
};

export default RotatingIP;
