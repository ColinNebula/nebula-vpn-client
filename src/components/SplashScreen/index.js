import React, { useState, useEffect, useRef } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete, isDarkMode = false }) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('Initializing Nebula VPN...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Use refs to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  const isMountedRef = useRef(true);

  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    console.log('🌟 Splash screen initialized, starting loading animation...');
    
    const loadingMessages = [
      'Initializing Nebula VPN...',
      'Securing connection protocols...',
      'Loading server network...',
      'Preparing dashboard...',
      'Almost ready...'
    ];
    
    let currentProgress = 0;
    let messageIndex = 0;
    
    // Progress animation
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      currentProgress += Math.random() * 12 + 8; // More consistent increment
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      
      // Update message based on progress thresholds
      const newMessageIndex = Math.min(
        Math.floor((currentProgress / 100) * loadingMessages.length),
        loadingMessages.length - 1
      );
      
      if (newMessageIndex !== messageIndex) {
        messageIndex = newMessageIndex;
        setCurrentText(loadingMessages[messageIndex]);
      }
    }, 250);

    // Guaranteed completion after exactly 3 seconds
    const completeTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      console.log('📊 3 seconds elapsed - completing splash screen...');
      setProgress(100);
      setCurrentText('Almost ready...');
      setIsFadingOut(true);
      
      // Trigger completion after fade animation starts
      setTimeout(() => {
        if (!isMountedRef.current) return;
        console.log('💫 Calling onComplete to transition to login...');
        onCompleteRef.current();
      }, 300);
    }, 3000);

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
  }, []); // Empty dependency array - run only once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Always render the component, but use CSS classes for visibility
  return (
    <div className={`splash-screen ${isDarkMode ? 'dark' : 'light'} ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        {/* Logo and Branding */}
        <div className="splash-logo">
          <div className="logo-container">
            <div className="logo-icon">
              <div className="shield-icon">
                🛡️
              </div>
              <div className="nebula-glow"></div>
            </div>
            <div className="logo-text">
              <h1 className="app-name">Nebula VPN</h1>
              <p className="app-tagline">Secure • Private • Fast</p>
            </div>
          </div>
        </div>

        {/* Loading Section */}
        <div className="loading-section">
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {Math.round(progress)}%
            </div>
          </div>
          
          <div className="loading-text">
            {currentText}
          </div>

          {/* Animated dots */}
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>

        {/* Company Branding */}
        <div className="company-branding">
          <p className="company-name">Nebula Media 3D</p>
          <p className="version">Version 1.0.0</p>
        </div>

        {/* Background Animation */}
        <div className="background-animation">
          <div className="floating-particle particle-1"></div>
          <div className="floating-particle particle-2"></div>
          <div className="floating-particle particle-3"></div>
          <div className="floating-particle particle-4"></div>
          <div className="floating-particle particle-5"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;