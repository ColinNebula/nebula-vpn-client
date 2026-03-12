import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ThreatProtection.css';

// ─── Minimal embedded blocklist ────────────────────────────────────────────
// A representative sample of tracker/ad/malware domains. In production this
// would be fetched from a hosted FilterList or a server-side allowlist proxy.
const AD_TRACKER_DOMAINS = new Set([
  // Ad networks
  'doubleclick.net','googlesyndication.com','googleadservices.com',
  'adnxs.com','advertising.com','outbrain.com','taboola.com',
  'moatads.com','criteo.com','pubmatic.com','rubiconproject.com',
  'openx.net','lijit.com','sovrn.com','media.net','adsrvr.org',
  'amazon-adsystem.com','scorecardresearch.com','quantserve.com',
  // Trackers
  'facebook.com/tr','connect.facebook.net','hotjar.com',
  'mouseflow.com','fullstory.com','segment.io','mixpanel.com',
  'heap.io','amplitude.com','intercom.io','klaviyo.com',
  'pardot.com','marketo.com','hubspot.com','clearbit.com',
  'sentry.io', 'nr-data.net', 'newrelic.com',
]);

const MALWARE_INDICATORS = new Set([
  '.xyz','malware','phish','ransom','cryptominer','trojan',
  'exploit','backdoor','botnet',
]);

const PHISHING_INDICATORS = new Set([
  'paypa1','arnazon','g00gle','appleid-verify','account-secure',
  'secure-login','verify-account','bank-secure',
]);

const CATEGORY_KEYS = ['ads', 'trackers', 'malware', 'phishing'];

const CATEGORY_META = {
  ads:      { icon: '📢', label: 'Ads',        color: '#3b82f6', settingKey: 'blockAds'      },
  trackers: { icon: '👁️', label: 'Trackers',   color: '#8b5cf6', settingKey: 'blockTrackers' },
  malware:  { icon: '🦠', label: 'Malware',    color: '#ef4444', settingKey: 'blockMalware'  },
  phishing: { icon: '🎣', label: 'Phishing',   color: '#f97316', settingKey: 'blockPhishing' },
};

const DNS_PROVIDERS = [
  { id: 'cloudflare-security', label: 'Cloudflare 1.1.1.2', desc: 'Blocks malware & phishing', ip: '1.1.1.2' },
  { id: 'quad9',               label: 'Quad9 9.9.9.9',      desc: 'Blocks malware domains',    ip: '9.9.9.9' },
  { id: 'nextdns',             label: 'NextDNS',             desc: 'Customisable filters',      ip: 'Custom'  },
  { id: 'adguard-dns',         label: 'AdGuard DNS',         desc: 'Ad + tracker blocking',     ip: '94.140.14.14' },
];

const STORAGE_KEY = 'nebula_tp_stats';

const loadStats = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ads: 0, trackers: 0, malware: 0, phishing: 0, total: 0 };
  } catch { return { ads: 0, trackers: 0, malware: 0, phishing: 0, total: 0 }; }
};

const saveStats = (stats) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {}
};

// ─── Classify a resource URL ───────────────────────────────────────────────
const classifyUrl = (url, settings) => {
  try {
    const { hostname, pathname } = new URL(url);
    const full = `${hostname}${pathname}`;

    if (settings.blockMalware &&
        [...MALWARE_INDICATORS].some(kw => full.includes(kw))) return 'malware';
    if (settings.blockPhishing &&
        [...PHISHING_INDICATORS].some(kw => full.includes(kw))) return 'phishing';
    if (settings.blockAds && [...AD_TRACKER_DOMAINS].some(d => hostname.endsWith(d))) return 'ads';
    if (settings.blockTrackers && [...AD_TRACKER_DOMAINS].some(d => hostname.endsWith(d))) return 'trackers';
  } catch {}
  return null;
};

// ─── Estimated time saved (250ms per blocked request) ──────────────────────
const fmtTimeSaved = (total) => {
  const ms = total * 250;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
};

// ─── Component ─────────────────────────────────────────────────────────────
const ThreatProtection = ({ isConnected }) => {
  const [enabled, setEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nebula_tp_enabled') ?? 'true'); } catch { return true; }
  });
  const [settings, setSettings] = useState({
    blockAds: true,
    blockTrackers: true,
    blockMalware: true,
    blockPhishing: true,
  });
  const [stats, setStats] = useState(loadStats);
  const [recentBlocked, setRecentBlocked] = useState([]);
  const [dnsProvider, setDnsProvider] = useState('cloudflare-security');
  const [activeView, setActiveView] = useState('overview');
  const observerRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Persist enabled state
  useEffect(() => {
    try { localStorage.setItem('nebula_tp_enabled', JSON.stringify(enabled)); } catch {}
  }, [enabled]);

  // ── PerformanceObserver: watch real network requests ─────────────────────
  const setupObserver = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;
    if (observerRef.current) { observerRef.current.disconnect(); }

    const observer = new PerformanceObserver((list) => {
      if (!enabled) return;
      list.getEntries().forEach(entry => {
        const category = classifyUrl(entry.name, settingsRef.current);
        if (!category) return;

        setStats(prev => {
          const next = {
            ...prev,
            [category]: (prev[category] || 0) + 1,
            total: (prev.total || 0) + 1,
          };
          saveStats(next);
          return next;
        });

        setRecentBlocked(prev => {
          try {
            const { hostname } = new URL(entry.name);
            const item = {
              id: Date.now() + Math.random(),
              domain: hostname,
              category,
              time: new Date().toLocaleTimeString(),
            };
            return [item, ...prev].slice(0, 50);
          } catch { return prev; }
        });
      });
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
      observerRef.current = observer;
    } catch {}
  }, [enabled]);

  useEffect(() => {
    setupObserver();
    return () => observerRef.current?.disconnect();
  }, [setupObserver]);

  const handleToggle = (key) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleClearStats = () => {
    const reset = { ads: 0, trackers: 0, malware: 0, phishing: 0, total: 0 };
    setStats(reset);
    saveStats(reset);
    setRecentBlocked([]);
  };

  const totalBlocked = stats.total || 0;
  const provider = DNS_PROVIDERS.find(p => p.id === dnsProvider) || DNS_PROVIDERS[0];

  return (
    <div className="threat-protection">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="tp-header">
        <div className="tp-title-row">
          <h3>🛡️ Threat Protection</h3>
          <span className="tp-always-on-badge">Always On</span>
        </div>
        <p className="tp-subtitle">
          Blocks ads, trackers &amp; malware in real time — even when the VPN is off.
        </p>
      </div>

      {/* ── Master toggle + status ─────────────────────────────────────── */}
      <div className={`tp-status-card ${enabled ? 'enabled' : 'disabled'}`}>
        <div className="tp-status-left">
          <span className="tp-status-orb">{enabled ? '✅' : '⚠️'}</span>
          <div>
            <div className="tp-status-title">{enabled ? 'Protection Active' : 'Protection Disabled'}</div>
            <div className="tp-status-sub">
              {enabled
                ? `${totalBlocked.toLocaleString()} threats blocked this session`
                : 'Enable Threat Protection to start blocking threats'}
            </div>
            {enabled && !isConnected && (
              <div className="tp-vpn-off-note">⚡ Running independently — VPN not required</div>
            )}
          </div>
        </div>
        <label className="tp-master-toggle">
          <input type="checkbox" checked={enabled} onChange={() => setEnabled(v => !v)} />
          <span className="tp-toggle-track">
            <span className="tp-toggle-thumb" />
          </span>
        </label>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="tp-stats-row">
        {CATEGORY_KEYS.map(cat => {
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} className="tp-stat-card" style={{ '--cat-color': meta.color }}>
              <span className="tp-stat-icon">{meta.icon}</span>
              <div className="tp-stat-count">{(stats[cat] || 0).toLocaleString()}</div>
              <div className="tp-stat-label">{meta.label}</div>
            </div>
          );
        })}
        <div className="tp-stat-card tp-stat-time">
          <span className="tp-stat-icon">⏱️</span>
          <div className="tp-stat-count">{fmtTimeSaved(totalBlocked)}</div>
          <div className="tp-stat-label">Est. Saved</div>
        </div>
      </div>

      {/* ── Navigation tabs ───────────────────────────────────────────── */}
      <div className="tp-tabs">
        {[
          { id: 'overview',  label: '🏠 Overview'     },
          { id: 'filters',   label: '🎛️ Filters'      },
          { id: 'dns',       label: '🔒 Secure DNS'   },
          { id: 'log',       label: `📋 Log (${recentBlocked.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tp-tab ${activeView === tab.id ? 'active' : ''}`}
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ Overview ════════════════════════════════════════════════════ */}
      {activeView === 'overview' && (
        <div className="tp-panel">
          <div className="tp-protection-grid">
            {CATEGORY_KEYS.map(cat => {
              const meta = CATEGORY_META[cat];
              const isOn = settings[meta.settingKey];
              return (
                <div key={cat} className={`tp-protection-tile ${isOn && enabled ? 'on' : 'off'}`}>
                  <span className="tile-icon">{meta.icon}</span>
                  <div className="tile-label">{meta.label} Blocking</div>
                  <div className={`tile-pill ${isOn && enabled ? 'on' : 'off'}`}>
                    {isOn && enabled ? 'ON' : 'OFF'}
                  </div>
                  <div className="tile-count">{(stats[cat] || 0).toLocaleString()} blocked</div>
                </div>
              );
            })}
          </div>

          <div className="tp-overview-footer">
            <div className="tp-dns-summary">
              <span className="tp-dns-icon">🔒</span>
              <div>
                <div className="tp-dns-name">{provider.label}</div>
                <div className="tp-dns-desc">{provider.desc} &middot; {provider.ip}</div>
              </div>
            </div>
            <button className="tp-clear-btn" onClick={handleClearStats}>
              🗑️ Reset Stats
            </button>
          </div>
        </div>
      )}

      {/* ══ Filters ═════════════════════════════════════════════════════ */}
      {activeView === 'filters' && (
        <div className="tp-panel">
          <p className="tp-panel-hint">
            These filters apply to all network requests — whether or not the VPN is connected.
          </p>
          <div className="tp-filter-list">
            {[
              { key: 'blockAds',      icon: '📢', label: 'Block Advertisements',    desc: 'Hide banner ads, video pre-rolls and sponsored content.' },
              { key: 'blockTrackers', icon: '👁️', label: 'Block Trackers',          desc: 'Prevent analytics scripts from profiling your browsing' },
              { key: 'blockMalware',  icon: '🦠', label: 'Block Malware Domains',   desc: 'Deny connections to known malicious hosts and C2 servers' },
              { key: 'blockPhishing', icon: '🎣', label: 'Block Phishing Sites',    desc: 'Warn and block lookalike credential-harvesting pages' },
            ].map(item => (
              <div key={item.key} className="tp-filter-row">
                <span className="tp-filter-icon">{item.icon}</span>
                <div className="tp-filter-info">
                  <div className="tp-filter-label">{item.label}</div>
                  <div className="tp-filter-desc">{item.desc}</div>
                </div>
                <label className="tp-toggle-mini">
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={() => handleToggle(item.key)}
                    disabled={!enabled}
                  />
                  <span className="tp-toggle-track">
                    <span className="tp-toggle-thumb" />
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Secure DNS ══════════════════════════════════════════════════ */}
      {activeView === 'dns' && (
        <div className="tp-panel">
          <p className="tp-panel-hint">
            Routing DNS queries through a filtering resolver blocks malicious domains before
            a connection is ever made — no VPN required.
          </p>
          <div className="tp-dns-list">
            {DNS_PROVIDERS.map(p => (
              <button
                key={p.id}
                className={`tp-dns-card ${dnsProvider === p.id ? 'selected' : ''}`}
                onClick={() => setDnsProvider(p.id)}
                type="button"
              >
                <div className="tp-dns-card-top">
                  <span className="tp-dns-card-label">{p.label}</span>
                  {dnsProvider === p.id && <span className="tp-dns-active-badge">Active</span>}
                </div>
                <div className="tp-dns-card-desc">{p.desc}</div>
                <div className="tp-dns-card-ip">{p.ip}</div>
              </button>
            ))}
          </div>
          <div className="tp-dns-setup-box">
            <div className="tp-dns-setup-title">⚙️ How to apply on your device</div>
            <ol className="tp-dns-steps">
              <li>Open your OS network settings (Wi-Fi / Ethernet adapter)</li>
              <li>Set <strong>DNS server</strong> to <code>{provider.ip}</code></li>
              <li>On the Electron app, filtering is applied automatically via the in-app DoH proxy</li>
            </ol>
          </div>
        </div>
      )}

      {/* ══ Log ═════════════════════════════════════════════════════════ */}
      {activeView === 'log' && (
        <div className="tp-panel">
          {recentBlocked.length === 0 ? (
            <div className="tp-log-empty">
              <span className="tp-log-empty-icon">📋</span>
              <div>No blocked requests yet this session</div>
              <div className="tp-log-empty-sub">Requests matching enabled filters will appear here</div>
            </div>
          ) : (
            <div className="tp-log-table">
              <div className="tp-log-header-row">
                <span>Domain</span>
                <span>Category</span>
                <span>Time</span>
              </div>
              {recentBlocked.map(item => {
                const meta = CATEGORY_META[item.category];
                return (
                  <div key={item.id} className="tp-log-row">
                    <span className="tp-log-domain">{item.domain}</span>
                    <span className="tp-log-cat" style={{ color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="tp-log-time">{item.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreatProtection;
