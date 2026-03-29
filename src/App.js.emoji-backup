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
import ThreatProtection from './components/ThreatProtection';
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
import WarrantCanary from './components/WarrantCanary';
import TransparencyReport from './components/TransparencyReport';
import UpdateNotification from './components/UpdateNotification';
import DonateModal from './components/DonateModal';
import OnboardingWizard from './components/OnboardingWizard';

function App() {
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState(null);
  const [oauthLoginError, setOAuthLoginError] = useState(null); // error from provider redirect
  
  // Debug: Track user state changes
  useEffect(() => {
    console.log('?? DEBUG - User state changed:', user);
    console.log('?? DEBUG - User role:', user?.role);
    console.log('?? DEBUG - Is admin?', user?.role === 'admin');
  }, [user]);
  
  const isElectronApp = typeof window !== 'undefined' && !!(window.electron?.vpn || window.nebulaVPN?.vpn);
  const buildProtectionState = useCallback((overrides = {}) => ({
    platform: isElectronApp ? 'electron' : 'browser',
    state: 'disconnected',
    simulated: false,
    tunnelVerified: false,
    verificationMethod: null,
    verifiedAt: null,
    detail: null,
    ...overrides,
  }), [isElectronApp]);
  const [isConnected, setIsConnected] = useState(false);
  const [protectionState, setProtectionState] = useState(() => buildProtectionState());
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
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [settings, setSettings] = useState({
    autoConnect: false,
    killSwitch: true,
    advancedKillSwitch: false,
    protocol: 'wireguard',
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

  // Enhanced server data with multi-hop capabilities - 40+ locations across 30+ countries
  const allServers = [
    // North America
    { id: '1',  name: 'US East',          location: 'New York',      ping: '25ms',  load: 45, country: 'US', flag: 'US', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '2',  name: 'US West',          location: 'Los Angeles',   ping: '18ms',  load: 32, country: 'US', flag: 'US', purpose: 'streaming', streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '3',  name: 'US Central',       location: 'Chicago',       ping: '22ms',  load: 41, country: 'US', flag: 'US', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '4',  name: 'US P2P',           location: 'Dallas',        ping: '28ms',  load: 38, country: 'US', flag: 'US', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '5',  name: 'Canada East',      location: 'Toronto',       ping: '30ms',  load: 56, country: 'CA', flag: 'CA', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '6',  name: 'Canada West',      location: 'Vancouver',     ping: '35ms',  load: 29, country: 'CA', flag: 'CA', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '7',  name: 'Mexico',           location: 'Mexico City',   ping: '55ms',  load: 22, country: 'MX', flag: 'MX', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // Europe
    { id: '8',  name: 'Germany',          location: 'Frankfurt',     ping: '45ms',  load: 67, country: 'DE', flag: 'DE', purpose: 'general',   streaming: true,  gaming: false, p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '9',  name: 'UK Streaming',     location: 'London',        ping: '55ms',  load: 78, country: 'GB', flag: 'GB', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '10', name: 'UK General',       location: 'Manchester',    ping: '58ms',  load: 44, country: 'GB', flag: 'GB', purpose: 'general',   streaming: true,  gaming: true,  p2p: true,  multiHopSupport: true,  specialty: null },
    { id: '11', name: 'Netherlands P2P',  location: 'Amsterdam',     ping: '50ms',  load: 42, country: 'NL', flag: 'NL', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '12', name: 'France',           location: 'Paris',         ping: '48ms',  load: 65, country: 'FR', flag: 'FR', purpose: 'streaming', streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '13', name: 'Switzerland',      location: 'Zurich',        ping: '52ms',  load: 31, country: 'CH', flag: 'CH', purpose: 'general',   streaming: true,  gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'privacy' },
    { id: '14', name: 'Sweden',           location: 'Stockholm',     ping: '60ms',  load: 27, country: 'SE', flag: 'SE', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '15', name: 'Norway',           location: 'Oslo',          ping: '62ms',  load: 19, country: 'NO', flag: 'NO', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '16', name: 'Spain',            location: 'Madrid',        ping: '58ms',  load: 48, country: 'ES', flag: 'ES', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: true,  specialty: 'streaming' },
    { id: '17', name: 'Italy',            location: 'Milan',         ping: '55ms',  load: 53, country: 'IT', flag: 'IT', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '18', name: 'Poland',           location: 'Warsaw',        ping: '65ms',  load: 35, country: 'PL', flag: 'PL', purpose: 'general',   streaming: false, gaming: true,  p2p: false, multiHopSupport: true,  specialty: null },
    { id: '19', name: 'Romania',          location: 'Bucharest',     ping: '70ms',  load: 28, country: 'RO', flag: 'RO', purpose: 'p2p',       streaming: false, gaming: false, p2p: true,  multiHopSupport: true,  specialty: 'p2p' },
    { id: '20', name: 'Iceland',          location: 'Reykjavik',     ping: '75ms',  load: 12, country: 'IS', flag: 'IS', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: true,  specialty: 'privacy' },
    { id: '21', name: 'Austria',          location: 'Vienna',        ping: '53ms',  load: 40, country: 'AT', flag: 'AT', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '22', name: 'Belgium',          location: 'Brussels',      ping: '52ms',  load: 37, country: 'BE', flag: 'BE', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: true,  specialty: null },
    // Asia Pacific
    { id: '23', name: 'Singapore',        location: 'Singapore',     ping: '120ms', load: 23, country: 'SG', flag: 'SG', purpose: 'gaming',    streaming: false, gaming: true,  p2p: false, multiHopSupport: false, specialty: 'gaming' },
    { id: '24', name: 'Japan Gaming',     location: 'Tokyo',         ping: '140ms', load: 89, country: 'JP', flag: 'JP', purpose: 'gaming',    streaming: false, gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'gaming' },
    { id: '25', name: 'Japan Streaming',  location: 'Osaka',         ping: '145ms', load: 55, country: 'JP', flag: 'JP', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: 'streaming' },
    { id: '26', name: 'South Korea',      location: 'Seoul',         ping: '150ms', load: 47, country: 'KR', flag: 'KR', purpose: 'gaming',    streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: 'gaming' },
    { id: '27', name: 'Australia',        location: 'Sydney',        ping: '180ms', load: 34, country: 'AU', flag: 'AU', purpose: 'general',   streaming: true,  gaming: false, p2p: true,  multiHopSupport: false, specialty: null },
    { id: '28', name: 'Australia East',   location: 'Melbourne',     ping: '185ms', load: 26, country: 'AU', flag: 'AU', purpose: 'streaming', streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: 'streaming' },
    { id: '29', name: 'India',            location: 'Mumbai',        ping: '130ms', load: 61, country: 'IN', flag: 'IN', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '30', name: 'Hong Kong',        location: 'Hong Kong',     ping: '135ms', load: 72, country: 'HK', flag: 'HK', purpose: 'general',   streaming: true,  gaming: true,  p2p: false, multiHopSupport: true,  specialty: null },
    { id: '31', name: 'New Zealand',      location: 'Auckland',      ping: '200ms', load: 18, country: 'NZ', flag: 'NZ', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // Middle East & Africa
    { id: '32', name: 'UAE',              location: 'Dubai',         ping: '110ms', load: 44, country: 'AE', flag: 'AE', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '33', name: 'Israel',           location: 'Tel Aviv',      ping: '95ms',  load: 33, country: 'IL', flag: 'IL', purpose: 'general',   streaming: true,  gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '34', name: 'South Africa',     location: 'Johannesburg',  ping: '160ms', load: 29, country: 'ZA', flag: 'ZA', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // South America
    { id: '35', name: 'Brazil',           location: 'Sao Paulo',     ping: '95ms',  load: 52, country: 'BR', flag: 'BR', purpose: 'general',   streaming: true,  gaming: true,  p2p: false, multiHopSupport: false, specialty: null },
    { id: '36', name: 'Argentina',        location: 'Buenos Aires',  ping: '110ms', load: 38, country: 'AR', flag: 'AR', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    { id: '37', name: 'Chile',            location: 'Santiago',      ping: '115ms', load: 21, country: 'CL', flag: 'CL', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: null },
    // Specialty / Privacy
    { id: '38', name: 'Tor over VPN',     location: 'Special',       ping: '350ms', load: 15, country: 'XX', flag: 'XX', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: 'tor' },
    { id: '39', name: 'Double VPN',       location: 'NL -> US',      ping: '80ms',  load: 20, country: 'XX', flag: 'XX', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: true,  specialty: 'double' },
    { id: '40', name: 'Obfuscated US',    location: 'New York',      ping: '35ms',  load: 30, country: 'US', flag: 'US', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: 'obfuscated' },
    { id: '41', name: 'Obfuscated EU',    location: 'Amsterdam',     ping: '60ms',  load: 25, country: 'NL', flag: 'NL', purpose: 'general',   streaming: false, gaming: false, p2p: false, multiHopSupport: false, specialty: 'obfuscated' },
  ];

  // Live server metrics fetched from /api/servers (ping ms + load %).
  // Keyed by server id. Merges on top of the static allServers array.
  const [serverLiveMetrics, setServerLiveMetrics] = useState({});
  const [isRefreshingServers, setIsRefreshingServers] = useState(false);

  // Admin gets unrestricted access; all others are gated by their plan
  const effectivePlan = user?.role === 'admin' ? 'admin' : currentPlan;

  // Merge live metrics (ping/load from API) on top of static server definitions
  const liveMergedServers = Object.keys(serverLiveMetrics).length > 0
    ? allServers.map(s => ({
        ...s,
        ...(serverLiveMetrics[s.id] || {}),
      }))
    : allServers;

  // Filter servers based on effective plan
  const servers = getAllowedServers(effectivePlan, liveMergedServers);

  // Fetch live server ping/load from the API and merge into allServers
  const fetchLiveServerData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshingServers(true);
    try {
      const data = await apiService.getServers();
      if (data?.servers) {
        const map = {};
        data.servers.forEach(s => {
          map[s.id] = { ping: s.ping, load: s.load };
        });
        setServerLiveMetrics(map);
      }
    } catch {
      // Silently fall back to static data
    } finally {
      setIsRefreshingServers(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLiveServerData();
    const interval = setInterval(fetchLiveServerData, 60_000);
    return () => clearInterval(interval);
  }, [fetchLiveServerData]);

  // Debug IPC communication on startup
  useEffect(() => {
    const electronAPI = window.electron || window.nebulaVPN;
    if (electronAPI && electronAPI.ipc) {
      console.log('?? APP.JS - Testing electron/nebulaVPN API on startup...');
      // Test simple IPC methods
      electronAPI.ipc.test().then(result => {
        console.log('?? APP.JS - test() result:', result);
      }).catch(error => {
        console.log('?? APP.JS - test() error:', error);
      });
      
      electronAPI.ipc.ping().then(result => {
        console.log('?? APP.JS - ping() result:', result);
      }).catch(error => {
        console.log('?? APP.JS - ping() error:', error);
      });
    } else {
      console.log('?? APP.JS - No electron/nebulaVPN IPC API available');
    }
  }, []);

  // PWA features and service worker registration
  useEffect(() => {
    // Register service worker for PWA - production only.
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
            console.log('? SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('? SW registration failed: ', registrationError);
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

  // Tracks the last-seen cumulative byte counts from wg show transfer / API
  const prevTrafficBytesRef = useRef({ download: 0, upload: 0 });

  // Timer for connection duration
  useEffect(() => {
    let interval;
    if (isConnected) {
      // Reset byte reference so the first delta isn't inflated
      prevTrafficBytesRef.current = { download: 0, upload: 0 };
      interval = setInterval(async () => {
        setConnectionTime(prev => prev + 1);
        // Read real rx/tx bytes from WireGuard (Electron) or backend API (browser)
        try {
          const stats = await apiService.getTrafficStats();
          const dlBytes = stats.download || 0;
          const ulBytes = stats.upload || 0;
          const dlDelta = Math.max(0, dlBytes - prevTrafficBytesRef.current.download);
          const ulDelta = Math.max(0, ulBytes - prevTrafficBytesRef.current.upload);
          prevTrafficBytesRef.current = { download: dlBytes, upload: ulBytes };
          // Convert byte-delta-per-second to KB/s
          const dlKbps = dlDelta / 1024;
          const ulKbps = ulDelta / 1024;
          setTrafficData(prev => ({
            download: dlKbps,
            upload: ulKbps,
            totalDownload: prev.totalDownload + dlKbps,
            totalUpload: prev.totalUpload + ulKbps,
          }));
        } catch {
          // Leave previous traffic values unchanged on transient error
        }
      }, 1000);
    } else {
      prevTrafficBytesRef.current = { download: 0, upload: 0 };
      setConnectionTime(0);
      setTrafficData({ download: 0, upload: 0, totalDownload: 0, totalUpload: 0 });
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // Update Electron system tray when VPN status changes
  useEffect(() => {
    if (window.electron?.isElectron) {
      const status = {
        connected: isConnected && protectionState.tunnelVerified,
        server: selectedServer?.name || (multiHopServers.length > 0 ? multiHopServers.map(s => s.name).join(' ? ') : 'Unknown')
      };
      
      // Send status to Electron main process
      const statusEvent = new CustomEvent('vpn-status-changed', { detail: status });
      window.dispatchEvent(statusEvent);
      
      // Update tray tooltip via IPC
      const electronAPI = window.electron || window.nebulaVPN;
      if (electronAPI && electronAPI.vpn && typeof electronAPI.vpn.updateStatus === 'function') {
        electronAPI.vpn.updateStatus(status);
      }
    }
  }, [isConnected, multiHopServers, protectionState.tunnelVerified, selectedServer]);

  // Advanced Kill Switch monitoring
  useEffect(() => {
    if (settings.advancedKillSwitch && isConnected && isElectronApp) {
      const monitorConnection = setInterval(async () => {
        try {
          const status = await apiService.getVPNStatus();
          if (!status.connected) {
            const token = localStorage.getItem('token') || '';
            const electronAPI = window.electron || window.nebulaVPN;
            await electronAPI?.vpn?.disconnect?.({ token }).catch(() => {});
            setIsConnected(false);
            setProtectionState(buildProtectionState({
              state: 'error',
              detail: 'Server no longer reports this peer as active',
            }));
            setKillSwitchActive(true);
            addLog('Server-side peer state was lost. Local tunnel status cleared and Kill Switch activated.', 'error');
            setTimeout(() => {
              setKillSwitchActive(false);
              addLog('Kill Switch deactivated after reconnect', 'success');
            }, 3000);
          }
        } catch {
          // Network error during health check - do nothing; offline handler covers this
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(monitorConnection);
    }
  }, [buildProtectionState, isConnected, isElectronApp, settings.advancedKillSwitch]);

  // -- Restore all saveable preferences for a user ------------------------
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
      
      // Enhanced server restoration with debugging
      if (prefs.selectedServerId) {
        console.log('Restoring server with ID:', prefs.selectedServerId, 'Type:', typeof prefs.selectedServerId);
        const srv = serverList.find(s => s.id === prefs.selectedServerId);
        console.log('Found server:', srv);
        if (srv) {
          setSelectedServer(srv);
          console.log('Selected server set to:', srv.name);
        } else {
          console.warn('Server not found for ID:', prefs.selectedServerId);
          // Try to find the server with string comparison just in case
          const srvString = serverList.find(s => String(s.id) === String(prefs.selectedServerId));
          if (srvString) {
            setSelectedServer(srvString);
            console.log('Selected server set via string match:', srvString.name);
          }
        }
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

  // -- OAuth redirect callback - store token before session restore runs ------
  // After a provider sign-in the backend redirects here with ?_oauthToken=<JWT>.
  // We store it in localStorage and clean the URL; the session-restore effect
  // below will pick it up and call verifyToken() as normal.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('_oauthToken');
    const oauthError = params.get('oauth_error');

    if (oauthToken) {
      // Store for session restore - clean token from visible URL immediately
      localStorage.setItem('token', oauthToken);
      apiService.token = oauthToken;
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthError) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const messages = {
        google_not_configured:    'Google sign-in is not yet configured on the server.',
        microsoft_not_configured: 'Microsoft sign-in is not yet configured on the server.',
        apple_not_configured:     'Apple sign-in is not yet configured on the server.',
        state_mismatch:           'Sign-in session expired. Please try again.',
        auth_failed:              'Social sign-in failed. Please try again or use email login.',
      };
      console.error('OAuth error:', oauthError);
      setOAuthLoginError(messages[oauthError] || 'Sign-in failed. Please try again.');
      window.__oauthError = messages[oauthError] || 'Sign-in failed. Please try again.';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Restore session from token on first mount ------------------------------
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    apiService.verifyToken()
      .then(data => {
        const u = data.user;
        // Update session cache with freshly-verified role+plan
        localStorage.setItem(`nebula_session_${u.email}`, JSON.stringify({
          role: u.role || 'user',
          plan: u.plan || 'free',
        }));
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
        
        // Always prioritize localStorage preferences for selectedServer if server prefs are incomplete
        const serverPrefs = u.settings || {};
        const localPrefs = loadPrefs(u.email);
        
        // If server preferences don't have selectedServerId but localStorage does, merge them
        if (!serverPrefs.selectedServerId && localPrefs && localPrefs.selectedServerId) {
          serverPrefs.selectedServerId = localPrefs.selectedServerId;
        }
        
        restorePrefs(serverPrefs, localPrefs, allServers);
      })
      .catch(() => {
        // Token invalid or expired - clear it so login screen shows
        localStorage.removeItem('token');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Ensure selectedServer state stays in sync with localStorage -------------
  useEffect(() => {
    // Skip if we're currently restoring preferences to avoid conflicts
    if (isRestoringPrefs.current) return;
    
    // Only run this if user is authenticated and has an email
    if (!user?.email || allServers.length === 0) return;
    
    // If selectedServer is null but localStorage has a selection, restore it
    if (!selectedServer) {
      const localPrefs = loadPrefs(user.email);
      if (localPrefs && localPrefs.selectedServerId) {
        console.log('?? Syncing selectedServer from localStorage:', localPrefs.selectedServerId);
        
        // First try exact match
        let srv = allServers.find(s => s.id === localPrefs.selectedServerId);
        
        // Fallback: try string comparison (same logic as restorePrefs)
        if (!srv) {
          console.log('?? Trying string fallback comparison');
          srv = allServers.find(s => String(s.id) === String(localPrefs.selectedServerId));
        }
        
        if (srv) {
          console.log('? Restoring selectedServer:', srv.name, 'ID:', srv.id);
          setSelectedServer(srv);
        } else {
          console.warn('? Server not found for ID:', localPrefs.selectedServerId, 'Available servers:', allServers.map(s => s.id).slice(0, 5));
        }
      }
    }
  }, [selectedServer, user?.email, allServers]);

  // -- Debug selectedServer state changes ----------------------------------
  useEffect(() => {
    console.log('selectedServer state changed:', selectedServer);
    if (selectedServer) {
      console.log('Server details:', { id: selectedServer.id, name: selectedServer.name });
    } else {
      console.log('selectedServer is null/undefined');
      // Try to restore from localStorage if still null
      if (user?.email) {
        const prefs = loadPrefs(user.email);
        if (prefs && prefs.selectedServerId) {
          console.log('Attempting fallback restore for server ID:', prefs.selectedServerId);
          const srv = allServers.find(s => s.id === prefs.selectedServerId);
          if (srv && !isRestoringPrefs.current) {
            console.log('Fallback restore setting server:', srv.name);
            setSelectedServer(srv);
          }
        }
      }
    }
  }, [selectedServer, user?.email, allServers]);

  // -- Auto-save preferences whenever they change -----------------------------
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
    console.log('?? Splash screen completed, transitioning to login...');
    console.log('Current state - showSplashScreen:', showSplashScreen, 'isAuthenticated:', isAuthenticated);
    setShowSplashScreen(false);
    console.log('State updated - showSplashScreen should now be false');
  };

  // Helper: read the last successfully-verified role+plan for a given email.
  // Written after every server-verified login so offline mode inherits real privileges.
  const readSessionCache = (email) => {
    try {
      return JSON.parse(localStorage.getItem(`nebula_session_${email}`) || '{}');
    } catch {
      return {};
    }
  };

  const handleLogin = async (credentials) => {
    console.log('?? Login form submitted, authenticating...');
    try {
      const data = await apiService.login(credentials.email, credentials.password);
      console.log('?? DEBUG - Login response data:', data);
      const u = data.user;
      console.log('?? DEBUG - User object from response:', u);
      console.log('?? DEBUG - User role:', u.role);
      console.log('?? DEBUG - User plan:', u.plan);
      // Cache role+plan so offline mode can restore them for this account
      localStorage.setItem(`nebula_session_${u.email}`, JSON.stringify({
        role: u.role || 'user',
        plan: u.plan || 'free',
      }));
      const userObj = {
        email: u.email,
        plan: u.plan || 'free',
        role: u.role || 'user',
        firstName: u.name ? u.name.split(' ')[0] : u.email.split('@')[0],
        lastName: u.name ? u.name.split(' ').slice(1).join(' ') : '',
        verified: true
      };
      console.log('?? DEBUG - Setting user state to:', userObj);
      setUser(userObj);
      setCurrentPlan(u.plan || 'free');
      setIsAuthenticated(true);
      setShowSignup(false);
      // Restore saved preferences: server is canonical, localStorage is fallback
      restorePrefs(u.settings || {}, loadPrefs(u.email), allServers);
      console.log('? Authentication successful (backend)');
      addLog('User logged in successfully', 'success');
    } catch (err) {
      // err.status is set for HTTP errors (auth failure, validation, etc.)
      // A missing status means a network/fetch error - server is truly unreachable
      if (err.status) {
        // Real auth error (401, 400, 429, -) - do NOT log the user in
        console.warn('?? Login rejected by server:', err.message);
        addLog(`Login failed: ${err.message}`, 'error');
        throw err;  // re-throw so LoginForm can display the error message
      }

      // Network error - server offline, use offline mode
      console.warn('?? Backend unreachable, using offline mode:', err.message);
      addLog('Server unreachable - running in offline mode', 'warning');

      // Still enforce basic offline credentials: reject obviously wrong attempts
      if (!credentials.password) {
        throw new Error('Password is required');
      }

      // Restore last known role+plan from cache so admin keeps their access level
      const cached = readSessionCache(credentials.email);
      const offlineRole = cached.role || 'user';
      const offlinePlan = cached.plan || 'free';
      setUser({
        email: credentials.email,
        plan: offlinePlan,
        role: offlineRole,
        firstName: credentials.email.split('@')[0],
        lastName: '',
        verified: true
      });
      setCurrentPlan(offlinePlan);
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
    console.log('?? New user signup:', userData);
    const signupRole = userData.role || 'user';
    const signupPlan = userData.plan || 'free';
    // Cache role+plan so offline mode inherits them
    if (userData.email) {
      localStorage.setItem(`nebula_session_${userData.email}`, JSON.stringify({
        role: signupRole,
        plan: signupPlan,
      }));
    }
    // Create user from signup data
    setUser({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: signupRole,
      plan: signupPlan,
      country: userData.country,
      verified: userData.verified,
      createdAt: userData.createdAt
    });
    setCurrentPlan(signupPlan);
    setIsAuthenticated(true);
    setShowSignup(false);
    console.log('? Account created successfully!');
    addLog('New account created and verified', 'success');

    // Show onboarding wizard for first-time users
    const onboardingKey = `nebula_onboarding_done_${userData.email}`;
    if (!localStorage.getItem(onboardingKey)) {
      setShowOnboarding(true);
    } else if (userData.plan === 'free') {
      // Returning user - show subscription nudge as before
      setTimeout(() => setShowSubscriptionModal(true), 3000);
    }
  };

  const handleOnboardingComplete = (choices) => {
    // Mark wizard as seen for this user so it never shows again
    if (user?.email) {
      localStorage.setItem(`nebula_onboarding_done_${user.email}`, '1');
    }
    // Apply wizard choices to app settings
    setSettings(prev => ({
      ...prev,
      ...(choices.protocol ? { protocol: choices.protocol } : {}),
      ...(choices.killSwitch !== undefined ? { killSwitch: choices.killSwitch } : {}),
    }));
    if (choices.server) setSelectedServer(choices.server);
    setShowOnboarding(false);
    // Show subscription modal for free users after a short delay
    if (currentPlan === 'free') {
      setTimeout(() => setShowSubscriptionModal(true), 2000);
    }
  };

  const handleLogout = async () => {
    // Revoke token server-side (best-effort) then clear local state
    await apiService.logout().catch(() => {});
    // Clear session cache on explicit logout so cached role doesn't persist
    if (user?.email) {
      localStorage.removeItem(`nebula_session_${user.email}`);
    }
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
    console.log(`?? Social auth: ${provider}`, profile.email);
    try {
      const data = await apiService.oauthLogin(provider, profile);
      const u = data.user;
      // Cache role+plan so offline mode can restore them
      localStorage.setItem(`nebula_session_${u.email}`, JSON.stringify({
        role: u.role || 'user',
        plan: u.plan || 'free',
      }));
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
      console.log(`? ${provider} authentication successful`);
      addLog(`Signed in with ${provider}`, 'success');
      if (data.isNewUser && (u.plan || 'free') === 'free') {
        setTimeout(() => setShowSubscriptionModal(true), 3000);
      }
    } catch (err) {
      if (err.status) {
        console.warn(`?? ${provider} auth rejected:`, err.message);
        addLog(`${provider} sign-in failed: ${err.message}`, 'error');
        throw err;
      }
      // Network unavailable - fall back to offline mode using last known role+plan
      console.warn('?? Backend unreachable, using offline mode for social auth');
      addLog('Server unreachable - running in offline mode', 'warning');
      const cached = readSessionCache(profile.email);
      const offlineRole = cached.role || 'user';
      const offlinePlan = cached.plan || 'free';
      setUser({
        email: profile.email,
        plan: offlinePlan,
        role: offlineRole,
        firstName: profile.name ? profile.name.split(' ')[0] : profile.email.split('@')[0],
        lastName: profile.name ? profile.name.split(' ').slice(1).join(' ') : '',
        verified: true
      });
      setCurrentPlan(offlinePlan);
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
    console.log('?? Connect button clicked! Current state:', { 
      isConnected, 
      selectedServer: selectedServer?.name, 
      multiHopServers: multiHopServers.length,
      hasElectronAPI: !!window.electron?.vpn,
      hasNebulaVPNAPI: !!window.nebulaVPN?.vpn,
      hasElectronConnectFunction: typeof window.electron?.vpn?.connect === 'function',
      hasNebulaVPNConnectFunction: typeof window.nebulaVPN?.vpn?.connect === 'function'
    });
    
    if (!selectedServer && !isConnected && multiHopServers.length === 0) {
      alert('Please select a server or configure multi-hop connection first');
      return;
    }

    setIsConnecting(true);
    
    if (multiHopServers.length > 0) {
      const serverNames = multiHopServers.map(s => s.name).join(' ? ');
      addLog(`${isConnected ? 'Disconnecting from' : 'Connecting to'} multi-hop chain: ${serverNames}`, 'info');
    } else {
      addLog(`${isConnected ? 'Disconnecting from' : 'Connecting to'} ${selectedServer?.name || 'server'}`, 'info');
    }
    
    // Use Electron IPC when running in the desktop app; fall back to simulation in browser
    // Detect Electron context by checking for the electron API, not just protocol
    const electronAPI = window.electron || window.nebulaVPN;
    const isElectronCtx = typeof window !== 'undefined' && 
                         !!electronAPI?.vpn &&
                         typeof electronAPI.vpn.connect === 'function';
                         
    console.log('?? Electron context detection:', {
      windowExists: typeof window !== 'undefined',
      hasElectron: !!window.electron,
      hasNebulaVPN: !!window.nebulaVPN,
      electronAPI: !!electronAPI,
      hasVpnAPI: !!electronAPI?.vpn,
      hasConnectFunction: typeof electronAPI?.vpn?.connect === 'function',
      isElectronCtx,
      token: localStorage.getItem('token') ? 'exists' : 'missing',
      // DETAILED DEBUGGING:
      electronObject: window.electron || 'undefined',
      nebulaVPNObject: window.nebulaVPN || 'undefined',
      electronAPI: electronAPI || 'undefined',
      hasElectronPreload: !!window.electron?.DEBUG_PRELOAD_LOADED,
      hasNebulaVPNPreload: !!window.nebulaVPN?.minimal,
      preloadDebug: window.electron?.DEBUG_PRELOAD_LOADED || 'not present',
      preloadTime: window.electron?.DEBUG_TIMESTAMP || 'not present'
    });
                         
    // Only consider it a browser if we don't have Electron APIs available
    const isInBrowser = !isElectronCtx;

    if (isElectronCtx) {
      console.log('?? Using Electron VPN mode');
      setProtectionState(buildProtectionState({ state: 'connecting', detail: 'Waiting for WireGuard handshake verification' }));
      try {
        const token = localStorage.getItem('token') || '';
        console.log('?? Token available:', !!token, 'length:', token.length);
        
        if (isConnected) {
          console.log('?? Disconnecting...');
          await electronAPI.vpn.disconnect({ token });
          setIsConnected(false);
          setProtectionState(buildProtectionState());
          setIsConnecting(false);
          addLog('Disconnected from VPN', 'warning');
          if (settings.advancedKillSwitch) {
            setKillSwitchActive(true);
            addLog('Advanced Kill Switch activated after disconnect', 'warning');
          }
        } else if (multiHopServers.length > 0) {
          console.log('?? Multi-hop connection...', multiHopServers.map(s => s.name));
          const result = await electronAPI.vpn.multiHopConnect({
            serverIds:  multiHopServers.map(s => String(s.id)),
            protocol:   settings.protocol || 'wireguard',
            token,
            killSwitch: !!settings.advancedKillSwitch,
          });
          console.log('?? Multi-hop result:', result);
          if (result?.success === false) throw new Error(result.error || 'Multi-hop connection failed');
          setKillSwitchActive(false);
          setIsConnected(true);
          setProtectionState(buildProtectionState({
            state: result?.tunnelVerified ? 'verified' : 'connected',
            tunnelVerified: !!result?.tunnelVerified,
            verificationMethod: result?.verificationMethod || null,
            verifiedAt: result?.verification?.lastHandshakeAt || null,
            detail: result?.tunnelVerified
              ? 'WireGuard handshake verified in Electron'
              : 'Connected without handshake proof',
          }));
          setIsConnecting(false);
          addLog(`WireGuard handshake verified via multi-hop: ${multiHopServers.map(s => s.name).join(' ? ')}`, 'success');
        } else {
          console.log('?? Single server connection...', selectedServer.name, 'ID:', selectedServer.id);
          const result = await electronAPI.vpn.connect({
            serverId:   String(selectedServer.id),
            protocol:   settings.protocol || 'wireguard',
            token,
            killSwitch: !!settings.advancedKillSwitch,
          });
          console.log('?? Connection result:', result);
          if (result?.success === false) throw new Error(result.error || 'Connection failed');
          setKillSwitchActive(false);
          setIsConnected(true);
          setProtectionState(buildProtectionState({
            state: result?.tunnelVerified ? 'verified' : 'connected',
            tunnelVerified: !!result?.tunnelVerified,
            verificationMethod: result?.verificationMethod || null,
            verifiedAt: result?.verification?.lastHandshakeAt || null,
            detail: result?.tunnelVerified
              ? 'WireGuard handshake verified in Electron'
              : 'Connected without handshake proof',
          }));
          setIsConnecting(false);
          addLog(`WireGuard handshake verified. Connected to ${selectedServer.name}`, 'success');
        }
      } catch (err) {
        console.error('?? VPN connection error:', err);
        setIsConnected(false);
        setProtectionState(buildProtectionState({ state: 'error', detail: err.message }));
        setIsConnecting(false);
        addLog(`Connection error: ${err.message}`, 'error');
      }
      return;
    }

    // ============================================
    // Browser Mode: Use Backend API
    // ============================================
    console.log('?? Using browser API mode - connecting to backend');
    setProtectionState(buildProtectionState({ 
      state: 'connecting', 
      detail: 'Connecting via backend API' 
    }));

    try {
      if (isConnected) {
        // Disconnect
        console.log('?? API disconnect...');
        await apiService.disconnectVPN();
        setIsConnected(false);
        setProtectionState(buildProtectionState());
        setIsConnecting(false);
        addLog('Disconnected from VPN', 'warning');
        if (settings.advancedKillSwitch) {
          setKillSwitchActive(true);
          addLog('Advanced Kill Switch activated after disconnect', 'warning');
        }
      } else if (multiHopServers.length > 0) {
        // Multi-hop connection via API
        console.log('🔗 API multi-hop connection...', multiHopServers.map(s => s.name));
        const result = await apiService.multiHopConnect(multiHopServers.map(s => String(s.id)));
        console.log('🔗 API multi-hop result:', result);
        setKillSwitchActive(false);
        setIsConnected(true);
        
        // Verify the multi-hop connection through the API
        try {
          const statusCheck = await apiService.getVPNStatus();
          console.log('🔗 API multi-hop status check:', statusCheck);
          const isVerified = statusCheck?.connected === true;
          const serverChain = multiHopServers.map(s => s.name).join(' -> ');
          
          setProtectionState(buildProtectionState({
            state: isVerified ? 'verified' : 'connected',
            tunnelVerified: isVerified,
            verificationMethod: isVerified ? 'api-status-check' : null,
            verifiedAt: isVerified ? new Date().toISOString() : null,
            detail: isVerified 
              ? `Server-side multi-hop tunnel verified via API: ${serverChain}`
              : `Connected via API: ${serverChain}`,
          }));
          
          setIsConnecting(false);
          
          if (isVerified) {
            addLog(`Server-side multi-hop VPN tunnel verified: ${serverChain}`, 'success');
          } else {
            addLog(`Connected to multi-hop chain via API: ${serverChain} (verification pending)`, 'success');
          }
        } catch (verifyErr) {
          console.warn('🔗 API multi-hop verification check failed:', verifyErr);
          setProtectionState(buildProtectionState({
            state: 'connected',
            detail: `Connected via API: ${multiHopServers.map(s => s.name).join(' -> ')} (verification unavailable)`,
          }));
          setIsConnecting(false);
          addLog(`Connected to multi-hop chain via API: ${multiHopServers.map(s => s.name).join(' -> ')}`, 'success');
        }
      } else {
        // Single server connection via API
        console.log('🔗 API single server connection...', selectedServer.name, 'ID:', selectedServer.id);
        const result = await apiService.connectVPN(
          String(selectedServer.id),
          settings.protocol || 'wireguard',
          !!settings.advancedKillSwitch
        );
        console.log('🔗 API connection result:', result);
        setKillSwitchActive(false);
        setIsConnected(true);
        
        // Verify the connection through the API
        try {
          const statusCheck = await apiService.getVPNStatus();
          console.log('🔗 API status check:', statusCheck);
          const isVerified = statusCheck?.connected === true;
          
          setProtectionState(buildProtectionState({
            state: isVerified ? 'verified' : 'connected',
            tunnelVerified: isVerified,
            verificationMethod: isVerified ? 'api-status-check' : null,
            verifiedAt: isVerified ? new Date().toISOString() : null,
            detail: isVerified 
              ? `Server-side tunnel verified via API to ${selectedServer.name}`
              : `Connected via API to ${selectedServer.name}`,
          }));
          
          setIsConnecting(false);
          
          if (isVerified) {
            addLog(`Server-side VPN tunnel verified. Connected to ${selectedServer.name}`, 'success');
          } else {
            addLog(`Connected to ${selectedServer.name} via API (verification pending)`, 'success');
          }
        } catch (verifyErr) {
          console.warn('🔗 API verification check failed:', verifyErr);
          setProtectionState(buildProtectionState({
            state: 'connected',
            detail: `Connected via API to ${selectedServer.name} (verification unavailable)`,
          }));
          setIsConnecting(false);
          addLog(`Connected to ${selectedServer.name} via API`, 'success');
        }
      }
    } catch (err) {
      console.error('?? API VPN connection error:', err);
      setIsConnected(false);
      setProtectionState(buildProtectionState({ state: 'error', detail: err.message }));
      setIsConnecting(false);
      addLog(`Connection error: ${err.message}`, 'error');
    }
  };

  const handleDisconnect = async () => {
    handleToggleConnection(); // Toggle connection state
  };

  const handleServerSelect = (server) => {
    if (!isConnected) {
      setSelectedServer(server);
      setMultiHopServers([]); // Clear multi-hop when selecting single server
      addLog(`Selected server: ${server.name} (${server.location})`, 'info');
      
      // Save server selection to localStorage
      if (user?.email) {
        const currentPrefs = loadPrefs(user.email) || {};
        savePrefs(user.email, {
          ...currentPrefs,
          selectedServerId: server.id
        });
        console.log('? Saved server selection to localStorage:', server.id);
      }
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
      addLog(`Multi-hop chain configured: ${servers.map(s => s.name).join(' ? ')}`, 'info');
    }
  };

  const handleSplitTunnelChange = (apps) => {
    setSplitTunnelApps(apps);
    addLog(`Split tunneling configured for ${apps.length} applications`, 'info');
  };

  // Show splash screen first
  if (showSplashScreen) {
    console.log('?? Rendering splash screen...');
    return <SplashScreen onComplete={handleSplashComplete} isDarkMode={isDarkMode} />;
  }

  if (!isAuthenticated) {
    console.log('?? Rendering login/signup form...');
    
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
        initialError={oauthLoginError}
      />
    );
  }

  console.log('?? Rendering main app...');

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

      {/* Donate Modal */}
      <DonateModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
      />

      {/* Onboarding Wizard - shown to first-time users after signup */}
      {showOnboarding && (
        <OnboardingWizard
          user={user}
          settings={settings}
          servers={servers}
          onComplete={handleOnboardingComplete}
        />
      )}

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
          ?? No internet connection - Check your network
        </div>
      )}
      
      {/* Kill Switch overlay */}
      {killSwitchActive && (
        <div className="kill-switch-overlay">
          <div className="kill-switch-message">
            ??? Kill Switch Active - All traffic blocked for security
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
                ? Upgrade
              </button>
            )}
            {user?.role === 'admin' && (
              <button className="admin-dashboard-btn" onClick={() => setShowAdminDashboard(true)}>
                ?? Admin
              </button>
            )}
            <button className="donate-btn" onClick={() => setShowDonateModal(true)} title="Support Nebula VPN">
              ?? Donate
            </button>
            <button className="admin-btn" onClick={() => setShowAdminPanel(true)}>
              ?? Settings
            </button>
            <button className="theme-toggle" title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleDarkMode}>
              {isDarkMode ? '??' : '??'}
            </button>
            <div className="user-info">
              <div className="user-avatar" title={user.email}>
                {user.email.charAt(0).toUpperCase()}
              </div>
              <span title={user.email}>{user.email.split('@')[0]}</span>
              <span className={`plan-badge ${effectivePlan}`}>{effectivePlan}</span>
              <button className="logout-btn" onClick={handleLogout}>? Out</button>
            </div>
          </div>
        </div>
        <StatusIndicator 
          isConnected={isConnected} 
          selectedServer={selectedServer}
          multiHopServers={multiHopServers}
          connectionTime={connectionTime}
          killSwitchActive={killSwitchActive}
          protectionState={protectionState}
        />
      </header>
      
      <div className="tab-nav-wrapper">
      <nav className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          ?? Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'servers' ? 'active' : ''}`}
          onClick={() => setActiveTab('servers')}
        >
          ?? Servers
        </button>
        {hasFeature(effectivePlan, 'multiHop') && (
          <button 
            className={`tab ${activeTab === 'multihop' ? 'active' : ''}`}
            onClick={() => setActiveTab('multihop')}
          >
            ?? Multi-Hop
          </button>
        )}
        {hasFeature(effectivePlan, 'splitTunneling') && (
          <button 
            className={`tab ${activeTab === 'splittunnel' ? 'active' : ''}`}
            onClick={() => setActiveTab('splittunnel')}
          >
            ?? Split Tunnel
          </button>
        )}
        {hasFeature(effectivePlan, 'trafficAnalytics') && (
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            ?? Analytics
          </button>
        )}
        {hasFeature(effectivePlan, 'threatDetection') && (
          <button 
            className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            ??? Security
            <span className="tab-shield-badge" title="Threat Protection active">?</span>
          </button>
        )}
        {hasFeature(effectivePlan, 'automationRules') && (
          <button 
            className={`tab ${activeTab === 'automation' ? 'active' : ''}`}
            onClick={() => setActiveTab('automation')}
          >
            ?? Automation
          </button>
        )}
        {hasFeature(effectivePlan, 'liveDashboard') && (
          <button 
            className={`tab ${activeTab === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveTab('experience')}
          >
            ? Experience
          </button>
        )}
        {hasFeature(effectivePlan, 'networkTopology') && (
          <button 
            className={`tab ${activeTab === 'enterprise' ? 'active' : ''}`}
            onClick={() => setActiveTab('enterprise')}
          >
            ?? Enterprise
          </button>
        )}
        {hasFeature(effectivePlan, 'aiNetworkOptimizer') && (
          <button 
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            ?? AI/ML
          </button>
        )}
        {hasFeature(effectivePlan, 'collaborativeVPN') && (
          <button 
            className={`tab ${activeTab === 'nextgen' ? 'active' : ''}`}
            onClick={() => setActiveTab('nextgen')}
          >
            ?? Next-Gen
          </button>
        )}
        {hasFeature(effectivePlan, 'mobileOptimizations') && (
          <button 
            className={`tab ${activeTab === 'mobile' ? 'active' : ''}`}
            onClick={() => setActiveTab('mobile')}
          >
            ?? Mobile
          </button>
        )}
        {hasFeature(effectivePlan, 'speedTest') && (
          <button 
            className={`tab ${activeTab === 'speedtest' ? 'active' : ''}`}
            onClick={() => setActiveTab('speedtest')}
          >
            ? Speed Test
          </button>
        )}
        <button 
          className={`tab ${activeTab === 'leaktest' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaktest')}
        >
          ?? Leak Test
        </button>
        <button 
          className={`tab ${activeTab === 'darkweb' ? 'active' : ''}`}
          onClick={() => setActiveTab('darkweb')}
        >
          ??? Dark Web
        </button>
        <button 
          className={`tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          ? Profiles
        </button>
        <button 
          className={`tab ${activeTab === 'traffic' ? 'active' : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          ?? Traffic
        </button>
        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          ?? Logs
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ?? Settings
        </button>
        <button
          className={`tab ${activeTab === 'trust' ? 'active' : ''}`}
          onClick={() => setActiveTab('trust')}
        >
          ??? Trust
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
              isElectron={isElectronApp}
              protectionState={protectionState}
            />
          )}
          
          {activeTab === 'servers' && (
            <div className="server-section">
              <ServerList 
                servers={servers}
                onSelect={handleServerSelect}
                selectedServer={selectedServer}
                isConnected={isConnected}
                onRefresh={fetchLiveServerData}
                isRefreshing={isRefreshingServers}
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
                    ?? Overview
                  </button>
                  <button 
                    className={`analytics-tab ${window.analyticsSubTab === 'performance' ? 'active' : ''}`}
                    onClick={() => { window.analyticsSubTab = 'performance'; setActiveTab('analytics'); }}
                  >
                    ?? Performance
                  </button>
                  <button 
                    className={`analytics-tab ${window.analyticsSubTab === 'history' ? 'active' : ''}`}
                    onClick={() => { window.analyticsSubTab = 'history'; setActiveTab('analytics'); }}
                  >
                    ?? History
                  </button>
                  <button 
                    className={`analytics-tab ${window.analyticsSubTab === 'usage' ? 'active' : ''}`}
                    onClick={() => { window.analyticsSubTab = 'usage'; setActiveTab('analytics'); }}
                  >
                    ?? App Usage
                  </button>
                  <button 
                    className={`analytics-tab ${window.analyticsSubTab === 'map' ? 'active' : ''}`}
                    onClick={() => { window.analyticsSubTab = 'map'; setActiveTab('analytics'); }}
                  >
                    ?? Global Map
                  </button>
                </div>
                
                <div className="analytics-content">
                  {(!window.analyticsSubTab || window.analyticsSubTab === 'overview') && (
                    <TrafficAnalytics 
                      isConnected={isConnected}
                      connectionTime={connectionTime}
                      trafficData={trafficData}
                    />
                  )}
                  {window.analyticsSubTab === 'performance' && (
                    <PerformanceMetrics 
                      isConnected={isConnected}
                      currentServer={selectedServer || (multiHopServers.length > 0 ? multiHopServers[multiHopServers.length - 1] : null)}
                      trafficData={trafficData}
                    />
                  )}
                  {window.analyticsSubTab === 'history' && (
                    <ConnectionHistory />
                  )}
                  {window.analyticsSubTab === 'usage' && (
                    <DataUsageTracker 
                      isConnected={isConnected}
                      trafficData={trafficData}
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
                    onClick={() => { window.securitySubTab = 'protection'; setActiveTab('security'); }}
                  >
                    ? Threat Protection
                  </button>
                  <button 
                    className={`analytics-tab ${window.securitySubTab === 'threats' ? 'active' : ''}`}
                    onClick={() => { window.securitySubTab = 'threats'; setActiveTab('security'); }}
                  >
                    ??? Threat Detection
                  </button>
                  <button 
                    className={`analytics-tab ${window.securitySubTab === 'dns' ? 'active' : ''}`}
                    onClick={() => { window.securitySubTab = 'dns'; setActiveTab('security'); }}
                  >
                    ?? DNS Protection
                  </button>
                  <button 
                    className={`analytics-tab ${window.securitySubTab === 'ipv6' ? 'active' : ''}`}
                    onClick={() => { window.securitySubTab = 'ipv6'; setActiveTab('security'); }}
                  >
                    ?? IPv6 Protection
                  </button>
                  <button 
                    className={`analytics-tab ${window.securitySubTab === 'firewall' ? 'active' : ''}`}
                    onClick={() => { window.securitySubTab = 'firewall'; setActiveTab('security'); }}
                  >
                    ?? Firewall
                  </button>
                  <button 
                    className={`analytics-tab ${window.securitySubTab === 'obfuscation' ? 'active' : ''}`}
                    onClick={() => { window.securitySubTab = 'obfuscation'; setActiveTab('security'); }}
                  >
                    ?? Obfuscation
                  </button>
                  <button 
                    className={`analytics-tab ${window.securitySubTab === '2fa' ? 'active' : ''}`}
                    onClick={() => { window.securitySubTab = '2fa'; setActiveTab('security'); }}
                  >
                    ?? Two-Factor Auth
                  </button>
                </div>
                
                <div className="analytics-content">
                  {(!window.securitySubTab || window.securitySubTab === 'protection') && (
                    <ThreatProtection isConnected={isConnected} />
                  )}

                  {window.securitySubTab === 'threats' && (
                    <ThreatDetection isConnected={isConnected} />
                  )}
                  
                  {window.securitySubTab === 'dns' && (
                    <DNSProtection
                      isConnected={isConnected}
                      isProtectionVerified={protectionState.tunnelVerified}
                      isSimulated={protectionState.simulated}
                    />
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
                    ?? Automation Rules
                  </button>
                  <button 
                    className={`analytics-tab ${window.automationSubTab === 'bandwidth' ? 'active' : ''}`}
                    onClick={() => { window.automationSubTab = 'bandwidth'; setActiveTab('automation'); }}
                  >
                    ?? Bandwidth Scheduler
                  </button>
                  <button 
                    className={`analytics-tab ${window.automationSubTab === 'monitor' ? 'active' : ''}`}
                    onClick={() => { window.automationSubTab = 'monitor'; setActiveTab('automation'); }}
                  >
                    ?? Network Monitor
                  </button>
                  <button 
                    className={`analytics-tab ${window.automationSubTab === 'chaining' ? 'active' : ''}`}
                    onClick={() => { window.automationSubTab = 'chaining'; setActiveTab('automation'); }}
                  >
                    ?? VPN Chaining
                  </button>
                  <button 
                    className={`analytics-tab ${window.automationSubTab === 'audit' ? 'active' : ''}`}
                    onClick={() => { window.automationSubTab = 'audit'; setActiveTab('automation'); }}
                  >
                    ?? Privacy Audit
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
                    <NetworkMonitor isConnected={isConnected} trafficData={trafficData} />
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
                    ?? Customization
                  </button>
                  <button 
                    className={`analytics-tab ${window.experienceSubTab === 'quickactions' ? 'active' : ''}`}
                    onClick={() => { window.experienceSubTab = 'quickactions'; setActiveTab('experience'); }}
                  >
                    ? Quick Actions
                  </button>
                  <button 
                    className={`analytics-tab ${window.experienceSubTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => { window.experienceSubTab = 'notifications'; setActiveTab('experience'); }}
                  >
                    ?? Notifications
                  </button>
                  <button 
                    className={`analytics-tab ${window.experienceSubTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => { window.experienceSubTab = 'sessions'; setActiveTab('experience'); }}
                  >
                    ?? Sessions
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
                  ?? Network Topology
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'compliance' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'compliance'; setActiveTab('enterprise'); }}
                >
                  ?? Compliance
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'integrations' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'integrations'; setActiveTab('enterprise'); }}
                >
                  ?? API Hub
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'analytics'; setActiveTab('enterprise'); }}
                >
                  ?? Analytics
                </button>
                <button 
                  className={`analytics-tab ${window.enterpriseSubTab === 'security' ? 'active' : ''}`}
                  onClick={() => { window.enterpriseSubTab = 'security'; setActiveTab('enterprise'); }}
                >
                  ??? Security Ops
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
                  ?? Network Optimizer
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'security' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'security'; setActiveTab('ai'); }}
                >
                  ?? Predictive Security
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'assistant' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'assistant'; setActiveTab('ai'); }}
                >
                  ?? AI Assistant
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'analytics'; setActiveTab('ai'); }}
                >
                  ?? Smart Analytics
                </button>
                <button 
                  className={`analytics-tab ${window.aiSubTab === 'learning' ? 'active' : ''}`}
                  onClick={() => { window.aiSubTab = 'learning'; setActiveTab('ai'); }}
                >
                  ?? Adaptive Learning
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
                  ?? Collaboration
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'mobile' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'mobile'; setActiveTab('nextgen'); }}
                >
                  ?? Mobile Manager
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'blockchain' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'blockchain'; setActiveTab('nextgen'); }}
                >
                  ?? Blockchain
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'quantum' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'quantum'; setActiveTab('nextgen'); }}
                >
                  ?? Quantum Security
                </button>
                <button 
                  className={`analytics-tab ${window.nextgenSubTab === 'edge' ? 'active' : ''}`}
                  onClick={() => { window.nextgenSubTab = 'edge'; setActiveTab('nextgen'); }}
                >
                  ? Edge Computing
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
            <IPLeakTest
              isConnected={isConnected}
              isProtectionVerified={protectionState.tunnelVerified}
              isSimulated={protectionState.simulated}
            />
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

          {activeTab === 'trust' && (
            <div className="analytics-section">
              <div className="analytics-tabs">
                <button
                  className={`analytics-tab ${!window.trustSubTab || window.trustSubTab === 'canary' ? 'active' : ''}`}
                  onClick={() => { window.trustSubTab = 'canary'; setActiveTab('trust'); }}
                >
                  ??? Warrant Canary
                </button>
                <button
                  className={`analytics-tab ${window.trustSubTab === 'transparency' ? 'active' : ''}`}
                  onClick={() => { window.trustSubTab = 'transparency'; setActiveTab('trust'); }}
                >
                  ??? Transparency Report
                </button>
              </div>
              <div className="analytics-content">
                {(!window.trustSubTab || window.trustSubTab === 'canary') && (
                  <WarrantCanary />
                )}
                {window.trustSubTab === 'transparency' && (
                  <TransparencyReport />
                )}
              </div>
            </div>
          )}
          
          <div className="control-section">
            <ConnectButton 
              isConnected={isConnected}
              onToggle={handleToggleConnection}
              disabled={isConnecting || killSwitchActive}
              connectionState={protectionState.state}
              isElectron={isElectronApp}
            />
            {isConnecting && <div className="connecting-text">Connecting...</div>}
            {killSwitchActive && <div className="kill-switch-text">??? Traffic Blocked</div>}
            
            {multiHopServers.length > 0 ? (
              <div className="selected-server-info multi-hop">
                <span className="connection-type">?? Multi-Hop Chain</span>
                <div className="hop-chain">
                  {multiHopServers.map((server, index) => (
                    <div key={server.id} className="hop-item">
                      <span className="server-flag">{server.flag}</span>
                      <span className="server-name">{server.name}</span>
                      {index < multiHopServers.length - 1 && <span className="hop-arrow">?</span>}
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
              protectionState={protectionState}
            />
          </div>
        </div>
      </main>

      {/* Persistent update banner - renders in Electron only */}
      <UpdateNotification />
    </div>
  );
}

export default App;

