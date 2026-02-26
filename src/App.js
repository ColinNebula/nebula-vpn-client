import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import logo from './logo.svg';
import { savePrefs, loadPrefs } from './utils/persistence';
import ConnectButton from './components/ConnectButton';
import ServerList from './components/ServerList';
import StatusIndicator from './components/StatusIndicator';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import SplashScreen from './components/SplashScreen';
import InstallPrompt from './components/InstallPrompt';
import InstallPWA from './components/InstallPWA';
import SubscriptionModal from './components/SubscriptionModal';
import PromoBanner from './components/PromoBanner';
import AdminPanel from './components/AdminPanel';
import AdminDashboard from './components/AdminDashboard';
import apiService from './services/api';
import UpgradePrompt from './components/UpgradePrompt';
import TrafficMonitor from './components/TrafficMonitor';
import { hasFeature, getAllowedServers } from './config/planFeatures';
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
import PauseVPN from './components/PauseVPN';
import QuickConnect from './components/QuickConnect';
import RotatingIP from './components/RotatingIP';
import AutoConnectWiFi from './components/AutoConnectWiFi';
import MainDashboard from './components/MainDashboard';
import DarkWebMonitor from './components/DarkWebMonitor';
import IPLeakTest from './components/IPLeakTest';
import ConnectionProfiles from './components/ConnectionProfiles';

function App() {
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
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

  // New enhanced feature states
  const [isVPNPaused, setIsVPNPaused] = useState(false);
  const [rotatingIPEnabled, setRotatingIPEnabled] = useState(false);
  const [rotatingIPInterval, setRotatingIPInterval] = useState(10);
  const [autoConnectWiFiEnabled, setAutoConnectWiFiEnabled] = useState(false);
  const [trustedNetworks, setTrustedNetworks] = useState([]);
  const [recentServers, setRecentServers] = useState([]);
  const [favoriteServers, setFavoriteServers] = useState([]);

  // Ref used to debounce auto-saving preferences to the server
  const prefsSaveTimer = useRef(null);
  // Flag set during preference restoration to prevent a save-on-restore loop
  const isRestoringPrefs = useRef(false);

  // Enhanced server data with multi-hop capabilities — 40+ locations across 30+ countries
  const allServers = [
    // North America
    { id: '1',  name: 'US East',          location: 'New York',      ping: '25ms',  load: 45, country: 'US', flag: '🇺🇸', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '2',  name: 'US West',          location: 'Los Angeles',   ping: '18ms',  load: 32, country: 'US', flag: '🇺🇸', purpose: 'streaming', streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '3',  name: 'US Central',       location: 'Chicago',       ping: '22ms',  load: 41, country: 'US', flag: '🇺🇸', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '4',  name: 'US P2P',           location: 'Dallas',        ping: '28ms',  load: 38, country: 'US', flag: '🇺🇸', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '5',  name: 'Canada East',      location: 'Toronto',       ping: '30ms',  load: 56, country: 'CA', flag: '🇨🇦', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '6',  name: 'Canada West',      location: 'Vancouver',     ping: '35ms',  load: 29, country: 'CA', flag: '🇨🇦', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '7',  name: 'Mexico',           location: 'Mexico City',   ping: '55ms',  load: 22, country: 'MX', flag: '🇲🇽', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // Europe
    { id: '8',  name: 'Germany',          location: 'Frankfurt',     ping: '45ms',  load: 67, country: 'DE', flag: '🇩🇪', purpose: 'general',   streaming: true,  gaming: false, p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '9',  name: 'UK Streaming',     location: 'London',        ping: '55ms',  load: 78, country: 'GB', flag: '🇬🇧', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '10', name: 'UK General',       location: 'Manchester',    ping: '58ms',  load: 44, country: 'GB', flag: '🇬🇧', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '11', name: 'Netherlands P2P',  location: 'Amsterdam',     ping: '50ms',  load: 42, country: 'NL', flag: '🇳🇱', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '12', name: 'France',           location: 'Paris',         ping: '48ms',  load: 65, country: 'FR', flag: '🇫🇷', purpose: 'streaming', streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '13', name: 'Switzerland',      location: 'Zurich',        ping: '52ms',  load: 31, country: 'CH', flag: '🇨🇭', purpose: 'general',   streaming: true,  gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'privacy' },
    { id: '14', name: 'Sweden',           location: 'Stockholm',     ping: '60ms',  load: 27, country: 'SE', flag: '🇸🇪', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '15', name: 'Norway',           location: 'Oslo',          ping: '62ms',  load: 19, country: 'NO', flag: '🇳🇴', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '16', name: 'Spain',            location: 'Madrid',        ping: '58ms',  load: 48, country: 'ES', flag: '🇪🇸', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '17', name: 'Italy',            location: 'Milan',         ping: '55ms',  load: 53, country: 'IT', flag: '🇮🇹', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '18', name: 'Poland',           location: 'Warsaw',        ping: '65ms',  load: 35, country: 'PL', flag: '🇵🇱', purpose: 'general',   streaming: false, gaming: true,  p2p: false, multiHopSupport: true,  specialty: null },
    { id: '19', name: 'Romania',          location: 'Bucharest',     ping: '70ms',  load: 28, country: 'RO', flag: '🇷🇴', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '20', name: 'Iceland',          location: 'Reykjavik',     ping: '75ms',  load: 12, country: 'IS', flag: '🇮🇸', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: true,  specialty: 'privacy' },
    { id: '21', name: 'Austria',          location: 'Vienna',        ping: '53ms',  load: 40, country: 'AT', flag: '🇦🇹', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '22', name: 'Belgium',          location: 'Brussels',      ping: '52ms',  load: 37, country: 'BE', flag: '🇧🇪', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: true,  specialty: null },
    // Asia Pacific
    { id: '23', name: 'Singapore',        location: 'Singapore',     ping: '120ms', load: 23, country: 'SG', flag: '🇸🇬', purpose: 'gaming',    streaming: false, gaming: true,  p2p: false, multiHopSupport: false, specialty: 'gaming' },
    { id: '24', name: 'Japan Gaming',     location: 'Tokyo',         ping: '140ms', load: 89, country: 'JP', flag: '🇯🇵', purpose: 'gaming',    streaming: false, gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'gaming' },
    { id: '25', name: 'Japan Streaming',  location: 'Osaka',         ping: '145ms', load: 55, country: 'JP', flag: '🇯🇵', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: 'streaming' },
    { id: '26', name: 'South Korea',      location: 'Seoul',         ping: '150ms', load: 47, country: 'KR', flag: '🇰🇷', purpose: 'gaming',    streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'gaming' },
    { id: '27', name: 'Australia',        location: 'Sydney',        ping: '180ms', load: 34, country: 'AU', flag: '🇦🇺', purpose: 'general',   streaming: true,  gaming: false, p2p: true,  multiHopSupport: false, specialty: null },
    { id: '28', name: 'Australia East',   location: 'Melbourne',     ping: '185ms', load: 26, country: 'AU', flag: '🇦🇺', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: 'streaming' },
    { id: '29', name: 'India',            location: 'Mumbai',        ping: '130ms', load: 61, country: 'IN', flag: '🇮🇳', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '30', name: 'Hong Kong',        location: 'Hong Kong',     ping: '135ms', load: 72, country: 'HK', flag: '🇭🇰', purpose: 'general',   streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: null },
    { id: '31', name: 'New Zealand',      location: 'Auckland',      ping: '200ms', load: 18, country: 'NZ', flag: '🇳🇿', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // Middle East & Africa
    { id: '32', name: 'UAE',              location: 'Dubai',         ping: '110ms', load: 44, country: 'AE', flag: '🇦🇪', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '33', name: 'Israel',           location: 'Tel Aviv',      ping: '95ms',  load: 33, country: 'IL', flag: '🇮🇱', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '34', name: 'South Africa',     location: 'Johannesburg',  ping: '160ms', load: 29, country: 'ZA', flag: '🇿🇦', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // South America
    { id: '35', name: 'Brazil',           location: 'São Paulo',     ping: '95ms',  load: 52, country: 'BR', flag: '🇧🇷', purpose: 'general',   streaming: true,  gaming: true,  p2p: false, multiHopSupport: false, specialty: null },
    { id: '36', name: 'Argentina',        location: 'Buenos Aires',  ping: '110ms', load: 38, country: 'AR', flag: '🇦🇷', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '37', name: 'Chile',            location: 'Santiago',      ping: '115ms', load: 21, country: 'CL', flag: '🇨🇱', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // Specialty / Privacy
    { id: '38', name: 'Tor over VPN',     location: 'Special',       ping: '350ms', load: 15, country: 'XX', flag: '🧅', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: 'tor' },
    { id: '39', name: 'Double VPN',       location: 'NL → US',       ping: '80ms',  load: 20, country: 'XX', flag: '🔐', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: true,  specialty: 'double' },
    { id: '40', name: 'Obfuscated US',    location: 'New York',      ping: '35ms',  load: 30, country: 'US', flag: '🥷', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: 'obfuscated' },
    { id: '41', name: 'Obfuscated EU',    location: 'Amsterdam',     ping: '60ms',  load: 25, country: 'NL', flag: '🥷', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: 'obfuscated' },
  ];

  // Admin gets unrestricted access; all others are gated by their plan
  const effectivePlan = user?.role === 'admin' ? 'admin' : currentPlan;

  // Filter servers based on effective plan
  const servers = getAllowedServers(effectivePlan, allServers);

  // PWA features and service worker registration
  useEffect(() => {
    // Register service worker for PWA — production only.
    // In development, CRA's dev server does not serve sw.js from the root so
    // registration would fail with a MIME-type error.  The PUBLIC_URL is also
    // set to the homepage sub-path (/nebula-vpn-client) at build time but is
    // an empty string when running locally, so we must guard on NODE_ENV.
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        // PUBLIC_URL is '' in dev, '/nebula-vpn-client' in the GH Pages build.
        const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
        navigator.serviceWorker.register(swUrl)
          .then((registration) => {
            console.log('✅ SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('❌ SW registration failed: ', registrationError);
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

  // Update Electron system tray when VPN status changes
  useEffect(() => {
    if (window.electron?.isElectron) {
      const status = {
        connected: isConnected,
        server: selectedServer?.name || (multiHopServers.length > 0 ? multiHopServers.map(s => s.name).join(' → ') : 'Unknown')
      };
      
      // Send status to Electron main process
      const statusEvent = new CustomEvent('vpn-status-changed', { detail: status });
      window.dispatchEvent(statusEvent);
      
      // Update tray tooltip via IPC
      if (window.electron.vpn && typeof window.electron.vpn.updateStatus === 'function') {
        window.electron.vpn.updateStatus(status);
      }
    }
  }, [isConnected, selectedServer, multiHopServers]);

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

  // ── Restore all saveable preferences for a user ────────────────────────
  // serverPrefs: settings object returned from the server (canonical)
  // localPrefs:  fallback from localStorage (used when server is offline)
  // serverList:  the full allServers array so we can look up objects by id
  const restorePrefs = useCallback((serverPrefs, localPrefs, serverList) => {
    const prefs = (serverPrefs && Object.keys(serverPrefs).length > 0)
      ? serverPrefs
      : localPrefs;
    if (!prefs) return;

    isRestoringPrefs.current = true;
    try {
      if (prefs.settings)                setSettings(p => ({ ...p, ...prefs.settings }));
      if (prefs.isDarkMode !== undefined) setIsDarkMode(prefs.isDarkMode);
      if (prefs.selectedServerId) {
        const srv = serverList.find(s => s.id === prefs.selectedServerId);
        if (srv) setSelectedServer(srv);
      }
      if (prefs.recentServers)               setRecentServers(prefs.recentServers);
      if (prefs.favoriteServers)             setFavoriteServers(prefs.favoriteServers);
      if (prefs.rotatingIPEnabled !== undefined) setRotatingIPEnabled(prefs.rotatingIPEnabled);
      if (prefs.rotatingIPInterval)          setRotatingIPInterval(prefs.rotatingIPInterval);
      if (prefs.autoConnectWiFiEnabled !== undefined) setAutoConnectWiFiEnabled(prefs.autoConnectWiFiEnabled);
      if (prefs.trustedNetworks)             setTrustedNetworks(prefs.trustedNetworks);
      if (prefs.splitTunnelApps)             setSplitTunnelApps(prefs.splitTunnelApps);
      if (prefs.multiHopServerIds) {
        const hops = prefs.multiHopServerIds
          .map(id => serverList.find(s => s.id === id))
          .filter(Boolean);
        if (hops.length) setMultiHopServers(hops);
      }
    } finally {
      // Allow a tick before re-enabling saves so React batches the state updates
      setTimeout(() => { isRestoringPrefs.current = false; }, 100);
    }
  }, []);

  // ── Restore session from token on first mount ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    apiService.verifyToken()
      .then(data => {
        const u = data.user;
        const userObj = {
          email: u.email,
          plan: u.plan || 'free',
          role: u.role || 'user',
          firstName: u.name ? u.name.split(' ')[0] : u.email.split('@')[0],
          lastName: u.name ? u.name.split(' ').slice(1).join(' ') : '',
          verified: true
        };
        setUser(userObj);
        setCurrentPlan(u.plan || 'free');
        setIsAuthenticated(true);
        setShowSplashScreen(false);
        restorePrefs(u.settings || {}, loadPrefs(u.email), allServers);
      })
      .catch(() => {
        // Token invalid or expired — clear it so login screen shows
        localStorage.removeItem('token');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save preferences whenever they change ─────────────────────────────
  useEffect(() => {
    if (!user?.email || isRestoringPrefs.current) return;

    const prefs = {
      settings,
      isDarkMode,
      selectedServerId: selectedServer?.id || null,
      recentServers,
      favoriteServers,
      rotatingIPEnabled,
      rotatingIPInterval,
      autoConnectWiFiEnabled,
      trustedNetworks,
      splitTunnelApps,
      multiHopServerIds: multiHopServers.map(s => s.id),
    };

    // Persist to localStorage immediately (survives server restarts)
    savePrefs(user.email, prefs);

    // Debounce the server write to avoid flooding on rapid changes
    clearTimeout(prefsSaveTimer.current);
    prefsSaveTimer.current = setTimeout(() => {
      apiService.saveSettings(prefs).catch(() => {}); // fire-and-forget
    }, 2000);

    return () => clearTimeout(prefsSaveTimer.current);
  }, [
    user?.email,
    settings, isDarkMode, selectedServer,
    recentServers, favoriteServers,
    rotatingIPEnabled, rotatingIPInterval,
    autoConnectWiFiEnabled, trustedNetworks,
    splitTunnelApps, multiHopServers
  ]);

  const handleSplashComplete = () => {
    console.log('🚀 Splash screen completed, transitioning to login...');
    console.log('Current state - showSplashScreen:', showSplashScreen, 'isAuthenticated:', isAuthenticated);
    setShowSplashScreen(false);
    console.log('State updated - showSplashScreen should now be false');
  };

  const handleLogin = async (credentials) => {
    console.log('🔐 Login form submitted, authenticating...');
    try {
      const data = await apiService.login(credentials.email, credentials.password);
      const u = data.user;
      setUser({
        email: u.email,
        plan: u.plan || 'free',
        role: u.role || 'user',
        firstName: u.name ? u.name.split(' ')[0] : u.email.split('@')[0],
        lastName: u.name ? u.name.split(' ').slice(1).join(' ') : '',
        verified: true
      });
      setCurrentPlan(u.plan || 'free');
      setIsAuthenticated(true);
      setShowSignup(false);
      // Restore saved preferences: server is canonical, localStorage is fallback
      restorePrefs(u.settings || {}, loadPrefs(u.email), allServers);
      console.log('✅ Authentication successful (backend)');
      addLog('User logged in successfully', 'success');
    } catch (err) {
      // err.status is set for HTTP errors (auth failure, validation, etc.)
      // A missing status means a network/fetch error — server is truly unreachable
      if (err.status) {
        // Real auth error (401, 400, 429, …) — do NOT log the user in
        console.warn('⚠️ Login rejected by server:', err.message);
        addLog(`Login failed: ${err.message}`, 'error');
        throw err;  // re-throw so LoginForm can display the error message
      }

      // Network error — server offline, use offline mode
      console.warn('⚠️ Backend unreachable, using offline mode:', err.message);
      addLog('Server unreachable — running in offline mode', 'warning');

      // Still enforce basic offline credentials: reject obviously wrong attempts
      // (no password entered at all)
      if (!credentials.password) {
        throw new Error('Password is required');
      }

      setUser({
        email: credentials.email,
        plan: 'free',
        role: 'user',
        firstName: credentials.email.split('@')[0],
        lastName: '',
        verified: true
      });
      setCurrentPlan('free');
      setIsAuthenticated(true);
      setShowSignup(false);
      // Restore whatever was saved locally for this email (offline-mode best-effort)
      restorePrefs({}, loadPrefs(credentials.email), allServers);
    }

    // Handle PWA shortcut URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const tab = urlParams.get('tab');

    if (action === 'connect') {
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
  };

  const handleSignup = (userData) => {
    console.log('🎉 New user signup:', userData);
    // Create user from signup data
    setUser({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      plan: userData.plan || 'free',
      country: userData.country,
      verified: userData.verified,
      createdAt: userData.createdAt
    });
    setCurrentPlan(userData.plan || 'free');
    setIsAuthenticated(true);
    setShowSignup(false);
    console.log('✅ Account created successfully!');
    addLog('New account created and verified', 'success');
    
    // Show welcome message
    setTimeout(() => {
      if (userData.plan === 'free') {
        setShowSubscriptionModal(true);
      }
    }, 3000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsConnected(false);
    setSelectedServer(null);
    setMultiHopServers([]);
    setSplitTunnelApps([]);
    setKillSwitchActive(false);
    setShowSplashScreen(true); // Show splash screen again on logout
    addLog('User logged out', 'info');
  };

  // Shared handler for Google / Apple / Microsoft OAuth
  const handleSocialAuth = async (provider, profile) => {
    console.log(`🔐 Social auth: ${provider}`, profile.email);
    try {
      const data = await apiService.oauthLogin(provider, profile);
      const u = data.user;
      setUser({
        email: u.email,
        plan: u.plan || 'free',
        role: u.role || 'user',
        firstName: u.name ? u.name.split(' ')[0] : u.email.split('@')[0],
        lastName: u.name ? u.name.split(' ').slice(1).join(' ') : '',
        verified: true
      });
      setCurrentPlan(u.plan || 'free');
      setIsAuthenticated(true);
      setShowSignup(false);
      restorePrefs(u.settings || {}, loadPrefs(u.email), allServers);
      console.log(`✅ ${provider} authentication successful`);
      addLog(`Signed in with ${provider}`, 'success');
      if (data.isNewUser && (u.plan || 'free') === 'free') {
        setTimeout(() => setShowSubscriptionModal(true), 3000);
      }
    } catch (err) {
      if (err.status) {
        console.warn(`⚠️ ${provider} auth rejected:`, err.message);
        addLog(`${provider} sign-in failed: ${err.message}`, 'error');
        throw err;
      }
      // Network unavailable — fall back to offline mode
      console.warn('⚠️ Backend unreachable, using offline mode for social auth');
      addLog('Server unreachable — running in offline mode', 'warning');
      setUser({
        email: profile.email,
        plan: 'free',
        role: 'user',
        firstName: profile.name ? profile.name.split(' ')[0] : profile.email.split('@')[0],
        lastName: profile.name ? profile.name.split(' ').slice(1).join(' ') : '',
        verified: true
      });
      setCurrentPlan('free');
      setIsAuthenticated(true);
      setShowSignup(false);
      restorePrefs({}, loadPrefs(profile.email), allServers);
    }
  };

  const addLog = (message, type = 'info') => {
    const log = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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

  // Show splash screen first
  if (showSplashScreen) {
    console.log('🎬 Rendering splash screen...');
    return <SplashScreen onComplete={handleSplashComplete} isDarkMode={isDarkMode} />;
  }

  if (!isAuthenticated) {
    console.log('🔑 Rendering login/signup form...');
    
    if (showSignup) {
      return (
        <SignupForm 
          onSignupSuccess={handleSignup}
          onSwitchToLogin={() => setShowSignup(false)}
          onSocialAuth={handleSocialAuth}
        />
      );
    }
    
    return (
      <LoginForm 
        onLogin={handleLogin} 
        onSwitchToSignup={() => setShowSignup(true)}
        onSocialLogin={handleSocialAuth}
        isDarkMode={isDarkMode} 
      />
    );
  }

  console.log('🏠 Rendering main app...');

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* PWA Install Prompt */}
      <InstallPWA />
      
      {/* Legacy Install Prompt */}
      <InstallPrompt />
      
      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentPlan={currentPlan}
      />

      {/* Promotional Banner */}
      <PromoBanner 
        currentPlan={currentPlan}
        onUpgrade={() => setShowSubscriptionModal(true)}
      />

      {/* Admin Panel (user settings) */}
      {showAdminPanel && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)}
          currentUser={user}
          onUpdateUser={(updatedUser) => {
            setUser(updatedUser);
          }}
        />
      )}

      {/* Admin Dashboard (role-protected) */}
      {showAdminDashboard && user?.role === 'admin' && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
          currentUser={user}
        />
      )}
      
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
          <div className="header-logo-section">
            <img src={logo} alt="Nebula VPN Logo" className="header-logo" />
            <h1>Nebula VPN</h1>
          </div>
          <div className="header-controls">
            {effectivePlan === 'free' && (
              <button className="upgrade-btn" onClick={() => setShowSubscriptionModal(true)}>
                ⭐ Upgrade
              </button>
            )}
            {user?.role === 'admin' && (
              <button className="admin-dashboard-btn" onClick={() => setShowAdminDashboard(true)}>
                👑 Admin
              </button>
            )}
            <button className="admin-btn" onClick={() => setShowAdminPanel(true)}>
              ⚙️ Settings
            </button>
            <button className="theme-toggle" title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleDarkMode}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="user-info">
              <div className="user-avatar" title={user.email}>
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span title={user.email}>{user.email.split('@')[0]}</span>
              <span className={`plan-badge ${effectivePlan}`}>{effectivePlan}</span>
              <button className="logout-btn" onClick={handleLogout}>↩ Out</button>
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
      
      <div className="tab-nav-wrapper">
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
        {hasFeature(effectivePlan, 'multiHop') && (
          <button 
            className={`tab ${activeTab === 'multihop' ? 'active' : ''}`}
            onClick={() => setActiveTab('multihop')}
          >
            🔗 Multi-Hop
          </button>
        )}
        {hasFeature(effectivePlan, 'splitTunneling') && (
          <button 
            className={`tab ${activeTab === 'splittunnel' ? 'active' : ''}`}
            onClick={() => setActiveTab('splittunnel')}
          >
            📱 Split Tunnel
          </button>
        )}
        {hasFeature(effectivePlan, 'trafficAnalytics') && (
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        )}
        {hasFeature(effectivePlan, 'threatDetection') && (
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🛡️ Security
          </button>
        )}
        {hasFeature(effectivePlan, 'automationRules') && (
          <button 
            className={`tab ${activeTab === 'automation' ? 'active' : ''}`}
            onClick={() => setActiveTab('automation')}
          >
            🤖 Automation
          </button>
        )}
        {hasFeature(effectivePlan, 'liveDashboard') && (
          <button 
            className={`tab ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            ✨ Experience
          </button>
        )}
        {hasFeature(effectivePlan, 'networkTopology') && (
          <button 
            className={`tab ${activeTab === 'enterprise' ? 'active' : ''}`}
            onClick={() => setActiveTab('enterprise')}
          >
            🏢 Enterprise
          </button>
        )}
        {hasFeature(effectivePlan, 'aiNetworkOptimizer') && (
          <button 
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            🤖 AI/ML
          </button>
        )}
        {hasFeature(effectivePlan, 'collaborativeVPN') && (
          <button 
            className={`tab ${activeTab === 'nextgen' ? 'active' : ''}`}
            onClick={() => setActiveTab('nextgen')}
          >
            🚀 Next-Gen
          </button>
        )}
        {hasFeature(effectivePlan, 'mobileOptimizations') && (
          <button 
            className={`tab ${activeTab === 'mobile' ? 'active' : ''}`}
            onClick={() => setActiveTab('mobile')}
          >
            📱 Mobile
          </button>
        )}
        {hasFeature(effectivePlan, 'speedTest') && (
          <button 
            className={`tab ${activeTab === 'speedtest' ? 'active' : ''}`}
            onClick={() => setActiveTab('speedtest')}
          >
            ⚡ Speed Test
          </button>
        )}
        <button 
          className={`tab ${activeTab === 'leaktest' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaktest')}
        >
          🔬 Leak Test
        </button>
        <button 
          className={`tab ${activeTab === 'darkweb' ? 'active' : ''}`}
          onClick={() => setActiveTab('darkweb')}
        >
          🕵️ Dark Web
        </button>
        <button 
          className={`tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          ⚡ Profiles
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
      </div>
      
      <main className="App-main">
        <div className="vpn-container">
          {activeTab === 'dashboard' && (
            <MainDashboard
              isConnected={isConnected}
              isConnecting={isConnecting}
              selectedServer={selectedServer}
              connectionTime={connectionTime}
              trafficData={trafficData}
              multiHopServers={multiHopServers}
              servers={servers}
              onConnect={(server) => {
                setSelectedServer(server);
                setRecentServers(prev => [server.id, ...prev.filter(id => id !== server.id).slice(0, 4)]);
                if (!isConnected) handleToggleConnection();
              }}
              onDisconnect={handleToggleConnection}
              onServerChange={(server) => {
                setSelectedServer(server);
                setRecentServers(prev => [server.id, ...prev.filter(id => id !== server.id).slice(0, 4)]);
              }}
              isVPNPaused={isVPNPaused}
              onPause={(duration) => {
                setIsVPNPaused(true);
                addLog(`VPN paused for ${duration / 60} minutes`, 'warning');
              }}
              onResume={() => {
                setIsVPNPaused(false);
                addLog('VPN resumed', 'success');
              }}
              rotatingIPEnabled={rotatingIPEnabled}
              onToggleRotatingIP={(enabled) => {
                setRotatingIPEnabled(enabled);
                addLog(`Rotating IP ${enabled ? 'enabled' : 'disabled'}`, 'info');
              }}
              user={user}
              killSwitchActive={killSwitchActive}
              settings={settings}
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
            hasFeature(effectivePlan, 'multiHop') ? (
              <MultiHop 
                servers={allServers.filter(s => s.multiHopSupport)}
                selectedServers={multiHopServers}
                onServersChange={handleMultiHopChange}
                isConnected={isConnected}
              />
            ) : (
              <UpgradePrompt 
                feature="multiHop"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'splittunnel' && (
            hasFeature(effectivePlan, 'splitTunneling') ? (
              <SplitTunneling 
                apps={splitTunnelApps}
                onAppsChange={handleSplitTunnelChange}
                isConnected={isConnected}
                enabled={settings.splitTunneling}
              />
            ) : (
              <UpgradePrompt 
                feature="splitTunneling"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'speedtest' && (
            hasFeature(effectivePlan, 'speedTest') ? (
              <SpeedTest isConnected={isConnected} />
            ) : (
              <UpgradePrompt 
                feature="speedTest"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'analytics' && (
            hasFeature(effectivePlan, 'trafficAnalytics') ? (
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
            ) : (
              <UpgradePrompt 
                feature="trafficAnalytics"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'security' && (
            hasFeature(effectivePlan, 'threatDetection') ? (
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
            ) : (
              <UpgradePrompt 
                feature="threatDetection"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'automation' && (
            hasFeature(effectivePlan, 'automationRules') ? (
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
            ) : (
              <UpgradePrompt 
                feature="automationRules"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'experience' && (
            hasFeature(effectivePlan, 'liveDashboard') ? (
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
            ) : (
              <UpgradePrompt 
                feature="liveDashboard"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'enterprise' && (
            hasFeature(effectivePlan, 'networkTopology') ? (
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
            ) : (
              <UpgradePrompt 
                feature="networkTopology"
                requiredPlan="ultimate"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'ai' && (
            hasFeature(effectivePlan, 'aiNetworkOptimizer') ? (
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
            ) : (
              <UpgradePrompt 
                feature="aiNetworkOptimizer"
                requiredPlan="ultimate"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'nextgen' && (
            hasFeature(effectivePlan, 'collaborativeVPN') ? (
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
            ) : (
              <UpgradePrompt 
                feature="collaborativeVPN"
                requiredPlan="ultimate"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'mobile' && (
            hasFeature(effectivePlan, 'mobileOptimizations') ? (
              <MobileOptimizations />
            ) : (
              <UpgradePrompt 
                feature="mobileOptimizations"
                requiredPlan="premium"
                onUpgrade={() => setShowSubscriptionModal(true)}
                fullScreen={true}
              />
            )
          )}
          
          {activeTab === 'speedtest' && (
            <SpeedTest 
              isConnected={isConnected}
              selectedServer={selectedServer || (multiHopServers.length > 0 ? multiHopServers[multiHopServers.length - 1] : null)}
            />
          )}

          {activeTab === 'leaktest' && (
            <IPLeakTest isConnected={isConnected} />
          )}

          {activeTab === 'darkweb' && (
            <DarkWebMonitor />
          )}

          {activeTab === 'profiles' && (
            <ConnectionProfiles
              isConnected={isConnected}
              currentSettings={settings}
              onActivate={(profile) => {
                handleSettingsChange({ ...settings, ...profile.settings });
                addLog(`Connection profile "${profile.name}" activated`, 'success');
                // Auto-select server matching the profile's preferred region/purpose
                const match = servers.find(
                  s => s.country === profile.preferCountry && s.purpose === profile.preferredPurpose
                ) || servers.find(s => s.purpose === profile.preferredPurpose)
                  || servers.find(s => s.country === profile.preferCountry);
                if (match && !isConnected) {
                  setSelectedServer(match);
                  addLog(`Auto-selected server: ${match.name} for "${profile.name}" profile`, 'info');
                }
              }}
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

