import React, { useState, useEffect, useMemo } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete, isDarkMode = false }) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('Initializing Nebula VPN...');
  const [isVisible, setIsVisible] = useState(true);

  const loadingTexts = useMemo(() => [
    'Initializing Nebula VPN...',
    'Securing connection protocols...',
    'Loading server network...',
    'Preparing dashboard...',
    'Almost ready...'
  ], []);

  useEffect(() => {
    console.log('🌟 Splash screen initialized, starting loading animation...');
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5; // Random increment between 5-20
        
        // Update text based on progress
        if (newProgress >= 80 && currentText !== loadingTexts[4]) {
          setCurrentText(loadingTexts[4]);
        } else if (newProgress >= 60 && currentText !== loadingTexts[3]) {
          setCurrentText(loadingTexts[3]);
        } else if (newProgress >= 40 && currentText !== loadingTexts[2]) {
          setCurrentText(loadingTexts[2]);
        } else if (newProgress >= 20 && currentText !== loadingTexts[1]) {
          setCurrentText(loadingTexts[1]);
        }
        
        return Math.min(newProgress, 100);
      });
    }, 200);

    // Complete loading after reaching 100%
    const completeTimer = setTimeout(() => {
      setProgress(100);
      console.log('📊 Progress complete, starting fade out...');
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          console.log('💫 Splash screen fade out complete, calling onComplete...');
          onComplete();
        }, 500); // Allow fade out animation to complete
      }, 500);
    }, 3000); // Total splash duration: 3 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
  }, [onComplete, currentText, loadingTexts]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`splash-screen ${isDarkMode ? 'dark' : 'light'} ${!isVisible ? 'fade-out' : ''}`}>
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