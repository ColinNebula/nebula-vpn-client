import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    setIsStandalone(isPWA);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isStandalone || 
      !showPrompt || 
      sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <div className="install-prompt" id="install-banner">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">
          <svg width="40" height="40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="installGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#667eea', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#764ba2', stopOpacity:1}} />
              </linearGradient>
            </defs>
            <path d="M 100 20 L 160 50 L 160 110 Q 160 160 100 180 Q 40 160 40 110 L 40 50 Z" 
                  fill="url(#installGradient)" 
                  stroke="white" 
                  strokeWidth="2" />
            <circle cx="100" cy="80" r="8" fill="white" opacity="0.9"/>
            <circle cx="75" cy="100" r="6" fill="white" opacity="0.7"/>
            <circle cx="125" cy="100" r="6" fill="white" opacity="0.7"/>
            <circle cx="100" cy="120" r="8" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <div className="install-prompt-text">
          <h3>Install Nebula VPN</h3>
          <p>Install our app for quick access and better performance on your device!</p>
        </div>
        <div className="install-prompt-actions">
          <button className="install-btn-primary" onClick={handleInstallClick}>
            📥 Install Now
          </button>
          <button className="install-btn-secondary" onClick={handleDismiss}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
