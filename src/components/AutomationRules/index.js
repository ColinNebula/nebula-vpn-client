import React, { useState } from 'react';
import './AutomationRules.css';

const AutomationRules = () => {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [rules, setRules] = useState([
    { 
      id: 1, 
      name: 'Work Hours Auto-Connect', 
      trigger: { type: 'time', value: '09:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      action: { type: 'connect', server: 'US East' },
      enabled: true 
    },
    { 
      id: 2, 
      name: 'Public WiFi Protection', 
      trigger: { type: 'network', value: 'unsecured' },
      action: { type: 'connect', server: 'Fastest' },
      enabled: true 
    },
    { 
      id: 3, 
      name: 'Home Network Disconnect', 
      trigger: { type: 'network', value: 'MyHomeWiFi' },
      action: { type: 'disconnect' },
      enabled: false 
    },
  ]);

  const [newRule, setNewRule] = useState({
    name: '',
    trigger: { type: 'time', value: '', days: [] },
    action: { type: 'connect', server: 'Fastest' }
  });

  const [triggerLog, setTriggerLog] = useState([
    { id: 1, rule: 'Work Hours Auto-Connect', triggered: '2025-10-01 09:00:15', action: 'Connected to US East', success: true },
    { id: 2, rule: 'Public WiFi Protection', triggered: '2025-09-30 14:23:42', action: 'Connected to UK London', success: true },
    { id: 3, rule: 'Home Network Disconnect', triggered: '2025-09-30 18:05:10', action: 'Disconnected from VPN', success: true },
  ]);

  const triggerTypes = [
    { value: 'time', label: '⏰ Time-based', description: 'Trigger at specific times or intervals' },
    { value: 'network', label: '📶 Network Change', description: 'Trigger when network changes' },
    { value: 'location', label: '📍 Location-based', description: 'Trigger based on GPS location' },
    { value: 'app', label: '📱 App Launch', description: 'Trigger when specific app starts' },
    { value: 'traffic', label: '📊 Traffic Threshold', description: 'Trigger at data usage limits' },
  ];

  const actionTypes = [
    { value: 'connect', label: '🔗 Connect VPN', hasServer: true },
    { value: 'disconnect', label: '⚡ Disconnect VPN', hasServer: false },
    { value: 'switch', label: '🔄 Switch Server', hasServer: true },
    { value: 'enable_killswitch', label: '🛡️ Enable Kill Switch', hasServer: false },
    { value: 'disable_killswitch', label: '🔓 Disable Kill Switch', hasServer: false },
  ];

  const servers = ['Fastest', 'US East', 'US West', 'UK London', 'Germany', 'Japan', 'Singapore'];
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleRule = (id) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const deleteRule = (id) => {
    if (window.confirm('Delete this automation rule?')) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };

  const handleAddRule = () => {
    if (newRule.name && newRule.trigger.value) {
      setRules([...rules, { 
        id: Date.now(), 
        ...newRule, 
        enabled: true 
      }]);
      setNewRule({
        name: '',
        trigger: { type: 'time', value: '', days: [] },
        action: { type: 'connect', server: 'Fastest' }
      });
      setShowAddRule(false);
    }
  };

  const getTriggerDisplay = (trigger) => {
    switch (trigger.type) {
      case 'time':
        return `${trigger.value} (${trigger.days?.join(', ') || 'Daily'})`;
      case 'network':
        return trigger.value === 'unsecured' ? 'Any Unsecured Network' : trigger.value;
      case 'location':
        return `Near ${trigger.value}`;
      case 'app':
        return `When ${trigger.value} starts`;
      case 'traffic':
        return `When usage exceeds ${trigger.value}`;
      default:
        return trigger.value;
    }
  };

  const getActionDisplay = (action) => {
    switch (action.type) {
      case 'connect':
        return `Connect to ${action.server}`;
      case 'disconnect':
        return 'Disconnect VPN';
      case 'switch':
        return `Switch to ${action.server}`;
      case 'enable_killswitch':
        return 'Enable Kill Switch';
      case 'disable_killswitch':
        return 'Disable Kill Switch';
      default:
        return action.type;
    }
  };

  const testRule = (ruleId) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      const newLog = {
        id: Date.now(),
        rule: rule.name,
        triggered: new Date().toLocaleString(),
        action: getActionDisplay(rule.action),
        success: true
      };
      setTriggerLog([newLog, ...triggerLog]);
      alert(`✅ Rule "${rule.name}" triggered successfully!\n\nAction: ${getActionDisplay(rule.action)}`);
    }
  };

  return (
    <div className="automation-rules">
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
              ? `${rules.filter(r => r.enabled).length} rules monitoring for triggers`
              : 'All automation rules are paused'}
          </p>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={automationEnabled}
            onChange={() => setAutomationEnabled(!automationEnabled)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Quick Templates */}
      <div className="templates-section">
        <h4>⚡ Quick Start Templates</h4>
        <div className="templates-grid">
          <div className="template-card">
            <span className="template-icon">💼</span>
            <h5>Smart Work Mode</h5>
            <p>Auto-connect during work hours, disconnect at home</p>
            <button className="apply-template-btn">Apply Template</button>
          </div>
          <div className="template-card">
            <span className="template-icon">🛡️</span>
            <h5>Public WiFi Guard</h5>
            <p>Instantly connect on any public/unsecured network</p>
            <button className="apply-template-btn">Apply Template</button>
          </div>
          <div className="template-card">
            <span className="template-icon">🌍</span>
            <h5>Traveler Protection</h5>
            <p>Location-based server switching for best speed</p>
            <button className="apply-template-btn">Apply Template</button>
          </div>
          <div className="template-card">
            <span className="template-icon">🎮</span>
            <h5>Gaming Optimizer</h5>
            <p>Switch to low-ping servers when games launch</p>
            <button className="apply-template-btn">Apply Template</button>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="rules-section">
        <div className="rules-header">
          <h4>📋 Active Rules ({rules.length})</h4>
          <button 
            className="add-rule-btn"
            onClick={() => setShowAddRule(!showAddRule)}
          >
            {showAddRule ? '✕ Cancel' : '+ Create Rule'}
          </button>
        </div>

        {/* Add Rule Form */}
        {showAddRule && (
          <div className="add-rule-form">
            <h5>Create New Automation Rule</h5>
            
            <div className="form-group">
              <label>Rule Name</label>
              <input 
                type="text"
                placeholder="e.g., Morning Coffee Shop Auto-Connect"
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
              />
            </div>

            <div className="form-section">
              <h6>🎯 Trigger (When to activate)</h6>
              <div className="trigger-types">
                {triggerTypes.map(type => (
                  <label 
                    key={type.value}
                    className={`trigger-option ${newRule.trigger.type === type.value ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio"
                      name="triggerType"
                      value={type.value}
                      checked={newRule.trigger.type === type.value}
                      onChange={(e) => setNewRule({
                        ...newRule, 
                        trigger: { type: e.target.value, value: '', days: [] }
                      })}
                    />
                    <div className="trigger-content">
                      <span className="trigger-label">{type.label}</span>
                      <span className="trigger-desc">{type.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="trigger-config">
                {newRule.trigger.type === 'time' && (
                  <>
                    <input 
                      type="time"
                      value={newRule.trigger.value}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        trigger: { ...newRule.trigger, value: e.target.value }
                      })}
                    />
                    <div className="day-selector">
                      <label>Days:</label>
                      {weekDays.map(day => (
                        <label key={day} className="day-checkbox">
                          <input 
                            type="checkbox"
                            checked={newRule.trigger.days?.includes(day)}
                            onChange={(e) => {
                              const days = newRule.trigger.days || [];
                              setNewRule({
                                ...newRule,
                                trigger: {
                                  ...newRule.trigger,
                                  days: e.target.checked 
                                    ? [...days, day]
                                    : days.filter(d => d !== day)
                                }
                              });
                            }}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {newRule.trigger.type === 'network' && (
                  <select 
                    value={newRule.trigger.value}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      trigger: { ...newRule.trigger, value: e.target.value }
                    })}
                  >
                    <option value="">Select network trigger...</option>
                    <option value="unsecured">Any Unsecured Network</option>
                    <option value="public">Any Public Network</option>
                    <option value="specific">Specific Network Name...</option>
                  </select>
                )}
                {newRule.trigger.type === 'location' && (
                  <input 
                    type="text"
                    placeholder="Enter location or address"
                    value={newRule.trigger.value}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      trigger: { ...newRule.trigger, value: e.target.value }
                    })}
                  />
                )}
                {newRule.trigger.type === 'app' && (
                  <input 
                    type="text"
                    placeholder="Enter application name"
                    value={newRule.trigger.value}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      trigger: { ...newRule.trigger, value: e.target.value }
                    })}
                  />
                )}
                {newRule.trigger.type === 'traffic' && (
                  <input 
                    type="text"
                    placeholder="e.g., 5GB, 100MB"
                    value={newRule.trigger.value}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      trigger: { ...newRule.trigger, value: e.target.value }
                    })}
                  />
                )}
              </div>
            </div>

            <div className="form-section">
              <h6>⚡ Action (What to do)</h6>
              <div className="action-config">
                <select 
                  value={newRule.action.type}
                  onChange={(e) => setNewRule({
                    ...newRule,
                    action: { type: e.target.value, server: 'Fastest' }
                  })}
                >
                  {actionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                
                {actionTypes.find(t => t.value === newRule.action.type)?.hasServer && (
                  <select 
                    value={newRule.action.server}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      action: { ...newRule.action, server: e.target.value }
                    })}
                  >
                    {servers.map(server => (
                      <option key={server} value={server}>{server}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button className="save-rule-btn" onClick={handleAddRule}>
                💾 Save Rule
              </button>
              <button className="cancel-btn" onClick={() => setShowAddRule(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rules Cards */}
        <div className="rules-list">
          {rules.map(rule => (
            <div key={rule.id} className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
              <div className="rule-main">
                <div className="rule-info">
                  <div className="rule-name-row">
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
                  <button 
                    className="test-btn"
                    onClick={() => testRule(rule.id)}
                    title="Test rule"
                  >
                    ▶️
                  </button>
                  <label className="toggle-switch small">
                    <input 
                      type="checkbox" 
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteRule(rule.id)}
                    title="Delete rule"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Log */}
      <div className="log-section">
        <h4>📜 Trigger History</h4>
        <div className="log-list">
          {triggerLog.map(log => (
            <div key={log.id} className="log-entry">
              <span className={`log-status ${log.success ? 'success' : 'failed'}`}>
                {log.success ? '✅' : '❌'}
              </span>
              <div className="log-details">
                <span className="log-rule">{log.rule}</span>
                <span className="log-action">{log.action}</span>
              </div>
              <span className="log-time">{log.triggered}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AutomationRules;
