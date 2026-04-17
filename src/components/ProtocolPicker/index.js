import React from 'react';
import './ProtocolPicker.css';

const PROTOCOLS = [
  {
    id: 'wireguard',
    label: 'WireGuard',
    icon: '⚡',
    speed: 5,
    security: 4,
    description: 'Modern, blazing-fast protocol using state-of-the-art Curve25519 cryptography.',
    tags: ['Fastest', 'Low latency', 'UDP'],
    recommended: true,
  },
  {
    id: 'openvpn-udp',
    label: 'OpenVPN UDP',
    icon: '🛡️',
    speed: 3,
    security: 5,
    description: 'Battle-tested open-source protocol with maximum compatibility and auditability.',
    tags: ['High security', 'UDP'],
  },
  {
    id: 'openvpn-tcp',
    label: 'OpenVPN TCP',
    icon: '🔒',
    speed: 2,
    security: 5,
    description: 'Tunnels over TCP port 443 - bypasses most firewalls and deep packet inspection.',
    tags: ['Port 443', 'Firewall bypass'],
  },
  {
    id: 'ikev2',
    label: 'IKEv2/IPSec',
    icon: '📱',
    speed: 4,
    security: 4,
    description: 'Reconnects instantly when switching Wi-Fi or mobile networks. Built for mobile.',
    tags: ['Mobile-optimized', 'Auto-reconnect'],
  },
  {
    id: 'stealth',
    label: 'Stealth',
    icon: '👁️',
    speed: 2,
    security: 5,
    description: 'Obfuscates VPN traffic so it looks like regular HTTPS. Evades DPI censorship.',
    tags: ['Anti-censorship', 'DPI bypass'],
  },
];

const Dots = ({ filled, total = 5, colorClass }) => (
  <div className="proto-dots">
    {Array.from({ length: total }, (_, i) => (
      <span key={i} className={`proto-dot ${i < filled ? colorClass : 'empty'}`} />
    ))}
  </div>
);

const ProtocolPicker = ({ value, onChange }) => (
  <div className="protocol-picker">
    {PROTOCOLS.map(proto => {
      const active = value === proto.id;
      return (
        <button
          key={proto.id}
          className={`proto-card ${active ? 'selected' : ''}`}
          onClick={() => onChange(proto.id)}
          type="button"
          aria-pressed={active}
        >
          <div className="proto-card-top">
            <span className="proto-icon">{proto.icon}</span>
            <div className="proto-title-row">
              <span className="proto-label">{proto.label}</span>
              {proto.recommended && <span className="proto-rec-badge">Recommended</span>}
              {active && <span className="proto-active-badge">Active</span>}
            </div>
          </div>

          <p className="proto-description">{proto.description}</p>

          <div className="proto-metrics">
            <div className="proto-metric">
              <span className="proto-metric-label">Speed</span>
              <Dots filled={proto.speed} colorClass="speed" />
            </div>
            <div className="proto-metric">
              <span className="proto-metric-label">Security</span>
              <Dots filled={proto.security} colorClass="security" />
            </div>
          </div>

          <div className="proto-tags">
            {proto.tags.map(tag => (
              <span key={tag} className="proto-tag">{tag}</span>
            ))}
          </div>
        </button>
      );
    })}
  </div>
);

export default ProtocolPicker;
export { PROTOCOLS };
