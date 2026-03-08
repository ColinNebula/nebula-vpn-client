import React, { useState, useEffect, useCallback } from 'react';
import './UpdateNotification.css';

/**
 * UpdateNotification
 * ------------------
 * Listens to electron-updater IPC events and renders an unobtrusive banner
 * at the bottom of the app when a new version is available. Shows a progress
 * bar while downloading and "Restart & Install" once ready.
 *
 * Works only inside Electron (window.electron.system must be available).
 * Renders nothing in browser/PWA context.
 */
export default function UpdateNotification() {
  const [state, setState] = useState('idle'); // idle | available | downloading | ready | error | upToDate
  const [info, setInfo] = useState(null);     // { version, releaseNotes, releaseDate }
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const sys = window.electron?.system;

  useEffect(() => {
    if (!sys) return;

    const cleanups = [
      sys.onUpdateAvailable((data) => {
        setInfo(data);
        setState('available');
        setDismissed(false);
      }),
      sys.onUpdateProgress((data) => {
        setProgress(data.percent || 0);
        setSpeed(data.bytesPerSecond || 0);
        setState('downloading');
      }),
      sys.onUpdateDownloaded((data) => {
        setInfo(data);
        setProgress(100);
        setState('ready');
        setDismissed(false);
      }),
      sys.onUpdateNotAvailable((data) => {
        setInfo(data);
        setState('upToDate');
        // Auto-clear "up to date" notice after 4 s
        setTimeout(() => setState('idle'), 4000);
      }),
      sys.onUpdateError((data) => {
        setState('error');
        setInfo({ message: data.message });
        setTimeout(() => setState('idle'), 8000);
      }),
    ];

    return () => cleanups.forEach((fn) => typeof fn === 'function' && fn());
  }, [sys]);

  const handleCheckNow = useCallback(async () => {
    if (!sys || checking) return;
    setChecking(true);
    setState('idle');
    try {
      await sys.checkForUpdates();
    } finally {
      setChecking(false);
    }
  }, [sys, checking]);

  const handleRestart = useCallback(() => {
    if (sys) sys.restartAndInstall();
  }, [sys]);

  const handleDismiss = useCallback(() => setDismissed(true), []);

  // Nothing to show
  if (!sys) return null;
  if (dismissed && state !== 'ready') return null;
  if (state === 'idle') {
    return (
      <button
        className="update-check-btn"
        onClick={handleCheckNow}
        disabled={checking}
        title="Check for updates"
      >
        {checking ? '⟳ Checking…' : '⟳ Check for updates'}
      </button>
    );
  }

  const fmtSpeed = (bps) => {
    if (bps > 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bps > 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
    return `${bps} B/s`;
  };

  return (
    <div className={`update-bar update-bar--${state}`} role="status" aria-live="polite">
      <div className="update-bar__icon">
        {state === 'available'    && '🔔'}
        {state === 'downloading'  && '⬇'}
        {state === 'ready'        && '✅'}
        {state === 'error'        && '⚠️'}
        {state === 'upToDate'     && '✓'}
      </div>

      <div className="update-bar__content">
        {state === 'available' && (
          <>
            <span className="update-bar__title">
              Version {info?.version} is available
            </span>
            <span className="update-bar__sub">Downloading in the background…</span>
          </>
        )}

        {state === 'downloading' && (
          <>
            <span className="update-bar__title">
              Downloading update — {progress}%
              {speed > 0 && <span className="update-bar__speed"> ({fmtSpeed(speed)})</span>}
            </span>
            <div className="update-bar__progress" role="progressbar" aria-valuenow={progress} aria-valuemax={100}>
              <div className="update-bar__progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}

        {state === 'ready' && (
          <>
            <span className="update-bar__title">
              Version {info?.version} is ready to install
            </span>
            {info?.releaseNotes && (
              <span className="update-bar__sub">{info.releaseNotes.slice(0, 120)}{info.releaseNotes.length > 120 && '…'}</span>
            )}
          </>
        )}

        {state === 'upToDate' && (
          <span className="update-bar__title">Nebula VPN is up to date (v{info?.version})</span>
        )}

        {state === 'error' && (
          <span className="update-bar__title">Update check failed: {info?.message}</span>
        )}
      </div>

      <div className="update-bar__actions">
        {state === 'ready' && (
          <button className="update-bar__btn update-bar__btn--primary" onClick={handleRestart}>
            Restart &amp; Install
          </button>
        )}
        {(state === 'available' || state === 'downloading' || state === 'error') && (
          <button className="update-bar__btn update-bar__btn--ghost" onClick={handleDismiss} aria-label="Dismiss">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
