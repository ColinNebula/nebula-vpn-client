import React, { useState } from 'react';
import './APIIntegrationHub.css';

const APIIntegrationHub = () => {
  const [activeTab, setActiveTab] = useState('integrations');
  const [connectedServices, setConnectedServices] = useState(['slack', 'teams', 'servicenow']);

  const availableIntegrations = [
    { id: 'slack', name: 'Slack', icon: '💬', category: 'Communication', description: 'Send VPN alerts to Slack channels', connected: true },
    { id: 'teams', name: 'Microsoft Teams', icon: '👥', category: 'Communication', description: 'Teams notifications and bot integration', connected: true },
    { id: 'servicenow', name: 'ServiceNow', icon: '🎫', category: 'ITSM', description: 'Create incidents for VPN issues', connected: true },
    { id: 'splunk', name: 'Splunk', icon: '📊', category: 'Analytics', description: 'Forward VPN logs to Splunk', connected: false },
    { id: 'siem', name: 'Generic SIEM', icon: '🛡️', category: 'Security', description: 'Security event forwarding', connected: false },
    { id: 'webhook', name: 'Custom Webhooks', icon: '🔗', category: 'Custom', description: 'Send events to custom endpoints', connected: false },
    { id: 'email', name: 'Email SMTP', icon: '📧', category: 'Notification', description: 'Email alert delivery', connected: false },
    { id: 'sms', name: 'SMS Gateway', icon: '📱', category: 'Notification', description: 'SMS alert delivery', connected: false },
    { id: 'pagerduty', name: 'PagerDuty', icon: '📟', category: 'Incident', description: 'Incident escalation and management', connected: false },
    { id: 'datadog', name: 'Datadog', icon: '🐕', category: 'Monitoring', description: 'Metrics and monitoring integration', connected: false }
  ];

  const webhooks = [
    { id: 1, name: 'Connection Events', url: 'https://api.company.com/vpn/events', events: ['connect', 'disconnect'], status: 'active' },
    { id: 2, name: 'Security Alerts', url: 'https://security.company.com/webhook', events: ['threat_detected', 'leak_detected'], status: 'active' },
    { id: 3, name: 'Performance Metrics', url: 'https://metrics.company.com/endpoint', events: ['speed_test', 'latency_alert'], status: 'inactive' }
  ];

  const apiKeys = [
    { id: 1, name: 'Slack Bot Token', service: 'slack', created: '2025-09-15', lastUsed: '2025-10-02', status: 'active' },
    { id: 2, name: 'Teams Connector', service: 'teams', created: '2025-09-20', lastUsed: '2025-10-01', status: 'active' },
    { id: 3, name: 'ServiceNow API', service: 'servicenow', created: '2025-09-25', lastUsed: '2025-10-02', status: 'active' }
  ];

  const toggleIntegration = (serviceId) => {
    if (connectedServices.includes(serviceId)) {
      setConnectedServices(connectedServices.filter(id => id !== serviceId));
      alert(`❌ Disconnected from ${serviceId}`);
    } else {
      setConnectedServices([...connectedServices, serviceId]);
      alert(`✅ Connected to ${serviceId}`);
    }
  };

  return (
    <div className="api-integration-hub">
      <div className="hub-header">
        <h3>🔗 API Integration Hub</h3>
        <div className="hub-stats">
          <span className="stat">{connectedServices.length} Connected</span>
          <span className="stat">{availableIntegrations.length - connectedServices.length} Available</span>
        </div>
      </div>

      <div className="hub-tabs">
        <button className={`hub-tab ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
          🔌 Integrations
        </button>
        <button className={`hub-tab ${activeTab === 'webhooks' ? 'active' : ''}`} onClick={() => setActiveTab('webhooks')}>
          🔗 Webhooks
        </button>
        <button className={`hub-tab ${activeTab === 'keys' ? 'active' : ''}`} onClick={() => setActiveTab('keys')}>
          🔑 API Keys
        </button>
      </div>

      {activeTab === 'integrations' && (
        <div className="integrations-grid">
          {availableIntegrations.map(service => (
            <div key={service.id} className={`integration-card ${service.connected ? 'connected' : ''}`}>
              <div className="integration-header">
                <span className="integration-icon">{service.icon}</span>
                <div className="integration-info">
                  <h4>{service.name}</h4>
                  <span className="integration-category">{service.category}</span>
                </div>
                <button 
                  className={`toggle-btn ${service.connected ? 'connected' : 'disconnected'}`}
                  onClick={() => toggleIntegration(service.id)}
                >
                  {service.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
              <p className="integration-description">{service.description}</p>
              {service.connected && (
                <div className="integration-status">
                  <span className="status-indicator">●</span>
                  <span>Active</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="webhooks-section">
          <div className="section-header">
            <h4>🔗 Custom Webhooks</h4>
            <button className="add-webhook-btn">➕ Add Webhook</button>
          </div>
          <div className="webhooks-list">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="webhook-card">
                <div className="webhook-header">
                  <h5>{webhook.name}</h5>
                  <span className={`webhook-status ${webhook.status}`}>
                    {webhook.status}
                  </span>
                </div>
                <div className="webhook-url">{webhook.url}</div>
                <div className="webhook-events">
                  Events: {webhook.events.map(event => (
                    <span key={event} className="event-tag">{event}</span>
                  ))}
                </div>
                <div className="webhook-actions">
                  <button className="test-webhook">Test</button>
                  <button className="edit-webhook">Edit</button>
                  <button className="delete-webhook">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="api-keys-section">
          <div className="section-header">
            <h4>🔑 API Keys & Tokens</h4>
            <button className="generate-key-btn">🔑 Generate New Key</button>
          </div>
          <div className="keys-table">
            <div className="table-header">
              <span>Name</span>
              <span>Service</span>
              <span>Created</span>
              <span>Last Used</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {apiKeys.map(key => (
              <div key={key.id} className="table-row">
                <span className="key-name">{key.name}</span>
                <span className="key-service">{key.service}</span>
                <span className="key-created">{key.created}</span>
                <span className="key-used">{key.lastUsed}</span>
                <span className={`key-status ${key.status}`}>{key.status}</span>
                <div className="key-actions">
                  <button className="copy-key">Copy</button>
                  <button className="rotate-key">Rotate</button>
                  <button className="revoke-key">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIIntegrationHub;