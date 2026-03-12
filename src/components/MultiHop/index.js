import React, { useState, useCallback, useMemo, useRef } from 'react';
import './MultiHop.css';

// ── Tunnel modes ──────────────────────────────────────────────────────────────
const TUNNEL_MODES = [
  { id: 'standard',  name: 'Standard Multi-Hop',    icon: '🔗', desc: 'Traffic routed through each server sequentially', badge: null },
  { id: 'nested',    name: 'Nested Encryption',      icon: '🧅', desc: 'Each hop wraps traffic in an additional layer (Tor-style)', badge: 'Max Security' },
  { id: 'rotating',  name: 'Auto-Rotating Hops',     icon: '🔄', desc: 'Entry/exit nodes rotate every 10 minutes', badge: 'Anti-Surveillance' },
];

// ── Per-hop protocols ─────────────────────────────────────────────────────────
const HOP_PROTOCOLS = [
  { id: 'wireguard',   name: 'WireGuard',   icon: '⚡', color: '#4CAF50' },
  { id: 'openvpn',     name: 'OpenVPN',     icon: '🔒', color: '#2196F3' },
  { id: 'shadowsocks', name: 'Shadowsocks', icon: '🌫️', color: '#9C27B0' },
];

// ── Preset chain configs ──────────────────────────────────────────────────────
const PRESETS = [
  { id: 'max-privacy',     name: 'Max Privacy',      icon: '🔒', desc: 'Triple-hop through no-log jurisdictions',            mode: 'nested',   countries: ['IS', 'CH', 'PA'],  tags: ['journalism', 'activism'], color: '#9C27B0' },
  { id: 'anti-censorship', name: 'Anti-Censorship',  icon: '🌐', desc: 'Enter locally, exit through neutral jurisdiction',   mode: 'standard', countries: ['SE', 'NL'],        tags: ['china', 'iran'],          color: '#FF5722' },
  { id: 'streaming',       name: 'Streaming',         icon: '🎬', desc: 'Two-hop optimised for low latency and bandwidth',   mode: 'standard', countries: ['US', 'GB'],        tags: ['netflix', 'bbc'],         color: '#E91E63' },
  { id: 'gaming',          name: 'Gaming',            icon: '🎮', desc: 'Nearest two hops to minimise added latency',        mode: 'standard', countries: ['US', 'DE'],        tags: ['low-latency'],            color: '#00BCD4' },
  { id: 'balanced',        name: 'Balanced',          icon: '⚖️', desc: 'Double-hop — good security, minimal speed penalty', mode: 'standard', countries: ['NL', 'SG'],        tags: ['everyday'],               color: '#4CAF50' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getLatencyColor = (ms) => ms < 60 ? '#4CAF50' : ms < 120 ? '#FF9800' : '#F44336';
const fmtBandwidth    = (v)  => v >= 1000 ? `${(v / 1000).toFixed(1)} Gbps` : `${Math.round(v)} Mbps`;

// ── Component ─────────────────────────────────────────────────────────────────
const MultiHop = ({ servers = [], selectedServers, onServersChange, isConnected }) => {
  const [tunnelMode, setTunnelMode]       = useState('standard');
  const [activePreset, setActivePreset]   = useState(null);
  const [hopProtocols, setHopProtocols]   = useState({});
  const [entryLock, setEntryLock]         = useState('');
  const [exitLock, setExitLock]           = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [showAdvanced, setShowAdvanced]   = useState(false);
  const [showPresets, setShowPresets]     = useState(true);
  const [presetWarnMsg, setPresetWarnMsg] = useState('');
  const [draggedIdx, setDraggedIdx]       = useState(null);
  const [dragOverIdx, setDragOverIdx]     = useState(null);
  const [autoBuilt, setAutoBuilt]         = useState(false);
  const hopRefs                           = useRef([]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalLatency = useMemo(() =>
    selectedServers.reduce((t, s) => t + parseInt(s.ping, 10), 0), [selectedServers]);

  const encryptionLayers = useMemo(() =>
    tunnelMode === 'nested' ? selectedServers.length : 1, [tunnelMode, selectedServers]);

  const geoScore = useMemo(() => {
    const countries = new Set(selectedServers.map(s => s.country));
    if (selectedServers.length < 2) return 0;
    return Math.round((countries.size / selectedServers.length) * 100);
  }, [selectedServers]);

  const estimatedBandwidth = useMemo(() => {
    if (selectedServers.length === 0) return null;
    return Math.max(10, 100 - (selectedServers.length - 1) * 20 - Math.round(totalLatency / 10));
  }, [selectedServers, totalLatency]);

  const securityRating = useMemo(() => {
    const hopBonus  = selectedServers.length * 25;
    const modeBonus = tunnelMode === 'nested' ? 25 : tunnelMode === 'rotating' ? 15 : 0;
    const geoBonus  = geoScore > 80 ? 10 : geoScore > 50 ? 5 : 0;
    return Math.min(100, hopBonus + modeBonus + geoBonus);
  }, [selectedServers, tunnelMode, geoScore]);

  const securityLabel = useMemo(() => {
    if (securityRating >= 90) return { label: 'Maximum',   color: '#9C27B0' };
    if (securityRating >= 70) return { label: 'Very High', color: '#2196F3' };
    if (securityRating >= 50) return { label: 'High',      color: '#4CAF50' };
    if (securityRating >= 30) return { label: 'Standard',  color: '#FF9800' };
    return                           { label: 'Basic',      color: '#9E9E9E' };
  }, [securityRating]);

  const filteredServers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return servers.filter(s =>
      !q || s.name.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) || s.country.toLowerCase().includes(q));
  }, [servers, searchQuery]);

  const uniqueCountries = useMemo(() =>
    [...new Set(servers.map(s => s.country))].sort(), [servers]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAddServer = useCallback((server) => {
    if (selectedServers.length >= 4 || selectedServers.find(s => s.id === server.id)) return;
    onServersChange([...selectedServers, server]);
    setAutoBuilt(false); setActivePreset(null);
  }, [selectedServers, onServersChange]);

  const handleRemoveServer = useCallback((serverId) => {
    onServersChange(selectedServers.filter(s => s.id !== serverId));
    setAutoBuilt(false); setActivePreset(null);
  }, [selectedServers, onServersChange]);

  const handleClearChain = useCallback(() => {
    onServersChange([]); setActivePreset(null); setAutoBuilt(false);
  }, [onServersChange]);

  const handleMoveHop = useCallback((fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= selectedServers.length) return;
    const next = [...selectedServers];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onServersChange(next);
  }, [selectedServers, onServersChange]);

  const handleSetProtocol = useCallback((serverId, proto) => {
    setHopProtocols(prev => ({ ...prev, [serverId]: proto }));
  }, []);

  const applyPreset = useCallback((preset) => {
    const picked = preset.countries.map(code => {
      const matching = servers.filter(s => s.country === code);
      if (!matching.length) return null;
      return matching.reduce((best, s) => parseInt(s.ping, 10) < parseInt(best.ping, 10) ? s : best);
    }).filter(Boolean).slice(0, 4);
    if (picked.length === 0) {
      setPresetWarnMsg(`No servers available for “${preset.name}” — ensure servers with multi-hop support are loaded.`);
      return;
    }
    if (picked.length < preset.countries.length) {
      setPresetWarnMsg(`“${preset.name}” applied with ${picked.length}/${preset.countries.length} hops — some countries have no available servers.`);
    } else {
      setPresetWarnMsg('');
    }
    setActivePreset(preset.id);
    setTunnelMode(preset.mode);
    onServersChange(picked);
  }, [servers, onServersChange]);

  const handleAutoBuild = useCallback(() => {
    const sorted = [...servers].sort((a, b) => parseInt(a.ping, 10) - parseInt(b.ping, 10));
    const used = new Set(); const chain = [];
    for (const s of sorted) {
      if (!used.has(s.country)) { chain.push(s); used.add(s.country); }
      if (chain.length === 3) break;
    }
    onServersChange(chain); setAutoBuilt(true); setActivePreset(null);
  }, [servers, onServersChange]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const handleDragStart = (_, idx) => setDraggedIdx(idx);
  const handleDragOver  = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop      = (e, idx) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== idx) handleMoveHop(draggedIdx, idx);
    setDraggedIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd   = () => { setDraggedIdx(null); setDragOverIdx(null); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="multi-hop">

      {/* Header */}
      <div className="mh-header">
        <div className="mh-title-group">
          <h3>🔗 Multi-Hop Tunnel</h3>
          <span className="mh-subtitle">Chain up to 4 servers for layered anonymity</span>
        </div>
        <div className="mh-header-actions">
          {selectedServers.length > 0 && !isConnected &&
            <button className="mh-btn-ghost" onClick={handleClearChain}>✕ Clear</button>}
          {!isConnected &&
            <button className="mh-btn-accent" onClick={handleAutoBuild}>✨ Auto-Build</button>}
        </div>
      </div>

      {/* Security score row */}
      <div className="mh-score-row">
        <div className="mh-score-card">
          <span className="mh-score-icon">🛡️</span>
          <div className="mh-score-info">
            <span className="mh-score-label">Security Rating</span>
            <div className="mh-score-bar-wrap">
              <div className="mh-score-bar" style={{ width: `${securityRating}%`, background: securityLabel.color }} />
            </div>
          </div>
          <span className="mh-score-val" style={{ color: securityLabel.color }}>{securityLabel.label}</span>
        </div>
        <div className="mh-stat-pill">
          <span>⏱</span>
          <div><span className="mh-stat-num" style={{ color: getLatencyColor(totalLatency) }}>{totalLatency}ms</span>
          <span className="mh-stat-lbl">Added latency</span></div>
        </div>
        <div className="mh-stat-pill">
          <span>🔐</span>
          <div><span className="mh-stat-num">{encryptionLayers}</span>
          <span className="mh-stat-lbl">Encryption layer{encryptionLayers !== 1 ? 's' : ''}</span></div>
        </div>
        <div className="mh-stat-pill">
          <span>🌍</span>
          <div><span className="mh-stat-num">{new Set(selectedServers.map(s => s.country)).size}</span>
          <span className="mh-stat-lbl">Countries</span></div>
        </div>
        {estimatedBandwidth !== null && (
          <div className="mh-stat-pill">
            <span>📶</span>
            <div><span className="mh-stat-num">{fmtBandwidth(estimatedBandwidth)}</span>
            <span className="mh-stat-lbl">Est. throughput</span></div>
          </div>
        )}
        <div className="mh-stat-pill">
          <span>🗺️</span>
          <div><span className="mh-stat-num">{geoScore}%</span>
          <span className="mh-stat-lbl">Geo diversity</span></div>
        </div>
      </div>

      {/* Tunnel mode */}
      <div className="mh-section">
        <div className="mh-section-title">Tunnel Mode</div>
        <div className="mh-mode-grid">
          {TUNNEL_MODES.map(mode => (
            <label key={mode.id} className={`mh-mode-card${tunnelMode === mode.id ? ' selected' : ''}${isConnected ? ' disabled' : ''}`}>
              <input type="radio" name="tunnelMode" value={mode.id}
                checked={tunnelMode === mode.id} disabled={isConnected}
                onChange={() => setTunnelMode(mode.id)} />
              <div className="mh-mode-icon">{mode.icon}</div>
              <div className="mh-mode-info">
                <span className="mh-mode-name">{mode.name}</span>
                {mode.badge && <span className="mh-mode-badge">{mode.badge}</span>}
                <span className="mh-mode-desc">{mode.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Connection chain */}
      <div className="mh-section">
        <div className="mh-section-title">
          Connection Chain
          {autoBuilt && <span className="mh-auto-tag">✨ Auto-built</span>}
        </div>
        {selectedServers.length === 0 ? (
          <div className="mh-empty-chain">
            <span className="mh-empty-icon">🔗</span>
            <p>No servers in chain. Use ✨ Auto-Build, apply a preset, or pick servers below.</p>
          </div>
        ) : (
          <div className="mh-chain-wrapper">
            <div className="mh-endpoint-node">
              <div className="mh-endpoint-icon">💻</div>
              <span>You</span>
            </div>
            {selectedServers.map((server, idx) => {
              const proto     = hopProtocols[server.id] || 'wireguard';
              const protoMeta = HOP_PROTOCOLS.find(p => p.id === proto);
              const lat       = parseInt(server.ping, 10);
              return (
                <React.Fragment key={server.id}>
                  <div className={`mh-chain-arrow${tunnelMode === 'nested' ? ' layered' : ''}`}>
                    {tunnelMode === 'nested' ? '🔒→' : '→'}
                  </div>
                  <div
                    className={`mh-hop-card${dragOverIdx === idx ? ' drag-over' : ''}${draggedIdx === idx ? ' dragging' : ''}`}
                    draggable={!isConnected}
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDrop={e => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    ref={el => (hopRefs.current[idx] = el)}
                  >
                    <div className="mh-hop-badge">{idx === 0 ? 'Entry' : idx === selectedServers.length - 1 ? 'Exit' : `Hop ${idx + 1}`}</div>
                    {!isConnected && <div className="mh-hop-drag-hint">⠿</div>}
                    <span className="mh-hop-flag">{server.flag}</span>
                    <div className="mh-hop-name">{server.name}</div>
                    <div className="mh-hop-loc">{server.location}</div>
                    <div className="mh-hop-stats-row">
                      <span className="mh-hop-ping" style={{ color: getLatencyColor(lat) }}>{server.ping}</span>
                      <span className="mh-hop-load">{server.load}%</span>
                    </div>
                    {!isConnected && (
                      <div className="mh-proto-row">
                        {HOP_PROTOCOLS.map(p => (
                          <button key={p.id}
                            className={`mh-proto-btn${proto === p.id ? ' active' : ''}`}
                            style={proto === p.id ? { borderColor: p.color, color: p.color } : {}}
                            onClick={() => handleSetProtocol(server.id, p.id)}
                            title={p.name}
                          >{p.icon} {p.name}</button>
                        ))}
                      </div>
                    )}
                    {isConnected && (
                      <div className="mh-hop-connected-proto" style={{ color: protoMeta?.color }}>
                        {protoMeta?.icon} {protoMeta?.name}
                      </div>
                    )}
                    {!isConnected && (
                      <div className="mh-hop-controls">
                        <button className="mh-hop-ctrl" title="Move up"    disabled={idx === 0}                           onClick={() => handleMoveHop(idx, idx - 1)}>↑</button>
                        <button className="mh-hop-ctrl" title="Move down"  disabled={idx === selectedServers.length - 1}  onClick={() => handleMoveHop(idx, idx + 1)}>↓</button>
                        <button className="mh-hop-ctrl remove" title="Remove"                                              onClick={() => handleRemoveServer(server.id)}>✕</button>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            <div className="mh-chain-arrow">→</div>
            <div className="mh-endpoint-node">
              <div className="mh-endpoint-icon">🌐</div>
              <span>Internet</span>
            </div>
            {!isConnected && selectedServers.length < 4 && (
              <>
                <div className="mh-chain-arrow muted">→</div>
                <div className="mh-add-slot">
                  <span>+</span>
                  <span className="mh-add-label">Add Hop</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Latency breakdown */}
      {selectedServers.length > 0 && (
        <div className="mh-section">
          <div className="mh-section-title">Latency Breakdown</div>
          <div className="mh-latency-bars">
            {selectedServers.map((s, i) => {
              const lat = parseInt(s.ping, 10);
              const pct = totalLatency > 0 ? Math.round((lat / totalLatency) * 100) : 0;
              return (
                <div key={s.id} className="mh-lat-row">
                  <span className="mh-lat-name">{s.flag} {i === 0 ? 'Entry' : i === selectedServers.length - 1 ? 'Exit' : `Hop ${i + 1}`}</span>
                  <div className="mh-lat-bar-wrap"><div className="mh-lat-bar" style={{ width: `${pct}%`, background: getLatencyColor(lat) }} /></div>
                  <span className="mh-lat-val" style={{ color: getLatencyColor(lat) }}>{s.ping}</span>
                </div>
              );
            })}
            <div className="mh-lat-row total">
              <span className="mh-lat-name">Total</span>
              <div className="mh-lat-bar-wrap"><div className="mh-lat-bar full" /></div>
              <span className="mh-lat-val" style={{ color: getLatencyColor(totalLatency) }}>{totalLatency}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Nested encryption stack */}
      {tunnelMode === 'nested' && selectedServers.length > 0 && (
        <div className="mh-section">
          <div className="mh-section-title">Encryption Layer Stack</div>
          <div className="mh-layer-stack">
            {[...selectedServers].reverse().map((s, i) => (
              <div key={s.id} className="mh-layer" style={{ '--depth': i, '--total': selectedServers.length }}>
                <span className="mh-layer-num"># Layer {selectedServers.length - i}</span>
                <span>{s.flag} {s.name}</span>
                <span className="mh-layer-cipher">AES-256-GCM</span>
              </div>
            ))}
          </div>
          <p className="mh-layer-note">
            Traffic is encrypted {selectedServers.length}× before leaving your device.
            Each server can only see its adjacent hops — never both endpoints simultaneously.
          </p>
        </div>
      )}

      {/* Presets */}
      {!isConnected && (
        <div className="mh-section">
          <div className="mh-section-header" onClick={() => setShowPresets(v => !v)}>
            <div className="mh-section-title" style={{ margin: 0 }}>Quick Presets</div>
            <span className="mh-toggle-caret">{showPresets ? '▲' : '▼'}</span>
          </div>
          {showPresets && (
            <div className="mh-preset-grid">
              {PRESETS.map(p => (
                <button key={p.id}
                  className={`mh-preset-card${activePreset === p.id ? ' active' : ''}`}
                  style={{ '--p-color': p.color }}
                  onClick={() => applyPreset(p)}
                >
                  <span className="mh-preset-icon">{p.icon}</span>
                  <span className="mh-preset-name">{p.name}</span>
                  <span className="mh-preset-desc">{p.desc}</span>
                  <div className="mh-preset-tags">{p.tags.map(t => <span key={t} className="mh-tag">{t}</span>)}</div>
                  {activePreset === p.id && <span className="mh-preset-check">✓</span>}
                </button>
              ))}
            </div>
          )}
          {presetWarnMsg && (
            <p className="mh-preset-warn">⚠️ {presetWarnMsg}</p>
          )}
        </div>
      )}

      {/* Advanced options */}
      {!isConnected && (
        <div className="mh-section">
          <div className="mh-section-header" onClick={() => setShowAdvanced(v => !v)}>
            <div className="mh-section-title" style={{ margin: 0 }}>⚙️ Advanced Options</div>
            <span className="mh-toggle-caret">{showAdvanced ? '▲' : '▼'}</span>
          </div>
          {showAdvanced && (
            <div className="mh-advanced-panel">
              <div className="mh-adv-row">
                <div className="mh-adv-label">
                  <span>🚪 Entry Country Lock</span>
                  <span className="mh-adv-hint">Always enter the chain from this country</span>
                </div>
                <select className="mh-adv-select" value={entryLock} onChange={e => setEntryLock(e.target.value)}>
                  <option value="">Any country</option>
                  {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="mh-adv-row">
                <div className="mh-adv-label">
                  <span>🏁 Exit Country Lock</span>
                  <span className="mh-adv-hint">Always exit the chain from this country</span>
                </div>
                <select className="mh-adv-select" value={exitLock} onChange={e => setExitLock(e.target.value)}>
                  <option value="">Any country</option>
                  {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Server picker */}
      {!isConnected && (
        <div className="mh-section">
          <div className="mh-section-title">
            Add Servers
            <span className="mh-hops-remaining">{selectedServers.length}/4 hops</span>
          </div>
          <input className="mh-search" type="text"
            placeholder="🔍  Search by name, city or country…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} />
          <div className="mh-server-grid">
            {filteredServers.map(server => {
              const isSelected = !!selectedServers.find(s => s.id === server.id);
              const isFull     = selectedServers.length >= 4;
              const pingMs     = parseInt(server.ping, 10);
              return (
                <div key={server.id}
                  className={`mh-server-card${isSelected ? ' selected' : ''}${isFull && !isSelected ? ' disabled' : ''}`}
                  onClick={() => (!isFull && !isSelected) && handleAddServer(server)}
                >
                  <div className="mh-srv-row">
                    <span className="mh-srv-flag">{server.flag}</span>
                    <div className="mh-srv-info">
                      <span className="mh-srv-name">{server.name}</span>
                      <span className="mh-srv-loc">{server.location}</span>
                    </div>
                    {isSelected && <span className="mh-srv-check">✓</span>}
                  </div>
                  <div className="mh-srv-metrics">
                    <span className="mh-srv-ping" style={{ color: getLatencyColor(pingMs) }}>{server.ping}</span>
                    <div className="mh-srv-load-bar">
                      <div style={{ width: `${server.load}%`, background: server.load > 80 ? '#f44336' : server.load > 50 ? '#FF9800' : '#4CAF50' }} />
                    </div>
                    <span className="mh-srv-load-val">{server.load}%</span>
                  </div>
                </div>
              );
            })}
            {filteredServers.length === 0 && <div className="mh-no-results">No servers match your search.</div>}
          </div>
        </div>
      )}

      {/* Notes */}
      {selectedServers.length > 0 && (
        <div className="mh-notes">
          <strong>ℹ️ Notes</strong>
          <ul>
            {tunnelMode === 'nested'   && <li>Nested mode wraps each hop in a separate AES-256-GCM envelope — maximum anonymity, ~40% higher overhead.</li>}
            {tunnelMode === 'rotating' && <li>Auto-Rotating mode swaps entry/exit nodes every 10 min to defeat long-term traffic analysis.</li>}
            <li>Each hop prevents any single server from knowing both your identity and your destination.</li>
            {selectedServers.length >= 3 && <li>3+ hops: even a compromised middle server cannot correlate traffic unless first and last nodes collude.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiHop;
