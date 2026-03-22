import React, { useState, useEffect } from 'react';
import './WarrantCanary.css';

// ─── Utility ─────────────────────────────────────────────────────────────────

function parseCanary(text) {
  const lines = text.split('\n');
  const result = {
    version:       null,
    statementDate: null,
    validUntil:    null,
    statements:    [],
    stats:         [],
    pgpBlock:      null,
    rawText:       text,
  };

  const DATE_RE    = /^Statement Date\s*:\s*(.+)/i;
  const VALID_RE   = /^Valid Until\s*:\s*(.+)/i;
  const VERSION_RE = /^Statement Version\s*:\s*(.+)/i;
  const STAT_RE    = /^\s*\[(\d+)\]\s+(.+)/;
  const STAT2_RE   = /^\s{6,}(.+)/;   // continuation lines (indented 6+)
  const TRANSP_RE  = /^\s+([^:]+?)\s*:\s+(\d+)\s*$/;

  let lastStatement = null;
  let inPgpBlock = false;
  const pgpLines = [];

  for (const line of lines) {
    if (line.trim().startsWith('-----BEGIN PGP')) { inPgpBlock = true; }
    if (inPgpBlock) { pgpLines.push(line); continue; }

    const d = line.match(DATE_RE);
    if (d) { result.statementDate = d[1].trim(); continue; }

    const v = line.match(VALID_RE);
    if (v) { result.validUntil = v[1].trim(); continue; }

    const ver = line.match(VERSION_RE);
    if (ver) { result.version = ver[1].trim(); continue; }

    const s = line.match(STAT_RE);
    if (s) {
      lastStatement = { num: s[1], text: s[2].trim() };
      result.statements.push(lastStatement);
      continue;
    }

    // Continuation of previous numbered statement
    const cont = lastStatement && line.match(STAT2_RE);
    if (cont) { lastStatement.text += ' ' + cont[1].trim(); continue; }
    else { lastStatement = null; }

    const t = line.match(TRANSP_RE);
    if (t) {
      result.stats.push({ label: t[1].trim(), value: t[2].trim() });
    }
  }

  if (pgpLines.length > 0) result.pgpBlock = pgpLines.join('\n');
  return result;
}

/** True if the statement date is within the past 90 days and validUntil hasn't passed. */
function checkFreshness(parsed) {
  if (!parsed.statementDate) return { fresh: false, reason: 'No statement date found' };

  const now      = new Date();
  const stmtDate = new Date(parsed.statementDate);
  const validEnd = parsed.validUntil ? new Date(parsed.validUntil) : null;

  if (isNaN(stmtDate.getTime())) return { fresh: false, reason: 'Cannot parse statement date' };

  if (validEnd && now > validEnd) {
    return {
      fresh:  false,
      reason: `Canary expired on ${parsed.validUntil}. This may indicate conditions in the canary no longer hold.`,
    };
  }

  const ageDays = Math.floor((now - stmtDate) / 86_400_000);
  if (ageDays > 90) {
    return {
      fresh:  false,
      reason: `Statement is ${ageDays} days old (>90 days). A missed update should be treated as a canary failure.`,
    };
  }

  return { fresh: true, ageDays };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WarrantCanary() {
  const [state, setState] = useState('loading'); // loading | ok | stale | error
  const [parsed, setParsed]   = useState(null);
  const [freshness, setFreshness] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCanary() {
      try {
        // Works in both Electron (file://) and dev server (http://)
        const res = await fetch('/canary.txt', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text  = await res.text();
        const p = parseCanary(text);
        const f = checkFreshness(p);
        if (!cancelled) {
          setParsed(p);
          setFreshness(f);
          setState(f.fresh ? 'ok' : 'stale');
        }
      } catch (e) {
        if (!cancelled) setState('error');
      }
    }

    loadCanary();
    return () => { cancelled = true; };
  }, []);

  // ── Render helpers ──────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div className="wc-container">
        <div className="wc-loading">
          <span className="wc-spin">⟳</span> Fetching warrant canary…
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="wc-container">
        <div className="wc-banner wc-red">
          <span className="wc-banner-icon">⚠️</span>
          <div>
            <strong>Canary Unavailable</strong>
            <p>Could not retrieve the warrant canary statement. Treat this as a potential canary failure.</p>
          </div>
        </div>
      </div>
    );
  }

  const isStale = state === 'stale';

  return (
    <div className="wc-container">
      {/* ── Status banner ── */}
      <div className={`wc-banner ${isStale ? 'wc-red' : 'wc-green'}`}>
        <span className="wc-banner-icon">{isStale ? '⚠️' : '✅'}</span>
        <div>
          <strong>{isStale ? 'CANARY FAILURE - ACTION REQUIRED' : 'Canary Active & Current'}</strong>
          <p>
            {isStale
              ? freshness?.reason || 'The canary has expired or is missing.'
              : `Last certified ${freshness?.ageDays ?? '?'} day(s) ago. Valid until ${parsed.validUntil}.`}
          </p>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="wc-header">
        <div className="wc-title-row">
          <span className="wc-icon">🕊️</span>
          <div>
            <h2 className="wc-title">Warrant Canary</h2>
            <p className="wc-subtitle">Updated quarterly - absence of a current statement is itself a disclosure</p>
          </div>
        </div>
        <div className="wc-meta">
          <span className="wc-meta-item">Statement date: <strong>{parsed.statementDate ?? '-'}</strong></span>
          <span className="wc-meta-sep">·</span>
          <span className="wc-meta-item">Version: <strong>{parsed.version ?? '-'}</strong></span>
          <span className="wc-meta-sep">·</span>
          <span className="wc-meta-item">Valid until: <strong>{parsed.validUntil ?? '-'}</strong></span>
        </div>
      </div>

      {/* ── Certified statements ── */}
      <section className="wc-section">
        <h3 className="wc-section-title">Certifications</h3>
        <div className="wc-statements">
          {parsed.statements.map(stmt => (
            <div key={stmt.num} className="wc-stmt">
              <span className="wc-stmt-num">{stmt.num}</span>
              <p className="wc-stmt-text">{stmt.text}</p>
              <span className="wc-stmt-check">{isStale ? '❓' : '✅'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Transparency statistics ── */}
      {parsed.stats.length > 0 && (
        <section className="wc-section">
          <h3 className="wc-section-title">Transparency Statistics</h3>
          <div className="wc-stats-grid">
            {parsed.stats.map((s, i) => (
              <div key={i} className="wc-stat-card">
                <span className="wc-stat-value">{s.value}</span>
                <span className="wc-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PGP signature ── */}
      <section className="wc-section">
        <h3 className="wc-section-title">Cryptographic Signature</h3>
        {parsed.pgpBlock ? (
          <div className="wc-pgp">
            <div className="wc-pgp-status">
              <span>🔑 PGP signature block present</span>
              <a
                className="wc-pgp-link"
                href="https://nebula-vpn.com/pgp.asc"
                target="_blank"
                rel="noopener noreferrer"
              >
                Import public key
              </a>
            </div>
            <pre className="wc-pgp-pre">{parsed.pgpBlock}</pre>
          </div>
        ) : (
          <p className="wc-note">No PGP signature found. Signing key to be published at nebula-vpn.com/pgp.asc</p>
        )}
      </section>

      {/* ── Raw text toggle ── */}
      <section className="wc-section">
        <button className="wc-toggle-btn" onClick={() => setShowRaw(v => !v)}>
          {showRaw ? '▲ Hide' : '▼ Show'} raw canary.txt
        </button>
        {showRaw && <pre className="wc-raw">{parsed.rawText}</pre>}
      </section>
    </div>
  );
}
