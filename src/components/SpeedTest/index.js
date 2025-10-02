import React, { useState, useEffect } from 'react';
import './SpeedTest.css';

const SpeedTest = ({ isConnected, selectedServer }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testPhase, setTestPhase] = useState('idle'); // idle, download, upload, complete
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [testHistory, setTestHistory] = useState([]);

  const runSpeedTest = async () => {
    if (!isConnected) {
      alert('Please connect to a VPN server first');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(0);
    setJitter(0);

    // Simulate ping test
    setTestPhase('ping');
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const currentPing = Math.random() * 50 + 20;
      setPing(currentPing);
      setProgress((i + 1) * 10);
    }

    // Simulate download test
    setTestPhase('download');
    setProgress(0);
    for (let i = 0; i < 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const speed = Math.min(i * 2, Math.random() * 100 + 50);
      setDownloadSpeed(speed);
      setProgress(i + 1);
    }

    // Simulate upload test
    setTestPhase('upload');
    setProgress(0);
    for (let i = 0; i < 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 40));
      const speed = Math.min(i * 1.5, Math.random() * 50 + 20);
      setUploadSpeed(speed);
      setProgress(i + 1);
    }

    // Calculate jitter
    const finalJitter = Math.random() * 10 + 2;
    setJitter(finalJitter);
    
    setTestPhase('complete');
    setIsRunning(false);

    // Add to history
    const testResult = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      server: selectedServer?.name || 'Unknown',
      download: downloadSpeed.toFixed(1),
      upload: uploadSpeed.toFixed(1),
      ping: ping.toFixed(0),
      jitter: finalJitter.toFixed(1)
    };
    
    setTestHistory(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 tests
  };

  const getSpeedRating = (speed, type) => {
    if (type === 'download') {
      if (speed > 50) return { rating: 'Excellent', color: '#4CAF50' };
      if (speed > 25) return { rating: 'Good', color: '#FF9800' };
      if (speed > 10) return { rating: 'Fair', color: '#f44336' };
      return { rating: 'Poor', color: '#9e9e9e' };
    } else {
      if (speed > 25) return { rating: 'Excellent', color: '#4CAF50' };
      if (speed > 10) return { rating: 'Good', color: '#FF9800' };
      if (speed > 5) return { rating: 'Fair', color: '#f44336' };
      return { rating: 'Poor', color: '#9e9e9e' };
    }
  };

  const getPingRating = (pingValue) => {
    if (pingValue < 30) return { rating: 'Excellent', color: '#4CAF50' };
    if (pingValue < 60) return { rating: 'Good', color: '#FF9800' };
    if (pingValue < 100) return { rating: 'Fair', color: '#f44336' };
    return { rating: 'Poor', color: '#9e9e9e' };
  };

  if (!isConnected) {
    return (
      <div className="speed-test">
        <div className="no-connection">
          <h3>⚡ Speed Test</h3>
          <p>Connect to a VPN server to test your connection speed</p>
          <div className="speed-info">
            <h4>What we test:</h4>
            <ul>
              <li><strong>Download Speed:</strong> How fast you can download data</li>
              <li><strong>Upload Speed:</strong> How fast you can upload data</li>
              <li><strong>Ping:</strong> Response time to server</li>
              <li><strong>Jitter:</strong> Variation in ping times</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="speed-test">
      <div className="speed-test-header">
        <h3>⚡ Speed Test</h3>
        <div className="server-info">
          <span>Testing via: {selectedServer?.flag} {selectedServer?.name}</span>
        </div>
      </div>

      <div className="speed-gauge-container">
        <div className="speed-gauge">
          <div className="gauge-circle">
            <div className="gauge-progress" style={{ 
              background: `conic-gradient(#4CAF50 ${progress * 3.6}deg, #eee 0deg)` 
            }}>
              <div className="gauge-inner">
                <div className="gauge-value">
                  {testPhase === 'download' && `${downloadSpeed.toFixed(1)}`}
                  {testPhase === 'upload' && `${uploadSpeed.toFixed(1)}`}
                  {testPhase === 'ping' && `${ping.toFixed(0)}`}
                  {testPhase === 'idle' && '0'}
                  {testPhase === 'complete' && '✓'}
                </div>
                <div className="gauge-unit">
                  {(testPhase === 'download' || testPhase === 'upload') && 'Mbps'}
                  {testPhase === 'ping' && 'ms'}
                  {testPhase === 'complete' && 'Done'}
                </div>
                <div className="gauge-phase">
                  {testPhase === 'idle' && 'Ready'}
                  {testPhase === 'ping' && 'Testing Ping'}
                  {testPhase === 'download' && 'Download Test'}
                  {testPhase === 'upload' && 'Upload Test'}
                  {testPhase === 'complete' && 'Complete'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          className={`speed-test-btn ${isRunning ? 'running' : ''}`}
          onClick={runSpeedTest}
          disabled={isRunning}
        >
          {isRunning ? 'Testing...' : 'Start Speed Test'}
        </button>
      </div>

      {(testPhase === 'complete' || downloadSpeed > 0) && (
        <div className="speed-results">
          <div className="result-grid">
            <div className="result-item">
              <div className="result-icon">⬇️</div>
              <div className="result-info">
                <div className="result-label">Download</div>
                <div className="result-value">{downloadSpeed.toFixed(1)} Mbps</div>
                <div 
                  className="result-rating"
                  style={{ color: getSpeedRating(downloadSpeed, 'download').color }}
                >
                  {getSpeedRating(downloadSpeed, 'download').rating}
                </div>
              </div>
            </div>

            <div className="result-item">
              <div className="result-icon">⬆️</div>
              <div className="result-info">
                <div className="result-label">Upload</div>
                <div className="result-value">{uploadSpeed.toFixed(1)} Mbps</div>
                <div 
                  className="result-rating"
                  style={{ color: getSpeedRating(uploadSpeed, 'upload').color }}
                >
                  {getSpeedRating(uploadSpeed, 'upload').rating}
                </div>
              </div>
            </div>

            <div className="result-item">
              <div className="result-icon">📡</div>
              <div className="result-info">
                <div className="result-label">Ping</div>
                <div className="result-value">{ping.toFixed(0)} ms</div>
                <div 
                  className="result-rating"
                  style={{ color: getPingRating(ping).color }}
                >
                  {getPingRating(ping).rating}
                </div>
              </div>
            </div>

            <div className="result-item">
              <div className="result-icon">📊</div>
              <div className="result-info">
                <div className="result-label">Jitter</div>
                <div className="result-value">{jitter.toFixed(1)} ms</div>
                <div className="result-rating">
                  {jitter < 5 ? 'Low' : jitter < 15 ? 'Medium' : 'High'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {testHistory.length > 0 && (
        <div className="speed-history">
          <h4>Recent Tests</h4>
          <div className="history-list">
            {testHistory.map((test) => (
              <div key={test.id} className="history-item">
                <div className="history-time">{test.timestamp}</div>
                <div className="history-server">{test.server}</div>
                <div className="history-speeds">
                  <span>↓ {test.download} Mbps</span>
                  <span>↑ {test.upload} Mbps</span>
                  <span>📡 {test.ping} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeedTest;