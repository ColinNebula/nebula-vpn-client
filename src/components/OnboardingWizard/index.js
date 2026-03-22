import React, { useState } from 'react';
import ProtocolPicker from '../ProtocolPicker';
import './OnboardingWizard.css';

const STEPS = ['welcome', 'protocol', 'killswitch', 'server', 'done'];

const STEP_LABELS = ['Welcome', 'Protocol', 'Kill Switch', 'Quick Connect', 'All Done'];

// Top recommended servers shown in step 4
function getRecommendedServers(servers = []) {
  return [...servers]
    .filter(s => !s.locked)
    .sort((a, b) => {
      const pingA = normalizePing(a.ping);
      const pingB = normalizePing(b.ping);
      const loadA = typeof a.load === 'number' ? a.load : 50;
      const loadB = typeof b.load === 'number' ? b.load : 50;
      return (pingA + loadA) - (pingB + loadB);
    })
    .slice(0, 4);
}

function normalizePing(ping) {
  if (typeof ping === 'number') return ping;
  if (typeof ping === 'string') return parseInt(ping, 10) || 999;
  return 999;
}

function getPingColor(ms) {
  if (ms < 50) return '#22c55e';
  if (ms < 100) return '#84cc16';
  if (ms < 200) return '#eab308';
  return '#ef4444';
}

export default function OnboardingWizard({ user, settings, servers = [], onComplete }) {
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState({
    protocol: settings?.protocol || 'wireguard',
    killSwitch: settings?.killSwitch !== false,
    server: null,
  });

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';
  const recommendedServers = getRecommendedServers(servers);
  const currentStep = STEPS[step];

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const skip = () => next();

  const finish = () => onComplete(choices);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {/* Progress dots */}
        <div className="onboarding-progress">
          {STEPS.map((s, i) => (
            <div key={s} className={`onboarding-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        <div className="onboarding-step-label">{STEP_LABELS[step]} · {step + 1} of {STEPS.length}</div>

        {/* ── Step 1: Welcome ── */}
        {currentStep === 'welcome' && (
          <div className="onboarding-content">
            <div className="onboarding-hero-icon">🛡️</div>
            <h1 className="onboarding-title">Welcome, {firstName}!</h1>
            <p className="onboarding-subtitle">
              Nebula VPN is ready to protect you. This quick setup takes about 60 seconds.
            </p>
            <ul className="onboarding-benefits">
              <li><span className="benefit-icon">🔒</span> Military-grade encryption on every connection</li>
              <li><span className="benefit-icon">🚫</span> Block ads &amp; trackers automatically</li>
              <li><span className="benefit-icon">📵</span> No logs, no surveillance, ever</li>
              <li><span className="benefit-icon">⚡</span> WireGuard protocol - fastest available</li>
            </ul>
            <div className="onboarding-actions">
              <button className="onboarding-btn-primary" onClick={next}>
                Get Started →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Protocol ── */}
        {currentStep === 'protocol' && (
          <div className="onboarding-content">
            <h2 className="onboarding-title">Choose Your Protocol</h2>
            <p className="onboarding-subtitle">
              This controls how your traffic is tunneled. WireGuard is the best choice for most people.
            </p>
            <div className="onboarding-picker-wrap">
              <ProtocolPicker
                value={choices.protocol}
                onChange={proto => setChoices(c => ({ ...c, protocol: proto }))}
              />
            </div>
            <div className="onboarding-actions">
              <button className="onboarding-btn-secondary" onClick={back}>← Back</button>
              <button className="onboarding-btn-primary" onClick={next}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Kill Switch ── */}
        {currentStep === 'killswitch' && (
          <div className="onboarding-content">
            <div className="onboarding-hero-icon">🔌</div>
            <h2 className="onboarding-title">Kill Switch</h2>
            <p className="onboarding-subtitle">
              If the VPN drops, a kill switch immediately cuts your internet to prevent accidental data leaks.
            </p>
            <div className="onboarding-ks-toggle">
              <div className="onboarding-ks-info">
                <span className="onboarding-ks-name">Enable Kill Switch</span>
                <span className="onboarding-ks-desc">
                  {choices.killSwitch
                    ? '✅ Your traffic is protected even if the VPN disconnects.'
                    : '⚠️ Without this, your real IP may be exposed on reconnect.'}
                </span>
              </div>
              <button
                className={`ow-toggle-track ${choices.killSwitch ? 'on' : ''}`}
                onClick={() => setChoices(c => ({ ...c, killSwitch: !c.killSwitch }))}
                aria-label="Toggle kill switch"
              >
                <span className="ow-toggle-thumb" />
              </button>
            </div>
            <div className="onboarding-ks-recommendation">
              <span className="ow-rec-badge">✓ Recommended</span> - enabled by default for maximum protection
            </div>
            <div className="onboarding-actions">
              <button className="onboarding-btn-secondary" onClick={back}>← Back</button>
              <button className="onboarding-btn-primary" onClick={next}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Quick Connect ── */}
        {currentStep === 'server' && (
          <div className="onboarding-content">
            <h2 className="onboarding-title">Pick a Server</h2>
            <p className="onboarding-subtitle">
              These are the fastest, least-loaded servers for your first connection. You can change this anytime.
            </p>
            <div className="onboarding-server-list">
              {recommendedServers.length === 0 && (
                <p className="onboarding-no-servers">No servers available - you can connect later from the dashboard.</p>
              )}
              {recommendedServers.map(server => {
                const pingMs = normalizePing(server.ping);
                const isSelected = choices.server?.id === server.id;
                return (
                  <button
                    key={server.id}
                    className={`ow-server-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setChoices(c => ({
                      ...c,
                      server: isSelected ? null : server,
                    }))}
                  >
                    <div className="ow-server-flag">{server.flag || '🌐'}</div>
                    <div className="ow-server-info">
                      <span className="ow-server-name">{server.name}</span>
                      <span className="ow-server-country">{server.country}</span>
                    </div>
                    <div className="ow-server-stats">
                      <span className="ow-server-ping" style={{ color: getPingColor(pingMs) }}>
                        {pingMs < 990 ? `${pingMs}ms` : '?'}
                      </span>
                      {typeof server.load === 'number' && (
                        <span className="ow-server-load">{server.load}% load</span>
                      )}
                    </div>
                    {isSelected && <span className="ow-server-check">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="onboarding-actions">
              <button className="onboarding-btn-secondary" onClick={back}>← Back</button>
              <button className="onboarding-btn-ghost" onClick={skip}>Skip</button>
              <button className="onboarding-btn-primary" onClick={next}>
                {choices.server ? 'Use This Server →' : 'Skip →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {currentStep === 'done' && (
          <div className="onboarding-content onboarding-done">
            <div className="onboarding-hero-icon onboarding-hero-spin">🚀</div>
            <h2 className="onboarding-title">You're all set!</h2>
            <p className="onboarding-subtitle">Here's what we configured for you:</p>
            <div className="onboarding-summary">
              <div className="ow-summary-row">
                <span className="ow-summary-label">Protocol</span>
                <span className="ow-summary-value ow-summary-proto">{choices.protocol.toUpperCase()}</span>
              </div>
              <div className="ow-summary-row">
                <span className="ow-summary-label">Kill Switch</span>
                <span className={`ow-summary-value ${choices.killSwitch ? 'ow-on' : 'ow-off'}`}>
                  {choices.killSwitch ? 'Enabled ✓' : 'Disabled'}
                </span>
              </div>
              <div className="ow-summary-row">
                <span className="ow-summary-label">Server</span>
                <span className="ow-summary-value">
                  {choices.server ? `${choices.server.flag || '🌐'} ${choices.server.name}` : 'Auto-select'}
                </span>
              </div>
            </div>
            <div className="onboarding-actions onboarding-actions-center">
              <button className="onboarding-btn-primary onboarding-btn-big" onClick={finish}>
                Start Protecting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
