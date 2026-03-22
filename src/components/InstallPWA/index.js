import React, { useState, useEffect, useCallback } from 'react';
import './InstallPWA.css';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [swRegistration, setSwRegistration] = useState(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [cacheStatus, setCacheStatus] = useState('checking');
  const [showInstructions, setShowInstructions] = useState(true);

  // Check cache status
  const checkCacheStatus = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
          setCacheStatus('cached');
        } else {
          setCacheStatus('not-cached');
        }
      } catch (e) {
        setCacheStatus('error');
      }
    }
  }, []);

  // Handle service worker updates
  const handleServiceWorkerUpdate = useCallback((registration) => {
    if (registration.waiting) {
      setUpdateAvailable(true);
      setShowUpdateBanner(true);
    }
  }, []);

  // Apply update
  const applyUpdate = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateBanner(false);
      window.location.reload();
    }
  }, [swRegistration]);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true ||
                         document.referrer.includes('android-app://');
    
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect platform with more detail
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedPlatform = 'desktop';
    if (/android/.test(userAgent)) {
      detectedPlatform = 'android';
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      detectedPlatform = 'ios';
    } else if (/windows/.test(userAgent)) {
      detectedPlatform = 'windows';
    } else if (/macintosh|mac os/.test(userAgent)) {
      detectedPlatform = 'mac';
    } else if (/linux/.test(userAgent)) {
      detectedPlatform = 'linux';
    }
    setPlatform(detectedPlatform);

    // Enhanced service worker registration - production only.
    // In dev the sw.js path resolves incorrectly due to the homepage sub-path,
    // causing a MIME-type SecurityError. App.js handles production registration.
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          setSwRegistration(registration);
          console.log('✅ Service Worker registered');
          
          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handleServiceWorkerUpdate(registration);
              }
            });
          });

          // Check for existing waiting worker
          if (registration.waiting) {
            handleServiceWorkerUpdate(registration);
          }
        })
        .catch((error) => {
          console.error('❌ SW registration failed:', error);
        });

      // Handle controller change (update applied)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    // Check cache status
    checkCacheStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('💾 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setShowInstallButton(true);
      }, 2000);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      // Track installation
      if ('localStorage' in window) {
        localStorage.setItem('pwa-installed', 'true');
        localStorage.setItem('pwa-install-date', new Date().toISOString());
      }
    };

    // Online/Offline handlers
    const handleOnline = () => {
      setIsOffline(false);
      setShowOfflineToast(true);
      setLastSyncTime(new Date());
      setTimeout(() => setShowOfflineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check after 3 seconds if prompt was received
    const timeoutId = setTimeout(() => {
      if (!deferredPrompt && !isStandalone) {
        // no-op: prompt not available on this platform
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timeoutId);
    };
  }, [checkCacheStatus, handleServiceWorkerUpdate, deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show progress animation
    setInstallProgress(10);
    const progressInterval = setInterval(() => {
      setInstallProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    clearInterval(progressInterval);
    
    if (outcome === 'accepted') {
      setInstallProgress(100);
      console.log('✅ User accepted the install prompt');
    } else {
      setInstallProgress(0);
      console.log('❌ User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const detectBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('edg/')) return 'edge';
    if (ua.includes('chrome')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari')) return 'safari';
    return 'other';
  };

  const getInstallInstructions = () => {
    const browser = detectBrowser();
    switch (platform) {
      case 'ios':
        return {
          title: 'Install on iPhone / iPad',
          steps: [
            { text: 'Open this page in Safari (not Chrome)', detail: 'PWA install only works in Safari on iOS' },
            { text: 'Tap the Share button at the bottom of the screen', detail: 'It looks like a box with an arrow pointing up ⬆️' },
            { text: 'Scroll down in the share sheet and tap "Add to Home Screen"', detail: null },
            { text: 'Tap "Add" in the top-right corner', detail: 'You can rename it first if you like' },
          ],
          icon: '📱',
          browserNote: 'Safari only - does not work in Chrome or Firefox on iOS',
          tip: null,
        };
      case 'android':
        return {
          title: 'Install on Android',
          steps: [
            { text: 'Open this page in Chrome or Edge', detail: null },
            { text: 'Tap the three-dot menu ⋮ in the top-right corner', detail: null },
            { text: 'Tap "Add to Home screen" or "Install app"', detail: 'The exact wording depends on your browser version' },
            { text: 'Tap "Install" or "Add" to confirm', detail: null },
          ],
          icon: '🤖',
          browserNote: 'Works in Chrome, Edge, or Samsung Internet',
          tip: null,
        };
      case 'windows':
        if (browser === 'edge') {
          return {
            title: 'Install on Windows - Microsoft Edge',
            steps: [
              { text: 'Look for the install icon in the address bar', detail: 'It looks like a "+" or a computer screen with a down arrow - on the right side of the address bar' },
              { text: 'Click it to open the install dialog', detail: 'If you don\'t see it, click the ⋯ menu (top-right) → Apps → Install this site as an app' },
              { text: 'Click "Install" in the popup', detail: null },
              { text: 'Nebula VPN will open as its own window and appear in your Start Menu', detail: null },
            ],
            icon: '🪟',
            browserNote: 'Microsoft Edge - recommended for Windows',
            tip: 'Tip: Edge gives the best Windows PWA experience with taskbar pinning.',
          };
        } else if (browser === 'chrome') {
          return {
            title: 'Install on Windows - Google Chrome',
            steps: [
              { text: 'Look for the install icon in the address bar', detail: 'It looks like a computer with a down arrow on the far right of the address bar' },
              { text: 'Click it - or click the ⋮ menu → "Save and share" → "Install page as app…"', detail: null },
              { text: 'Click "Install" in the confirmation popup', detail: null },
              { text: 'Nebula VPN will launch as an app and be pinned to your taskbar', detail: null },
            ],
            icon: '🪟',
            browserNote: 'Google Chrome',
            tip: 'Tip: If you don\'t see the install icon, make sure you\'re not in Incognito mode.',
          };
        } else {
          return {
            title: 'Install on Windows',
            steps: [
              { text: 'Open this page in Microsoft Edge or Google Chrome', detail: 'Firefox and Internet Explorer do not support PWA install' },
              { text: 'Look for a "+" or install icon on the right side of the address bar', detail: null },
              { text: 'Click it and select "Install"', detail: null },
              { text: 'Nebula VPN will appear in your Start Menu', detail: null },
            ],
            icon: '🪟',
            browserNote: 'Use Edge or Chrome for best results',
            tip: 'You are currently using ' + (browser === 'firefox' ? 'Firefox, which does not support app install.' : 'an unsupported browser.') + ' Please switch to Edge or Chrome.',
          };
        }
      case 'mac':
        return {
          title: 'Install on macOS',
          steps: [
            { text: 'Open this page in Chrome or Edge', detail: 'Safari 17+ also supports install on macOS Sonoma or later' },
            { text: 'Click the install icon in the address bar', detail: 'Or go to the browser menu → "Install Nebula VPN…"' },
            { text: 'Click "Install" to confirm', detail: null },
            { text: 'Find Nebula VPN in Launchpad or your Applications folder', detail: null },
          ],
          icon: '🍎',
          browserNote: 'Works in Chrome, Edge, or Safari 17+',
          tip: null,
        };
      case 'linux':
        return {
          title: 'Install on Linux',
          steps: [
            { text: 'Open this page in Chrome or Chromium', detail: null },
            { text: 'Click the install icon on the right side of the address bar', detail: 'Or click ⋮ menu → More tools → Create shortcut…' },
            { text: 'Check "Open as window" and click "Create"', detail: null },
            { text: 'Launch from your applications menu', detail: null },
          ],
          icon: '🐧',
          browserNote: 'Works in Chrome, Chromium, or Edge',
          tip: null,
        };
      default:
        return {
          title: 'Install Nebula VPN',
          steps: [
            { text: 'Look for an install icon in your browser address bar', detail: null },
            { text: 'Click it to install the app', detail: null },
            { text: 'Launch anytime without opening a browser!', detail: null },
          ],
          icon: '💻',
          browserNote: '',
          tip: null,
        };
    }
  };

  const instructions = getInstallInstructions();

  // Features list for installed state
  const pwaFeatures = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Instant loading, no browser overhead' },
    { icon: '📴', title: 'Works Offline', desc: 'Core features available without internet' },
    { icon: '🔔', title: 'Notifications', desc: 'Get alerts for connection status' },
    { icon: '🔒', title: 'Secure', desc: 'Same security as the web version' },
  ];

  return (
    <div className="install-pwa-container">
      {/* Update Available Banner */}
      {showUpdateBanner && (
        <div className="update-banner">
          <div className="update-content">
            <span className="update-icon">🔄</span>
            <div className="update-text">
              <strong>Update Available!</strong>
              <p>A new version of Nebula VPN is ready</p>
            </div>
            <button className="update-button" onClick={applyUpdate}>
              Update Now
            </button>
            <button 
              className="update-dismiss"
              onClick={() => setShowUpdateBanner(false)}
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Offline/Online Toast */}
      {showOfflineToast && (
        <div className={`network-toast ${isOffline ? 'offline' : 'online'}`}>
          <span className="toast-icon">{isOffline ? '📴' : '📶'}</span>
          <span className="toast-text">
            {isOffline 
              ? "You're offline. Some features may be limited." 
              : "Back online! Syncing data..."}
          </span>
        </div>
      )}

      {/* Main Install Banner with Progress */}
      {showInstallButton && deferredPrompt && (
        <div className="install-prompt-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <div className="app-icon-wrapper">
                📲
                {installProgress > 0 && installProgress < 100 && (
                  <div className="install-progress-ring">
                    <svg viewBox="0 0 36 36">
                      <circle
                        cx="18" cy="18" r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="18" cy="18" r="16"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        strokeDasharray={`${installProgress} 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <div className="banner-text">
              <strong>Install Nebula VPN</strong>
              <p>Quick access • Works offline • No app store needed</p>
            </div>
            <button 
              className="install-button-primary" 
              onClick={handleInstallClick}
              disabled={installProgress > 0 && installProgress < 100}
            >
              {installProgress > 0 && installProgress < 100 ? 'Installing...' : 'Install Free'}
            </button>
            <button 
              className="install-button-dismiss" 
              onClick={() => setShowInstallButton(false)}
            >
              ✕
            </button>
          </div>
          <div className="banner-features">
            {pwaFeatures.map((feature, idx) => (
              <div key={idx} className="banner-feature">
                <span>{feature.icon}</span>
                <span>{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Install Button */}
      {!isInstalled && deferredPrompt && !showInstallButton && (
        <div className="floating-install-hint" onClick={handleInstallClick}>
          <div className="hint-content">
            <span className="hint-icon">⬇️</span>
            <span className="hint-text">Install App</span>
          </div>
          <div className="hint-badge">FREE</div>
        </div>
      )}

      {/* Manual Install Instructions */}
      {instructions && !deferredPrompt && !isInstalled && showInstructions && (
        <div className="install-instructions">
          <button 
            className="instructions-close" 
            onClick={() => setShowInstructions(false)}
            aria-label="Dismiss install instructions"
          >
            ✕
          </button>
          <div className="instructions-header">
            <span className="platform-icon">{instructions.icon}</span>
            <div>
              <h3>{instructions.title}</h3>
              {instructions.browserNote && (
                <span className="browser-note">{instructions.browserNote}</span>
              )}
            </div>
          </div>

          {instructions.tip && (
            <div className="install-tip">
              <span className="tip-icon">💡</span>
              <span>{instructions.tip}</span>
            </div>
          )}
          
          <ol className="instructions-list">
            {instructions.steps.map((step, index) => (
              <li key={index}>
                <span className="step-number">{index + 1}</span>
                <div className="step-body">
                  <span className="step-text">{step.text}</span>
                  {step.detail && <span className="step-detail">{step.detail}</span>}
                </div>
              </li>
            ))}
          </ol>

          {platform === 'ios' && (
            <div className="ios-share-hint">
              <div className="share-icon-animated">
                <span>⬆️</span>
              </div>
              <p>Look for this Share button at the bottom of Safari</p>
            </div>
          )}

          <div className="why-install">
            <h4>Why install?</h4>
            <div className="features-grid">
              {pwaFeatures.map((feature, idx) => (
                <div key={idx} className="feature-item">
                  <span className="feature-icon">{feature.icon}</span>
                  <div className="feature-info">
                    <strong>{feature.title}</strong>
                    <span>{feature.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Installed State - Show status */}
      {isInstalled && (
        <div className="installed-status">
          <div className="installed-badge">
            <span className="badge-icon">✓</span>
            <span className="badge-text">App Installed</span>
          </div>
          {lastSyncTime && (
            <div className="sync-status">
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Persistent Offline Indicator */}
      {isOffline && (
        <div className="offline-indicator">
          <span className="offline-dot"></span>
          <span>Offline Mode</span>
        </div>
      )}
    </div>
  );
};

export default InstallPWA;
