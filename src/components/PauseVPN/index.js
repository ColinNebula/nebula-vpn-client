import React, { useState, useEffect, useCallback } from 'react';
import './PauseVPN.css';

const PauseVPN = ({ isConnected, onPause, onResume }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [pauseDuration, setPauseDuration] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const pauseOptions = [
    { label: '5 minutes', value: 5 * 60 },
    { label: '15 minutes', value: 15 * 60 },
    { label: '30 minutes', value: 30 * 60 },
    { label: '1 hour', value: 60 * 60 },
    { label: '2 hours', value: 2 * 60 * 60 },
  ];

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setPauseDuration(null);
    setRemainingTime(0);
    setShowOptions(false);
    if (onResume) onResume();
  }, [onResume]);

  useEffect(() => {
    let interval;
    if (isPaused && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            handleResume();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, remainingTime, handleResume]);

  const handlePause = (duration) => {
    setIsPaused(true);
    setPauseDuration(duration);
    setRemainingTime(duration);
    setShowOptions(false);
    if (onPause) onPause(duration);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!pauseDuration) return 0;
    return ((pauseDuration - remainingTime) / pauseDuration) * 100;
  };

  if (!isConnected && !isPaused) {
    return null;
  }

  return (
    <div className="pause-vpn-container">
      {isPaused ? (
        <div className="pause-active">
          <div className="pause-header">
            <span className="pause-icon">⏸️</span>
            <span className="pause-title">VPN Paused</span>
          </div>
          
          <div className="pause-timer">
            <div className="timer-circle">
              <svg viewBox="0 0 100 100">
                <circle 
                  className="timer-bg" 
                  cx="50" 
                  cy="50" 
                  r="45" 
                />
                <circle 
                  className="timer-progress" 
                  cx="50" 
                  cy="50" 
                  r="45"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}`,
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`
                  }}
                />
              </svg>
              <div className="timer-text">
                <span className="time-remaining">{formatTime(remainingTime)}</span>
                <span className="time-label">remaining</span>
              </div>
            </div>
          </div>

          <div className="pause-warning">
            <span className="warning-icon">⚠️</span>
            <span>Your connection is not protected</span>
          </div>

          <button className="resume-button" onClick={handleResume}>
            <span className="button-icon">▶️</span>
            Resume VPN Now
          </button>
        </div>
      ) : (
        <div className="pause-controls">
          <button 
            className="pause-toggle-button"
            onClick={() => setShowOptions(!showOptions)}
          >
            <span className="button-icon">⏸️</span>
            Pause VPN
          </button>

          {showOptions && (
            <div className="pause-options">
              <div className="options-header">
                <span>Pause for:</span>
                <button className="close-options" onClick={() => setShowOptions(false)}>✕</button>
              </div>
              <div className="options-list">
                {pauseOptions.map((option) => (
                  <button
                    key={option.value}
                    className="pause-option"
                    onClick={() => handlePause(option.value)}
                  >
                    <span className="option-icon">⏱️</span>
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="options-note">
                VPN will automatically resume after the selected time
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PauseVPN;
