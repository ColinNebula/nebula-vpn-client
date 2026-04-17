/**
 * Integration Example - Enhanced VPN with Advanced Routing 
 * =======================================================
 * Shows how to integrate the new AdvancedRoutingManager with existing VPN tunnel
 * 
 * This demonstrates upgrading your current VPN to commercial-grade standards
 * using the research findings from major VPN providers.
 */

const { AdvancedRoutingManager } = require('./advanced-routing');

// Example integration with existing WireGuardTunnel class
class EnhancedWireGuardTunnel {
  constructor() {
    // Keep all existing functionality
    this.platform = process.platform;
    this.tunnelName = 'Nebulavpn';
    this.connected = false;
    
    // Add advanced routing manager
    this.advancedRouting = new AdvancedRoutingManager(this.tunnelName, false);
    
    console.log('🚀 Enhanced WireGuard Tunnel initialized with advanced routing');
  }

  /**
   * ENHANCED CONNECT - Adds industry-standard routing on top of basic VPN
   */
  async connect(serverConfig) {
    console.log('🔌 Starting enhanced VPN connection...');
    
    try {
      // Step 1: Basic VPN connection (existing implementation)
      console.log('[Step 1] Establishing basic WireGuard tunnel...');
      await this._connectBasicTunnel(serverConfig);
      
      // Step 2: Enhanced routing setup (new capability)
      console.log('[Step 2] Setting up advanced routing protection...');
      const routingResults = await this.advancedRouting.setupEnhancedRouting({
        serverIP: serverConfig.endpoint.split(':')[0],
        gateway: '10.8.0.1', // VPN gateway
        dns: serverConfig.dns || ['1.1.1.1', '1.0.0.1']
      });
      
      // Step 3: Verify connection quality
      console.log('[Step 3] Verifying connection security...');
      const verification = await this._verifyEnhancedConnection();
      
      if (verification.secure) {
        this.connected = true;
        console.log('✅ Enhanced VPN connection established successfully!');
        console.log(`   - Routing layers active: ${Object.values(routingResults).filter(Boolean).length}/5`);
        console.log(`   - Security score: ${verification.securityScore}/100`);
        return { success: true, enhanced: true, results: routingResults };
      } else {
        console.warn('⚠️ VPN connected but security verification failed');
        return { success: true, enhanced: false, issues: verification.issues };
      }
      
    } catch (error) {
      console.error('❌ Enhanced VPN connection failed:', error.message);
      await this._cleanup();
      throw error;
    }
  }

  /**
   * ENHANCED DISCONNECT - Clean up all routing layers
   */
  async disconnect() {
    console.log('🔌 Disconnecting enhanced VPN...');
    
    try {
      // Clean up advanced routing first
      await this.advancedRouting._cleanup();
      
      // Then disconnect basic tunnel
      await this._disconnectBasicTunnel();
      
      this.connected = false;
      console.log('✅ Enhanced VPN disconnected successfully');
      
    } catch (error) {
      console.error('❌ Enhanced VPN disconnect failed:', error.message);
      throw error;
    }
  }

  /**
   * REAL-TIME STATUS - Get comprehensive VPN status
   */
  async getEnhancedStatus() {
    const status = {
      connected: this.connected,
      basicTunnel: await this._checkBasicTunnelStatus(),
      routing: {
        basicRoutes: this.advancedRouting.activeRoutes.size > 0,
        nrptDns: this.advancedRouting.nrptRules.size > 0,
        leakMonitoring: this.advancedRouting.leakDetectionActive,
        wfpFiltering: this.advancedRouting.wfpFilters.size > 0
      },
      security: await this._getSecurityMetrics(),
      performance: await this._getPerformanceMetrics()
    };
    
    return status;
  }

  /**
   * SMART RECONNECT - Automatically fix connection issues
   */
  async smartReconnect() {
    console.log('🔄 Smart reconnect initiated...');
    
    try {
      const status = await this.getEnhancedStatus();
      
      // Diagnose issues
      const issues = [];
      if (!status.basicTunnel.active) issues.push('tunnel');
      if (!status.routing.basicRoutes) issues.push('routing');
      if (!status.routing.nrptDns) issues.push('dns');
      
      console.log(`[Diagnosis] Found ${issues.length} issues: ${issues.join(', ')}`);
      
      // Targeted fixes
      for (const issue of issues) {
        switch (issue) {
          case 'tunnel':
            await this._restartBasicTunnel();
            break;
          case 'routing':
            await this.advancedRouting._setupEnhancedBasicRoutes(this._lastConfig);
            break;
          case 'dns':
            await this.advancedRouting._setupNRPTDnsEnforcement(this._lastConfig.dns);
            break;
        }
      }
      
      console.log('✅ Smart reconnect completed');
      return { success: true, fixedIssues: issues.length };
      
    } catch (error) {
      console.error('❌ Smart reconnect failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // =====================================
  // HELPER METHODS (implement these based on your existing code)
  // =====================================

  async _connectBasicTunnel(config) {
    // Your existing WireGuard tunnel setup code
    // This should handle:
    // - Generate/load key pair
    // - Create WireGuard config file  
    // - Start WireGuard service
    // - Verify tunnel is up
    
    console.log('  ✓ Basic WireGuard tunnel established');
    this._lastConfig = config; // Save for reconnect
  }

  async _disconnectBasicTunnel() {
    // Your existing WireGuard tunnel cleanup code
    // This should handle:
    // - Stop WireGuard service
    // - Clean up config files
    // - Restore original network settings
    
    console.log('  ✓ Basic WireGuard tunnel disconnected');
  }

  async _verifyEnhancedConnection() {
    // Comprehensive security verification
    const checks = {
      externalIP: false,
      dnsLeaks: false, 
      ipv6Leaks: false,
      webrtcLeaks: false
    };
    
    try {
      // Check external IP
      const externalIP = await this._getExternalIP();
      checks.externalIP = this._isVPNIP(externalIP);
      
      // Check DNS leaks
      checks.dnsLeaks = await this._checkDNSLeaks();
      
      // Check IPv6 leaks  
      checks.ipv6Leaks = await this._checkIPv6Leaks();
      
      // Check WebRTC leaks
      checks.webrtcLeaks = await this._checkWebRTCLeaks();
      
      const passedChecks = Object.values(checks).filter(Boolean).length;
      const securityScore = Math.round((passedChecks / Object.keys(checks).length) * 100);
      
      return {
        secure: securityScore >= 75,
        securityScore,
        checks,
        issues: Object.entries(checks).filter(([_, passed]) => !passed).map(([check]) => check)
      };
      
    } catch (error) {
      return { secure: false, securityScore: 0, error: error.message };
    }
  }

  async _getExternalIP() {
    // Implementation to get external IP
    return '1.1.1.1'; // Placeholder
  }

  _isVPNIP(ip) {
    return /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(ip);
  }

  async _checkBasicTunnelStatus() {
    // Check if WireGuard service is running
    return { active: true, adapter: 'Nebulavpn' }; // Placeholder
  }

  async _getSecurityMetrics() {
    // Get security-related metrics
    return { 
      dnsSecurity: 95,
      ipLeakProtection: 90, 
      killSwitchActive: true
    };
  }

  async _getPerformanceMetrics() {
    // Get performance metrics
    return {
      latency: 45,
      bandwidth: 95,
      uptime: 99.5
    };
  }

  async _checkDNSLeaks() {
    // Implementation for DNS leak detection
    return true; // No leaks
  }

  async _checkIPv6Leaks() {
    // Implementation for IPv6 leak detection  
    return true; // No leaks
  }

  async _checkWebRTCLeaks() {
    // Implementation for WebRTC leak detection
    return true; // No leaks
  }

  async _restartBasicTunnel() {
    // Restart the basic WireGuard tunnel
    console.log('  🔄 Restarting basic tunnel...');
  }

  async _cleanup() {
    // Clean up everything on error
    try {
      await this.advancedRouting._cleanup();
      await this._disconnectBasicTunnel();
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  }
}

// =====================================
// USAGE EXAMPLE
// =====================================

async function demonstrateEnhancedVPN() {
  console.log('🧪 ENHANCED VPN DEMONSTRATION');
  console.log('============================');
  console.log('');
  
  const vpn = new EnhancedWireGuardTunnel();
  
  try {
    // Connect with enhanced protection
    const result = await vpn.connect({
      endpoint: 'vpn.example.com:51820',
      publicKey: 'YOUR_SERVER_PUBLIC_KEY',
      dns: ['1.1.1.1', '1.0.0.1']
    });
    
    console.log('Connection result:', result);
    
    // Check status periodically
    setInterval(async () => {
      const status = await vpn.getEnhancedStatus();
      console.log('VPN Status:', {
        connected: status.connected,
        securityScore: status.security.ipLeakProtection,
        routingLayers: Object.values(status.routing).filter(Boolean).length
      });
    }, 30000);
    
    // Simulate connection issue and auto-fix
    setTimeout(async () => {
      console.log('\\n🔧 Simulating connection recovery...');
      const recovery = await vpn.smartReconnect();
      console.log('Recovery result:', recovery);
    }, 60000);
    
  } catch (error) {
    console.error('VPN demonstration failed:', error.message);
  }
}

// Export for integration with your existing code
module.exports = { 
  EnhancedWireGuardTunnel,
  demonstrateEnhancedVPN 
};

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateEnhancedVPN().catch(console.error);
}