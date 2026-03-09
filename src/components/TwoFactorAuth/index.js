import React, { useState, useEffect } from 'react';
import './TwoFactorAuth.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const TwoFactorAuth = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [backupCodes, setBackupCodes] = useState([]);
  const [savedCodes, setSavedCodes] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Disable flow: show a confirmation step requiring the current TOTP code
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState(['', '', '', '', '', '']);
  const [disableError, setDisableError] = useState('');

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  // ── Load 2FA status from the server on mount ────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.user?.twoFactorEnabled) setTwoFAEnabled(true);
      })
      .catch(() => { /* ignore — show disabled banner */ });
  }, []);

  // ── Toggle handler ─────────────────────────────────────────────
  const handleTwoFAToggle = async () => {
    if (twoFAEnabled) {
      // Show the disable-confirmation step rather than just toggling
      setDisabling(true);
      setDisableCode(['', '', '', '', '', '']);
      setDisableError('');
    } else {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/auth/2fa/setup`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Setup failed');
        setQrDataUrl(data.qrDataUrl);
        setSecretKey(data.secret);
        setBackupCodes(data.backupCodes);
        // Note: twoFAEnabled stays false until code is successfully verified
        setSetupStep(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`)?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      // Only mark as enabled now that the server confirmed the code
      setTwoFAEnabled(true);
      setSetupStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Disable: called after user enters their current TOTP code ─────────
  const handleDisableCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...disableCode];
      newCode[index] = value;
      setDisableCode(newCode);
      if (value && index < 5) {
        document.getElementById(`disable-code-${index + 1}`)?.focus();
      }
    }
  };

  const handleConfirmDisable = async () => {
    const code = disableCode.join('');
    if (code.length !== 6) return;
    setDisableError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/2fa/disable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');
      setTwoFAEnabled(false);
      setDisabling(false);
      setDisableCode(['', '', '', '', '', '']);
      setSetupStep(1);
      setQrDataUrl('');
      setSecretKey('');
      setBackupCodes([]);
      setSavedCodes(false);
    } catch (err) {
      setDisableError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show the toggle as connected to setup-in-progress too
  const isSetupInProgress = !twoFAEnabled && qrDataUrl !== '';

  const downloadBackupCodes = () => {
    const content = `Nebula VPN - 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nebula-vpn-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    setSavedCodes(true);
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
  };

  return (
    <div className="two-factor-auth">
      <div className="twofa-header">
        <h3>🔐 Two-Factor Authentication</h3>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${twoFAEnabled ? 'enabled' : 'disabled'}`}>
        <span className="banner-icon">{twoFAEnabled ? '✅' : '⚠️'}</span>
        <div className="banner-content">
          <h4>2FA is {twoFAEnabled ? 'Enabled' : isSetupInProgress ? 'Setup in Progress…' : 'Disabled'}</h4>
          <p>
            {twoFAEnabled
              ? 'Your account is protected with two-factor authentication'
              : 'Add an extra layer of security to your account'}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={twoFAEnabled || isSetupInProgress}
            onChange={handleTwoFAToggle}
            disabled={loading}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {error && <div className="error-message" style={{ color: '#d32f2f', padding: '0.5rem 1rem' }}>⚠️ {error}</div>}

      {/* ── Disable confirmation panel ──────────────────────────────── */}
      {disabling && (
        <div className="disable-confirm-panel">
          <h4>🛡️ Confirm Disable 2FA</h4>
          <p>Enter the current 6-digit code from your authenticator app to confirm.</p>
          <div className="code-input-container">
            {disableCode.map((digit, index) => (
              <input
                key={index}
                id={`disable-code-${index}`}
                type="text"
                maxLength="1"
                className="code-input"
                value={digit}
                onChange={(e) => handleDisableCodeChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !digit && index > 0) {
                    document.getElementById(`disable-code-${index - 1}`)?.focus();
                  }
                }}
              />
            ))}
          </div>
          {disableError && <p style={{ color: '#d32f2f', margin: '8px 0 0' }}>⚠️ {disableError}</p>}
          <div className="button-group">
            <button className="back-btn" onClick={() => setDisabling(false)}>Cancel</button>
            <button
              className="verify-btn"
              style={{ background: '#d32f2f' }}
              onClick={handleConfirmDisable}
              disabled={disableCode.join('').length !== 6 || loading}
            >
              {loading ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}

      {/* ── Setup wizard (toggle was just turned on, QR fetched) ──── */}
      {isSetupInProgress && (
        <div className="setup-container">
          <div className="setup-steps">
            <div className={`step ${setupStep >= 1 ? 'active' : ''} ${setupStep > 1 ? 'completed' : ''}`}>
              <span className="step-number">{setupStep > 1 ? '✓' : '1'}</span>
              <span className="step-label">Scan QR Code</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${setupStep >= 2 ? 'active' : ''} ${setupStep > 2 ? 'completed' : ''}`}>
              <span className="step-number">{setupStep > 2 ? '✓' : '2'}</span>
              <span className="step-label">Verify Code</span>
            </div>
          </div>

          {/* Step 1: QR Code */}
          {setupStep === 1 && (
            <div className="step-content">
              <h4>📱 Scan QR Code</h4>
              <p className="step-description">
                Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
              </p>
              <div className="qr-code-container">
                <div className="qr-code-placeholder">
                  {qrDataUrl
                    ? <img src={qrDataUrl} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
                    : <div style={{ width: 200, height: 200, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>
                  }
                </div>
                <div className="manual-entry">
                  <p className="manual-label">Can't scan? Enter this key manually:</p>
                  <div className="secret-key-box">
                    <code className="secret-key">{secretKey}</code>
                    <button className="copy-btn" onClick={copySecretKey}>📋 Copy</button>
                  </div>
                </div>
              </div>
              <button className="next-btn" onClick={() => setSetupStep(2)}>
                Continue to Verification →
              </button>
            </div>
          )}

          {/* Step 2: Verify */}
          {setupStep === 2 && (
            <div className="step-content">
              <h4>🔢 Enter Verification Code</h4>
              <p className="step-description">Enter the 6-digit code from your authenticator app</p>
              <div className="code-input-container">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength="1"
                    className="code-input"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && index > 0) {
                        document.getElementById(`code-${index - 1}`)?.focus();
                      }
                    }}
                  />
                ))}
              </div>
              <div className="button-group">
                <button className="back-btn" onClick={() => setSetupStep(1)}>← Back</button>
                <button
                  className="verify-btn"
                  onClick={handleVerify}
                  disabled={verificationCode.join('').length !== 6 || loading}
                >
                  {loading ? 'Verifying…' : 'Verify Code'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2FA enabled — show backup codes if just verified, else active state ── */}
      {twoFAEnabled && (
        <div className="setup-container">
          {setupStep === 3 ? (
            <>
              <div className="setup-steps">
                <div className="step completed"><span className="step-number">✓</span><span className="step-label">Scan QR Code</span></div>
                <div className="step-line"></div>
                <div className="step completed"><span className="step-number">✓</span><span className="step-label">Verify Code</span></div>
                <div className="step-line"></div>
                <div className="step active"><span className="step-number">3</span><span className="step-label">Save Backup Codes</span></div>
              </div>
              <div className="step-content">
                <h4>💾 Save Backup Codes</h4>
                <p className="step-description">
                  Store these codes in a safe place. Use them if you lose access to your authenticator app.
                </p>
                <div className="backup-codes-container">
                  <div className="backup-codes-grid">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="backup-code">{code}</div>
                    ))}
                  </div>
                  <div className="backup-warning">
                    ⚠️ Each backup code can only be used once. Generate new codes after using one.
                  </div>
                  <button className="download-btn" onClick={downloadBackupCodes}>
                    📥 Download Backup Codes
                  </button>
                  {savedCodes && (
                    <div className="success-message">
                      ✅ Setup complete! Your account is now protected with 2FA.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="step-content">
              <h4>✅ Two-Factor Authentication is Active</h4>
              <p className="step-description">
                Your account is protected. Every login requires your password and a code from your authenticator app.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary, #777)', marginTop: 8 }}>
                To disable 2FA, use the toggle above and enter your current authenticator code.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Benefits (shown only when disabled and not in setup) ── */}
      {!twoFAEnabled && !isSetupInProgress && (
        <div className="benefits-section">
          <h4>🛡️ Why Enable 2FA?</h4>
          <div className="benefits-grid">
            <div className="benefit-card">
              <span className="benefit-icon">🔒</span>
              <h5>Extra Security</h5>
              <p>Protect your account even if your password is compromised</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">🚫</span>
              <h5>Prevent Unauthorized Access</h5>
              <p>Stop hackers from accessing your VPN account and data</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">📱</span>
              <h5>Easy to Use</h5>
              <p>Quick verification with your smartphone authenticator app</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">🌍</span>
              <h5>Industry Standard</h5>
              <p>Used by major services like Google, Facebook, and banks</p>
            </div>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="twofa-info">
        <h4>ℹ️ About Two-Factor Authentication</h4>
        <div className="info-content">
          <div className="info-item">
            <h5>What is 2FA?</h5>
            <p>
              Two-Factor Authentication adds a second layer of security by requiring both
              your password and a time-based code from your phone.
            </p>
          </div>
          <div className="info-item">
            <h5>Recommended Apps</h5>
            <p>
              Google Authenticator, Microsoft Authenticator, Authy, or 1Password are all
              excellent choices for generating 2FA codes.
            </p>
          </div>
          <div className="info-item">
            <h5>Lost Your Device?</h5>
            <p>
              Use your backup codes to access your account. Contact support if you've
              lost both your device and backup codes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
