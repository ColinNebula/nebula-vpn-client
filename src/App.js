import React, { useState, useEffect } from 'react';
import './App.css';
import ConnectButton from './components/ConnectButton';
import ServerList from './components/ServerList';
import StatusIndicator from './components/StatusIndicator';
import LoginForm from './components/LoginForm';
import TrafficMonitor from './components/TrafficMonitor';
import SettingsPanel from './components/SettingsPanel';
import ConnectionLog from './components/ConnectionLog';
import SpeedTest from './components/SpeedTest';
import SplitTunneling from './components/SplitTunneling';
import MultiHop from './components/MultiHop';
import KillSwitch from './components/KillSwitch';
import TrafficAnalytics from './components/TrafficAnalytics';
import ConnectionHistory from './components/ConnectionHistory';
import DataUsageTracker from './components/DataUsageTracker';
import PerformanceMetrics from './components/PerformanceMetrics';
import GeographicMap from './components/GeographicMap';
import ThreatDetection from './components/ThreatDetection';
import DNSProtection from './components/DNSProtection';
import IPv6Protection from './components/IPv6Protection';
import FirewallManager from './components/FirewallManager';
import ObfuscationSettings from './components/ObfuscationSettings';
import TwoFactorAuth from './components/TwoFactorAuth';
import AutomationRules from './components/AutomationRules';
import BandwidthScheduler from './components/BandwidthScheduler';
import NetworkMonitor from './components/NetworkMonitor';
import VPNChaining from './components/VPNChaining';
import PrivacyAudit from './components/PrivacyAudit';
import LiveDashboard from './components/LiveDashboard';
import CustomizationCenter from './components/CustomizationCenter';
import QuickActions from './components/QuickActions';
import NotificationCenter from './components/NotificationCenter';
import SessionManager from './components/SessionManager';
import NetworkTopology from './components/NetworkTopology';
import ComplianceCenter from './components/ComplianceCenter';
import APIIntegrationHub from './components/APIIntegrationHub';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import SecurityOperations from './components/SecurityOperations';
import AINetworkOptimizer from './components/AINetworkOptimizer';
import PredictiveSecurity from './components/PredictiveSecurity';
import IntelligentAssistant from './components/IntelligentAssistant';
import SmartAnalytics from './components/SmartAnalytics';
import AdaptiveLearning from './components/AdaptiveLearning';
import CollaborativeVPN from './components/CollaborativeVPN';
import MobileDeviceManager from './components/MobileDeviceManager';
import BlockchainIntegration from './components/BlockchainIntegration';
import QuantumSecurity from './components/QuantumSecurity';
import EdgeComputing from './components/EdgeComputing';
import MobileOptimizations from './components/MobileOptimizations';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [connectionTime, setConnectionTime] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [trafficData, setTrafficData] = useState({ download: 0, upload: 0, totalDownload: 0, totalUpload: 0 });
  const [connectionLogs, setConnectionLogs] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [splitTunnelApps, setSplitTunnelApps] = useState([]);
  const [multiHopServers, setMultiHopServers] = useState([]);
  const [settings, setSettings] = useState({
    autoConnect: false,
    killSwitch: true,
    advancedKillSwitch: false,
    protocol: 'OpenVPN',
    notifications: true,
    darkMode: false,
    splitTunneling: false,
    multiHop: false,
    dnsLeakProtection: true,
    ipv6Protection: true
  });

  // Enhanced server data with multi-hop capabilities
  const servers = [
    { id: '1', name: 'US East', location: 'New York', ping: '25ms', load: 45, country: 'US', flag: '🇺🇸', purpose: 'general', streaming: true, gaming: true, p2p: true, multiHopSupport: true },
    { id: '2', name: 'US West', location: 'Los Angeles', ping: '18ms', load: 32, country: 'US', flag: '🇺🇸', purpose: 'streaming', streaming: true, gaming: true, p2p: false, multiHopSupport: true },
    { id: '3', name: 'Europe', location: 'Frankfurt', ping: '45ms', load: 67, country: 'DE', flag: '🇩🇪', purpose: 'general', streaming: true, gaming: false, p2p: true, multiHopSupport: true },
    { id: '4', name: 'Asia Gaming', location: 'Singapore', ping: '120ms', load: 23, country: 'SG', flag: '🇸🇬', purpose: 'gaming', streaming: false, gaming: true, p2p: false, multiHopSupport: false },
    { id: '5', name: 'Canada', location: 'Toronto', ping: '30ms', load: 56, country: 'CA', flag: '🇨🇦', purpose: 'general', streaming: true, gaming: true, p2p: true, multiHopSupport: true },
    { id: '6', name: 'UK Streaming', location: 'London', ping: '55ms', load: 78, country: 'GB', flag: '🇬🇧', purpose: 'streaming', streaming: true, gaming: false, p2p: false, multiHopSupport: true },
    { id: '7', name: 'Australia', location: 'Sydney', ping: '180ms', load: 34, country: 'AU', flag: '🇦🇺', purpose: 'general', streaming: true, gaming: false, p2p: true, multiHopSupport: false },
    { id: '8', name: 'Japan Gaming', location: 'Tokyo', ping: '140ms', load: 89, country: 'JP', flag: '🇯🇵', purpose: 'gaming', streaming: false, gaming: true, p2p: false, multiHopSupport: true },
    { id: '9', name: 'Netherlands P2P', location: 'Amsterdam', ping: '50ms', load: 42, country: 'NL', flag: '🇳🇱', purpose: 'p2p', streaming: false, gaming: false, p2p: true, multiHopSupport: true },
    { id: '10', name: 'France', location: 'Paris', ping: '48ms', load: 65, country: 'FR', flag: '🇫🇷', purpose: 'streaming', streaming: true, gaming: true, p2p: false, multiHopSupport: true }
  ];

  // PWA features and service worker registration
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      addLog('Internet connection restored', 'success');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      addLog('Internet connection lost', 'error');
      if (settings.advancedKillSwitch) {
        setKillSwitchActive(true);
        addLog('Advanced Kill Switch activated - blocking all traffic', 'warning');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [settings.advancedKillSwitch]);

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Timer for connection duration
  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setConnectionTime(prev => prev + 1);
        // Simulate traffic data
        setTrafficData(prev => ({
          download: Math.random() * 1000 + 500, // KB/s
          upload: Math.random() * 300 + 100,
          totalDownload: prev.totalDownload + (Math.random() * 1000 + 500) / 8, // Convert to KB
          totalUpload: prev.totalUpload + (Math.random() * 300 + 100) / 8
        }));
      }, 1000);
    } else {
      setConnectionTime(0);
      setTrafficData({ download: 0, upload: 0, totalDownload: 0, totalUpload: 0 });
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // Advanced Kill Switch monitoring
  useEffect(() => {
    if (settings.advancedKillSwitch && isConnected) {
      const monitorConnection = setInterval(() => {
        // Simulate connection monitoring
        const connectionHealthy = Math.random() > 0.05; // 95% uptime simulation
        
        if (!connectionHealthy) {
          setKillSwitchActive(true);
          addLog('VPN connection unstable - Kill Switch activated', 'warning');
          
          setTimeout(() => {
            setKillSwitchActive(false);
            addLog('VPN connection restored - Kill Switch deactivated', 'success');
          }, 3000);
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(monitorConnection);
    }
  }, [settings.advancedKillSwitch, isConnected]);

  const handleLogin = (credentials) => {
    // Simulate login
    setTimeout(() => {
      setUser({ email: credentials.email, plan: 'Premium' });
      setIsAuthenticated(true);
      addLog('User logged in successfully', 'success');
      
      // Check for URL parameters for PWA shortcuts
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const tab = urlParams.get('tab');
      
      if (action === 'connect') {
        // Auto-select optimal server for quick connect
        const optimalServer = servers.reduce((best, current) => {
          const currentScore = (100 - current.load) + (200 - parseInt(current.ping));
          const bestScore = (100 - best.load) + (200 - parseInt(best.ping));
          return currentScore > bestScore ? current : best;
        });
        setSelectedServer(optimalServer);
      }
      
      if (tab) {
        setActiveTab(tab);
      }
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsConnected(false);
    setSelectedServer(null);
    setMultiHopServers([]);
    setSplitTunnelApps([]);
    setKillSwitchActive(false);
    addLog('User logged out', 'info');
  };

  const addLog = (message, type = 'info') => {
    const log = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      message,
      type
    };
    setConnectionLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const handleToggleConnection = async () => {
    if (!selectedServer && !isConnected && multiHopServers.length === 0) {
      alert('Please select a server or configure multi-hop connection first');
      return;
    }

    setIsConnecting(true);
    
    if (multiHopServers.length > 0) {
      const serverNames = multiHopServers.map(s => s.name).join(' → ');
      addLog(`${isConnected ? 'Disconnecting from' : 'Connecting to'} multi-hop chain: ${serverNames}`, 'info');
    } else {
      addLog(`${isConnected ? 'Disconnecting from' : 'Connecting to'} ${selectedServer?.name || 'server'}`, 'info');
    }
    
    // Simulate connection delay (longer for multi-hop)
    const connectionDelay = multiHopServers.length > 0 ? 4000 : 2000;
    
    setTimeout(() => {
      const newConnectedState = !isConnected;
      setIsConnected(newConnectedState);
      setIsConnecting(false);
      
      if (newConnectedState) {
        setKillSwitchActive(false);
        if (multiHopServers.length > 0) {
          addLog(`Successfully connected via multi-hop: ${multiHopServers.map(s => s.name).join(' → ')}`, 'success');
        } else {
          addLog(`Successfully connected to ${selectedServer.name}`, 'success');
        }
      } else {
        addLog('Disconnected from VPN', 'warning');
        if (settings.advancedKillSwitch) {
          setKillSwitchActive(true);
          addLog('Advanced Kill Switch activated after disconnect', 'warning');
        }
      }
    }, connectionDelay);
  };

  const handleServerSelect = (server) => {
    if (!isConnected) {
      setSelectedServer(server);
      setMultiHopServers([]); // Clear multi-hop when selecting single server
      addLog(`Selected server: ${server.name} (${server.location})`, 'info');
    }
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    if (newSettings.darkMode !== settings.darkMode) {
      setIsDarkMode(newSettings.darkMode);
    }
    if (newSettings.advancedKillSwitch && isConnected) {
      addLog('Advanced Kill Switch enabled - monitoring connection', 'info');
    }
    addLog('Settings updated', 'info');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    setSettings(prev => ({ ...prev, darkMode: newDarkMode }));
  };

  const handleMultiHopChange = (servers) => {
    setMultiHopServers(servers);
    setSelectedServer(null); // Clear single server when using multi-hop
    if (servers.length > 0) {
      addLog(`Multi-hop chain configured: ${servers.map(s => s.name).join(' → ')}`, 'info');
    }
  };

  const handleSplitTunnelChange = (apps) => {
    setSplitTunnelApps(apps);
    addLog(`Split tunneling configured for ${apps.length} applications`, 'info');
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-banner">
          📶 No internet connection - Check your network
        </div>
      )}
      
      {/* Kill Switch overlay */}
      {killSwitchActive && (
        <div className="kill-switch-overlay">
          <div className="kill-switch-message">
            🛡️ Kill Switch Active - All traffic blocked for security
          </div>
        </div>
      )}

      <header className="App-header">
        <div className="header-content">
          <h1>Nebula VPN Client</h1>
          <div className="header-controls">
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="user-info">
              <span>Welcome, {user.email} ({user.plan})</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
        <StatusIndicator 
          isConnected={isConnected} 
          selectedServer={selectedServer}
          multiHopServers={multiHopServers}
          connectionTime={connectionTime}
          killSwitchActive={killSwitchActive}
        />
      </header>
      
      <nav className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'servers' ? 'active' : ''}`}
          onClick={() => setActiveTab('servers')}
        >
          🌍 Servers
        </button>
        <button 
          className={`tab ${activeTab === 'multihop' ? 'active' : ''}`}
          onClick={() => setActiveTab('multihop')}
        >
          🔗 Multi-Hop
        </button>
        <button 
          className={`tab ${activeTab === 'splittunnel' ? 'active' : ''}`}
          onClick={() => setActiveTab('splittunnel')}
        >
          📱 Split Tunnel
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🛡️ Security
        </button>
        <button 
          className={`tab ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          🤖 Automation
        </button>
        <button 
          className={`tab ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          ✨ Experience
        </button>
        <button 
          className={`tab ${activeTab === 'enterprise' ? 'active' : ''}`}
          onClick={() => setActiveTab('enterprise')}
        >
          🏢 Enterprise
        </button>
        <button 
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI/ML
        </button>
        <button 
          className={`tab ${activeTab === 'nextgen' ? 'active' : ''}`}
          onClick={() => setActiveTab('nextgen')}
        >
          🚀 Next-Gen
        </button>
        <button 
          className={`tab ${activeTab === 'mobile' ? 'active' : ''}`}
          onClick={() => setActiveTab('mobile')}
        >
          📱 Mobile
        </button>
        <button 
          className={`tab ${activeTab === 'speedtest' ? 'active' : ''}`}
          onClick={() => setActiveTab('speedtest')}
        >
          ⚡ Speed Test
        </button>
        <button 
          className={`tab ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          📊 Traffic
        </button>
        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📝 Logs
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>
      
      <main className="App-main">
        <div className="vpn-container">
          {activeTab === 'dashboard' && (
            <LiveDashboard 
              isConnected={isConnected}
              selectedServer={selectedServer}
              connectionTime={connectionTime}
              trafficData={trafficData}
              multiHopServers={multiHopServers}
              onQuickConnect={handleToggleConnection}
              onServerSelect={handleServerSelect}
              servers={servers}
            />
          )}
          
          {activeTab === 'servers' && (
            <div className="server-section">
              <ServerList 
                servers={servers}
                onSelect={handleServerSelect}
                selectedServer={selectedServer}
                isConnected={isConnected}
              />
            </div>
          )}
          
          {activeTab === 'multihop' && (
            <MultiHop 
              servers={servers.filter(s => s.multiHopSupport)}
              selectedServers={multiHopServers}
              onServersChange={handleMultiHopChange}
              isConnected={isConnected}
            />
          )}
          
          {activeTab === 'splittunnel' && (
            <SplitTunneling 
              apps={splitTunnelApps}
              onAppsChange={handleSplitTunnelChange}
              isConnected={isConnected}
              enabled={settings.splitTunneling}
            />
          )}
          
          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button 
                  className={`analytics-tab ${activeTab === 'analytics' && !window.analyticsSubTab ? 'active' : ''}`}
                  onClick={() => { window.analyticsSubTab = 'overview'; setActiveTab('analytics'); }}
                >
                  📊 Overview
                </button>
                <button 
                  className={`analytics-tab ${window.analyticsSubTab === 'performance' ? 'active' : ''}`}
                  onClick={() => { window.analyticsSubTab = 'performance'; setActiveTab('analytics'); }}
                >
                  📈 Performance
                </button>
                <button 
                  className={`analytics-tab ${window.analyticsSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => { window.analyticsSubTab = 'history'; setActiveTab('analytics'); }}
                >
                  📜 History
                </button>
                <button 
                  className={`analytics-tab ${window.analyticsSubTab === 'usage' ? 'active' : ''}`}
                  onClick={() => { window.analyticsSubTab = 'usage'; setActiveTab('analytics'); }}
                >
                  📱 App Usage
                </button>
                <button 
                  className={`analytics-tab ${window.analyticsSubTab === 'map' ? 'active' : ''}`}
                  onClick={() => { window.analyticsSubTab = 'map'; setActiveTab('analytics'); }}
                >
                  🌍 Global Map
                </button>
              </div>
              
              <div className="analytics-content">
                {(!window.analyticsSubTab || window.analyticsSubTab === 'overview') && (
                  <TrafficAnalytics 
                    isConnected={isConnected}
                    connectionTime={connectionTime}
                  />
                )}
                {window.analyticsSubTab === 'performance' && (
                  <PerformanceMetrics 
                    isConnected={isConnected}
                    currentServer={selectedServer || (multiHopServers.length > 0 ? multiHopServers[multiHopServers.length - 1] : null)}
                  />
                )}
                {window.analyticsSubTab === 'history' && (
                  <ConnectionHistory />
                )}
                {window.analyticsSubTab === 'usage' && (
                  <DataUsageTracker 
                    isConnected={isConnected}
                  />
                )}
                {window.analyticsSubTab === 'map' && (
                  <GeographicMap 
                    servers={servers}
                    currentServer={selectedServer || (multiHopServers.length > 0 ? multiHopServers[multiHopServers.length - 1] : null)}
                    onServerSelect={handleServerSelect}
                  />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button 
                  className={`analytics-tab ${activeTab === 'security' && !window.securitySubTab ? 'active' : ''}`}
                  onClick={() => { window.securitySubTab = 'threats'; setActiveTab('security'); }}
                >
                  🛡️ Threat Detection
                </button>
                <button 
                  className={`analytics-tab ${window.securitySubTab === 'dns' ? 'active' : ''}`}
                  onClick={() => { window.securitySubTab = 'dns'; setActiveTab('security'); }}
                >
                  🔒 DNS Protection
                </button>
                <button 
                  className={`analytics-tab ${window.securitySubTab === 'ipv6' ? 'active' : ''}`}
                  onClick={() => { window.securitySubTab = 'ipv6'; setActiveTab('security'); }}
                >
                  🌐 IPv6 Protection
                </button>
                <button 
                  className={`analytics-tab ${window.securitySubTab === 'firewall' ? 'active' : ''}`}
                  onClick={() => { window.securitySubTab = 'firewall'; setActiveTab('security'); }}
                >
                  🔥 Firewall
                </button>
                <button 
                  className={`analytics-tab ${window.securitySubTab === 'obfuscation' ? 'active' : ''}`}
                  onClick={() => { window.securitySubTab = 'obfuscation'; setActiveTab('security'); }}
                >
                  🥷 Obfuscation
                </button>
                <button 
                  className={`analytics-tab ${window.securitySubTab === '2fa' ? 'active' : ''}`}
                  onClick={() => { window.securitySubTab = '2fa'; setActiveTab('security'); }}
                >
                  🔐 Two-Factor Auth
                </button>
              </div>
              
              <div className="analytics-content">
                {(!window.securitySubTab || window.securitySubTab === 'threats') && (
                  <ThreatDetection isConnected={isConnected} />
                )}
                
                {window.securitySubTab === 'dns' && (
                  <DNSProtection isConnected={isConnected} />
                )}
                
                {window.securitySubTab === 'ipv6' && (
                  <IPv6Protection isConnected={isConnected} />
                )}
                
                {window.securitySubTab === 'firewall' && (
                  <FirewallManager isConnected={isConnected} />
                )}
                
                {window.securitySubTab === 'obfuscation' && (
                  <ObfuscationSettings isConnected={isConnected} />
                )}
                
                {window.securitySubTab === '2fa' && (
                  <TwoFactorAuth />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'automation' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button 
                  className={`analytics-tab ${activeTab === 'automation' && !window.automationSubTab ? 'active' : ''}`}
                  onClick={() => { window.automationSubTab = 'rules'; setActiveTab('automation'); }}
                >
                  ⚙️ Automation Rules
                </button>
                <button 
                  className={`analytics-tab ${window.automationSubTab === 'bandwidth' ? 'active' : ''}`}
                  onClick={() => { window.automationSubTab = 'bandwidth'; setActiveTab('automation'); }}
                >
                  📊 Bandwidth Scheduler
                </button>
                <button 
                  className={`analytics-tab ${window.automationSubTab === 'monitor' ? 'active' : ''}`}
                  onClick={() => { window.automationSubTab = 'monitor'; setActiveTab('automation'); }}
                >
                  📡 Network Monitor
                </button>
                <button 
                  className={`analytics-tab ${window.automationSubTab === 'chaining' ? 'active' : ''}`}
                  onClick={() => { window.automationSubTab = 'chaining'; setActiveTab('automation'); }}
                >
                  🔗 VPN Chaining
                </button>
                <button 
                  className={`analytics-tab ${window.automationSubTab === 'audit' ? 'active' : ''}`}
                  onClick={() => { window.automationSubTab = 'audit'; setActiveTab('automation'); }}
                >
                  🔒 Privacy Audit
                </button>
              </div>
              
              <div className="analytics-content">
                {(!window.automationSubTab || window.automationSubTab === 'rules') && (
                  <AutomationRules isConnected={isConnected} />
                )}
                
                {window.automationSubTab === 'bandwidth' && (
                  <BandwidthScheduler isConnected={isConnected} />
                )}
                
                {window.automationSubTab === 'monitor' && (
                  <NetworkMonitor isConnected={isConnected} />
                )}
                
                {window.automationSubTab === 'chaining' && (
                  <VPNChaining isConnected={isConnected} />
                )}
                
                {window.automationSubTab === 'audit' && (
                  <PrivacyAudit isConnected={isConnected} />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'experience' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button 
                  className={`analytics-tab ${activeTab === 'experience' && !window.experienceSubTab ? 'active' : ''}`}
                  onClick={() => { window.experienceSubTab = 'customization'; setActiveTab('experience'); }}
                >
                  🎨 Customization
                </button>
                <button 
                  className={`analytics-tab ${window.experienceSubTab === 'quickactions' ? 'active' : ''}`}
                  onClick={() => { window.experienceSubTab = 'quickactions'; setActiveTab('experience'); }}
                >
                  ⚡ Quick Actions
                </button>
                <button 
                  className={`analytics-tab ${window.experienceSubTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => { window.experienceSubTab = 'notifications'; setActiveTab('experience'); }}
                >
                  🔔 Notifications
                </button>
                <button 
                  className={`analytics-tab ${window.experienceSubTab === 'sessions' ? 'active' : ''}`}
                  onClick={() => { window.experienceSubTab = 'sessions'; setActiveTab('experience'); }}
                >
                  💾 Sessions
                </button>
              </div>
              
              <div className="analytics-content">
                {(!window.experienceSubTab || window.experienceSubTab === 'customization') && (
                  <CustomizationCenter />
                )}
                
                {window.experienceSubTab === 'quickactions' && (
                  <QuickActions 
                    onQuickConnect={handleToggleConnection}
                    onSpeedTest={() => setActiveTab('speedtest')}
                    isConnected={isConnected}
                    onDisconnect={handleToggleConnection}
                  />
                )}
                
                {window.experienceSubTab === 'notifications' && (
                  <NotificationCenter />
                )}
                
                {window.experienceSubTab === 'sessions' && (
                  <SessionManager 
                    onLoadProfile={(profile) => alert(`Loading profile: ${profile.name}`)}
                  />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'enterprise' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button 
                  className={`analytics-tab ${activeTab === 'enterprise' && !window.enterpriseSubTab ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'topology'; setActiveTab('enterprise'); }}
                >
                  🌐 Network Topology
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'compliance' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'compliance'; setActiveTab('enterprise'); }}
                >
                  📋 Compliance
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'integrations' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'integrations'; setActiveTab('enterprise'); }}
                >
                  🔗 API Hub
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'analytics'; setActiveTab('enterprise'); }}
                >
                  📊 Analytics
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'security' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'security'; setActiveTab('enterprise'); }}
                >
                  🛡️ Security Ops
                </button>
              </div>
              
              <div className="analytics-content">
                {(!window.enterpriseSubTab || window.enterpriseSubTab === 'topology') && (
                  <NetworkTopology 
                    isConnected={isConnected}
                    selectedServer={selectedServer}
                    multiHopServers={multiHopServers}
                    servers={servers}
                  />
                )}
                
                {window.enterpriseSubTab === 'compliance' && (
                  <ComplianceCenter />
                )}
                
                {window.enterpriseSubTab === 'integrations' && (
                  <APIIntegrationHub />
                )}
                
                {window.enterpriseSubTab === 'analytics' && (
                  <AdvancedAnalytics />
                )}
                
                {window.enterpriseSubTab === 'security' && (
                  <SecurityOperations />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'ai' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button 
                  className={`analytics-tab ${activeTab === 'ai' && !window.aiSubTab ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'optimizer'; setActiveTab('ai'); }}
                >
                  🚀 Network Optimizer
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'security' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'security'; setActiveTab('ai'); }}
                >
                  🔮 Predictive Security
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'assistant' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'assistant'; setActiveTab('ai'); }}
                >
                  💬 AI Assistant
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'analytics'; setActiveTab('ai'); }}
                >
                  📊 Smart Analytics
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'learning' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'learning'; setActiveTab('ai'); }}
                >
                  🧠 Adaptive Learning
                </button>
              </div>
              
              <div className="analytics-content">
                {(!window.aiSubTab || window.aiSubTab === 'optimizer') && (
                  <AINetworkOptimizer 
                    isConnected={isConnected}
                    selectedServer={selectedServer}
                    servers={servers}
                    onServerSelect={handleServerSelect}
                  />
                )}
                
                {window.aiSubTab === 'security' && (
                  <PredictiveSecurity />
                )}
                
                {window.aiSubTab === 'assistant' && (
                  <IntelligentAssistant />
                )}
                
                {window.aiSubTab === 'analytics' && (
                  <SmartAnalytics />
                )}
                
                {window.aiSubTab === 'learning' && (
                  <AdaptiveLearning />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'nextgen' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button 
                  className={`analytics-tab ${activeTab === 'nextgen' && !window.nextgenSubTab ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'collaboration'; setActiveTab('nextgen'); }}
                >
                  👥 Collaboration
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'mobile' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'mobile'; setActiveTab('nextgen'); }}
                >
                  📱 Mobile Manager
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'blockchain' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'blockchain'; setActiveTab('nextgen'); }}
                >
                  ⛓️ Blockchain
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'quantum' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'quantum'; setActiveTab('nextgen'); }}
                >
                  🔮 Quantum Security
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'edge' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'edge'; setActiveTab('nextgen'); }}
                >
                  ⚡ Edge Computing
                </button>
              </div>
              
              <div className="analytics-content">
                {(!window.nextgenSubTab || window.nextgenSubTab === 'collaboration') && (
                  <CollaborativeVPN />
                )}
                
                {window.nextgenSubTab === 'mobile' && (
                  <MobileDeviceManager />
                )}
                
                {window.nextgenSubTab === 'blockchain' && (
                  <BlockchainIntegration />
                )}
                
                {window.nextgenSubTab === 'quantum' && (
                  <QuantumSecurity />
                )}
                
                {window.nextgenSubTab === 'edge' && (
                  <EdgeComputing />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'mobile' && (
            <MobileOptimizations />
          )}
          
          {activeTab === 'speedtest' && (
            <SpeedTest 
              isConnected={isConnected}
              selectedServer={selectedServer || (multiHopServers.length > 0 ? multiHopServers[multiHopServers.length - 1] : null)}
            />
          )}
          
          {activeTab === 'traffic' && (
            <TrafficMonitor 
              trafficData={trafficData}
              isConnected={isConnected}
            />
          )}
          
          {activeTab === 'logs' && (
            <ConnectionLog logs={connectionLogs} />
          )}
          
          {activeTab === 'settings' && (
            <SettingsPanel 
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          )}
          
          <div className="control-section">
            <ConnectButton 
              isConnected={isConnected}
              onToggle={handleToggleConnection}
              disabled={isConnecting || killSwitchActive}
            />
            {isConnecting && <div className="connecting-text">Connecting...</div>}
            {killSwitchActive && <div className="kill-switch-text">🛡️ Protected</div>}
            
            {multiHopServers.length > 0 ? (
              <div className="selected-server-info multi-hop">
                <span className="connection-type">🔗 Multi-Hop Chain</span>
                <div className="hop-chain">
                  {multiHopServers.map((server, index) => (
                    <div key={server.id} className="hop-item">
                      <span className="server-flag">{server.flag}</span>
                      <span className="server-name">{server.name}</span>
                      {index < multiHopServers.length - 1 && <span className="hop-arrow">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedServer ? (
              <div className="selected-server-info">
                <span className="server-flag">{selectedServer.flag}</span>
                <div className="server-details">
                  <span className="server-name">{selectedServer.name}</span>
                  <span className="server-purpose">{selectedServer.purpose}</span>
                </div>
              </div>
            ) : null}
            
            <KillSwitch 
              isActive={killSwitchActive}
              isAdvanced={settings.advancedKillSwitch}
              isOnline={isOnline}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
