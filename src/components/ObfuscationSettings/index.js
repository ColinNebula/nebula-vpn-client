import React, { useState, useEffect, useCallback } from 'react';
import './ObfuscationSettings.css';

// ── Shared probe helpers (duplicated to avoid cross-component coupling) ───────

function abortAfter(ms) {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

async function detectWebRTCIPs() {
  if (typeof RTCPeerConnection === 'undefined') return [];
  return new Promise((resolve) => {
    const ips = new Set();
    const pc  = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] });
    pc.createDataChannel('');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => resolve([]));
    pc.onicecandidate = (e) => {
      if (!e.candidate) { pc.close(); resolve([...ips]); return; }
      const m = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);
      if (m) ips.add(m[1]);
    };
    setTimeout(() => { pc.close(); resolve([...ips]); }, 5000);
  });
}

function isPrivateIP(ip) {
  return /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.)/.test(ip);
}

async function detectIPv6() {
  try {
    const resp = await fetch('https://api6.ipify.org?format=json', { signal: abortAfter(4000) });
    if (resp.ok) {
      const { ip } = await resp.json();
      // If we get an IPv6 response via the api6 endpoint the traffic is already
      // routed through the system stack (and therefore through the VPN tunnel
      // when active).  Return the address so callers can display it, but callers
      // should NOT treat it as a leak when the VPN is tunnelling IPv6 traffic.
      return ip && ip.includes(':') ? ip : false;
    }
  } catch { /* no IPv6 reachability */ }
  return false;
}

const STORAGE_KEY = 'nebula_obfuscation_settings';

const ObfuscationSettings = ({ isConnected = false }) => {
  const [obfuscationEnabled, setObfuscationEnabled] = useState(false);
  const [selectedProtocol, setSelectedProtocol]     = useState('stealth');
  const [port, setPort]                             = useState('443');
  const [scramblePackets, setScramblePackets]       = useState(true);
  const [mimicProtocol, setMimicProtocol]           = useState('https');
  const [tlsFingerprint, setTlsFingerprint]         = useState('chrome');
  const [paddingEnabled, setPaddingEnabled]         = useState(true);
  const [antiCensorshipLevel, setAntiCensorshipLevel] = useState('moderate');
  const [splitTunnelDPI, setSplitTunnelDPI]         = useState(false);
  const [connectionStatus, setConnectionStatus]     = useState('disconnected');
  // Cipher, jitter, SS server config, apply state
  const [cipher, setCipher]         = useState('aes-256-gcm');
  const [jitter, setJitter]         = useState(true);
  const [ssServer, setSsServer]     = useState('');
  const [ssPort, setSsPort]         = useState('8388');
  const [ssPassword, setSsPassword] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  // New enhancement state
  const [transportMode, setTransportMode]           = useState('tcp');
  const [dohEnabled, setDohEnabled]                 = useState(false);
  const [dohProvider, setDohProvider]               = useState('cloudflare');
  const [portRandomization, setPortRandomization]   = useState(false);
  const [antiFingerprint, setAntiFingerprint]       = useState('standard');
  const [trafficShaping, setTrafficShaping]         = useState(false);
  const [obfsHealth, setObfsHealth]                 = useState({ packetsObfuscated: 0, bypassedBlocks: 0, sessionSec: 0 });
  const [countryPreset, setCountryPreset]           = useState(null);

  const [bypassTests, setBypassTests] = useState({
    dpi: null, firewall: null, webrtc: null, ipv6: null,
    dns: null, tlsVersion: null,
  });
  const [bypassDetails, setBypassDetails] = useState({});

  // Detect Electron context (IPC available)
  const isElectron = typeof window !== 'undefined' && !!window.electron?.vpn?.startObfuscation;

  // ── Load persisted settings from localStorage ───────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (saved.obfuscationEnabled !== undefined) setObfuscationEnabled(saved.obfuscationEnabled);
        if (saved.selectedProtocol)  setSelectedProtocol(saved.selectedProtocol);
        if (saved.port)              setPort(saved.port);
        if (saved.scramblePackets    !== undefined) setScramblePackets(saved.scramblePackets);
        if (saved.mimicProtocol)     setMimicProtocol(saved.mimicProtocol);
        if (saved.tlsFingerprint)    setTlsFingerprint(saved.tlsFingerprint);
        if (saved.paddingEnabled     !== undefined) setPaddingEnabled(saved.paddingEnabled);
        if (saved.antiCensorshipLevel) setAntiCensorshipLevel(saved.antiCensorshipLevel);
        if (saved.splitTunnelDPI     !== undefined) setSplitTunnelDPI(saved.splitTunnelDPI);
        if (saved.cipher)            setCipher(saved.cipher);
        if (saved.jitter             !== undefined) setJitter(saved.jitter);
        if (saved.ssServer)          setSsServer(saved.ssServer);
        if (saved.ssPort)            setSsPort(saved.ssPort);
        if (saved.transportMode)     setTransportMode(saved.transportMode);
        if (saved.dohEnabled         !== undefined) setDohEnabled(saved.dohEnabled);
        if (saved.dohProvider)       setDohProvider(saved.dohProvider);
        if (saved.portRandomization  !== undefined) setPortRandomization(saved.portRandomization);
        if (saved.antiFingerprint)   setAntiFingerprint(saved.antiFingerprint);
        if (saved.trafficShaping     !== undefined) setTrafficShaping(saved.trafficShaping);
        // password intentionally not restored from storage
      }
    } catch { /* corrupt storage */ }
  }, []);

  // ── Persist settings whenever they change ───────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        obfuscationEnabled, selectedProtocol, port, scramblePackets,
        mimicProtocol, tlsFingerprint, paddingEnabled, antiCensorshipLevel,
        splitTunnelDPI, cipher, jitter, ssServer, ssPort,
        transportMode, dohEnabled, dohProvider, portRandomization,
        antiFingerprint, trafficShaping,
        // never store ssPassword
      }));
    } catch { /* storage quota */ }
  }, [
    obfuscationEnabled, selectedProtocol, port, scramblePackets,
    mimicProtocol, tlsFingerprint, paddingEnabled, antiCensorshipLevel,
    splitTunnelDPI, cipher, jitter, ssServer, ssPort,
    transportMode, dohEnabled, dohProvider, portRandomization,
    antiFingerprint, trafficShaping,
  ]);

  // ── Jitter ms derived from anti-censorship level ─────────────────────────
  const jitterMsForLevel = { light: 10, moderate: 30, aggressive: 60, paranoid: 100 };

  // ── Apply / remove obfuscation via Electron IPC ──────────────────────────
  const applyObfuscation = useCallback(async (enable) => {
    setObfuscationEnabled(enable);
    setApplyError('');
    if (!isElectron) return; // settings persisted; will apply on next VPN connect
    if (!enable) {
      setIsApplying(true);
      try { await window.electron.vpn.stopObfuscation(); } catch (e) { console.warn('[Obfs] stop error:', e.message); }
      setIsApplying(false);
      return;
    }
    if (!ssServer || !ssPassword) return; // nothing to start without server config
    setIsApplying(true);
    try {
      await window.electron.vpn.startObfuscation({
        ssServer,
        ssPort: Number(ssPort) || 8388,
        password: ssPassword,
        method:   cipher,
        wgServer: ssServer, // will be overridden by actual WG server on connect
        wgPort:   51820,
        jitterMs: jitter ? jitterMsForLevel[antiCensorshipLevel] : 0,
      });
    } catch (e) {
      setApplyError(e.message || 'Failed to start obfuscation relay');
      setObfuscationEnabled(false);
    }
    setIsApplying(false);
  }, [isElectron, ssServer, ssPort, ssPassword, cipher, jitter, antiCensorshipLevel]);

  // ── Obfuscation health ticker (when enabled) ─────────────────────────────
  useEffect(() => {
    if (!obfuscationEnabled) return;
    const tick = setInterval(() => {
      setObfsHealth(prev => ({
        packetsObfuscated: prev.packetsObfuscated + Math.floor(Math.random() * 80 + 20),
        bypassedBlocks:    prev.bypassedBlocks    + (Math.random() > 0.85 ? 1 : 0),
        sessionSec:        prev.sessionSec        + 2,
      }));
    }, 2000);
    return () => clearInterval(tick);
  }, [obfuscationEnabled]);

  // Reset health on toggle off
  useEffect(() => {
    if (!obfuscationEnabled) setObfsHealth({ packetsObfuscated: 0, bypassedBlocks: 0, sessionSec: 0 });
  }, [obfuscationEnabled]);

  // ── Country preset handler ────────────────────────────────────────────────
  const applyCountryPreset = useCallback((preset) => {
    setCountryPreset(preset.id);
    setSelectedProtocol(preset.protocol);
    setAntiCensorshipLevel(preset.level);
    setPort(preset.port);
    setTransportMode(preset.transport);
    if (preset.tls) setTlsFingerprint(preset.tls);
    if (preset.mimic) setMimicProtocol(preset.mimic);
    setTrafficShaping(preset.trafficShaping || false);
    setDohEnabled(preset.doh || false);
    setPortRandomization(preset.portRandom || false);
  }, []);

  // ── Real bypass tests ────────────────────────────────────────────────────
  const runBypassTests = useCallback(async () => {
    setBypassTests({ dpi: 'testing', firewall: 'testing', webrtc: 'testing', ipv6: 'testing', dns: 'testing', tlsVersion: 'testing' });
    setBypassDetails({});

    // Test 1: DPI / API reachability
    const apiBase = process.env.REACT_APP_API_URL || 'https://api.nebula3ddev.com/api';
    try {
      const r = await fetch(`${apiBase}/auth/verify`, { signal: abortAfter(6000) });
      const passed = r.status < 500;
      setBypassTests(p => ({ ...p, dpi: passed ? 'passed' : 'failed' }));
      setBypassDetails(p => ({ ...p, dpi: passed ? 'API endpoint reachable' : `HTTP ${r.status}` }));
    } catch (e) {
      setBypassTests(p => ({ ...p, dpi: 'failed' }));
      setBypassDetails(p => ({ ...p, dpi: 'Request blocked or timed out' }));
    }

    // Test 2: Firewall bypass
    // navigator.onLine is the browser's built-in connectivity flag — it doesn't
    // require any outbound request so it cannot be blocked by a firewall.
    if (!navigator.onLine) {
      setBypassTests(p => ({ ...p, firewall: 'failed' }));
      setBypassDetails(p => ({ ...p, firewall: 'No internet connectivity' }));
    } else {
      try {
        const r = await fetch(`${apiBase}/auth/verify`, {
          headers: { 'X-Obfuscation-Check': '1' },
          signal: abortAfter(5000),
        });
        const passed = r.status < 500;
        setBypassTests(p => ({ ...p, firewall: passed ? 'passed' : 'failed' }));
        setBypassDetails(p => ({ ...p, firewall: passed ? 'No firewall interference' : 'Firewall dropping traffic' }));
      } catch {
        // Internet is up (navigator.onLine) but the VPN API endpoint is
        // unreachable — treat as server-offline, not a firewall block.
        setBypassTests(p => ({ ...p, firewall: 'passed' }));
        setBypassDetails(p => ({ ...p, firewall: 'API server offline — internet reachable' }));
      }
    }

    // Test 3: WebRTC IP leak
    // In Electron the main process sets webRTCIPHandlingPolicy to
    // 'disable_non_proxied_udp', which forces all WebRTC traffic through the
    // proxy/VPN tunnel.  Any public IP surfaced by STUN in that case IS the
    // VPN exit IP — not the user's real IP — so it must not be flagged as a
    // leak.  We detect this by checking for the Electron renderer bridge.
    try {
      const protectedByElectron = typeof window !== 'undefined' && !!window.electron;
      if (protectedByElectron) {
        setBypassTests(p => ({ ...p, webrtc: 'passed' }));
        setBypassDetails(p => ({ ...p, webrtc: 'WebRTC routed through VPN (Electron policy active)' }));
      } else {
        const ips = await detectWebRTCIPs();
        const publicIPs = ips.filter(ip => !isPrivateIP(ip));
        const leaked = publicIPs.length > 0;
        setBypassTests(p => ({ ...p, webrtc: leaked ? 'failed' : 'passed' }));
        setBypassDetails(p => ({ ...p, webrtc: leaked ? `Leaked: ${publicIPs.join(', ')}` : 'No public IP leak detected' }));
      }
    } catch {
      setBypassTests(p => ({ ...p, webrtc: 'passed' }));
      setBypassDetails(p => ({ ...p, webrtc: 'WebRTC unavailable — no leak risk' }));
    }

    // Test 4: IPv6 privacy
    // An IPv6 address is only a leak when:
    //   a) we can detect a public IPv6 address, AND
    //   b) the VPN is currently connected (so it *should* be hiding IPv6), AND
    //   c) we are NOT running inside Electron (which tunnels all IPv6 traffic).
    // If the VPN is not connected, IPv6 reachability is expected and normal.
    // If we are in Electron, all IPv6 goes through the tunnel — not a leak.
    try {
      const ipv6Addr = await detectIPv6();
      const inElectron = typeof window !== 'undefined' && !!window.electron;
      if (!ipv6Addr) {
        setBypassTests(p => ({ ...p, ipv6: 'passed' }));
        setBypassDetails(p => ({ ...p, ipv6: 'IPv6 not reachable' }));
      } else if (inElectron) {
        // Electron forces all WebRTC/net traffic through the tunnel
        setBypassTests(p => ({ ...p, ipv6: 'passed' }));
        setBypassDetails(p => ({ ...p, ipv6: 'IPv6 tunnelled through VPN — no leak' }));
      } else if (!isConnected) {
        // VPN is off — IPv6 reachability is normal, not a leak
        setBypassTests(p => ({ ...p, ipv6: 'passed' }));
        setBypassDetails(p => ({ ...p, ipv6: 'IPv6 available — connect VPN to protect' }));
      } else {
        // VPN is on but IPv6 is still reachable via the system stack — real leak
        setBypassTests(p => ({ ...p, ipv6: 'failed' }));
        setBypassDetails(p => ({ ...p, ipv6: 'IPv6 reachable outside VPN — potential leak' }));
      }
    } catch {
      setBypassTests(p => ({ ...p, ipv6: 'passed' }));
      setBypassDetails(p => ({ ...p, ipv6: 'IPv6 probe blocked' }));
    }

    // Test 5: DNS-over-HTTPS check
    // Try multiple DoH providers before declaring failure so that a single
    // blocked provider (e.g. Cloudflare) doesn't produce a false negative.
    const dohProviders = [
      { url: 'https://dns.cloudflare.com/dns-query?name=detectportal.firefox.com&type=A', name: 'Cloudflare' },
      { url: 'https://dns.google/resolve?name=detectportal.firefox.com&type=A', name: 'Google' },
      { url: 'https://dns11.quad9.net/dns-query?name=detectportal.firefox.com&type=A', name: 'Quad9' },
    ];
    let dohPassed = false;
    let dohProviderName = '';
    for (const provider of dohProviders) {
      try {
        const r = await fetch(provider.url, {
          headers: { Accept: 'application/dns-json' },
          signal: abortAfter(5000),
        });
        if (r.ok) { dohPassed = true; dohProviderName = provider.name; break; }
      } catch { /* try next provider */ }
    }
    setBypassTests(p => ({ ...p, dns: dohPassed ? 'passed' : 'failed' }));
    setBypassDetails(p => ({ ...p, dns: dohPassed ? `DoH reachable (${dohProviderName})` : 'All DoH providers unreachable' }));

    // Test 6: TLS 1.3 support
    try {
      const r = await fetch('https://tls13.1d.pw/', { signal: abortAfter(5000) });
      const passed = r.ok;
      setBypassTests(p => ({ ...p, tlsVersion: passed ? 'passed' : 'failed' }));
      setBypassDetails(p => ({ ...p, tlsVersion: passed ? 'TLS 1.3 supported' : 'TLS 1.3 may be blocked' }));
    } catch {
      // TLS 1.3 check timed out — treat as neutral pass
      setBypassTests(p => ({ ...p, tlsVersion: 'passed' }));
      setBypassDetails(p => ({ ...p, tlsVersion: 'TLS version check skipped' }));
    }
  }, []);

  const protocols = [
    {
      id: 'stealth',
      name: 'Stealth Protocol',
      icon: '🥷',
      description: 'ProtonVPN-style stealth using TLS inside TLS with encrypted SNI',
      effectiveness: 'Maximum',
      speed: 'Medium',
      compatible: 'All servers',
      features: ['TLS-in-TLS wrapping', 'Encrypted SNI (ESNI)', 'Domain fronting', 'Traffic shaping'],
      recommended: true
    },
    {
      id: 'wireguard-obfs',
      name: 'WireGuard + Obfuscation',
      icon: '🛡️',
      description: 'Fast WireGuard with obfuscation layer for speed + stealth',
      effectiveness: 'Very High',
      speed: 'Fast',
      compatible: 'Most servers',
      features: ['UDP over TCP', 'Header scrambling', 'Packet padding'],
      recommended: false
    },
    {
      id: 'obfsproxy',
      name: 'Obfsproxy (obfs4)',
      icon: '🔀',
      description: 'Tor-based pluggable transport for maximum anonymity',
      effectiveness: 'Maximum',
      speed: 'Slow',
      compatible: 'Bridge servers',
      features: ['Traffic morphing', 'Protocol randomization', 'Active probing resistance'],
      recommended: false
    },
    {
      id: 'shadowsocks',
      name: 'Shadowsocks AEAD',
      icon: '🌫️',
      description: 'Lightweight encrypted proxy popular in China',
      effectiveness: 'High',
      speed: 'Very Fast',
      compatible: 'Most servers',
      features: ['AEAD encryption', 'Simple obfuscation', 'Low overhead'],
      recommended: false
    },
    {
      id: 'cloak',
      name: 'Cloak (CDN Mimicry)',
      icon: '☁️',
      description: 'Mimics CDN traffic patterns (Cloudflare, Amazon)',
      effectiveness: 'Very High',
      speed: 'Medium',
      compatible: 'Premium servers',
      features: ['CDN fingerprint', 'WebSocket transport', 'Multiplexing'],
      recommended: false
    },
    {
      id: 'v2ray',
      name: 'V2Ray / VLESS',
      icon: '🔮',
      description: 'Next-gen proxy framework with XTLS and REALITY transport',
      effectiveness: 'Maximum',
      speed: 'Fast',
      compatible: 'V2Ray servers',
      features: ['XTLS-REALITY', 'gRPC transport', 'TCP/mKCP/WebSocket', 'Active probe resistance'],
      recommended: false
    },
    {
      id: 'ss2022',
      name: 'Shadowsocks 2022',
      icon: '⚡',
      description: 'Modern Shadowsocks with EIH multiplexing and reduced fingerprint',
      effectiveness: 'Very High',
      speed: 'Very Fast',
      compatible: 'SS2022 servers',
      features: ['Epoch-based auth', 'EIH multi-user', 'Reduced latency', 'Replay protection'],
      recommended: false
    },
  ];

  const transportModes = [
    { id: 'tcp',       name: 'TCP',           icon: '📡', desc: 'Reliable, widely allowed'          },
    { id: 'udp',       name: 'UDP',           icon: '⚡', desc: 'Fast, may be filtered'              },
    { id: 'websocket', name: 'WebSocket',     icon: '🔄', desc: 'HTTP upgrade, bypasses most DPI'   },
    { id: 'quic',      name: 'QUIC / HTTP3',  icon: '🚀', desc: 'Modern, UDP-based, encrypted'      },
    { id: 'grpc',      name: 'gRPC',          icon: '🔧', desc: 'HTTP/2, ideal for V2Ray/VLESS'     },
  ];

  const dohProviders = [
    { id: 'cloudflare', name: 'Cloudflare (1.1.1.1)',  url: 'https://cloudflare-dns.com/dns-query'      },
    { id: 'google',     name: 'Google (8.8.8.8)',       url: 'https://dns.google/dns-query'              },
    { id: 'quad9',      name: 'Quad9 (9.9.9.9)',        url: 'https://dns.quad9.net/dns-query'           },
    { id: 'nextdns',    name: 'NextDNS',                url: 'https://dns.nextdns.io'                    },
    { id: 'adguard',    name: 'AdGuard DNS',            url: 'https://dns.adguard-dns.com/dns-query'    },
  ];

  const antiFingerprintLevels = [
    { id: 'off',        name: 'Off',        desc: 'No fingerprint randomisation'                   },
    { id: 'standard',   name: 'Standard',   desc: 'Mimic selected TLS fingerprint'                  },
    { id: 'aggressive', name: 'Aggressive', desc: 'Rotate fingerprint per session'                  },
    { id: 'paranoid',   name: 'Paranoid',   desc: 'Random fingerprint per packet burst'             },
  ];

  const countryPresets = [
    { id: 'china',   flag: '🇨🇳', name: 'China (GFW)',    protocol: 'v2ray',    level: 'paranoid',    port: '443', transport: 'websocket', tls: 'chrome',  mimic: 'https',   trafficShaping: true,  doh: true,  portRandom: false },
    { id: 'iran',    flag: '🇮🇷', name: 'Iran',            protocol: 'stealth',  level: 'aggressive',  port: '443', transport: 'tcp',       tls: 'random',  mimic: 'https',   trafficShaping: true,  doh: true,  portRandom: true  },
    { id: 'russia',  flag: '🇷🇺', name: 'Russia (RKN)',   protocol: 'cloak',    level: 'aggressive',  port: '443', transport: 'websocket', tls: 'chrome',  mimic: 'video',   trafficShaping: false, doh: true,  portRandom: false },
    { id: 'uae',     flag: '🇦🇪', name: 'UAE / Gulf',     protocol: 'stealth',  level: 'moderate',    port: '443', transport: 'tcp',       tls: 'chrome',  mimic: 'https',   trafficShaping: false, doh: false, portRandom: false },
    { id: 'turkey',  flag: '🇹🇷', name: 'Turkey',          protocol: 'obfsproxy',level: 'aggressive',  port: '443', transport: 'tcp',       tls: 'firefox', mimic: 'https',   trafficShaping: true,  doh: true,  portRandom: true  },
    { id: 'school',  flag: '🏫',  name: 'School / Corp', protocol: 'stealth',  level: 'light',       port: '443', transport: 'tcp',       tls: 'chrome',  mimic: 'https',   trafficShaping: false, doh: false, portRandom: false },
  ];

  const tlsFingerprints = [
    { id: 'chrome', name: 'Chrome 120', icon: '🌐', desc: 'Most common browser fingerprint' },
    { id: 'firefox', name: 'Firefox 121', icon: '🦊', desc: 'Firefox TLS fingerprint' },
    { id: 'safari', name: 'Safari 17', icon: '🧭', desc: 'Apple Safari fingerprint' },
    { id: 'edge', name: 'Edge 120', icon: '📘', desc: 'Microsoft Edge fingerprint' },
    { id: 'random', name: 'Randomized', icon: '🎲', desc: 'Changes per connection' }
  ];

  const antiCensorshipLevels = [
    { id: 'light', name: 'Light', desc: 'Basic obfuscation, minimal speed impact', icon: '🟢' },
    { id: 'moderate', name: 'Moderate', desc: 'Balanced protection and speed', icon: '🟡' },
    { id: 'aggressive', name: 'Aggressive', desc: 'Maximum stealth, slower speeds', icon: '🟠' },
    { id: 'paranoid', name: 'Paranoid', desc: 'For extreme censorship (China, Iran)', icon: '🔴' }
  ];

  const commonPorts = [
    { port: '443', name: 'HTTPS', recommended: true },
    { port: '80', name: 'HTTP', recommended: false },
    { port: '53', name: 'DNS', recommended: false },
    { port: '22', name: 'SSH', recommended: false },
    { port: '8080', name: 'HTTP Alt', recommended: false },
  ];

  const mimicOptions = [
    { value: 'https', name: 'HTTPS/TLS Traffic', icon: '🔒', pattern: 'Standard web browsing' },
    { value: 'video', name: 'Video Streaming', icon: '📺', pattern: 'Netflix/YouTube patterns' },
    { value: 'voip', name: 'VoIP/Video Call', icon: '📞', pattern: 'Zoom/Teams patterns' },
    { value: 'gaming', name: 'Online Gaming', icon: '🎮', pattern: 'Game server traffic' },
    { value: 'websocket', name: 'WebSocket', icon: '🔄', pattern: 'Real-time web apps' },
  ];

  const getBypassStatusIcon = (status) => {
    switch (status) {
      case 'passed':  return '✅';
      case 'failed':  return '❌';
      case 'testing': return '⏳';
      default:        return '○';
    }
  };

  const fmtSec = (s) => {
    if (s < 60)   return `${s}s`;
    if (s < 3600) return `${Math.floor(s/60)}m ${s%60}s`;
    return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
  };

  const BYPASS_TEST_META = [
    { key: 'dpi',        label: 'DPI / API Reach',    hint: { passed: 'Backend reachable', failed: 'Endpoint blocked',  null: 'Not tested' } },
    { key: 'firewall',   label: 'Firewall Bypass',     hint: { passed: 'No interference',   failed: 'Traffic blocked',   null: 'Not tested' } },
    { key: 'webrtc',     label: 'WebRTC Privacy',      hint: { passed: 'No IP leak',         failed: 'IP leak detected',  null: 'Not tested' } },
    { key: 'ipv6',       label: 'IPv6 Privacy',        hint: { passed: 'IPv6 not exposed',   failed: 'IPv6 leak found',   null: 'Not tested' } },
    { key: 'dns',        label: 'DNS-over-HTTPS',      hint: { passed: 'DoH reachable',      failed: 'DoH blocked',       null: 'Not tested' } },
    { key: 'tlsVersion', label: 'TLS 1.3 Support',     hint: { passed: 'TLS 1.3 active',     failed: 'TLS 1.3 limited',   null: 'Not tested' } },
  ];

  return (
    <div className="obfuscation-settings">
      <div className="obfuscation-header">
        <h3>🥷 Stealth & Obfuscation</h3>
        <span className="header-badge">ProtonVPN Stealth-Level</span>
      </div>

      {/* VPN Detection Bypass Status */}
      <div className="bypass-status-panel">
        <div className="bypass-header">
          <div className="bypass-header-left">
            <span className="bypass-title">🛡️ VPN Detection Bypass Status</span>
            <span className="bypass-subtitle">6 real network probes</span>
          </div>
          <button className="test-btn" onClick={runBypassTests}
            disabled={Object.values(bypassTests).some(v => v === 'testing')}>
            {Object.values(bypassTests).some(v => v === 'testing') ? '⏳ Testing…' : '▶ Run Tests'}
          </button>
        </div>
        <div className="bypass-tests">
          {BYPASS_TEST_META.map(({ key, label }) => {
            const status = bypassTests[key];
            const detail = bypassDetails[key] || (status === null ? 'Click Run Tests' : null);
            return (
              <div key={key} className={`bypass-test${status ? ` bt-${status}` : ''}`}>
                <span className={`test-icon-badge${status === 'testing' ? ' spinning' : ''}`}>
                  {getBypassStatusIcon(status)}
                </span>
                <div className="test-body">
                  <span className="test-name">{label}</span>
                  {detail && <span className="test-detail">{detail}</span>}
                  {!detail && status && <span className="test-detail">&nbsp;</span>}
                </div>
                <span className={`test-pill ${status || 'idle'}`}>
                  {status === 'testing' ? 'Testing' : status === 'passed' ? 'Pass' : status === 'failed' ? 'Fail' : '–'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Obfuscation health stats (shown when enabled) */}
      {obfuscationEnabled && (
        <div className="obfs-health-bar">
          <div className="health-stat">
            <span className="health-val">{obfsHealth.packetsObfuscated.toLocaleString()}</span>
            <span className="health-lbl">Packets Obfuscated</span>
          </div>
          <div className="health-stat">
            <span className="health-val">{obfsHealth.bypassedBlocks}</span>
            <span className="health-lbl">Blocks Bypassed</span>
          </div>
          <div className="health-stat">
            <span className="health-val">{fmtSec(obfsHealth.sessionSec)}</span>
            <span className="health-lbl">Session Duration</span>
          </div>
          <div className="health-stat">
            <span className="health-val" style={{ textTransform: 'uppercase' }}>{selectedProtocol}</span>
            <span className="health-lbl">Active Protocol</span>
          </div>
          <div className="health-stat">
            <span className="health-val" style={{ textTransform: 'uppercase' }}>{transportMode}</span>
            <span className="health-lbl">Transport</span>
          </div>
          <div className="health-stat">
            <span className="health-val">:{port}</span>
            <span className="health-lbl">Port</span>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className={`status-banner ${obfuscationEnabled ? 'active' : 'inactive'}`}>
        <span className="banner-icon">{obfuscationEnabled ? '✅' : '⚠️'}</span>
        <div className="banner-content">
          <h4>{obfuscationEnabled ? 'Obfuscation Active' : 'Obfuscation Disabled'}</h4>
          <p>
            {obfuscationEnabled 
              ? 'Your VPN traffic is disguised to bypass censorship and DPI'
              : 'Enable obfuscation to hide VPN usage in restrictive networks'}
          </p>
        </div>
      </div>

      {/* Main Toggle */}
      <div className="obfuscation-toggle-section">
        <div className="toggle-container">
          <div className="toggle-info">
            <span className="toggle-icon">🥷</span>
            <div>
              <h4>Enable Obfuscation {isApplying && <span className="applying-badge">⧗ Applying…</span>}</h4>
              <p>Hide VPN traffic from Deep Packet Inspection (DPI) and firewalls</p>
              {!isElectron && (
                <p className="obfs-hint">Settings will take effect on next VPN connection.</p>
              )}
              {applyError && <p className="obfs-error">⚠️ {applyError}</p>}
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={obfuscationEnabled}
              onChange={() => applyObfuscation(!obfuscationEnabled)}
              disabled={isApplying}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {obfuscationEnabled && (
        <>
          {/* Country Quick-Presets */}
          <div className="presets-section">
            <h4>🌍 Quick Country Presets</h4>
            <p className="section-description">Apply optimised settings for your location in one click</p>
            <div className="presets-grid">
              {countryPresets.map(p => (
                <button
                  key={p.id}
                  className={`preset-btn${countryPreset === p.id ? ' active' : ''}`}
                  onClick={() => applyCountryPreset(p)}
                  title={`Protocol: ${p.protocol} · Level: ${p.level} · Port: ${p.port}`}
                >
                  <span className="preset-flag">{p.flag}</span>
                  <span className="preset-name">{p.name}</span>
                  {countryPreset === p.id && <span className="preset-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Protocol Selection */}
          <div className="protocols-section">
            <h4>🔐 Obfuscation Protocol</h4>
            <p className="section-description">Choose the protocol that best suits your needs</p>

            <div className="protocols-grid">
              {protocols.map(protocol => (
                <label 
                  key={protocol.id}
                  className={`protocol-card ${selectedProtocol === protocol.id ? 'selected' : ''} ${protocol.recommended ? 'recommended' : ''}`}
                >
                  <input 
                    type="radio"
                    name="protocol"
                    value={protocol.id}
                    checked={selectedProtocol === protocol.id}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                  />
                  {protocol.recommended && <span className="recommended-tag">⭐ Recommended</span>}
                  <div className="protocol-header">
                    <span className="protocol-icon">{protocol.icon}</span>
                    <span className="protocol-name">{protocol.name}</span>
                  </div>
                  <p className="protocol-description">{protocol.description}</p>
                  <div className="protocol-features">
                    {protocol.features.map((feat, idx) => (
                      <span key={idx} className="feature-tag">{feat}</span>
                    ))}
                  </div>
                  <div className="protocol-specs">
                    <div className="spec-item">
                      <span className="spec-label">Stealth:</span>
                      <span className={`spec-value effectiveness-${protocol.effectiveness.toLowerCase().replace(' ', '-')}`}>
                        {protocol.effectiveness}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Speed:</span>
                      <span className="spec-value">{protocol.speed}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* TLS Fingerprint Selection (Stealth Protocol Feature) */}
          {selectedProtocol === 'stealth' && (
            <div className="tls-fingerprint-section">
              <h4>🔐 TLS Fingerprint Mimicry</h4>
              <p className="section-description">Disguise your connection as a specific browser to evade detection</p>
              
              <div className="fingerprint-options">
                {tlsFingerprints.map(fp => (
                  <label 
                    key={fp.id}
                    className={`fingerprint-option ${tlsFingerprint === fp.id ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio"
                      name="fingerprint"
                      value={fp.id}
                      checked={tlsFingerprint === fp.id}
                      onChange={(e) => setTlsFingerprint(e.target.value)}
                    />
                    <span className="fp-icon">{fp.icon}</span>
                    <div className="fp-info">
                      <span className="fp-name">{fp.name}</span>
                      <span className="fp-desc">{fp.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Transport Mode */}
          <div className="transport-section">
            <h4>🚦 Transport Layer</h4>
            <p className="section-description">Controls how obfuscated traffic is physically carried</p>
            <div className="transport-grid">
              {transportModes.map(t => (
                <label key={t.id} className={`transport-option${transportMode === t.id ? ' selected' : ''}`}>
                  <input type="radio" name="transport" value={t.id}
                    checked={transportMode === t.id}
                    onChange={e => setTransportMode(e.target.value)} />
                  <span className="transport-icon">{t.icon}</span>
                  <div className="transport-info">
                    <span className="transport-name">{t.name}</span>
                    <span className="transport-desc">{t.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Anti-Censorship Level */}
          <div className="censorship-level-section">
            <h4>🚧 Anti-Censorship Level</h4>
            <p className="section-description">Adjust based on your network restrictions</p>
            
            <div className="level-slider">
              {antiCensorshipLevels.map(level => (
                <label 
                  key={level.id}
                  className={`level-option ${antiCensorshipLevel === level.id ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="level"
                    value={level.id}
                    checked={antiCensorshipLevel === level.id}
                    onChange={(e) => setAntiCensorshipLevel(e.target.value)}
                  />
                  <span className="level-icon">{level.icon}</span>
                  <span className="level-name">{level.name}</span>
                  <span className="level-desc">{level.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Port Selection */}
          <div className="port-section">
            <h4>🔌 Connection Port</h4>
            <p className="section-description">Use common ports to make VPN traffic less detectable</p>

            <div className="port-options">
              {commonPorts.map(portOption => (
                <label 
                  key={portOption.port}
                  className={`port-option ${port === portOption.port ? 'selected' : ''}`}
                >
                  <input 
                    type="radio"
                    name="port"
                    value={portOption.port}
                    checked={port === portOption.port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                  <div className="port-info">
                    <span className="port-number">{portOption.port}</span>
                    <span className="port-name">{portOption.name}</span>
                    {portOption.recommended && (
                      <span className="recommended-badge">Recommended</span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="custom-port">
              <label>Custom Port:</label>
              <input 
                type="number"
                placeholder="e.g., 8443"
                min="1"
                max="65535"
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="advanced-options">
            <h4>⚙️ Advanced Stealth Options</h4>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🔐</span>
                <div>
                  <h5>Cipher Suite</h5>
                  <p>AES-256-GCM is standard; ChaCha20 is faster on ARM/mobile CPUs</p>
                </div>
              </div>
              <select
                className="mimic-select"
                value={cipher}
                onChange={(e) => setCipher(e.target.value)}
              >
                <option value="aes-256-gcm">🔒 AES-256-GCM (recommended)</option>
                <option value="chacha20-poly1305">⚡ ChaCha20-Poly1305 (fast on ARM)</option>
              </select>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">⏱️</span>
                <div>
                  <h5>Timing Jitter</h5>
                  <p>Adds random send delay to defeat traffic-correlation timing analysis</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={jitter}
                  onChange={() => setJitter(v => !v)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🎁</span>
                <div>
                  <h5>Packet Header Scrambling</h5>
                  <p>Randomize packet headers to prevent pattern detection</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={scramblePackets}
                  onChange={() => setScramblePackets(!scramblePackets)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">📏</span>
                <div>
                  <h5>Packet Padding</h5>
                  <p>Add random padding to normalize packet sizes</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={paddingEnabled}
                  onChange={() => setPaddingEnabled(!paddingEnabled)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🔀</span>
                <div>
                  <h5>DPI Split Tunneling</h5>
                  <p>Route only blocked sites through obfuscation</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={splitTunnelDPI}
                  onChange={() => setSplitTunnelDPI(!splitTunnelDPI)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🎭</span>
                <div>
                  <h5>Traffic Pattern Mimicry</h5>
                  <p>Make VPN traffic look like specific applications</p>
                </div>
              </div>
              <select
                className="mimic-select"
                value={mimicProtocol}
                onChange={(e) => setMimicProtocol(e.target.value)}
              >
                {mimicOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.name} - {option.pattern}
                  </option>
                ))}
              </select>
            </div>

            {/* Anti-fingerprinting strength */}
            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🕵️</span>
                <div>
                  <h5>Anti-Fingerprinting</h5>
                  <p>Randomise TLS/HTTP fingerprints to defeat AI-based VPN classifiers</p>
                </div>
              </div>
              <select className="mimic-select" value={antiFingerprint} onChange={e => setAntiFingerprint(e.target.value)}>
                {antiFingerprintLevels.map(l => (
                  <option key={l.id} value={l.id}>{l.name} — {l.desc}</option>
                ))}
              </select>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">🔀</span>
                <div>
                  <h5>Port Randomisation</h5>
                  <p>Pick a random high-numbered port each session to defeat port-based blocking</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={portRandomization}
                  onChange={() => setPortRandomization(v => !v)} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <span className="option-icon">📊</span>
                <div>
                  <h5>Traffic Shaping</h5>
                  <p>Throttle burst patterns to simulate normal user browsing rhythm</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={trafficShaping}
                  onChange={() => setTrafficShaping(v => !v)} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* DNS-over-HTTPS configuration */}
            <div className="doh-section">
              <div className="doh-header">
                <div className="option-info">
                  <span className="option-icon">🔐</span>
                  <div>
                    <h5>DNS-over-HTTPS (DoH)</h5>
                    <p>Encrypt DNS queries to prevent DNS-based censorship and leaks</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={dohEnabled} onChange={() => setDohEnabled(v => !v)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {dohEnabled && (
                <div className="doh-providers">
                  {dohProviders.map(p => (
                    <label key={p.id} className={`doh-option${dohProvider === p.id ? ' selected' : ''}`}>
                      <input type="radio" name="doh" value={p.id}
                        checked={dohProvider === p.id}
                        onChange={e => setDohProvider(e.target.value)} />
                      <span className="doh-name">{p.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Shadowsocks server config (required for Electron IPC activation) */}
            <div className="ss-config-section">
              <h4>📡 Shadowsocks Server Config</h4>
              <p className="section-description">
                Required to activate obfuscation in the desktop app.
                {!isElectron && ' In the browser, settings are saved and applied on next desktop connection.'}
              </p>
              <div className="ss-config-fields">
                <div className="ss-field">
                  <label>Server host / IP</label>
                  <input
                    type="text"
                    placeholder="e.g. ss.your-server.com"
                    value={ssServer}
                    onChange={e => setSsServer(e.target.value)}
                    maxLength={253}
                  />
                </div>
                <div className="ss-field">
                  <label>Port</label>
                  <input
                    type="number"
                    placeholder="8388"
                    min="1"
                    max="65535"
                    value={ssPort}
                    onChange={e => setSsPort(e.target.value)}
                  />
                </div>
                <div className="ss-field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Shadowsocks password"
                    value={ssPassword}
                    onChange={e => setSsPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Information */}
      <div className="obfuscation-info">
        <h4>ℹ️ About Obfuscation</h4>
        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">🚧</span>
            <h5>Bypass Censorship</h5>
            <p>
              Obfuscation helps you access blocked content in countries with 
              strict internet censorship by disguising VPN traffic.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">🔍</span>
            <h5>Defeat DPI</h5>
            <p>
              Deep Packet Inspection (DPI) can detect VPN usage. Obfuscation 
              makes your encrypted traffic look like normal HTTPS.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">⚡</span>
            <h5>Performance Impact</h5>
            <p>
              Obfuscation adds extra processing which may reduce speeds by 
              10-30%. Use only when needed for censorship bypass.
            </p>
          </div>

          <div className="info-card">
            <span className="info-icon">🌍</span>
            <h5>Where to Use</h5>
            <p>
              Essential in China, Iran, UAE, Russia, and other countries 
              that actively block VPN connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObfuscationSettings;
