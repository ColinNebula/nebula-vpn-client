import React, { useState, useEffect } from 'react';
import './SubscriptionModal.css';

const SubscriptionModal = ({ isOpen, onClose, currentPlan = 'free' }) => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [billingCycle, setBillingCycle] = useState('annual'); // 'monthly' or 'annual'
  const [showSuccess, setShowSuccess] = useState(false);

  const plans = {
    free: {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      color: '#9E9E9E',
      features: [
        { text: 'Basic VPN Protection', included: true },
        { text: '3 Server Locations', included: true },
        { text: 'Standard Speed', included: true },
        { text: '1 Device', included: true },
        { text: 'Limited Bandwidth (10GB/month)', included: true },
        { text: 'Email Support', included: false },
        { text: 'Advanced Features', included: false },
        { text: 'Priority Support', included: false }
      ],
      badge: null
    },
    premium: {
      name: 'Premium',
      price: { monthly: 9.99, annual: 99.99 },
      color: '#4CAF50',
      features: [
        { text: 'Advanced VPN Protection', included: true },
        { text: '50+ Server Locations', included: true },
        { text: 'Ultra-Fast Speed', included: true },
        { text: '5 Devices Simultaneously', included: true },
        { text: 'Unlimited Bandwidth', included: true },
        { text: 'Multi-Hop VPN', included: true },
        { text: 'Split Tunneling', included: true },
        { text: 'Kill Switch', included: true },
        { text: 'Email Support', included: true },
        { text: 'Ad Blocker', included: false },
        { text: 'Threat Detection', included: false },
        { text: 'Priority Support', included: false }
      ],
      badge: 'POPULAR',
      savings: '17%'
    },
    ultimate: {
      name: 'Ultimate',
      price: { monthly: 19.99, annual: 199.99 },
      color: '#667eea',
      features: [
        { text: 'Maximum Security & Privacy', included: true },
        { text: '100+ Global Servers', included: true },
        { text: 'Lightning-Fast Speed', included: true },
        { text: 'Unlimited Devices', included: true },
        { text: 'Unlimited Bandwidth', included: true },
        { text: 'Multi-Hop VPN', included: true },
        { text: 'Split Tunneling', included: true },
        { text: 'Advanced Kill Switch', included: true },
        { text: 'AI Network Optimization', included: true },
        { text: 'Quantum Security', included: true },
        { text: 'Blockchain Integration', included: true },
        { text: 'Advanced Threat Detection', included: true },
        { text: 'DNS Protection', included: true },
        { text: 'IPv6 Protection', included: true },
        { text: 'Dedicated IP', included: true },
        { text: 'Priority 24/7 Support', included: true },
        { text: 'White-label Options', included: true }
      ],
      badge: 'BEST VALUE',
      savings: '17%'
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubscribe = (plan) => {
    console.log(`Subscribing to ${plan} - ${billingCycle}`);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2500);
  };

  const calculateSavings = (plan) => {
    if (plan === 'free') return 0;
    const monthlyTotal = plans[plan].price.monthly * 12;
    const annualPrice = plans[plan].price.annual;
    return monthlyTotal - annualPrice;
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        {showSuccess && (
          <div className="success-animation">
            <div className="success-checkmark">
              <div className="check-icon">✓</div>
            </div>
            <h2>Welcome to {plans[selectedPlan].name}!</h2>
            <p>Your subscription is being activated...</p>
          </div>
        )}

        {!showSuccess && (
          <>
            <button className="modal-close" onClick={onClose}>✕</button>
            
            <div className="modal-header">
              <h2>🚀 Upgrade Your VPN Experience</h2>
              <p>Choose the perfect plan for your security needs</p>
              
              <div className="billing-toggle">
                <button 
                  className={billingCycle === 'monthly' ? 'active' : ''}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button 
                  className={billingCycle === 'annual' ? 'active' : ''}
                  onClick={() => setBillingCycle('annual')}
                >
                  Annual <span className="save-badge">Save 17%</span>
                </button>
              </div>
            </div>

            <div className="plans-container">
              {Object.entries(plans).map(([key, plan]) => {
                const isCurrentPlan = currentPlan === key;
                const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual / 12;
                
                return (
                  <div 
                    key={key}
                    className={`plan-card ${selectedPlan === key ? 'selected' : ''} ${isCurrentPlan ? 'current' : ''}`}
                    onClick={() => setSelectedPlan(key)}
                    style={{ borderColor: selectedPlan === key ? plan.color : 'transparent' }}
                  >
                    {plan.badge && (
                      <div className="plan-badge" style={{ background: plan.color }}>
                        {plan.badge}
                      </div>
                    )}
                    
                    {isCurrentPlan && (
                      <div className="current-plan-badge">Current Plan</div>
                    )}

                    <div className="plan-header">
                      <h3>{plan.name}</h3>
                      <div className="plan-price">
                        <span className="currency">$</span>
                        <span className="amount">{price.toFixed(2)}</span>
                        <span className="period">/month</span>
                      </div>
                      {billingCycle === 'annual' && key !== 'free' && (
                        <div className="annual-price">
                          ${plan.price.annual}/year - Save ${calculateSavings(key).toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="plan-features">
                      {plan.features.map((feature, index) => (
                        <div key={index} className={`feature ${feature.included ? 'included' : 'excluded'}`}>
                          <span className="feature-icon">{feature.included ? '✓' : '✕'}</span>
                          <span className="feature-text">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      className={`subscribe-btn ${key === 'free' ? 'free-plan' : ''}`}
                      style={{ background: key !== 'free' ? plan.color : '#e0e0e0' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubscribe(key);
                      }}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Current Plan' : key === 'free' ? 'Continue Free' : `Subscribe to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              <div className="trust-badges">
                <div className="trust-item">🔒 256-bit Encryption</div>
                <div className="trust-item">💳 Secure Payment</div>
                <div className="trust-item">🔄 30-Day Money Back</div>
                <div className="trust-item">🌍 No Logs Policy</div>
              </div>
              
              <div className="payment-methods">
                <span>We accept:</span>
                <div className="payment-icons">
                  💳 Visa • Mastercard • PayPal • Crypto
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
