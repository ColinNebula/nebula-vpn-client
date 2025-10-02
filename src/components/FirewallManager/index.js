import React, { useState } from 'react';
import './FirewallManager.css';

const FirewallManager = () => {
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [rules, setRules] = useState([
    { id: 1, name: 'Block Facebook', action: 'block', protocol: 'all', direction: 'outbound', target: 'facebook.com', enabled: true },
    { id: 2, name: 'Allow Local Network', action: 'allow', protocol: 'all', direction: 'both', target: '192.168.1.0/24', enabled: true },
    { id: 3, name: 'Block Ads', action: 'block', protocol: 'tcp', direction: 'outbound', target: 'ads.doubleclick.net', enabled: true },
    { id: 4, name: 'Allow HTTPS', action: 'allow', protocol: 'tcp', direction: 'outbound', target: 'port:443', enabled: true },
  ]);
  
  const [newRule, setNewRule] = useState({
    name: '',
    action: 'block',
    protocol: 'all',
    direction: 'outbound',
    target: ''
  });

  const templates = [
    { id: 1, name: '🚫 Block Social Media', description: 'Block major social media platforms', rules: 3 },
    { id: 2, name: '🛡️ Block Ads & Trackers', description: 'Block advertising and tracking domains', rules: 12 },
    { id: 3, name: '🎮 Gaming Optimized', description: 'Prioritize gaming traffic, block updates', rules: 5 },
    { id: 4, name: '🏢 Work Mode', description: 'Block entertainment sites during work hours', rules: 8 },
    { id: 5, name: '👨‍👩‍👧 Parental Control', description: 'Block adult content and unsafe sites', rules: 15 },
    { id: 6, name: '🔒 Maximum Security', description: 'Strict rules for maximum protection', rules: 10 },
  ];

  const handleAddRule = () => {
    if (newRule.name && newRule.target) {
      setRules([...rules, { 
        id: rules.length + 1, 
        ...newRule, 
        enabled: true 
      }]);
      setNewRule({ name: '', action: 'block', protocol: 'all', direction: 'outbound', target: '' });
      setShowAddRule(false);
    }
  };

  const toggleRule = (id) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const deleteRule = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const applyTemplate = (templateName) => {
    alert(`Applied "${templateName}" template with preset rules!`);
  };

  return (
    <div className="firewall-manager">
      <div className="firewall-header">
        <h3>🔥 Firewall Manager</h3>
      </div>

      {/* Firewall Status */}
      <div className={`firewall-status ${firewallEnabled ? 'active' : 'inactive'}`}>
        <div className="status-content">
          <div className="status-info">
            <span className="status-icon">{firewallEnabled ? '🛡️' : '⚠️'}</span>
            <div>
              <h4>Firewall {firewallEnabled ? 'Active' : 'Inactive'}</h4>
              <p>
                {firewallEnabled 
                  ? `${rules.filter(r => r.enabled).length} rules active, protecting your connection`
                  : 'Enable firewall to enforce custom rules'}
              </p>
            </div>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={firewallEnabled}
              onChange={() => setFirewallEnabled(!firewallEnabled)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Rule Templates */}
      <div className="templates-section">
        <h4>📋 Quick Templates</h4>
        <p className="section-description">Apply pre-configured rule sets for common scenarios</p>
        
        <div className="templates-grid">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-header">
                <span className="template-name">{template.name}</span>
                <span className="template-badge">{template.rules} rules</span>
              </div>
              <p className="template-description">{template.description}</p>
              <button 
                className="apply-btn"
                onClick={() => applyTemplate(template.name)}
                disabled={!firewallEnabled}
              >
                Apply Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Rules */}
      <div className="rules-section">
        <div className="rules-header">
          <h4>⚙️ Custom Rules ({rules.length})</h4>
          <button 
            className="add-rule-btn"
            onClick={() => setShowAddRule(!showAddRule)}
            disabled={!firewallEnabled}
          >
            {showAddRule ? '✕ Cancel' : '+ Add Rule'}
          </button>
        </div>

        {/* Add Rule Form */}
        {showAddRule && (
          <div className="add-rule-form">
            <div className="form-row">
              <div className="form-group">
                <label>Rule Name</label>
                <input 
                  type="text"
                  placeholder="e.g., Block Twitter"
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Action</label>
                <select 
                  value={newRule.action}
                  onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                >
                  <option value="block">Block</option>
                  <option value="allow">Allow</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Protocol</label>
                <select 
                  value={newRule.protocol}
                  onChange={(e) => setNewRule({...newRule, protocol: e.target.value})}
                >
                  <option value="all">All</option>
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="icmp">ICMP</option>
                </select>
              </div>
              <div className="form-group">
                <label>Direction</label>
                <select 
                  value={newRule.direction}
                  onChange={(e) => setNewRule({...newRule, direction: e.target.value})}
                >
                  <option value="outbound">Outbound</option>
                  <option value="inbound">Inbound</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Target (domain, IP, or port)</label>
              <input 
                type="text"
                placeholder="e.g., twitter.com, 192.168.1.1, port:80"
                value={newRule.target}
                onChange={(e) => setNewRule({...newRule, target: e.target.value})}
              />
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={handleAddRule}>
                Save Rule
              </button>
              <button className="cancel-btn" onClick={() => setShowAddRule(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="rules-list">
          {rules.length === 0 ? (
            <div className="no-rules">
              <span className="no-rules-icon">📋</span>
              <p>No custom rules yet. Add your first rule above!</p>
            </div>
          ) : (
            rules.map(rule => (
              <div key={rule.id} className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}>
                <div className="rule-main">
                  <div className="rule-info">
                    <div className="rule-name-row">
                      <span className={`rule-action ${rule.action}`}>
                        {rule.action === 'block' ? '🚫' : '✅'}
                      </span>
                      <span className="rule-name">{rule.name}</span>
                      {!rule.enabled && <span className="disabled-badge">Disabled</span>}
                    </div>
                    <div className="rule-details">
                      <span className="detail-item">
                        <strong>Protocol:</strong> {rule.protocol.toUpperCase()}
                      </span>
                      <span className="detail-item">
                        <strong>Direction:</strong> {rule.direction}
                      </span>
                      <span className="detail-item">
                        <strong>Target:</strong> {rule.target}
                      </span>
                    </div>
                  </div>
                  <div className="rule-actions">
                    <label className="toggle-switch small">
                      <input 
                        type="checkbox" 
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                        disabled={!firewallEnabled}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteRule(rule.id)}
                      disabled={!firewallEnabled}
                      title="Delete rule"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Information */}
      <div className="firewall-info">
        <h4>ℹ️ About Firewall Rules</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🎯</span>
            <div>
              <h5>Rule Priority</h5>
              <p>Rules are evaluated from top to bottom. First match wins.</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🔄</span>
            <div>
              <h5>Direction Types</h5>
              <p>Outbound: Your device → Internet | Inbound: Internet → Your device</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🌐</span>
            <div>
              <h5>Target Formats</h5>
              <p>Domains (site.com), IPs (1.2.3.4), CIDR (192.168.1.0/24), Ports (port:80)</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <div>
              <h5>Performance</h5>
              <p>Complex rules may slightly impact connection speed. Keep it simple!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirewallManager;
