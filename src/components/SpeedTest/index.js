import React, { useState, useRef } from 'react';
import './SpeedTest.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const token = () => localStorage.getItem('token') || '';

// Measure round-trip time to the ping endpoint (returns median of N probes)
async function measurePing(samples = 6) {
  const rtts = [];
  for (let i = 0; i < samples; i++) {
    const t0 = Date.now();
    try {
      await fetch(`${API_BASE}/speedtest/ping`, {
        headers: { Authorization: `Bearer ${token()}` },
        cache: 'no-store',
      });
      rtts.push(Date.now() - t0);
    } catch {
      // skip failed probe
    }
  }
  if (rtts.length === 0) return { ping: null, jitter: null };
  rtts.sort((a, b) => a - b);
  const median = rtts[Math.floor(rtts.length / 2)];
  const mean = rtts.reduce((s, v) => s + v, 0) / rtts.length;
  const jitter = Math.sqrt(rtts.reduce((s, v) => s + (v - mean) ** 2, 0) / rtts.length);
  return { ping: median, jitter: Math.round(jitter * 10) / 10 };
}

// Measure download speed — streams BYTES bytes and measures throughput
async function measureDownload(bytes = 5 * 1024 * 1024, onProgress) {
  const t0 = Date.now();
  let received = 0;
  const resp = await fetch(
    `${API_BASE}/speedtest/download?bytes=${bytes}`,
    { headers: { Authorization: `Bearer ${token()}` }, cache: 'no-store' }
  );
  const reader = resp.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    const elapsed = (Date.now() - t0) / 1000;
    if (elapsed > 0) {
      // Mbps = (bytes * 8) / elapsed / 1_000_000
      onProgress((received * 8) / elapsed / 1_000_000);
    }
  }
  const elapsed = (Date.now() - t0) / 1000;
  return elapsed > 0 ? (received * 8) / elapsed / 1_000_000 : 0;
}

// Measure upload speed — sends BYTES bytes and measures throughput
async function measureUpload(bytes = 2 * 1024 * 1024, onProgress) {
  const payload = new Uint8Array(bytes);
  const t0 = Date.now();
  // Fake progress ticks while upload occurs
  let done = false;
  const ticker = setInterval(() => {
    if (done) return;
    const elapsed = (Date.now() - t0) / 1000;
    if (elapsed > 0) onProgress(Math.min((bytes * 8) / elapsed / 1_000_000, 9999));
  }, 200);
  try {
    await fetch(`${API_BASE}/speedtest/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/octet-stream',
      },
      body: payload,
    });
  } finally {
    done = true;
    clearInterval(ticker);
  }
  const elapsed = (Date.now() - t0) / 1000;
  return elapsed > 0 ? (bytes * 8) / elapsed / 1_000_000 : 0;
}

const SpeedTest = ({ isConnected, selectedServer }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testPhase, setTestPhase] = useState('idle'); // idle | ping | download | upload | complete | error
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [ping, setPing] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [progress, setProgress] = useState(0);
  const [testHistory, setTestHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(false);

  const runSpeedTest = async () => {
    if (!isConnected) return;

    abortRef.current = false;
    setIsRunning(true);
    setErrorMsg('');
    setProgress(0);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setPing(0);
    setJitter(0);

    try {
      // ── 1. Ping + jitter ──────────────────────────────────────────────
      setTestPhase('ping');
      setProgress(10);
      const { ping: measuredPing, jitter: measuredJitter } = await measurePing(6);
      if (abortRef.current) return;
      if (measuredPing === null) throw new Error('Ping test failed — server unreachable');
      setPing(measuredPing);
      setProgress(33);

      // ── 2. Download ───────────────────────────────────────────────────
      setTestPhase('download');
      const finalDl = await measureDownload(5 * 1024 * 1024, (mbps) => {
        if (!abortRef.current) {
          setDownloadSpeed(mbps);
          setProgress(33 + Math.min(33, (mbps / 200) * 33));
        }
      });
      if (abortRef.current) return;
      setDownloadSpeed(finalDl);
      setProgress(66);

      // ── 3. Upload ─────────────────────────────────────────────────────
      setTestPhase('upload');
      const finalUl = await measureUpload(2 * 1024 * 1024, (mbps) => {
        if (!abortRef.current) {
          setUploadSpeed(mbps);
          setProgress(66 + Math.min(34, (mbps / 100) * 34));
        }
      });
      if (abortRef.current) return;
      setUploadSpeed(finalUl);
      setJitter(measuredJitter ?? 0);
      setProgress(100);
      setTestPhase('complete');

      setTestHistory(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        server: selectedServer?.name || 'Unknown',
        download: finalDl.toFixed(1),
        upload: finalUl.toFixed(1),
        ping: measuredPing.toFixed(0),
        jitter: (measuredJitter ?? 0).toFixed(1),
      }, ...prev.slice(0, 9)]);
    } catch (err) {
      setErrorMsg(err.message || 'Speed test failed');
      setTestPhase('error');
    } finally {
      setIsRunning(false);
    }
  };

  const cancelTest = () => { abortRef.current = true; setIsRunning(false); setTestPhase('idle'); };

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

      {testPhase === 'error' && (
        <div className="speed-error" style={{ color: '#f44336', padding: '8px 12px', background: 'rgba(244,67,54,0.1)', borderRadius: 6, marginBottom: 12 }}>
          ⚠️ {errorMsg}
        </div>
      )}

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
                  {testPhase === 'ping' && `${ping.toFixed(0) || '…'}`}
                  {(testPhase === 'idle' || testPhase === 'error') && '0'}
                  {testPhase === 'complete' && '✓'}
                </div>
                <div className="gauge-unit">
                  {(testPhase === 'download' || testPhase === 'upload') && 'Mbps'}
                  {testPhase === 'ping' && 'ms'}
                  {testPhase === 'complete' && 'Done'}
                </div>
                <div className="gauge-phase">
                  {testPhase === 'idle' && 'Ready'}
                  {testPhase === 'error' && 'Error'}
                  {testPhase === 'ping' && 'Testing Ping'}
                  {testPhase === 'download' && 'Download Test'}
                  {testPhase === 'upload' && 'Upload Test'}
                  {testPhase === 'complete' && 'Complete'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isRunning ? (
          <button className="speed-test-btn running" onClick={cancelTest}>Cancel</button>
        ) : (
          <button className="speed-test-btn" onClick={runSpeedTest}>Start Speed Test</button>
        )}
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