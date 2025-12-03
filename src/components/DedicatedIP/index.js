import React, { useState } from 'react';
import './DedicatedIP.css';

const DedicatedIP = () => {
  const [currentPlan, setCurrentPlan] = useState('shared'); // shared, dedicated, static
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [assignedIP, setAssignedIP] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [ipHistory, setIpHistory] = useState([
    { ip: '185.156.46.xxx', date: '2024-01-15', region: 'Netherlands' },
    { ip: '103.108.92.xxx', date: '2024-01-14', region: 'Singapore' },
    { ip: '45.83.90.xxx', date: '2024-01-13', region: 'Germany' },
  ]);

  const regions = [
    { id: 'us-east', name: 'US East', city: 'New York', flag: '🇺🇸', available: 12, price: 5 },
    { id: 'us-west', name: 'US West', city: 'Los Angeles', flag: '🇺🇸', available: 8, price: 5 },
    { id: 'uk', name: 'United Kingdom', city: 'London', flag: '🇬🇧', available: 15, price: 4 },
    { id: 'de', name: 'Germany', city: 'Frankfurt', flag: '🇩🇪', available: 20, price: 4 },
    { id: 'nl', name: 'Netherlands', city: 'Amsterdam', flag: '🇳🇱', available: 18, price: 4 },
    { id: 'jp', name: 'Japan', city: 'Tokyo', flag: '🇯🇵', available: 6, price: 6 },
    { id: 'sg', name: 'Singapore', city: 'Singapore', flag: '🇸🇬', available: 10, price: 5 },
    { id: 'au', name: 'Australia', city: 'Sydney', flag: '🇦🇺', available: 5, price: 6 },
  ];

  const planFeatures = {
    shared: {
      name: 'Shared IP',
      icon: '👥',
      description: 'Share IP with other users for maximum anonymity',
      features: [
        { text: 'Shared with other users', included: true },
        { text: 'IP changes each session', included: true },
        { text: 'Maximum privacy', included: true },
        { text: 'Included in all plans', included: true },
      ],
      price: 'Included'
    },
    static: {
      name: 'Static IP',
      icon: '📌',
      description: 'Same shared IP that persists across sessions',
      features: [
        { text: 'Consistent IP address', included: true },
        { text: 'Shared with fewer users', included: true },
        { text: 'Faster whitelisting', included: true },
        { text: 'Available in select regions', included: true },
      ],
      price: '$2/mo'
    },
    dedicated: {
      name: 'Dedicated IP',
      icon: '🎯',
      description: 'Your own unique IP that only you use',
      features: [
        { text: 'Exclusively yours', included: true },
        { text: 'Not shared with anyone', included: true },
        { text: 'Best for business use', included: true },
        { text: 'Ideal for accessing IP-restricted services', included: true },
        { text: 'Lower chance of blocklisting', included: true },
      ],
      price: '$5/mo'
    }
  };

  const useCases = [
    {
      icon: '🏦',
      title: 'Banking & Finance',
      desc: 'Avoid security flags from changing IPs',
      plan: 'dedicated'
    },
    {
      icon: '🎮',
      title: 'Gaming',
      desc: 'Consistent IP for game servers',
      plan: 'static'
    },
    {
      icon: '💼',
      title: 'Business Access',
      desc: 'Access company networks with whitelisted IP',
      plan: 'dedicated'
    },
    {
      icon: '📧',
      title: 'Email Servers',
      desc: 'Better email deliverability',
      plan: 'dedicated'
    },
    {
      icon: '🌐',
      title: 'Web Hosting',
      desc: 'Host services with static address',
      plan: 'static'
    },
    {
      icon: '📹',
      title: 'Remote Desktop',
      desc: 'Reliable RDP/VNC connections',
      plan: 'static'
    },
  ];

  const handleUpgrade = (plan) => {
    setCurrentPlan(plan);
    if (plan === 'dedicated' && selectedRegion) {
      // Simulate IP assignment
      const region = regions.find(r => r.id === selectedRegion);
      setAssignedIP({
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        region: region.name,
        city: region.city,
        assigned: new Date().toLocaleDateString()
      });
    }
    setShowUpgrade(false);
  };

  return (
    <div className="dedicated-ip">
      <div className="dip-header">
        <h3>🏠 Static/Dedicated IP</h3>
        <div className="current-plan-badge">
          <span className="plan-icon">{planFeatures[currentPlan].icon}</span>
          <span className="plan-name">{planFeatures[currentPlan].name}</span>
        </div>
      </div>

      {/* Current IP Status */}
      <div className="ip-status-panel">
        {assignedIP ? (
          <div className="assigned-ip">
            <div className="ip-header">
              <span className="ip-label">Your Dedicated IP</span>
              <span className="ip-region">{assignedIP.region}</span>
            </div>
            <div className="ip-display">
              <span className="ip-address">{assignedIP.ip}</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(assignedIP.ip)}>
                📋 Copy
              </button>
            </div>
            <div className="ip-meta">
              <span>Assigned: {assignedIP.assigned}</span>
              <span>•</span>
              <span>{assignedIP.city}</span>
            </div>
          </div>
        ) : (
          <div className="no-dedicated-ip">
            <span className="no-ip-icon">🌐</span>
            <div className="no-ip-text">
              <h4>Using Shared IP</h4>
              <p>Upgrade to get your own static or dedicated IP address</p>
            </div>
            <button className="upgrade-btn" onClick={() => setShowUpgrade(true)}>
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div className="plans-section">
        <h4>📊 IP Options</h4>
        <div className="plans-grid">
          {Object.entries(planFeatures).map(([key, plan]) => (
            <div 
              key={key}
              className={`plan-card ${currentPlan === key ? 'active' : ''} ${key === 'dedicated' ? 'featured' : ''}`}
              onClick={() => key !== currentPlan && setShowUpgrade(true)}
            >
              {key === 'dedicated' && <span className="featured-badge">Best Value</span>}
              <div className="plan-header">
                <span className="plan-icon">{plan.icon}</span>
                <h5>{plan.name}</h5>
                <span className="plan-price">{plan.price}</span>
              </div>
              <p className="plan-desc">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((feat, idx) => (
                  <li key={idx}>
                    <span className="check">✓</span>
                    {feat.text}
                  </li>
                ))}
              </ul>
              {currentPlan === key ? (
                <span className="current-badge">Current Plan</span>
              ) : (
                <button className="select-plan-btn">
                  {key === 'shared' ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Region Selection for Dedicated IP */}
      {(currentPlan === 'dedicated' || currentPlan === 'static') && (
        <div className="region-section">
          <h4>🌍 Select Region</h4>
          <p className="section-desc">Choose a region for your {currentPlan} IP address</p>
          
          <div className="regions-grid">
            {regions.map(region => (
              <label 
                key={region.id}
                className={`region-option ${selectedRegion === region.id ? 'selected' : ''}`}
              >
                <input 
                  type="radio"
                  name="region"
                  value={region.id}
                  checked={selectedRegion === region.id}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                />
                <span className="region-flag">{region.flag}</span>
                <div className="region-info">
                  <span className="region-name">{region.name}</span>
                  <span className="region-city">{region.city}</span>
                </div>
                <div className="region-meta">
                  <span className="availability">{region.available} available</span>
                  <span className="region-price">+${region.price}/mo</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* IP History */}
      <div className="history-section">
        <h4>📜 Recent IP History</h4>
        <div className="history-list">
          {ipHistory.map((entry, idx) => (
            <div key={idx} className="history-item">
              <span className="history-ip">{entry.ip}</span>
              <span className="history-region">{entry.region}</span>
              <span className="history-date">{entry.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="use-cases-section">
        <h4>💡 Use Cases</h4>
        <div className="use-cases-grid">
          {useCases.map((useCase, idx) => (
            <div key={idx} className="use-case-item">
              <span className="use-case-icon">{useCase.icon}</span>
              <div className="use-case-info">
                <h5>{useCase.title}</h5>
                <p>{useCase.desc}</p>
              </div>
              <span className={`use-case-plan ${useCase.plan}`}>
                {useCase.plan === 'dedicated' ? '🎯' : '📌'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="benefits-section">
        <div className="benefit-card">
          <span className="benefit-icon">🚫</span>
          <h5>Avoid Blocklists</h5>
          <p>Dedicated IPs are rarely blocked since they're not shared</p>
        </div>
        <div className="benefit-card">
          <span className="benefit-icon">⚡</span>
          <h5>Faster Access</h5>
          <p>No CAPTCHA challenges or verification prompts</p>
        </div>
        <div className="benefit-card">
          <span className="benefit-icon">🔐</span>
          <h5>IP Whitelisting</h5>
          <p>Add your IP to trusted lists for services</p>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="upgrade-modal">
          <div className="upgrade-content">
            <button className="close-modal" onClick={() => setShowUpgrade(false)}>✕</button>
            <h4>Upgrade Your IP Plan</h4>
            <p>Choose the IP option that best fits your needs</p>
            
            <div className="upgrade-options">
              {Object.entries(planFeatures).filter(([key]) => key !== 'shared').map(([key, plan]) => (
                <div 
                  key={key} 
                  className={`upgrade-option ${key === 'dedicated' ? 'recommended' : ''}`}
                  onClick={() => handleUpgrade(key)}
                >
                  {key === 'dedicated' && <span className="rec-badge">Recommended</span>}
                  <span className="opt-icon">{plan.icon}</span>
                  <span className="opt-name">{plan.name}</span>
                  <span className="opt-price">{plan.price}</span>
                </div>
              ))}
            </div>
            
            <button className="cancel-btn" onClick={() => setShowUpgrade(false)}>
              Keep Shared IP
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="dip-info">
        <span className="info-icon">ℹ️</span>
        <p>
          <strong>Privacy Note:</strong> While dedicated IPs offer benefits for specific use cases, 
          shared IPs provide better anonymity as your traffic blends with other users.
        </p>
      </div>
    </div>
  );
};

export default DedicatedIP;
