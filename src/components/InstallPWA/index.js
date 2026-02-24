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

    // Enhanced service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
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

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Install on iPhone/iPad',
          steps: [
            'Tap the Share button (square with arrow) at the bottom',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" in the top right corner',
            'Nebula VPN will appear on your home screen!'
          ],
          icon: '📱',
          browserNote: 'Works best in Safari'
        };
      case 'android':
        return {
          title: 'Install on Android',
          steps: [
            'Tap the menu icon (⋮) in the top right',
            'Select "Add to Home screen" or "Install app"',
            'Confirm by tapping "Add" or "Install"',
            'Launch from your home screen!'
          ],
          icon: '🤖',
          browserNote: 'Works in Chrome, Edge, Firefox'
        };
      case 'windows':
        return {
          title: 'Install on Windows',
          steps: [
            'Click the install icon (⊕) in the address bar',
            'Or click the menu (⋯) → Apps → Install this site',
            'Click "Install" in the popup',
            'Access from Start Menu or Desktop!'
          ],
          icon: '🪟',
          browserNote: 'Works in Chrome, Edge'
        };
      case 'mac':
        return {
          title: 'Install on macOS',
          steps: [
            'Click the install icon in the address bar',
            'Or go to File → Install Nebula VPN',
            'Click "Install" to confirm',
            'Find it in Launchpad or Applications!'
          ],
          icon: '🍎',
          browserNote: 'Works in Chrome, Edge, Safari 17+'
        };
      case 'linux':
        return {
          title: 'Install on Linux',
          steps: [
            'Click the install icon in the address bar',
            'Or click menu → More tools → Create shortcut',
            'Check "Open as window" option',
            'Launch from your applications menu!'
          ],
          icon: '🐧',
          browserNote: 'Works in Chrome, Edge'
        };
      default:
        return {
          title: 'Install App',
          steps: [
            'Look for the install icon in your browser',
            'Click to add to your device',
            'Launch anytime without opening browser!'
          ],
          icon: '💻',
          browserNote: ''
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
          
          <ol className="instructions-list">
            {instructions.steps.map((step, index) => (
              <li key={index}>
                <span className="step-number">{index + 1}</span>
                <span className="step-text">{step}</span>
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
