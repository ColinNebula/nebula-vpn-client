import React, { useState, useCallback, useMemo, useRef } from 'react';
import './FirewallManager.css';

// ── Target types ──────────────────────────────────────────────────────────────
const TARGET_TYPES = [
  { value: 'domain',   label: 'Domain',        placeholder: 'e.g., facebook.com or *.ads.com' },
  { value: 'ip',       label: 'IP Address',    placeholder: 'e.g., 1.2.3.4' },
  { value: 'cidr',     label: 'IP Range (CIDR)',placeholder: 'e.g., 192.168.1.0/24' },
  { value: 'port',     label: 'Port',          placeholder: 'e.g., 80' },
  { value: 'portrange',label: 'Port Range',    placeholder: 'e.g., 8080-8090' },
];

// ── Validation helpers ────────────────────────────────────────────────────────
function validateTarget(type, value) {
  if (!value.trim()) return 'Target value is required.';
  switch (type) {
    case 'domain':
      if (!/^(\*\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(value.trim()))
        return 'Enter a valid domain, e.g. facebook.com or *.ads.com';
      break;
    case 'ip':
      if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value.trim()))
        return 'Enter a valid IPv4 address, e.g. 1.2.3.4';
      break;
    case 'cidr':
      if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(value.trim()))
        return 'Enter a valid CIDR range, e.g. 192.168.1.0/24';
      break;
    case 'port': {
      const p = Number(value.trim());
      if (!Number.isInteger(p) || p < 1 || p > 65535)
        return 'Port must be an integer between 1 and 65535';
      break;
    }
    case 'portrange': {
      const parts = value.trim().split('-');
      if (parts.length !== 2 || parts.some(p => !Number.isInteger(Number(p))))
        return 'Enter a range as start-end, e.g. 8080-8090';
      const [lo, hi] = parts.map(Number);
      if (lo < 1 || hi > 65535 || lo >= hi)
        return 'Invalid port range (1–65535, start must be less than end)';
      break;
    }
    default: break;
  }
  return null;
}

function formatTarget(type, value) {
  if (type === 'port')      return `port:${value.trim()}`;
  if (type === 'portrange') return `ports:${value.trim()}`;
  return value.trim();
}

// ── Template presets ──────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'social-media',
    name: '🚫 Block Social Media',
    description: 'Block major social media platforms',
    color: '#F44336',
    rules: [
      { name: 'Block Facebook',  action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'facebook.com' },
      { name: 'Block Instagram', action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'instagram.com' },
      { name: 'Block TikTok',    action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'tiktok.com' },
      { name: 'Block X / Twitter', action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'x.com' },
    ],
  },
  {
    id: 'ads-trackers',
    name: '🛡️ Block Ads & Trackers',
    description: 'Block major advertising and analytics domains',
    color: '#FF9800',
    rules: [
      { name: 'Block DoubleClick',    action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'doubleclick.net' },
      { name: 'Block Google Ads',     action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'googleadservices.com' },
      { name: 'Block Analytics',      action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'google-analytics.com' },
      { name: 'Block Ad Exchange',    action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'adnxs.com' },
      { name: 'Block Facebook Pixel', action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'connect.facebook.net' },
    ],
  },
  {
    id: 'gaming',
    name: '🎮 Gaming Optimized',
    description: 'Allow game traffic, block telemetry & background updates',
    color: '#9C27B0',
    rules: [
      { name: 'Allow Steam',         action: 'allow', protocol: 'tcp', direction: 'both',     targetType: 'domain', target: 'steampowered.com' },
      { name: 'Block Steam Updates', action: 'block', protocol: 'tcp', direction: 'outbound', targetType: 'portrange', target: 'ports:27030-27040' },
      { name: 'Allow Game Ports',    action: 'allow', protocol: 'udp', direction: 'both',     targetType: 'portrange', target: 'ports:7000-8000' },
    ],
  },
  {
    id: 'work-mode',
    name: '🏢 Work Mode',
    description: 'Block entertainment & social during work hours',
    color: '#2196F3',
    rules: [
      { name: 'Block YouTube',   action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'youtube.com' },
      { name: 'Block Netflix',   action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'netflix.com' },
      { name: 'Block Reddit',    action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'reddit.com' },
      { name: 'Block Twitch',    action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: 'twitch.tv' },
    ],
  },
  {
    id: 'parental',
    name: '👨‍👩‍👧 Parental Control',
    description: 'Block adult content categories',
    color: '#E91E63',
    rules: [
      { name: 'Block Adult Content', action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: '*.xxx' },
      { name: 'Block Adult Sites',   action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain', target: '*.adult.com' },
    ],
  },
  {
    id: 'max-security',
    name: '🔒 Maximum Security',
    description: 'Strict policy — allow only HTTPS/DNS, block everything else',
    color: '#607D8B',
    rules: [
      { name: 'Allow HTTPS',       action: 'allow', protocol: 'tcp', direction: 'outbound', targetType: 'port', target: 'port:443' },
      { name: 'Allow DNS',         action: 'allow', protocol: 'udp', direction: 'outbound', targetType: 'port', target: 'port:53' },
      { name: 'Allow DoH',         action: 'allow', protocol: 'tcp', direction: 'outbound', targetType: 'port', target: 'port:853' },
      { name: 'Block All Inbound', action: 'block', protocol: 'all', direction: 'inbound',  targetType: 'cidr', target: '0.0.0.0/0' },
      { name: 'Block HTTP',        action: 'block', protocol: 'tcp', direction: 'outbound', targetType: 'port', target: 'port:80' },
    ],
  },
];

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', action: 'block', protocol: 'all',
  direction: 'outbound', targetType: 'domain', target: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const actionBadge   = (a) => a === 'block' ? { icon: '🚫', cls: 'badge-block' } : { icon: '✅', cls: 'badge-allow' };
const directionIcon = (d) => ({ outbound: '⬆️', inbound: '⬇️', both: '↕️' }[d] || '↕️');
const nextId        = () => Date.now() + '_' + Math.random().toString(36).slice(2, 6);

// ── Component ─────────────────────────────────────────────────────────────────
const FirewallManager = ({ isConnected = false }) => {
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [defaultPolicy, setDefaultPolicy]     = useState('allow'); // allow | block
  const [rules, setRules] = useState([
    { id: nextId(), name: 'Block Facebook',      action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain',   target: 'facebook.com',        enabled: true  },
    { id: nextId(), name: 'Allow Local Network', action: 'allow', protocol: 'all', direction: 'both',     targetType: 'cidr',     target: '192.168.1.0/24',      enabled: true  },
    { id: nextId(), name: 'Block Ad Trackers',   action: 'block', protocol: 'tcp', direction: 'outbound', targetType: 'domain',   target: 'doubleclick.net',     enabled: true  },
    { id: nextId(), name: 'Allow HTTPS',         action: 'allow', protocol: 'tcp', direction: 'outbound', targetType: 'port',     target: 'port:443',            enabled: true  },
    { id: nextId(), name: 'Block Telemetry',     action: 'block', protocol: 'all', direction: 'outbound', targetType: 'domain',   target: 'telemetry.microsoft.com', enabled: false },
  ]);

  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [search,     setSearch]     = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [appliedTemplates, setAppliedTemplates] = useState(new Set());
  const [toast,      setToast]      = useState(null);
  const [dragIdx,    setDragIdx]    = useState(null);
  const [dragOverIdx,setDragOverIdx]= useState(null);
  const [threatLog,  setThreatLog]  = useState([
    { id: 1, rule: 'Block Facebook',    target: '31.13.72.36',     action: 'blocked', time: '2026-03-12 09:14:02', protocol: 'TCP' },
    { id: 2, rule: 'Block Ad Trackers', target: 'doubleclick.net', action: 'blocked', time: '2026-03-12 09:12:55', protocol: 'TCP' },
    { id: 3, rule: 'Allow HTTPS',       target: 'api.github.com',  action: 'allowed', time: '2026-03-12 09:11:30', protocol: 'TCP' },
  ]);
  const [showLog, setShowLog] = useState(false);
  const formRef = useRef(null);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeRules  = useMemo(() => rules.filter(r => r.enabled).length, [rules]);
  const blockRules   = useMemo(() => rules.filter(r => r.action === 'block').length, [rules]);
  const allowRules   = useMemo(() => rules.filter(r => r.action === 'allow').length, [rules]);
  const blockedToday = useMemo(() => threatLog.filter(l => l.action === 'blocked').length, [threatLog]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredRules = useMemo(() => {
    const q = search.toLowerCase();
    return rules.filter(r => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.target.toLowerCase().includes(q);
      const matchAction = filterAction === 'all' || r.action === filterAction;
      return matchSearch && matchAction;
    });
  }, [rules, search, filterAction]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Rule CRUD ─────────────────────────────────────────────────────────────
  const toggleRule = useCallback((id) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)), []);

  const deleteRule = useCallback((id) => {
    setRules(prev => prev.filter(r => r.id !== id));
    showToast('Rule deleted.', 'info');
  }, [showToast]);

  const moveRule = useCallback((id, dir) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }, []);

  // ── Form ──────────────────────────────────────────────────────────────────
  const openCreateForm = () => {
    setEditingId(null); setFormData(EMPTY_FORM); setFormErrors({}); setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const openEditForm = (rule) => {
    setEditingId(rule.id);
    setFormData({ name: rule.name, action: rule.action, protocol: rule.protocol,
                  direction: rule.direction, targetType: rule.targetType || 'domain', target: rule.target });
    setFormErrors({}); setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormErrors({}); };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Rule name is required.';
    const targetErr = validateTarget(formData.targetType, formData.target);
    if (targetErr) errors.target = targetErr;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRule = () => {
    if (!validateForm()) return;
    const target = formData.targetType === 'port' || formData.targetType === 'portrange'
      ? formatTarget(formData.targetType, formData.target)
      : formData.target.trim();
    if (editingId !== null) {
      setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...formData, target } : r));
      showToast(`Rule "${formData.name}" updated.`);
    } else {
      setRules(prev => [...prev, { id: nextId(), ...formData, target, enabled: true }]);
      showToast(`Rule "${formData.name}" created.`);
    }
    cancelForm();
  };

  // ── Templates ─────────────────────────────────────────────────────────────
  const applyTemplate = useCallback((tpl) => {
    const newRules = tpl.rules.map(r => ({ id: nextId(), ...r, enabled: true }));
    setRules(prev => [...prev, ...newRules]);
    setAppliedTemplates(prev => new Set(prev).add(tpl.id));
    showToast(`"${tpl.name}" applied — ${newRules.length} rule(s) added.`);
  }, [showToast]);

  // ── Drag-and-drop reorder ─────────────────────────────────────────────────
  const handleDragStart = (e, idx) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver  = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop      = (e, idx) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      setRules(prev => {
        const copy = [...prev];
        const [moved] = copy.splice(dragIdx, 1);
        copy.splice(idx, 0, moved);
        return copy;
      });
    }
    setDragIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // ── Simulate a block event (test button) ─────────────────────────────────
  const simulateBlock = useCallback((rule) => {
    const entry = {
      id: Date.now(), rule: rule.name,
      target: rule.target, action: rule.enabled && firewallEnabled ? rule.action : 'bypassed',
      time: new Date().toLocaleString(), protocol: rule.protocol.toUpperCase(),
    };
    setThreatLog(prev => [entry, ...prev.slice(0, 99)]);
    showToast(`Simulated: "${rule.name}" → ${entry.action}`, 'info');
  }, [firewallEnabled, showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="firewall-manager">

      {/* Toast */}
      {toast && (
        <div className={`fw-toast fw-toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'} {toast.msg}
        </div>
      )}

      <div className="firewall-header">
        <h3>🔥 Firewall Manager</h3>
        <span className="fw-header-sub">Rule-based traffic control with real-time monitoring</span>
      </div>

      {/* Status Banner */}
      <div className={`firewall-status ${firewallEnabled ? 'active' : 'inactive'}`}>
        <div className="status-content">
          <div className="status-info">
            <span className="status-icon">{firewallEnabled ? '🛡️' : '⚠️'}</span>
            <div>
              <h4>Firewall {firewallEnabled ? 'Active' : 'Inactive'}</h4>
              <p>
                {firewallEnabled
                  ? `${activeRules} of ${rules.length} rules enforced — default policy: ${defaultPolicy.toUpperCase()} all`
                  : 'All rules suspended — traffic passes without filtering'}
              </p>
            </div>
          </div>
          <div className="status-right">
            <div className="default-policy">
              <span className="policy-label">Default policy</span>
              <select
                className="policy-select"
                value={defaultPolicy}
                onChange={e => setDefaultPolicy(e.target.value)}
                disabled={!firewallEnabled}
              >
                <option value="allow">Allow all</option>
                <option value="block">Block all</option>
              </select>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={firewallEnabled}
                onChange={() => setFirewallEnabled(v => !v)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="fw-stats-row">
        <div className="fw-stat-card">
          <span className="fw-stat-val">{rules.length}</span>
          <span className="fw-stat-lbl">Total Rules</span>
        </div>
        <div className="fw-stat-card green">
          <span className="fw-stat-val">{activeRules}</span>
          <span className="fw-stat-lbl">Active</span>
        </div>
        <div className="fw-stat-card red">
          <span className="fw-stat-val">{blockRules}</span>
          <span className="fw-stat-lbl">Block Rules</span>
        </div>
        <div className="fw-stat-card blue">
          <span className="fw-stat-val">{allowRules}</span>
          <span className="fw-stat-lbl">Allow Rules</span>
        </div>
        <div className="fw-stat-card orange">
          <span className="fw-stat-val">{blockedToday}</span>
          <span className="fw-stat-lbl">Events Logged</span>
        </div>
      </div>

      {/* Templates */}
      <div className="templates-section">
        <h4>📋 Quick Templates</h4>
        <p className="section-description">Apply pre-configured rule sets for common scenarios</p>
        <div className="templates-grid">
          {TEMPLATES.map(tpl => {
            const applied = appliedTemplates.has(tpl.id);
            return (
              <div key={tpl.id} className={`template-card ${applied ? 'applied' : ''}`}
                style={{ '--tpl-color': tpl.color }}>
                <div className="template-header">
                  <span className="template-name">{tpl.name}</span>
                  <span className="template-badge">{tpl.rules.length} rules</span>
                </div>
                <p className="template-description">{tpl.description}</p>
                <button className={`apply-btn ${applied ? 'applied' : ''}`}
                  onClick={() => applyTemplate(tpl)} disabled={!firewallEnabled}>
                  {applied ? '✓ Applied — Add Again' : 'Apply Template'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules Section */}
      <div className="rules-section">
        <div className="rules-header">
          <h4>⚙️ Custom Rules ({filteredRules.length}{search || filterAction !== 'all' ? ' filtered' : ` / ${rules.length}`})</h4>
          <div className="rules-header-actions">
            <input className="fw-search" type="text" placeholder="Search rules…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="fw-filter-select" value={filterAction}
              onChange={e => setFilterAction(e.target.value)}>
              <option value="all">All</option>
              <option value="block">Block only</option>
              <option value="allow">Allow only</option>
            </select>
            <button className="add-rule-btn" onClick={showForm ? cancelForm : openCreateForm}
              disabled={!firewallEnabled}>
              {showForm && !editingId ? '✕ Cancel' : '+ Add Rule'}
            </button>
          </div>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div className="add-rule-form" ref={formRef}>
            <h5>{editingId ? '✏️ Edit Rule' : '➕ New Rule'}</h5>

            <div className="form-row">
              <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
                <label>Rule Name</label>
                <input type="text" placeholder="e.g., Block Twitter"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Action</label>
                <select value={formData.action}
                  onChange={e => setFormData(p => ({ ...p, action: e.target.value }))}>
                  <option value="block">🚫 Block</option>
                  <option value="allow">✅ Allow</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Protocol</label>
                <select value={formData.protocol}
                  onChange={e => setFormData(p => ({ ...p, protocol: e.target.value }))}>
                  <option value="all">All</option>
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="icmp">ICMP</option>
                </select>
              </div>
              <div className="form-group">
                <label>Direction</label>
                <select value={formData.direction}
                  onChange={e => setFormData(p => ({ ...p, direction: e.target.value }))}>
                  <option value="outbound">⬆️ Outbound</option>
                  <option value="inbound">⬇️ Inbound</option>
                  <option value="both">↕️ Both</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Target Type</label>
                <select value={formData.targetType}
                  onChange={e => setFormData(p => ({ ...p, targetType: e.target.value, target: '' }))}>
                  {TARGET_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className={`form-group ${formErrors.target ? 'has-error' : ''}`}>
                <label>Target Value</label>
                <input type="text"
                  placeholder={TARGET_TYPES.find(t => t.value === formData.targetType)?.placeholder}
                  value={formData.target}
                  onChange={e => setFormData(p => ({ ...p, target: e.target.value }))} />
                {formErrors.target && <span className="field-error">{formErrors.target}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={handleSaveRule}>
                {editingId ? '✏️ Update Rule' : '💾 Save Rule'}
              </button>
              <button className="cancel-btn" onClick={cancelForm}>Cancel</button>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="rules-list">
          {filteredRules.length === 0 ? (
            <div className="no-rules">
              <span className="no-rules-icon">📋</span>
              <p>{rules.length === 0 ? 'No rules yet. Add one or apply a template.' : 'No rules match your filter.'}</p>
            </div>
          ) : (
            filteredRules.map((rule, idx) => {
              const badge = actionBadge(rule.action);
              return (
                <div key={rule.id}
                  className={`rule-item ${!rule.enabled ? 'disabled' : ''} ${dragOverIdx === idx ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Priority column */}
                  <div className="rule-priority">
                    <button className="priority-btn" onClick={() => moveRule(rule.id, -1)}
                      disabled={idx === 0} title="Move up">▲</button>
                    <span className="priority-num">{idx + 1}</span>
                    <button className="priority-btn" onClick={() => moveRule(rule.id, 1)}
                      disabled={idx === filteredRules.length - 1} title="Move down">▼</button>
                    <span className="drag-handle" title="Drag to reorder">⠿</span>
                  </div>

                  <div className="rule-main">
                    <div className="rule-info">
                      <div className="rule-name-row">
                        <span className={`action-badge ${badge.cls}`}>{badge.icon} {rule.action.toUpperCase()}</span>
                        <span className="rule-name">{rule.name}</span>
                        {!rule.enabled && <span className="disabled-badge">Disabled</span>}
                      </div>
                      <div className="rule-details">
                        <span className="detail-pill">{rule.protocol.toUpperCase()}</span>
                        <span className="detail-pill">{directionIcon(rule.direction)} {rule.direction}</span>
                        <span className="detail-pill target-pill">🎯 {rule.target}</span>
                      </div>
                    </div>
                    <div className="rule-actions">
                      <button className="fw-icon-btn test-btn" title="Simulate this rule"
                        onClick={() => simulateBlock(rule)} disabled={!firewallEnabled}>▶</button>
                      <button className="fw-icon-btn edit-btn" title="Edit this rule"
                        onClick={() => openEditForm(rule)} disabled={!firewallEnabled}>✏️</button>
                      <label className="toggle-switch small">
                        <input type="checkbox" checked={rule.enabled}
                          onChange={() => toggleRule(rule.id)} disabled={!firewallEnabled} />
                        <span className="toggle-slider"></span>
                      </label>
                      <button className="fw-icon-btn delete-btn" title="Delete rule"
                        onClick={() => deleteRule(rule.id)} disabled={!firewallEnabled}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Event Log */}
      <div className="rules-section">
        <div className="rules-header">
          <h4>📜 Event Log ({threatLog.length})</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="add-rule-btn" style={{ background: 'var(--text-secondary,#666)' }}
              onClick={() => setShowLog(v => !v)}>
              {showLog ? 'Hide' : 'Show'}
            </button>
            {threatLog.length > 0 && (
              <button className="add-rule-btn" style={{ background: '#F44336' }}
                onClick={() => { setThreatLog([]); showToast('Log cleared.', 'info'); }}>
                Clear
              </button>
            )}
          </div>
        </div>
        {showLog && (
          <div className="fw-log-list">
            {threatLog.length === 0 ? (
              <div className="no-rules"><p>No events yet.</p></div>
            ) : (
              threatLog.slice(0, 50).map(entry => (
                <div key={entry.id} className={`fw-log-entry ${entry.action === 'blocked' ? 'log-blocked' : entry.action === 'allowed' ? 'log-allowed' : 'log-bypassed'}`}>
                  <span className="log-action-icon">
                    {entry.action === 'blocked' ? '🚫' : entry.action === 'allowed' ? '✅' : '⚠️'}
                  </span>
                  <div className="log-details">
                    <span className="log-rule">{entry.rule}</span>
                    <span className="log-target">{entry.target} · {entry.protocol}</span>
                  </div>
                  <span className="log-time">{entry.time}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="firewall-info">
        <h4>ℹ️ How It Works</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🎯</span>
            <div>
              <h5>Priority Order</h5>
              <p>Rules are evaluated top-to-bottom. First match wins. Drag or use ▲▼ to reorder.</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🌐</span>
            <div>
              <h5>Target Types</h5>
              <p>Domain (site.com, *.ads.com), IP (1.2.3.4), CIDR (10.0.0.0/8), Port (443), Port Range (8080–8090)</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🔄</span>
            <div>
              <h5>Default Policy</h5>
              <p>Traffic that matches no rule falls through to the default policy — Allow all or Block all.</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">▶</span>
            <div>
              <h5>Test Button</h5>
              <p>Press ▶ on any rule to simulate a matching event and see it appear in the Event Log.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirewallManager;
