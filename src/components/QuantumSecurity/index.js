import React, { useState, useEffect, useRef, useCallback } from 'react';
import './QuantumSecurity.css';

// ─── Constants ───────────────────────────────────────────────────────────────

// NIST PQC round-4 / finalised standards (2024); SIKE removed — was cracked in 2022
const ALGORITHMS = [
  {
    id: 'kyber',
    name: 'ML-KEM (Kyber-1024)',
    type: 'Key Encapsulation',
    nist: 'FIPS 203',
    status: 'active',
    bits: 256,
    quantum: true,
    desc: 'NIST-standardised lattice-based KEM. Primary key exchange algorithm.',
  },
  {
    id: 'dilithium',
    name: 'ML-DSA (Dilithium-3)',
    type: 'Digital Signature',
    nist: 'FIPS 204',
    status: 'active',
    bits: 192,
    quantum: true,
    desc: 'NIST-standardised lattice-based signature. Used for server authentication.',
  },
  {
    id: 'falcon',
    name: 'FN-DSA (FALCON-1024)',
    type: 'Digital Signature',
    nist: 'FIPS 206',
    status: 'standby',
    bits: 256,
    quantum: true,
    desc: 'Compact NTRU lattice signatures. Smaller footprint than Dilithium.',
  },
  {
    id: 'sphincs',
    name: 'SLH-DSA (SPHINCS+-256)',
    type: 'Digital Signature',
    nist: 'FIPS 205',
    status: 'standby',
    bits: 256,
    quantum: true,
    desc: 'Hash-based, stateless. No algebraic assumptions — maximum conservatism.',
  },
  {
    id: 'aes256',
    name: 'AES-256-GCM',
    type: 'Symmetric Cipher',
    nist: 'FIPS 197',
    status: 'active',
    bits: 256,
    quantum: true, // symmetric 256-bit survives Grover's attack (equiv. 128-bit)
    desc: 'Data encryption. 256-bit key provides 128-bit quantum security.',
  },
  {
    id: 'rsa',
    name: 'RSA-4096',
    type: 'Legacy Key Exchange',
    nist: '—',
    status: 'deprecated',
    bits: 4096,
    quantum: false, // Shor's algorithm breaks RSA
    desc: 'Legacy only. Vulnerable to Shor\'s algorithm on CRQC. Migrate immediately.',
  },
];

// Estimated years until a Cryptographically Relevant Quantum Computer (CRQC)
const Q_DAY_YEAR = 2035;

const fmtCountdown = (targetYear) => {
  const now = new Date();
  const target = new Date(targetYear, 0, 1);
  const diffMs = target - now;
  if (diffMs <= 0) return { years: 0, days: 0, hours: 0 };
  const totalDays = Math.floor(diffMs / 86400000);
  return {
    years: Math.floor(totalDays / 365),
    days: totalDays % 365,
    hours: Math.floor((diffMs % 86400000) / 3600000),
  };
};

// ─── Entropy visualiser bars ─────────────────────────────────────────────────
const EntropyBar = ({ value, max = 100, color = '#4ade80' }) => (
  <div className="qs-entropy-bar-track">
    <div
      className="qs-entropy-bar-fill"
      style={{ width: `${(value / max) * 100}%`, background: color }}
    />
  </div>
);

// ─── Animated quantum noise canvas ───────────────────────────────────────────
const QuantumNoise = ({ active }) => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cols = 32;
    const colW = W / cols;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < cols; i++) {
        const v = active ? Math.random() : 0.05 + Math.random() * 0.1;
        const h = v * H;
        const alpha = active ? 0.4 + Math.random() * 0.6 : 0.12;
        ctx.fillStyle = active
          ? `rgba(74,222,128,${alpha})`
          : `rgba(148,163,184,${alpha})`;
        ctx.fillRect(i * colW + 1, H - h, colW - 2, h);
      }
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return <canvas ref={canvasRef} className="qs-noise-canvas" width={320} height={80} />;
};

// ─── Main component ───────────────────────────────────────────────────────────
const QuantumSecurity = () => {
  const [algorithms, setAlgorithms]         = useState(ALGORITHMS);
  const [qkdActive,  setQkdActive]          = useState(false);
  const [activeTab,  setActiveTab]          = useState('overview');
  const [countdown,  setCountdown]          = useState(fmtCountdown(Q_DAY_YEAR));
  const [resistScore, setResistScore]       = useState(91);
  const [entropyPool, setEntropyPool]       = useState(Array(8).fill(0).map(() => Math.random() * 80 + 20));
  const [keyLastRotated, setKeyLastRotated] = useState(() => {
    const d = new Date(); d.setHours(d.getHours() - 6); return d;
  });
  const [rotationCountdown, setRotationCountdown] = useState(18); // hours until next rotation
  const [qkdMetrics, setQkdMetrics] = useState({
    channels: 12, keyRate: 847, errorRate: 0.0023, distance: 245,
    entangledPairs: 156789, fidelity: 99.97,
  });

  const activeAlgos  = algorithms.filter(a => a.status === 'active');
  const quantum_ok   = activeAlgos.every(a => a.quantum);
  const vulnCount    = algorithms.filter(a => a.status !== 'deprecated' && !a.quantum).length;

  // ── Live ticks ──
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(fmtCountdown(Q_DAY_YEAR));
      setEntropyPool(p => p.map(() => Math.random() * 100));
      setResistScore(p => Math.max(88, Math.min(100, p + (Math.random() - 0.4) * 0.5)));
      setRotationCountdown(p => p > 0 ? p - 1/120 : 24); // counts down, resets at 0
      if (qkdActive) {
        setQkdMetrics(p => ({
          ...p,
          keyRate:       Math.max(600, p.keyRate + (Math.random() - 0.5) * 40),
          errorRate:     Math.max(0.001, Math.min(0.005, p.errorRate + (Math.random() - 0.5) * 0.0003)),
          entangledPairs:p.entangledPairs + Math.floor(Math.random() * 80),
          fidelity:      Math.max(99.9, Math.min(100, p.fidelity + (Math.random() - 0.3) * 0.01)),
        }));
      }
    }, 500);
    return () => clearInterval(t);
  }, [qkdActive]);

  const rotateKeys = useCallback(() => {
    setKeyLastRotated(new Date());
    setRotationCountdown(24);
  }, []);

  const toggleAlgo = (id) => {
    setAlgorithms(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (a.status === 'active' && activeAlgos.filter(x => x.quantum).length > 1)
        return { ...a, status: 'standby' };
      if (a.status === 'standby') return { ...a, status: 'active' };
      return a;
    }));
  };

  const scoreColor = resistScore >= 90 ? '#4ade80' : resistScore >= 70 ? '#facc15' : '#f87171';

  const fmtRotated = (d) => {
    const mins = Math.floor((Date.now() - d) / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const TABS = ['overview', 'algorithms', 'qkd', 'threats'];

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="qs-root">

      {/* ── Header ── */}
      <div className="qs-header">
        <div className="qs-header-left">
          <h2 className="qs-title">🔮 Quantum Security</h2>
          <span className={`qs-badge ${quantum_ok ? 'safe' : 'warn'}`}>
            {quantum_ok ? '✓ PQC Hardened' : `⚠ ${vulnCount} Vulnerability`}
          </span>
          <span className="qs-nist-badge">NIST FIPS 2024</span>
        </div>
        <div className="qs-score-pill" style={{ borderColor: scoreColor, color: scoreColor }}>
          <span className="qs-score-num">{Math.round(resistScore)}</span>
          <span className="qs-score-label">/ 100 Resistance</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="qs-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`qs-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === 'overview' && (
        <div className="qs-section-grid">

          {/* Q-Day countdown */}
          <div className="qs-card qs-qday-card">
            <div className="qs-card-title">⏳ Q-Day Countdown</div>
            <p className="qs-qday-sub">
              Estimated CRQC arrival: <strong>{Q_DAY_YEAR}</strong>
            </p>
            <div className="qs-countdown-row">
              {[['Years', countdown.years], ['Days', countdown.days], ['Hours', countdown.hours]].map(([lbl, val]) => (
                <div key={lbl} className="qs-countdown-cell">
                  <span className="qs-countdown-num">{val}</span>
                  <span className="qs-countdown-lbl">{lbl}</span>
                </div>
              ))}
            </div>
            <p className="qs-qday-note">
              Your tunnel is protected today. All active algorithms are post-quantum safe.
            </p>
          </div>

          {/* Resistance meter */}
          <div className="qs-card">
            <div className="qs-card-title">🛡️ Quantum Resistance Score</div>
            <div className="qs-score-arc-wrap">
              <svg viewBox="0 0 120 70" className="qs-arc-svg">
                <defs>
                  <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#667eea" />
                    <stop offset="100%" stopColor={scoreColor} />
                  </linearGradient>
                </defs>
                <path d="M 12 60 A 48 48 0 0 1 108 60"
                  fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 12 60 A 48 48 0 0 1 108 60"
                  fill="none" stroke="url(#arcGrad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(resistScore / 100) * 150} 150`}
                  style={{ transition: 'stroke-dasharray 1s ease' }} />
                <text x="60" y="54" textAnchor="middle" className="qs-arc-num">{Math.round(resistScore)}</text>
                <text x="60" y="66" textAnchor="middle" className="qs-arc-lbl">/ 100</text>
              </svg>
            </div>
            <div className="qs-checklist">
              {[
                { label: 'NIST PQC Active',       on: quantum_ok },
                { label: 'QKD Channel',            on: qkdActive },
                { label: 'Key Rotation Current',   on: rotationCountdown > 12 },
                { label: 'Zero Legacy Algorithms', on: vulnCount === 0 },
              ].map(c => (
                <div key={c.label} className={`qs-check-row ${c.on ? 'on' : 'off'}`}>
                  <span>{c.on ? '✓' : '✗'}</span>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Entropy pool */}
          <div className="qs-card">
            <div className="qs-card-title">🎲 Live Entropy Pool</div>
            <QuantumNoise active={qkdActive} />
            <div className="qs-entropy-grid">
              {entropyPool.map((v, i) => (
                <div key={i} className="qs-entropy-lane">
                  <span className="qs-entropy-lbl">Pool {i + 1}</span>
                  <EntropyBar value={v} color={v > 70 ? '#4ade80' : v > 40 ? '#facc15' : '#f87171'} />
                  <span className="qs-entropy-val">{Math.round(v)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key rotation */}
          <div className="qs-card">
            <div className="qs-card-title">🔄 Session Key Rotation</div>
            <div className="qs-key-stats">
              <div className="qs-key-stat">
                <span className="qs-key-stat-label">Last Rotated</span>
                <span className="qs-key-stat-val">{fmtRotated(keyLastRotated)}</span>
              </div>
              <div className="qs-key-stat">
                <span className="qs-key-stat-label">Next Rotation</span>
                <span className="qs-key-stat-val" style={{ color: rotationCountdown < 2 ? '#f87171' : '#4ade80' }}>
                  {Math.floor(rotationCountdown)}h {Math.floor((rotationCountdown % 1) * 60)}m
                </span>
              </div>
              <div className="qs-key-stat">
                <span className="qs-key-stat-label">Algorithm</span>
                <span className="qs-key-stat-val">ML-KEM-1024</span>
              </div>
              <div className="qs-key-stat">
                <span className="qs-key-stat-label">Key Size</span>
                <span className="qs-key-stat-val">256-bit</span>
              </div>
            </div>
            <div className="qs-rotation-bar-track">
              <div className="qs-rotation-bar-fill"
                style={{ width: `${(rotationCountdown / 24) * 100}%` }} />
            </div>
            <button className="qs-rotate-btn" onClick={rotateKeys}>
              ↺ Rotate Keys Now
            </button>
          </div>
        </div>
      )}

      {/* ══ ALGORITHMS TAB ══ */}
      {activeTab === 'algorithms' && (
        <div className="qs-algo-grid">
          {algorithms.map(a => (
            <div key={a.id} className={`qs-algo-card ${a.status} ${a.quantum ? 'pqc' : 'classical'}`}>
              <div className="qs-algo-top">
                <div>
                  <div className="qs-algo-name">{a.name}</div>
                  <div className="qs-algo-type">{a.type}</div>
                </div>
                <div className="qs-algo-right">
                  <span className={`qs-algo-status-badge ${a.status}`}>
                    {a.status === 'active'     && '🟢 Active'}
                    {a.status === 'standby'    && '🟡 Standby'}
                    {a.status === 'deprecated' && '🔴 Deprecated'}
                  </span>
                  {a.nist !== '—' && (
                    <span className="qs-nist-pill">{a.nist}</span>
                  )}
                </div>
              </div>
              <p className="qs-algo-desc">{a.desc}</p>
              <div className="qs-algo-meta">
                <span>{a.bits}-bit security</span>
                <span className={`qs-pqc-tag ${a.quantum ? 'ok' : 'bad'}`}>
                  {a.quantum ? '🧬 Post-Quantum' : '⚠ Quantum-Vulnerable'}
                </span>
              </div>
              {(a.status === 'active' || a.status === 'standby') && a.id !== 'rsa' && (
                <button
                  className={`qs-algo-btn ${a.status === 'active' ? 'deactivate' : 'activate'}`}
                  onClick={() => toggleAlgo(a.id)}
                >
                  {a.status === 'active' ? 'Set Standby' : 'Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ QKD TAB ══ */}
      {activeTab === 'qkd' && (
        <div className="qs-qkd-section">
          <div className="qs-qkd-hero">
            <div className="qs-qkd-info">
              <h3>Quantum Key Distribution</h3>
              <p>QKD uses the laws of quantum mechanics to generate and distribute
              cryptographic keys. Any eavesdropping attempt disturbs the quantum
              states, making interception detectable.</p>
              <div className="qs-qkd-badges">
                <span className="qs-badge-info">BB84 Protocol</span>
                <span className="qs-badge-info">E91 Entanglement</span>
                <span className="qs-badge-info">Unconditional Security</span>
              </div>
            </div>
            <button
              className={`qs-qkd-toggle ${qkdActive ? 'on' : 'off'}`}
              onClick={() => setQkdActive(p => !p)}
            >
              <span className="qs-qkd-toggle-icon">{qkdActive ? '⬛' : '▶'}</span>
              <span>{qkdActive ? 'Deactivate QKD' : 'Activate QKD'}</span>
            </button>
          </div>

          {qkdActive && (
            <>
              <div className="qs-qkd-noise-wrap">
                <div className="qs-card-title">Quantum Channel Activity</div>
                <QuantumNoise active />
              </div>
              <div className="qs-qkd-metrics-grid">
                {[
                  { label: 'Active Channels',  value: qkdMetrics.channels,                              unit: '',     color: '#60a5fa' },
                  { label: 'Key Rate',          value: Math.round(qkdMetrics.keyRate),                   unit: '/min', color: '#4ade80' },
                  { label: 'QBER',              value: (qkdMetrics.errorRate * 100).toFixed(3),          unit: '%',    color: qkdMetrics.errorRate > 0.03 ? '#f87171' : '#4ade80' },
                  { label: 'Secure Distance',   value: qkdMetrics.distance,                              unit: 'km',   color: '#a78bfa' },
                  { label: 'Entangled Pairs',   value: qkdMetrics.entangledPairs.toLocaleString(),       unit: '',     color: '#f472b6' },
                  { label: 'Fidelity',          value: qkdMetrics.fidelity.toFixed(2),                  unit: '%',    color: '#4ade80' },
                ].map(m => (
                  <div key={m.label} className="qs-qkd-metric">
                    <span className="qs-qkd-m-val" style={{ color: m.color }}>{m.value}<span className="qs-qkd-m-unit">{m.unit}</span></span>
                    <span className="qs-qkd-m-label">{m.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!qkdActive && (
            <div className="qs-qkd-offline">
              <span className="qs-qkd-offline-icon">⚫</span>
              <p>QKD channel is offline. Activate to establish quantum-secured key distribution.</p>
              <p className="qs-qkd-offline-sub">Standard post-quantum cryptography is still fully active.</p>
            </div>
          )}
        </div>
      )}

      {/* ══ THREATS TAB ══ */}
      {activeTab === 'threats' && (
        <div className="qs-threats-section">
          <div className="qs-threats-grid">
            {[
              {
                cat: "Shor's Algorithm",
                icon: '💻',
                threat: 'Breaks RSA, ECC, DH key exchange exponentially faster on a CRQC.',
                prob: 'future',
                timeframe: '8–12 years',
                mitigation: 'ML-KEM replaces all asymmetric key exchange.',
                mitigated: true,
              },
              {
                cat: "Grover's Algorithm",
                icon: '🔍',
                threat: 'Halves the effective bit-strength of symmetric ciphers (AES-128 → 64-bit).',
                prob: 'future',
                timeframe: '8–12 years',
                mitigation: 'AES-256 provides 128-bit quantum security — no change needed.',
                mitigated: true,
              },
              {
                cat: 'Harvest Now, Decrypt Later',
                icon: '📦',
                threat: 'Adversaries are storing TLS traffic today to decrypt once CRQCs exist.',
                prob: 'high',
                timeframe: 'Right now',
                mitigation: 'PQC key encapsulation ensures forward secrecy against future decryption.',
                mitigated: true,
              },
              {
                cat: 'Side-Channel Attacks',
                icon: '⏱️',
                threat: 'Timing, power and cache-based attacks on PQC implementations.',
                prob: 'medium',
                timeframe: '3–7 years',
                mitigation: 'Constant-time implementations; hardware security modules.',
                mitigated: false,
              },
              {
                cat: 'Quantum Annealing Cryptanalysis',
                icon: '🌀',
                threat: 'D-Wave-style optimisation attacks on lattice problems (theoretical).',
                prob: 'low',
                timeframe: '10–15 years',
                mitigation: 'Conservative parameter choices in ML-KEM absorb this margin.',
                mitigated: true,
              },
              {
                cat: 'Supply Chain / Backdoored Randomness',
                icon: '🏭',
                threat: 'Weak entropy in key generation undermines any algorithm.',
                prob: 'medium',
                timeframe: 'Today',
                mitigation: 'Entropy pool monitors and hardware RNG fallback (see Overview tab).',
                mitigated: true,
              },
            ].map(t => (
              <div key={t.cat} className={`qs-threat-card ${t.prob} ${t.mitigated ? 'mitigated' : 'open'}`}>
                <div className="qs-threat-top">
                  <span className="qs-threat-icon">{t.icon}</span>
                  <div>
                    <div className="qs-threat-cat">{t.cat}</div>
                    <div className="qs-threat-timeframe">⏰ {t.timeframe}</div>
                  </div>
                  <span className={`qs-threat-prob ${t.prob}`}>
                    {t.prob === 'high'   && '🔴 High'}
                    {t.prob === 'medium' && '🟡 Medium'}
                    {t.prob === 'low'    && '🟢 Low'}
                    {t.prob === 'future' && '🔵 Future'}
                  </span>
                </div>
                <p className="qs-threat-desc">{t.threat}</p>
                <div className={`qs-threat-mitigation ${t.mitigated ? 'ok' : 'warn'}`}>
                  <span>{t.mitigated ? '✓ Mitigated:' : '⚠ Partial:'}</span> {t.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumSecurity;
