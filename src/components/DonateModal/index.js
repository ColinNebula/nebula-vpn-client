import React, { useState, useEffect } from 'react';
import './DonateModal.css';

// ── Replace these with your real donation URLs ────────────────────────────────
const DONATE_LINKS = {
  paypal:  'https://www.paypal.com/donate/?hosted_button_id=YOUR_PAYPAL_BUTTON_ID',
  github:  'https://github.com/sponsors/YOUR_GITHUB_USERNAME',
  kofi:    'https://ko-fi.com/YOUR_KOFI_USERNAME',
};
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: 'paypal',
    name: 'PayPal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="donate-svg">
        <path d="M19.5 7.5c.28 1.68-.3 3.16-1.56 4.22C16.68 12.8 15.1 13.5 13 13.5H11l-.9 5.5H6.5l2.5-15h6c2.2 0 3.72.93 4.28 2.56.16.46.22.94.22 1.44z" fill="#009cde"/>
        <path d="M9 17l1.5-9H14c1.8 0 3.05.6 3.5 2C18 11.7 17.4 13.5 16 14.5c-.95.68-2.1 1-3.5 1h-1.5L10 17H9z" fill="#003087"/>
      </svg>
    ),
    bg: 'linear-gradient(135deg, #003087, #009cde)',
    hoverBg: 'linear-gradient(135deg, #002069, #0080c0)',
    textColor: '#fff',
    description: 'Quick & secure one-time or recurring donation',
    badge: 'Most Popular',
    badgeColor: '#009cde',
  },
  {
    id: 'github',
    name: 'GitHub Sponsors',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="donate-svg">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
    bg: 'linear-gradient(135deg, #24292e, #4a5568)',
    hoverBg: 'linear-gradient(135deg, #1a1e23, #3a4558)',
    textColor: '#fff',
    description: 'Sponsor development directly on GitHub',
    badge: null,
  },
  {
    id: 'kofi',
    name: 'Ko-fi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="donate-svg">
        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 2.198.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" fill="#FF5E5B"/>
      </svg>
    ),
    bg: 'linear-gradient(135deg, #ff5e5b, #ff8a65)',
    hoverBg: 'linear-gradient(135deg, #e04e4b, #e07550)',
    textColor: '#fff',
    description: 'Buy us a coffee to keep the servers running',
    badge: '☕ Friendly',
    badgeColor: '#ff5e5b',
  },
];

const AMOUNTS = [1, 3, 5, 10, 25];

const DonateModal = ({ isOpen, onClose }) => {
  const [hovered, setHovered] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [thanked, setThanked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setThanked(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const effectiveAmount = customAmount !== '' ? parseFloat(customAmount) || 0 : selectedAmount;

  const buildUrl = (platform) => {
    if (platform === 'paypal') {
      return `${DONATE_LINKS.paypal}&amount=${effectiveAmount}`;
    }
    return DONATE_LINKS[platform];
  };

  const handleDonate = (platformId) => {
    window.open(buildUrl(platformId), '_blank', 'noopener,noreferrer');
    setThanked(true);
  };

  return (
    <div className="donate-overlay" onClick={onClose}>
      <div className="donate-modal" onClick={(e) => e.stopPropagation()}>
        <button className="donate-close" onClick={onClose} aria-label="Close">✕</button>

        {thanked ? (
          <div className="donate-thanks">
            <div className="thanks-heart">❤️</div>
            <h2>Thank you so much!</h2>
            <p>Every contribution helps keep Nebula VPN free and improving for everyone.</p>
            <button className="thanks-close-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="donate-header">
              <div className="donate-header-icon">💜</div>
              <h2>Support Nebula VPN</h2>
              <p className="donate-subtitle">
                Nebula VPN is free and always will be. Your donation helps pay for server
                infrastructure, development time, and new features. Every bit counts!
              </p>
            </div>

            {/* Stats row */}
            <div className="donate-stats">
              <div className="donate-stat">
                <span className="d-stat-value">100%</span>
                <span className="d-stat-label">Free forever</span>
              </div>
              <div className="donate-stat">
                <span className="d-stat-value">0</span>
                <span className="d-stat-label">Ads or tracking</span>
              </div>
              <div className="donate-stat">
                <span className="d-stat-value">Open</span>
                <span className="d-stat-label">Source</span>
              </div>
            </div>

            {/* Amount selector (for PayPal) */}
            <div className="donate-amounts">
              <div className="amounts-label">Choose an amount (USD)</div>
              <div className="amounts-row">
                {AMOUNTS.map(a => (
                  <button
                    key={a}
                    className={`amount-btn ${selectedAmount === a && customAmount === '' ? 'active' : ''}`}
                    onClick={() => { setSelectedAmount(a); setCustomAmount(''); }}
                  >
                    ${a}
                  </button>
                ))}
                <input
                  type="number"
                  className="amount-custom"
                  placeholder="Other"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  onClick={() => setSelectedAmount(null)}
                />
              </div>
              <div className="amounts-hint">Amount pre-filled for PayPal · GitHub & Ko-fi accept any amount</div>
            </div>

            {/* Platform cards */}
            <div className="donate-platforms">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  className={`donate-platform-btn ${hovered === p.id ? 'hovered' : ''}`}
                  style={{ background: hovered === p.id ? p.hoverBg : p.bg }}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleDonate(p.id)}
                >
                  <div className="platform-icon-wrap">{p.icon}</div>
                  <div className="platform-info">
                    <div className="platform-name">
                      {p.name}
                      {p.badge && (
                        <span className="platform-badge" style={{ background: p.badgeColor }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="platform-desc">{p.description}</div>
                  </div>
                  <div className="platform-arrow">→</div>
                </button>
              ))}
            </div>

            {/* Footer note */}
            <p className="donate-footer">
              🔒 You'll be taken to a secure third-party payment page. We never store your payment details.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DonateModal;
