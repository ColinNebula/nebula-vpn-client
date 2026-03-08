import React, { useState, useEffect } from 'react';
import './TransparencyReport.css';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS = {
  completed:   { label: 'Completed',   cls: 'tr-status-green'  },
  'in-progress': { label: 'In Progress', cls: 'tr-status-yellow' },
  scheduled:   { label: 'Scheduled',   cls: 'tr-status-blue'   },
  cancelled:   { label: 'Cancelled',   cls: 'tr-status-red'    },
};

const TYPE_ICONS = {
  'penetration-test': '🔓',
  'code-review':      '🔍',
  'soc2':             '📋',
  'iso27001':         '🏅',
};

const CERT_ICONS = {
  'no-logs':    '📵',
  'open-source':'💻',
  'crypto':     '🔒',
  'quantum':    '⚛️',
  'dns':        '🌐',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransparencyReport() {
  const [manifest, setManifest] = useState(null);
  const [state, setState]       = useState('loading');
  const [activeSection, setActiveSection] = useState('audits');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/audit-manifest.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) { setManifest(json); setState('ok'); }
      } catch { if (!cancelled) setState('error'); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (state === 'loading') {
    return (
      <div className="tr-container">
        <div className="tr-loading">⟳  Loading transparency data…</div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="tr-container">
        <div className="tr-error">
          <span>⚠️</span>
          <p>Could not load audit manifest. Please check your connection or contact security@nebula-vpn.com</p>
        </div>
      </div>
    );
  }

  const audits         = manifest.audits ?? [];
  const certifications = manifest.certifications ?? [];
  const contact        = manifest.securityContact ?? {};

  return (
    <div className="tr-container">
      {/* ── Header ── */}
      <div className="tr-header">
        <div className="tr-title-row">
          <span className="tr-icon">🏛️</span>
          <div>
            <h2 className="tr-title">Transparency Report</h2>
            <p className="tr-subtitle">Security audits, certifications, and responsible disclosure</p>
          </div>
        </div>
        <div className="tr-meta">
          <span>Last updated: <strong>{manifest._generated?.split('T')[0] ?? '—'}</strong></span>
          <span className="tr-meta-sep">·</span>
          <span>Provider: <strong>{manifest.provider}</strong></span>
        </div>
      </div>

      {/* ── Sub-nav ── */}
      <div className="tr-subnav">
        {['audits', 'certifications', 'contact'].map(s => (
          <button
            key={s}
            className={`tr-subnav-btn ${activeSection === s ? 'active' : ''}`}
            onClick={() => setActiveSection(s)}
          >
            {{ audits: '📋 Audits', certifications: '✅ Certifications', contact: '📬 Security Contact' }[s]}
          </button>
        ))}
      </div>

      {/* ══ Audits ══ */}
      {activeSection === 'audits' && (
        <section className="tr-section">
          <div className="tr-section-intro">
            <p>
              Nebula VPN commissions regular third-party security audits. Completed reports are published
              in full (or with minimal redactions where necessary to protect infrastructure) within 30 days
              of receipt. Audit firms are given read-only access to the full codebase and documentation.
            </p>
          </div>

          {audits.length === 0 && (
            <p className="tr-empty">No audits recorded yet.</p>
          )}

          <div className="tr-audits">
            {audits.map(audit => {
              const status = STATUS_LABELS[audit.status] ?? { label: audit.status, cls: '' };
              return (
                <div key={audit.id} className="tr-audit-card">
                  <div className="tr-audit-header">
                    <span className="tr-audit-type-icon">{TYPE_ICONS[audit.type] ?? '🔎'}</span>
                    <div className="tr-audit-title-block">
                      <h4 className="tr-audit-title">{audit.title}</h4>
                      <span className="tr-audit-id">{audit.id}</span>
                    </div>
                    <span className={`tr-status-badge ${status.cls}`}>{status.label}</span>
                  </div>

                  {audit.summary && (
                    <p className="tr-audit-summary">{audit.summary}</p>
                  )}

                  <div className="tr-audit-meta">
                    {audit.firm && (
                      <span className="tr-audit-meta-item">
                        🏢 <strong>Firm:</strong> {audit.firm || 'TBD'}
                      </span>
                    )}
                    {audit.scheduledStart && (
                      <span className="tr-audit-meta-item">
                        📅 <strong>Date:</strong> {audit.scheduledStart}
                      </span>
                    )}
                    {audit.publishedAt && (
                      <span className="tr-audit-meta-item">
                        📢 <strong>Published:</strong> {audit.publishedAt}
                      </span>
                    )}
                  </div>

                  {audit.scope && (
                    <div className="tr-audit-scope">
                      {audit.scope.map(s => (
                        <span key={s} className="tr-scope-tag">{s}</span>
                      ))}
                    </div>
                  )}

                  {(audit.criticalFindings !== null || audit.highFindings !== null) && (
                    <div className="tr-findings">
                      <FindingBadge label="Critical" count={audit.criticalFindings} color="red" />
                      <FindingBadge label="High"     count={audit.highFindings}     color="orange" />
                      <FindingBadge label="Medium"   count={audit.mediumFindings}   color="yellow" />
                      {audit.remediatedWithin30Days !== null && (
                        <span className="tr-finding-remediated">
                          ✅ {audit.remediatedWithin30Days} remediated within 30 days
                        </span>
                      )}
                    </div>
                  )}

                  {audit.reportUrl && (
                    <a className="tr-report-link" href={audit.reportUrl} target="_blank" rel="noopener noreferrer">
                      📄 Download full report
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <div className="tr-audit-commitment">
            <h4>Our Commitment</h4>
            <ul>
              <li>Audits commissioned at least once per year from independent third-party firms</li>
              <li>Full reports (or sanitised versions) published within 30 days of receipt</li>
              <li>Critical and high severity findings remediated within 30 days</li>
              <li>Scope includes: network layer, cryptography, Electron IPC surface, API endpoints, and key management</li>
            </ul>
          </div>
        </section>
      )}

      {/* ══ Certifications ══ */}
      {activeSection === 'certifications' && (
        <section className="tr-section">
          <div className="tr-certs">
            {certifications.map((cert, i) => (
              <div key={i} className={`tr-cert-card ${cert.verified ? 'tr-cert-verified' : ''}`}>
                <div className="tr-cert-header">
                  <span className="tr-cert-icon">{CERT_ICONS[cert.icon] ?? '🏷️'}</span>
                  <div>
                    <h4 className="tr-cert-name">{cert.name}</h4>
                    <span className="tr-cert-verifier">{cert.verifier}</span>
                  </div>
                  <span className={`tr-cert-badge ${cert.verified ? 'tr-cert-yes' : 'tr-cert-no'}`}>
                    {cert.verified ? '✅ Verified' : '❌ Unverified'}
                  </span>
                </div>
                <p className="tr-cert-desc">{cert.description}</p>
                <div className="tr-cert-since">Active since: {cert.since}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ Security Contact ══ */}
      {activeSection === 'contact' && (
        <section className="tr-section">
          <div className="tr-contact-grid">
            <ContactCard icon="📧" label="Security Email" value={contact.email}
              href={`mailto:${contact.email}`} />
            <ContactCard icon="🔑" label="PGP Public Key" value="Import key"
              href={contact.pgpKey} ext />
            <ContactCard icon="🐛" label="Bug Bounty" value="Bug Bounty Programme"
              href={contact.bugBounty ? `https://${contact.bugBounty}` : null} ext />
            <ContactCard icon="⏱️" label="Response SLA" value={contact.responseTime} />
          </div>

          <div className="tr-disclosure-policy">
            <h4>Responsible Disclosure Policy</h4>
            <p>
              We ask that security researchers give us a minimum of <strong>90 days</strong> to patch
              confirmed vulnerabilities before public disclosure. In return, we commit to:
            </p>
            <ul>
              <li>Acknowledge receipt within <strong>48 hours</strong></li>
              <li>Provide a timeline within <strong>7 days</strong></li>
              <li>Not pursue legal action against good-faith researchers</li>
              <li>Credit researchers in our security advisories (with consent)</li>
            </ul>
            <p>
              <strong>Note:</strong> Nebula VPN does not currently operate a paid bug bounty programme.
              We are evaluating Immunefi and HackerOne for future programmes.
            </p>
          </div>

          <div className="tr-pgp-note">
            <h4>PGP Key</h4>
            <p>
              Our PGP signing key will be published at{' '}
              <a href="https://nebula-vpn.com/pgp.asc" target="_blank" rel="noopener noreferrer">
                nebula-vpn.com/pgp.asc
              </a>{' '}
              and submitted to public keyservers (keys.openpgp.org). The same key signs the warrant canary.
            </p>
            <p>Fingerprint: <code>{manifest.pgpFingerprint}</code></p>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FindingBadge({ label, count, color }) {
  if (count === null || count === undefined) return null;
  const colorMap = { red: '#ef4444', orange: '#f97316', yellow: '#eab308' };
  return (
    <span className="tr-finding-badge" style={{ '--finding-color': colorMap[color] }}>
      {count} {label}
    </span>
  );
}

function ContactCard({ icon, label, value, href, ext }) {
  const inner = (
    <div className="tr-contact-card">
      <span className="tr-contact-icon">{icon}</span>
      <div>
        <span className="tr-contact-label">{label}</span>
        <span className="tr-contact-value">{value ?? '—'}</span>
      </div>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="tr-contact-card-link"
        target={ext ? '_blank' : undefined}
        rel={ext ? 'noopener noreferrer' : undefined}>
        {inner}
      </a>
    );
  }
  return inner;
}
