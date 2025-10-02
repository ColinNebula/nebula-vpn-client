import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete, isDarkMode = false }) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('Initializing Nebula VPN...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Use refs to avoid dependency issues and prevent stale closures
  const onCompleteRef = useRef(onComplete);
  const isMountedRef = useRef(true);
  const hasCompletedRef = useRef(false);

  // Update ref when onComplete changes
  onCompleteRef.current = onComplete;

  // Memoized completion handler to prevent multiple calls
  const handleCompletion = useCallback(() => {
    if (hasCompletedRef.current || !isMountedRef.current) return;
    
    hasCompletedRef.current = true;
    console.log('💫 Splash screen completing - calling onComplete...');
    
    // Small delay to ensure state updates are processed
    setTimeout(() => {
      if (isMountedRef.current && onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 50);
  }, []);

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
    let currentMessageIndex = 0;
    
    // Progress animation with consistent timing
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      // Increment progress by fixed amount to reach 100% in about 2.5 seconds
      currentProgress += 4; // 25 increments * 100ms = 2.5s to reach 100%
      if (currentProgress > 100) currentProgress = 100;
      
      setProgress(currentProgress);
      
      // Update message based on progress milestones
      const targetMessageIndex = Math.floor((currentProgress / 100) * (loadingMessages.length - 1));
      
      if (targetMessageIndex !== currentMessageIndex && targetMessageIndex < loadingMessages.length) {
        currentMessageIndex = targetMessageIndex;
        setCurrentText(loadingMessages[currentMessageIndex]);
      }
    }, 100); // Faster, smoother updates

    // Guaranteed completion after exactly 3 seconds
    const completeTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      console.log('📊 3 seconds elapsed - completing splash screen...');
      setProgress(100);
      setCurrentText('Almost ready...');
      setIsFadingOut(true);
      
      // Trigger completion after fade animation starts
      setTimeout(() => {
        handleCompletion();
      }, 400); // Slightly longer for smooth transition
    }, 3000);

    // Emergency backup timer - ensures splash never gets stuck
    const emergencyTimer = setTimeout(() => {
      if (!hasCompletedRef.current && isMountedRef.current) {
        console.log('⚠️ Emergency completion triggered');
        handleCompletion();
      }
    }, 5000); // 5 second backup

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      clearTimeout(completeTimer);
      clearTimeout(emergencyTimer);
    };
  }, [handleCompletion]); // Include handleCompletion in dependencies

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