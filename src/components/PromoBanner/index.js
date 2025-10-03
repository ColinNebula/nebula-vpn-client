import React, { useState, useEffect } from 'react';
import './PromoBanner.css';

const PromoBanner = ({ currentPlan = 'free', onUpgrade }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [countdown, setCountdown] = useState({ days: 7, hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = sessionStorage.getItem('promoBannerDismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show banner after 10 seconds for free users
    if (currentPlan === 'free') {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [currentPlan]);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    sessionStorage.setItem('promoBannerDismissed', 'true');
  };

  const handleUpgrade = () => {
    setShowBanner(false);
    onUpgrade();
  };

  if (!showBanner || isDismissed || currentPlan !== 'free') {
    return null;
  }

  return (
    <div className="promo-banner-container">
      <div className="promo-banner">
        <button className="promo-close" onClick={handleDismiss}>✕</button>
        
        <div className="promo-content">
          <div className="promo-header">
            <div className="promo-badge">🔥 LIMITED TIME OFFER</div>
            <h2>Unlock Premium Features!</h2>
            <p>Upgrade now and get 50+ global servers, unlimited bandwidth, and advanced security</p>
          </div>

          <div className="promo-countdown">
            <div className="countdown-label">Offer expires in:</div>
            <div className="countdown-timer">
              <div className="countdown-item">
                <span className="countdown-value">{countdown.days}</span>
                <span className="countdown-unit">Days</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-value">{countdown.hours.toString().padStart(2, '0')}</span>
                <span className="countdown-unit">Hours</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-value">{countdown.minutes.toString().padStart(2, '0')}</span>
                <span className="countdown-unit">Minutes</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-value">{countdown.seconds.toString().padStart(2, '0')}</span>
                <span className="countdown-unit">Seconds</span>
              </div>
            </div>
          </div>

          <div className="promo-features">
            <div className="promo-feature">
              <span className="feature-icon">🌍</span>
              <span>50+ Servers</span>
            </div>
            <div className="promo-feature">
              <span className="feature-icon">⚡</span>
              <span>Ultra-Fast</span>
            </div>
            <div className="promo-feature">
              <span className="feature-icon">🔒</span>
              <span>Advanced Security</span>
            </div>
            <div className="promo-feature">
              <span className="feature-icon">∞</span>
              <span>Unlimited Data</span>
            </div>
          </div>

          <div className="promo-pricing">
            <div className="price-comparison">
              <div className="old-price">$119.88/year</div>
              <div className="new-price">
                <span className="discount-badge">Save 17%</span>
                <span className="price">$99.99/year</span>
              </div>
            </div>
            <div className="price-per-month">Only $8.33/month</div>
          </div>

          <button className="promo-upgrade-btn" onClick={handleUpgrade}>
            <span className="btn-icon">🚀</span>
            Upgrade to Premium Now
          </button>

          <div className="promo-guarantee">
            <span>✓ 30-Day Money-Back Guarantee</span>
            <span>✓ No Commitment Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;
