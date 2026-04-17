// Plan-based feature access configuration
// This defines what features are available to each subscription tier

export const PLAN_FEATURES = {
  free: {
    // Basic Features
    basicVPN: true,
    servers: {
      maxLocations: 3,
      allowedServers: ['1', '2', '3'], // US East, US West, Europe
      streaming: false,
      gaming: false,
      p2p: false
    },
    devices: 1,
    bandwidth: {
      limited: true,
      monthlyLimit: 10, // GB
    },
    
    // Advanced Features (disabled for free)
    multiHop: false,
    splitTunneling: false,
    killSwitch: false,
    speedTest: false,
    
    // Analytics & Monitoring
    trafficAnalytics: false,
    connectionHistory: false,
    dataUsageTracker: true, // Basic only
    performanceMetrics: false,
    geographicMap: false,
    
    // Security Features
    threatDetection: false,
    dnsProtection: false,
    ipv6Protection: false,
    firewallManager: false,
    obfuscation: false,
    twoFactorAuth: false,
    
    // Automation
    automationRules: false,
    bandwidthScheduler: false,
    networkMonitor: false,
    vpnChaining: false,
    privacyAudit: false,
    
    // Experience Features
    liveDashboard: false,
    customization: false,
    quickActions: false,
    notifications: true, // Basic only
    sessionManager: false,
    
    // Enterprise Features
    networkTopology: false,
    complianceCenter: false,
    apiIntegration: false,
    advancedAnalytics: false,
    securityOperations: false,
    
    // AI/ML Features
    aiNetworkOptimizer: false,
    predictiveSecurity: false,
    intelligentAssistant: false,
    smartAnalytics: false,
    adaptiveLearning: false,
    
    // Next-Gen Features
    collaborativeVPN: false,
    mobileDeviceManager: false,
    blockchainIntegration: false,
    quantumSecurity: false,
    edgeComputing: false,
    
    // Mobile Features
    mobileOptimizations: false,
    
    // Support
    support: 'community', // community, email, priority
  },
  
  premium: {
    // Basic Features
    basicVPN: true,
    servers: {
      maxLocations: 50,
      allowedServers: 'all',
      streaming: true,
      gaming: true,
      p2p: true
    },
    devices: 5,
    bandwidth: {
      limited: false,
      monthlyLimit: null,
    },
    
    // Advanced Features
    multiHop: true,
    splitTunneling: true,
    killSwitch: true,
    speedTest: true,
    
    // Analytics & Monitoring
    trafficAnalytics: true,
    connectionHistory: true,
    dataUsageTracker: true,
    performanceMetrics: true,
    geographicMap: true,
    
    // Security Features
    threatDetection: true,
    dnsProtection: true,
    ipv6Protection: true,
    firewallManager: true,
    obfuscation: true,
    twoFactorAuth: true,
    
    // Automation
    automationRules: true,
    bandwidthScheduler: true,
    networkMonitor: true,
    vpnChaining: false,
    privacyAudit: true,
    
    // Experience Features
    liveDashboard: true,
    customization: true,
    quickActions: true,
    notifications: true,
    sessionManager: true,
    
    // Enterprise Features (disabled for premium)
    networkTopology: false,
    complianceCenter: false,
    apiIntegration: false,
    advancedAnalytics: false,
    securityOperations: false,
    
    // AI/ML Features (disabled for premium)
    aiNetworkOptimizer: false,
    predictiveSecurity: false,
    intelligentAssistant: false,
    smartAnalytics: false,
    adaptiveLearning: false,
    
    // Next-Gen Features (disabled for premium)
    collaborativeVPN: false,
    mobileDeviceManager: false,
    blockchainIntegration: false,
    quantumSecurity: false,
    edgeComputing: false,
    
    // Mobile Features
    mobileOptimizations: true,
    
    // Support
    support: 'email',
  },
  
  ultimate: {
    // Basic Features
    basicVPN: true,
    servers: {
      maxLocations: 'unlimited',
      allowedServers: 'all',
      streaming: true,
      gaming: true,
      p2p: true
    },
    devices: 'unlimited',
    bandwidth: {
      limited: false,
      monthlyLimit: null,
    },
    
    // Advanced Features (all enabled)
    multiHop: true,
    splitTunneling: true,
    killSwitch: true,
    speedTest: true,
    
    // Analytics & Monitoring (all enabled)
    trafficAnalytics: true,
    connectionHistory: true,
    dataUsageTracker: true,
    performanceMetrics: true,
    geographicMap: true,
    
    // Security Features (all enabled)
    threatDetection: true,
    dnsProtection: true,
    ipv6Protection: true,
    firewallManager: true,
    obfuscation: true,
    twoFactorAuth: true,
    
    // Automation (all enabled)
    automationRules: true,
    bandwidthScheduler: true,
    networkMonitor: true,
    vpnChaining: true,
    privacyAudit: true,
    
    // Experience Features (all enabled)
    liveDashboard: true,
    customization: true,
    quickActions: true,
    notifications: true,
    sessionManager: true,
    
    // Enterprise Features (all enabled)
    networkTopology: true,
    complianceCenter: true,
    apiIntegration: true,
    advancedAnalytics: true,
    securityOperations: true,
    
    // AI/ML Features (all enabled)
    aiNetworkOptimizer: true,
    predictiveSecurity: true,
    intelligentAssistant: true,
    smartAnalytics: true,
    adaptiveLearning: true,
    
    // Next-Gen Features (all enabled)
    collaborativeVPN: true,
    mobileDeviceManager: true,
    blockchainIntegration: true,
    quantumSecurity: true,
    edgeComputing: true,
    
    // Mobile Features
    mobileOptimizations: true,
    
    // Support
    support: 'priority',
  }
};

// Helper function to check if a feature is available for a plan
export const hasFeature = (plan, feature) => {
  // Admin role gets unrestricted access to all features
  if (plan === 'admin') return true;

  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  
  // Handle nested features (e.g., 'servers.streaming')
  if (feature.includes('.')) {
    const parts = feature.split('.');
    let value = planFeatures;
    for (const part of parts) {
      value = value?.[part];
    }
    return !!value;
  }
  
  return !!planFeatures[feature];
};

// Get allowed servers for a plan
export const getAllowedServers = (plan, allServers) => {
  // Admin gets access to all servers
  if (plan === 'admin') return allServers;

  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  
  if (planFeatures.servers.allowedServers === 'all') {
    return allServers;
  }
  
  return allServers.filter(server => 
    planFeatures.servers.allowedServers.includes(server.id)
  );
};

// Check if user has reached device limit
export const canAddDevice = (plan, currentDevices) => {
  // Admin has unlimited devices
  if (plan === 'admin') return true;

  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  
  if (planFeatures.devices === 'unlimited') {
    return true;
  }
  
  return currentDevices < planFeatures.devices;
};

// Check if user has bandwidth remaining
export const hasBandwidthRemaining = (plan, usedBandwidth) => {
  // Admin has unlimited bandwidth
  if (plan === 'admin') return true;

  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.free;
  
  if (!planFeatures.bandwidth.limited) {
    return true;
  }
  
  return usedBandwidth < planFeatures.bandwidth.monthlyLimit;
};

// Get plan display name
export const getPlanDisplayName = (plan) => {
  if (plan === 'admin') return 'Admin';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};

// Get plan color
export const getPlanColor = (plan) => {
  const colors = {
    free: '#9E9E9E',
    premium: '#4CAF50',
    ultimate: '#667eea',
    admin: '#FF5722'
  };
  return colors[plan] || colors.free;
};
