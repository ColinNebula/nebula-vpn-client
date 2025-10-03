import React from 'react';
import './UpgradePrompt.css';
import { getPlanDisplayName } from '../../config/planFeatures';

const UpgradePrompt = ({ 
  feature, 
  requiredPlan = 'premium', 
  onUpgrade,
  fullScreen = false 
}) => {
  const featureNames = {
    multiHop: 'Multi-Hop VPN',
    splitTunneling: 'Split Tunneling',
    killSwitch: 'Kill Switch',
    speedTest: 'Speed Test',
    trafficAnalytics: 'Traffic Analytics',
    connectionHistory: 'Connection History',
    performanceMetrics: 'Performance Metrics',
    geographicMap: 'Geographic Map',
    threatDetection: 'Threat Detection',
    dnsProtection: 'DNS Protection',
    ipv6Protection: 'IPv6 Protection',
    firewallManager: 'Firewall Manager',
    obfuscation: 'Obfuscation',
    twoFactorAuth: 'Two-Factor Authentication',
    automationRules: 'Automation Rules',
    bandwidthScheduler: 'Bandwidth Scheduler',
    networkMonitor: 'Network Monitor',
    vpnChaining: 'VPN Chaining',
    privacyAudit: 'Privacy Audit',
    liveDashboard: 'Live Dashboard',
    customization: 'Customization Center',
    quickActions: 'Quick Actions',
    sessionManager: 'Session Manager',
    networkTopology: 'Network Topology',
    complianceCenter: 'Compliance Center',
    apiIntegration: 'API Integration Hub',
    advancedAnalytics: 'Advanced Analytics',
    securityOperations: 'Security Operations',
    aiNetworkOptimizer: 'AI Network Optimizer',
    predictiveSecurity: 'Predictive Security',
    intelligentAssistant: 'Intelligent Assistant',
    smartAnalytics: 'Smart Analytics',
    adaptiveLearning: 'Adaptive Learning',
    collaborativeVPN: 'Collaborative VPN',
    mobileDeviceManager: 'Mobile Device Manager',
    blockchainIntegration: 'Blockchain Integration',
    quantumSecurity: 'Quantum Security',
    edgeComputing: 'Edge Computing',
    mobileOptimizations: 'Mobile Optimizations',
  };

  const featureName = featureNames[feature] || feature;
  const planName = getPlanDisplayName(requiredPlan);

  if (fullScreen) {
    return (
      <div className="upgrade-prompt-fullscreen">
        <div className="upgrade-prompt-content">
          <div className="upgrade-prompt-icon">
            {requiredPlan === 'premium' ? '🌟' : '👑'}
          </div>
          <h2>{featureName}</h2>
          <p className="upgrade-prompt-subtitle">
            This feature requires {planName} plan
          </p>
          <div className="upgrade-prompt-benefits">
            <h3>Unlock with {planName}:</h3>
            <ul>
              {requiredPlan === 'premium' && (
                <>
                  <li>✓ 50+ server locations worldwide</li>
                  <li>✓ Unlimited bandwidth</li>
                  <li>✓ Multi-Hop VPN & Split Tunneling</li>
                  <li>✓ Advanced security features</li>
                  <li>✓ Priority email support</li>
                  <li>✓ 5 devices simultaneously</li>
                </>
              )}
              {requiredPlan === 'ultimate' && (
                <>
                  <li>✓ Everything in Premium</li>
                  <li>✓ AI-powered optimization</li>
                  <li>✓ Enterprise-grade security</li>
                  <li>✓ Blockchain & Quantum security</li>
                  <li>✓ Unlimited devices</li>
                  <li>✓ 24/7 priority support</li>
                </>
              )}
            </ul>
          </div>
          <div className="upgrade-prompt-actions">
            <button className="upgrade-now-btn" onClick={onUpgrade}>
              ⭐ Upgrade to {planName}
            </button>
            <p className="upgrade-prompt-note">
              {requiredPlan === 'premium' 
                ? 'Starting at $9.99/month • 7-day money-back guarantee'
                : 'Starting at $19.99/month • 7-day money-back guarantee'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upgrade-prompt-inline">
      <div className="upgrade-prompt-icon-small">
        {requiredPlan === 'premium' ? '🌟' : '👑'}
      </div>
      <div className="upgrade-prompt-text">
        <h4>{featureName}</h4>
        <p>Available with {planName} plan</p>
      </div>
      <button className="upgrade-small-btn" onClick={onUpgrade}>
        Upgrade
      </button>
    </div>
  );
};

export default UpgradePrompt;
