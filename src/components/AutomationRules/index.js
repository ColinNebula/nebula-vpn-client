import React, { useState, useCallback } from 'react';
import './AutomationRules.css';

// ---------------------------------------------------------------------------
// Template definitions — each template produces one or more rules
// ---------------------------------------------------------------------------
const TEMPLATES = [
  {
    id: 'smart-work',
    icon: '💼',
    title: 'Smart Work Mode',
    description: 'Auto-connect on weekdays at 9 AM, disconnect at 6 PM',
    rules: [
      {
        name: 'Work Hours Auto-Connect',
        trigger: { type: 'time', value: '09:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        action: { type: 'connect', server: 'US East' },
        conditions: [],
      },
      {
        name: 'After-Work Disconnect',
        trigger: { type: 'time', value: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        action: { type: 'disconnect', server: '' },
        conditions: [],
      },
    ],
  },
  {
    id: 'public-wifi',
    icon: '🛡️',
    title: 'Public WiFi Guard',
    description: 'Instantly connect & enable Kill Switch on any unsecured network',
    rules: [
      {
        name: 'Public WiFi Auto-Protect',
        trigger: { type: 'network', value: 'unsecured', ssid: '' },
        action: { type: 'connect', server: 'Fastest' },
        conditions: [],
      },
      {
        name: 'Public WiFi Kill Switch',
        trigger: { type: 'network', value: 'unsecured', ssid: '' },
        action: { type: 'enable_killswitch', server: '' },
        conditions: [],
      },
    ],
  },
  {
    id: 'traveler',
    icon: '🌍',
    title: 'Traveler Protection',
    description: 'Location-based server switching for best performance abroad',
    rules: [
      {
        name: 'Airport Auto-Connect',
        trigger: { type: 'network', value: 'public', ssid: '' },
        action: { type: 'connect', server: 'Fastest' },
        conditions: [],
      },
    ],
  },
  {
    id: 'gaming',
    icon: '🎮',
    title: 'Gaming Optimizer',
    description: 'Switch to low-latency server when a game launcher starts',
    rules: [
      {
        name: 'Game Launch VPN Switch',
        trigger: { type: 'app', value: 'Steam' },
        action: { type: 'switch', server: 'US West' },
        conditions: [],
      },
    ],
  },
  {
    id: 'battery-saver',
    icon: '🔋',
    title: 'Battery Saver',
    description: 'Disconnect VPN when battery is critically low',
    rules: [
      {
        name: 'Low Battery Disconnect',
        trigger: { type: 'battery', value: '10' },
        action: { type: 'disconnect', server: '' },
        conditions: [],
      },
    ],
  },
  {
    id: 'privacy-always-on',
    icon: '🔒',
    title: 'Always-On Privacy',
    description: 'Reconnect automatically if VPN drops unexpectedly',
    rules: [
      {
        name: 'VPN Drop Auto-Reconnect',
        trigger: { type: 'vpn_status', value: 'disconnected' },
        action: { type: 'connect', server: 'Fastest' },
        conditions: [],
      },
    ],
  },
];

const TRIGGER_TYPES = [
  { value: 'time',       label: '⏰ Time-based',       description: 'Trigger at specific times or intervals' },
  { value: 'network',    label: '📶 Network Change',    description: 'Trigger when network type changes' },
  { value: 'location',   label: '📍 Location-based',    description: 'Trigger based on GPS location' },
  { value: 'app',        label: '📱 App Launch',        description: 'Trigger when a specific app starts' },
  { value: 'traffic',    label: '📊 Traffic Threshold', description: 'Trigger at a data usage limit' },
  { value: 'battery',    label: '🔋 Battery Level',     description: 'Trigger at a battery percentage' },
  { value: 'vpn_status', label: '🔌 VPN Status Change', description: 'Trigger on VPN connect/disconnect events' },
  { value: 'interval',   label: '🔁 Interval',          description: 'Trigger on a repeating schedule' },
];

const ACTION_TYPES = [
  { value: 'connect',            label: '🔗 Connect VPN',           hasServer: true  },
  { value: 'disconnect',         label: '⚡ Disconnect VPN',         hasServer: false },
  { value: 'switch',             label: '🔄 Switch Server',          hasServer: true  },
  { value: 'enable_killswitch',  label: '🛡️ Enable Kill Switch',     hasServer: false },
  { value: 'disable_killswitch', label: '🔓 Disable Kill Switch',    hasServer: false },
  { value: 'enable_split',       label: '✂️ Enable Split Tunneling',  hasServer: false },
  { value: 'disable_split',      label: '🔗 Disable Split Tunneling', hasServer: false },
  { value: 'notify',             label: '🔔 Send Notification',      hasServer: false },
];

const SERVERS = ['Fastest', 'US East', 'US West', 'UK London', 'Germany', 'Japan', 'Singapore', 'Australia', 'Canada', 'Netherlands'];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EMPTY_RULE = {
  name: '',
  trigger: { type: 'time', value: '', days: [], ssid: '' },
  action: { type: 'connect', server: 'Fastest' },
  conditions: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getTriggerDisplay = (trigger) => {
  switch (trigger.type) {
    case 'time':       return `${trigger.value || '--:--'} (${trigger.days?.length ? trigger.days.join(', ') : 'Daily'})`;
    case 'network':    return trigger.value === 'unsecured' ? 'Any Unsecured Network'
                            : trigger.value === 'public'    ? 'Any Public Network'
                            : trigger.ssid                  ? `Network "${trigger.ssid}"`
                            : 'Network Change';
    case 'location':   return `Near ${trigger.value}`;
    case 'app':        return `When ${trigger.value} starts`;
    case 'traffic':    return `Usage exceeds ${trigger.value}`;
    case 'battery':    return `Battery below ${trigger.value}%`;
    case 'vpn_status': return `VPN ${trigger.value}`;
    case 'interval':   return `Every ${trigger.value}`;
    default:           return trigger.value;
  }
};

const getActionDisplay = (action) => {
  switch (action.type) {
    case 'connect':            return `Connect to ${action.server}`;
    case 'disconnect':         return 'Disconnect VPN';
    case 'switch':             return `Switch to ${action.server}`;
    case 'enable_killswitch':  return 'Enable Kill Switch';
    case 'disable_killswitch': return 'Disable Kill Switch';
    case 'enable_split':       return 'Enable Split Tunneling';
    case 'disable_split':      return 'Disable Split Tunneling';
    case 'notify':             return 'Send Notification';
    default:                   return action.type;
  }
};

const getTriggerIcon = (type) => {
  const icons = { time: '⏰', network: '📶', location: '📍', app: '📱', traffic: '📊', battery: '🔋', vpn_status: '🔌', interval: '🔁' };
  return icons[type] || '⚡';
};

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span className="toast-msg">{message}</span>
    <button className="toast-close" onClick={onClose}>×</button>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const AutomationRules = () => {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [showForm,          setShowForm]          = useState(false);
  const [editingId,         setEditingId]         = useState(null);
  const [formData,          setFormData]          = useState(EMPTY_RULE);
  const [formErrors,        setFormErrors]        = useState({});
  const [toast,             setToast]             = useState(null);
  const [filterType,        setFilterType]        = useState('all');
  const [appliedTemplates,  setAppliedTemplates]  = useState(new Set());

  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Work Hours Auto-Connect',
      trigger: { type: 'time', value: '09:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      action:  { type: 'connect', server: 'US East' },
      conditions: [],
      enabled: true,
    },
    {
      id: 2,
      name: 'Public WiFi Protection',
      trigger: { type: 'network', value: 'unsecured', ssid: '' },
      action:  { type: 'connect', server: 'Fastest' },
      conditions: [],
      enabled: true,
    },
    {
      id: 3,
      name: 'Home Network Disconnect',
      trigger: { type: 'network', value: 'specific', ssid: 'MyHomeWiFi' },
      action:  { type: 'disconnect', server: '' },
      conditions: [],
      enabled: false,
    },
  ]);

  const [triggerLog, setTriggerLog] = useState([
    { id: 1, rule: 'Work Hours Auto-Connect', triggered: '2026-02-25 09:00:15', action: 'Connected to US East',   success: true  },
    { id: 2, rule: 'Public WiFi Protection',  triggered: '2026-02-24 14:23:42', action: 'Connected to UK London', success: true  },
    { id: 3, rule: 'Home Network Disconnect', triggered: '2026-02-24 18:05:10', action: 'Disconnected from VPN',  success: false },
  ]);

  // ---- toast helpers -------------------------------------------------------
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ---- rule CRUD -----------------------------------------------------------
  const toggleRule = (id) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const deleteRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id));
    showToast('Rule deleted.', 'info');
  };

  const moveRule = (id, direction) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === id);
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const startEdit = (rule) => {
    setEditingId(rule.id);
    setFormData({
      name:       rule.name,
      trigger:    { ...rule.trigger },
      action:     { ...rule.action },
      conditions: [...(rule.conditions || [])],
    });
    setFormErrors({});
    setShowForm(true);
    setTimeout(() => document.querySelector('.add-rule-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_RULE);
    setFormErrors({});
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim())          errors.name    = 'Rule name is required.';
    if (!formData.trigger.value.trim()) errors.trigger = 'Trigger value is required.';
    if (formData.trigger.type === 'network' && formData.trigger.value === 'specific' && !formData.trigger.ssid?.trim())
      errors.ssid = 'Please enter a network name (SSID).';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRule = () => {
    if (!validate()) return;
    if (editingId !== null) {
      setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...formData } : r));
      showToast(`Rule "${formData.name}" updated.`);
    } else {
      setRules(prev => [...prev, { id: Date.now() + '_' + Math.random().toString(36).slice(2,7), ...formData, enabled: true }]);
      showToast(`Rule "${formData.name}" created.`);
    }
    cancelForm();
  };

  // ---- test rule -----------------------------------------------------------
  const testRule = (ruleId) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    const entry = {
      id:        Date.now() + '_' + Math.random().toString(36).slice(2,7),
      rule:      rule.name,
      triggered: new Date().toLocaleString(),
      action:    getActionDisplay(rule.action),
      success:   true,
    };
    setTriggerLog(prev => [entry, ...prev]);
    showToast(`Rule "${rule.name}" tested — ${getActionDisplay(rule.action)}`);
  };

  // ---- templates -----------------------------------------------------------
  const applyTemplate = (template) => {
    const newRules = template.rules.map(r => ({ id: Date.now() + Math.random(), ...r, enabled: true }));
    setRules(prev => [...prev, ...newRules]);
    setAppliedTemplates(prev => new Set(prev).add(template.id));
    showToast(`Template "${template.title}" applied — ${newRules.length} rule(s) added.`);
  };

  // ---- form helpers --------------------------------------------------------
  const updateTrigger = (patch) =>
    setFormData(prev => ({ ...prev, trigger: { ...prev.trigger, ...patch } }));

  const updateAction = (patch) =>
    setFormData(prev => ({ ...prev, action: { ...prev.action, ...patch } }));

  const toggleDay = (day) => {
    const days = formData.trigger.days || [];
    updateTrigger({ days: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
  };

  // ---- derived stats -------------------------------------------------------
  const activeCount    = rules.filter(r => r.enabled).length;
  const todayStr       = new Date().toLocaleDateString();
  const triggeredToday = triggerLog.filter(l => l.triggered.startsWith(todayStr)).length;
  const successRate    = triggerLog.length
    ? Math.round((triggerLog.filter(l => l.success).length / triggerLog.length) * 100)
    : 100;

  const filteredRules = filterType === 'all' ? rules : rules.filter(r => r.trigger.type === filterType);

  // =========================================================================
  return (
    <div className="automation-rules">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="automation-header">
        <h3>🤖 Automation Rules</h3>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${automationEnabled ? 'active' : 'inactive'}`}>
        <span className="banner-icon">{automationEnabled ? '✅' : '⏸️'}</span>
        <div className="banner-content">
          <h4>Automation {automationEnabled ? 'Active' : 'Paused'}</h4>
          <p>
            {automationEnabled
              ? `${activeCount} of ${rules.length} rules monitoring for triggers`
              : 'All automation rules are paused'}
          </p>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={automationEnabled}
            onChange={() => setAutomationEnabled(v => !v)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{rules.length}</span>
          <span className="stat-label">Total Rules</span>
        </div>
        <div className="stat-card green">
          <span className="stat-value">{activeCount}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-value">{triggeredToday}</span>
          <span className="stat-label">Triggered Today</span>
        </div>
        <div className="stat-card purple">
          <span className="stat-value">{successRate}%</span>
          <span className="stat-label">Success Rate</span>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="templates-section">
        <div className="templates-header">
          <h4>⚡ Quick Start Templates</h4>
          <span className="templates-sub">Click a template to instantly add pre-configured rules</span>
        </div>
        <div className="templates-grid">
          {TEMPLATES.map(tpl => {
            const applied = appliedTemplates.has(tpl.id);
            return (
              <div key={tpl.id} className={`template-card ${applied ? 'applied' : ''}`}>
                <span className="template-icon">{tpl.icon}</span>
                <h5>{tpl.title}</h5>
                <p>{tpl.description}</p>
                <div className="template-meta">
                  <span className="template-rules-count">{tpl.rules.length} rule{tpl.rules.length > 1 ? 's' : ''}</span>
                </div>
                <button
                  className={`apply-template-btn ${applied ? 'applied' : ''}`}
                  onClick={() => applyTemplate(tpl)}
                  title={applied ? 'Apply again to add another copy' : 'Add these rules to your list'}
                >
                  {applied ? '✓ Applied — Add Again' : '⚡ Apply Template'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules List */}
      <div className="rules-section">
        <div className="rules-header">
          <h4>📋 Rules ({filteredRules.length}{filterType !== 'all' ? ' filtered' : ''})</h4>
          <div className="rules-header-actions">
            <select
              className="filter-select"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {TRIGGER_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button className="add-rule-btn" onClick={showForm ? cancelForm : openCreateForm}>
              {showForm && editingId === null ? '✕ Cancel' : '+ Create Rule'}
            </button>
          </div>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="add-rule-form">
            <h5>{editingId !== null ? '✏️ Edit Automation Rule' : '➕ Create New Automation Rule'}</h5>

            <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
              <label>Rule Name</label>
              <input
                type="text"
                placeholder="e.g., Morning Coffee Shop Auto-Connect"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="form-section">
              <h6>🎯 Trigger — When to activate</h6>
              <div className="trigger-types">
                {TRIGGER_TYPES.map(type => (
                  <label
                    key={type.value}
                    className={`trigger-option ${formData.trigger.type === type.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="triggerType"
                      value={type.value}
                      checked={formData.trigger.type === type.value}
                      onChange={e => setFormData(p => ({
                        ...p,
                        trigger: { type: e.target.value, value: '', days: [], ssid: '' },
                      }))}
                    />
                    <div className="trigger-content">
                      <span className="trigger-label">{type.label}</span>
                      <span className="trigger-desc">{type.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="trigger-config">
                {formData.trigger.type === 'time' && (
                  <>
                    <input
                      type="time"
                      value={formData.trigger.value}
                      onChange={e => updateTrigger({ value: e.target.value })}
                    />
                    <div className="day-selector">
                      <label>Days:</label>
                      {WEEK_DAYS.map(day => (
                        <label key={day} className={`day-checkbox ${formData.trigger.days?.includes(day) ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={formData.trigger.days?.includes(day)}
                            onChange={() => toggleDay(day)}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </>
                )}

                {formData.trigger.type === 'network' && (
                  <>
                    <select
                      value={formData.trigger.value}
                      onChange={e => updateTrigger({ value: e.target.value, ssid: '' })}
                    >
                      <option value="">Select network trigger…</option>
                      <option value="unsecured">Any Unsecured Network</option>
                      <option value="public">Any Public Network</option>
                      <option value="specific">Specific Network Name (SSID)…</option>
                    </select>
                    {formData.trigger.value === 'specific' && (
                      <input
                        type="text"
                        placeholder="Enter exact WiFi network name (SSID)"
                        value={formData.trigger.ssid || ''}
                        onChange={e => updateTrigger({ ssid: e.target.value })}
                      />
                    )}
                    {formErrors.ssid && <span className="field-error">{formErrors.ssid}</span>}
                  </>
                )}

                {formData.trigger.type === 'location' && (
                  <input
                    type="text"
                    placeholder="Enter location or address"
                    value={formData.trigger.value}
                    onChange={e => updateTrigger({ value: e.target.value })}
                  />
                )}

                {formData.trigger.type === 'app' && (
                  <input
                    type="text"
                    placeholder="Application name (e.g., Steam, Chrome)"
                    value={formData.trigger.value}
                    onChange={e => updateTrigger({ value: e.target.value })}
                  />
                )}

                {formData.trigger.type === 'traffic' && (
                  <input
                    type="text"
                    placeholder="e.g., 5GB or 500MB"
                    value={formData.trigger.value}
                    onChange={e => updateTrigger({ value: e.target.value })}
                  />
                )}

                {formData.trigger.type === 'battery' && (
                  <div className="battery-config">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={formData.trigger.value || 20}
                      onChange={e => updateTrigger({ value: e.target.value })}
                    />
                    <span className="battery-value">
                      Below <strong>{formData.trigger.value || 20}%</strong>
                    </span>
                  </div>
                )}

                {formData.trigger.type === 'vpn_status' && (
                  <select
                    value={formData.trigger.value}
                    onChange={e => updateTrigger({ value: e.target.value })}
                  >
                    <option value="">Select VPN event…</option>
                    <option value="disconnected">VPN Disconnected (unexpected)</option>
                    <option value="connected">VPN Connected</option>
                    <option value="server_changed">Server Changed</option>
                  </select>
                )}

                {formData.trigger.type === 'interval' && (
                  <select
                    value={formData.trigger.value}
                    onChange={e => updateTrigger({ value: e.target.value })}
                  >
                    <option value="">Select interval…</option>
                    <option value="15 minutes">Every 15 minutes</option>
                    <option value="30 minutes">Every 30 minutes</option>
                    <option value="1 hour">Every 1 hour</option>
                    <option value="6 hours">Every 6 hours</option>
                    <option value="12 hours">Every 12 hours</option>
                    <option value="24 hours">Every 24 hours</option>
                  </select>
                )}

                {formErrors.trigger && <span className="field-error">{formErrors.trigger}</span>}
              </div>
            </div>

            <div className="form-section">
              <h6>⚡ Action — What to do</h6>
              <div className="action-config">
                <select
                  value={formData.action.type}
                  onChange={e => updateAction({ type: e.target.value, server: 'Fastest' })}
                >
                  {ACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                {ACTION_TYPES.find(t => t.value === formData.action.type)?.hasServer && (
                  <select
                    value={formData.action.server}
                    onChange={e => updateAction({ server: e.target.value })}
                  >
                    {SERVERS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="save-rule-btn" onClick={handleSaveRule}>
                {editingId !== null ? '✏️ Update Rule' : '💾 Save Rule'}
              </button>
              <button className="cancel-btn" onClick={cancelForm}>Cancel</button>
            </div>
          </div>
        )}

        {/* Rules Cards */}
        {filteredRules.length === 0 ? (
          <div className="empty-rules">
            <span>No rules found. Create one or apply a template above.</span>
          </div>
        ) : (
          <div className="rules-list">
            {filteredRules.map((rule, idx) => (
              <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
                <div className="rule-priority">
                  <button
                    className="priority-btn"
                    onClick={() => moveRule(rule.id, -1)}
                    disabled={idx === 0}
                    title="Move up"
                  >▲</button>
                  <span className="priority-num">{idx + 1}</span>
                  <button
                    className="priority-btn"
                    onClick={() => moveRule(rule.id, 1)}
                    disabled={idx === filteredRules.length - 1}
                    title="Move down"
                  >▼</button>
                </div>

                <div className="rule-main">
                  <div className="rule-info">
                    <div className="rule-name-row">
                      <span className="rule-trigger-icon">{getTriggerIcon(rule.trigger.type)}</span>
                      <h5>{rule.name}</h5>
                      {!rule.enabled && <span className="disabled-badge">Disabled</span>}
                    </div>
                    <div className="rule-flow">
                      <div className="rule-trigger">
                        <span className="flow-label">WHEN</span>
                        <span className="flow-value">{getTriggerDisplay(rule.trigger)}</span>
                      </div>
                      <span className="flow-arrow">→</span>
                      <div className="rule-action">
                        <span className="flow-label">THEN</span>
                        <span className="flow-value">{getActionDisplay(rule.action)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rule-controls">
                    <button className="test-btn"   onClick={() => testRule(rule.id)}  title="Test this rule">▶</button>
                    <button className="edit-btn"   onClick={() => startEdit(rule)}    title="Edit this rule">✏️</button>
                    <label className="toggle-switch small">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button className="delete-btn" onClick={() => deleteRule(rule.id)} title="Delete this rule">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trigger Log */}
      <div className="log-section">
        <div className="log-header">
          <h4>📜 Trigger History</h4>
          {triggerLog.length > 0 && (
            <button
              className="clear-log-btn"
              onClick={() => { setTriggerLog([]); showToast('Log cleared.', 'info'); }}
            >
              Clear Log
            </button>
          )}
        </div>
        {triggerLog.length === 0 ? (
          <div className="empty-log">No trigger history yet.</div>
        ) : (
          <div className="log-list">
            {triggerLog.slice(0, 20).map(log => (
              <div key={log.id} className={`log-entry ${log.success ? '' : 'log-failed'}`}>
                <span className="log-status">{log.success ? '✅' : '❌'}</span>
                <div className="log-details">
                  <span className="log-rule">{log.rule}</span>
                  <span className="log-action">{log.action}</span>
                </div>
                <span className="log-time">{log.triggered}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationRules;
