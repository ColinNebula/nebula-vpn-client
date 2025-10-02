import React, { useState, useEffect } from 'react';
import './QuantumSecurity.css';

const QuantumSecurity = () => {
  const [quantumStatus, setQuantumStatus] = useState({
    quantumThreatLevel: 'moderate',
    postQuantumReady: true,
    qkdActive: false,
    quantumResistanceScore: 94
  });

  const [encryptionAlgorithms, setEncryptionAlgorithms] = useState([
    { name: 'CRYSTALS-Kyber', type: 'Key Encapsulation', status: 'active', strength: 'AES-256 equivalent', quantum: true },
    { name: 'CRYSTALS-Dilithium', type: 'Digital Signatures', status: 'active', strength: 'RSA-3072 equivalent', quantum: true },
    { name: 'FALCON', type: 'Digital Signatures', status: 'standby', strength: 'ECDSA-P256 equivalent', quantum: true },
    { name: 'SPHINCS+', type: 'Digital Signatures', status: 'testing', strength: 'Hash-based security', quantum: true },
    { name: 'SIKE', type: 'Key Exchange', status: 'deprecated', strength: 'Supersingular isogeny', quantum: false },
    { name: 'Classic AES-256', type: 'Symmetric', status: 'legacy', strength: 'AES-256', quantum: false }
  ]);

  const [quantumKeyDistribution, setQuantumKeyDistribution] = useState({
    activeChannels: 12,
    keyGenerationRate: 847, // keys per minute
    quantumErrorRate: 0.0023,
    secureDistance: 245, // km
    entangledPairs: 156789,
    fidelity: 99.97
  });

  const [threatAssessment, setThreatAssessment] = useState([
    { category: 'Quantum Computers', threat: 'Shor\'s Algorithm attacks on RSA/ECC', probability: 'low', timeframe: '10-15 years', mitigation: 'Post-quantum cryptography' },
    { category: 'Quantum Annealing', threat: 'Optimization-based cryptanalysis', probability: 'medium', timeframe: '5-10 years', mitigation: 'Algorithm diversification' },
    { category: 'Cryptanalytic Attacks', threat: 'Enhanced classical cryptanalysis', probability: 'high', timeframe: '2-5 years', mitigation: 'Increased key sizes' },
    { category: 'Side-channel Attacks', threat: 'Quantum-enhanced timing attacks', probability: 'medium', timeframe: '3-7 years', mitigation: 'Quantum-safe implementations' }
  ]);

  const [quantumProtocols, setQuantumProtocols] = useState([
    { name: 'BB84 Protocol', description: 'Quantum key distribution using polarized photons', security: 'Unconditional', implementation: 'Hardware', status: 'active' },
    { name: 'E91 Protocol', description: 'Entanglement-based quantum cryptography', security: 'Information-theoretic', implementation: 'Advanced Hardware', status: 'testing' },
    { name: 'SARG04 Protocol', description: 'Four-state quantum key distribution', security: 'High', implementation: 'Specialized Hardware', status: 'available' },
    { name: 'Quantum Digital Signatures', description: 'Quantum-secured message authentication', security: 'Unconditional', implementation: 'Research', status: 'development' }
  ]);

  const [migrationStatus, setMigrationStatus] = useState({
    algorithms: { total: 15, migrated: 12, inProgress: 2, pending: 1 },
    certificates: { total: 847, migrated: 623, inProgress: 156, pending: 68 },
    protocols: { total: 8, migrated: 6, inProgress: 1, pending: 1 },
    compliance: { total: 12, migrated: 10, inProgress: 2, pending: 0 }
  });

  useEffect(() => {
    // Simulate quantum system updates
    const interval = setInterval(() => {
      setQuantumKeyDistribution(prev => ({
        ...prev,
        keyGenerationRate: Math.max(500, prev.keyGenerationRate + (Math.random() - 0.5) * 50),
        quantumErrorRate: Math.max(0.001, Math.min(0.005, prev.quantumErrorRate + (Math.random() - 0.5) * 0.0005)),
        entangledPairs: prev.entangledPairs + Math.floor(Math.random() * 100),
        fidelity: Math.max(99.9, Math.min(100, prev.fidelity + (Math.random() - 0.3) * 0.01))
      }));

      setQuantumStatus(prev => ({
        ...prev,
        quantumResistanceScore: Math.max(85, Math.min(100, prev.quantumResistanceScore + (Math.random() - 0.4)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const activateQKD = () => {
    setQuantumStatus(prev => ({ ...prev, qkdActive: !prev.qkdActive }));
  };

  const switchAlgorithm = (index, newStatus) => {
    setEncryptionAlgorithms(prev => prev.map((algo, i) => 
      i === index ? { ...algo, status: newStatus } : algo
    ));
  };

  return (
    <div className="quantum-security">
      <div className="quantum-header">
        <h3>🔮 Quantum Security</h3>
        <div className="quantum-status">
          <div className={`threat-level ${quantumStatus.quantumThreatLevel}`}>
            ⚠️ Threat Level: {quantumStatus.quantumThreatLevel.toUpperCase()}
          </div>
          <div className="quantum-score">
            🛡️ Quantum Resistance: {quantumStatus.quantumResistanceScore}%
          </div>
        </div>
      </div>

      <div className="quantum-dashboard">
        <div className="post-quantum-overview">
          <h4>🧬 Post-Quantum Cryptography Status</h4>
          <div className="pqc-status">
            <div className="status-indicator">
              <span className="status-icon">
                {quantumStatus.postQuantumReady ? '✅' : '⚠️'}
              </span>
              <span className="status-text">
                {quantumStatus.postQuantumReady ? 'Post-Quantum Ready' : 'Migration Required'}
              </span>
            </div>
            <div className="resistance-meter">
              <div className="meter-container">
                <div 
                  className="meter-fill"
                  style={{ 
                    width: `${quantumStatus.quantumResistanceScore}%`,
                    backgroundColor: quantumStatus.quantumResistanceScore > 90 ? '#10b981' : 
                                   quantumStatus.quantumResistanceScore > 70 ? '#f59e0b' : '#ef4444'
                  }}
                ></div>
              </div>
              <span className="meter-label">Quantum Resistance Score</span>
            </div>
          </div>
        </div>

        <div className="encryption-algorithms">
          <h4>🔐 Quantum-Resistant Algorithms</h4>
          <div className="algorithms-list">
            {encryptionAlgorithms.map((algo, index) => (
              <div key={index} className={`algorithm-card ${algo.status} ${algo.quantum ? 'quantum' : 'classical'}`}>
                <div className="algorithm-header">
                  <span className="algorithm-name">{algo.name}</span>
                  <span className={`algorithm-status ${algo.status}`}>
                    {algo.status === 'active' && '🟢 Active'}
                    {algo.status === 'standby' && '🟡 Standby'}
                    {algo.status === 'testing' && '🔵 Testing'}
                    {algo.status === 'deprecated' && '🔴 Deprecated'}
                    {algo.status === 'legacy' && '⚫ Legacy'}
                  </span>
                </div>
                <div className="algorithm-details">
                  <span className="algorithm-type">Type: {algo.type}</span>
                  <span className="algorithm-strength">Strength: {algo.strength}</span>
                  <span className={`quantum-ready ${algo.quantum ? 'ready' : 'not-ready'}`}>
                    {algo.quantum ? '🧬 Quantum-Resistant' : '⚠️ Quantum-Vulnerable'}
                  </span>
                </div>
                <div className="algorithm-actions">
                  {algo.status === 'standby' && (
                    <button 
                      className="algo-btn activate"
                      onClick={() => switchAlgorithm(index, 'active')}
                    >
                      Activate
                    </button>
                  )}
                  {algo.status === 'active' && algo.quantum && (
                    <button 
                      className="algo-btn standby"
                      onClick={() => switchAlgorithm(index, 'standby')}
                    >
                      Standby
                    </button>
                  )}
                  {algo.status === 'legacy' && (
                    <button 
                      className="algo-btn migrate"
                      onClick={() => switchAlgorithm(index, 'deprecated')}
                    >
                      Migrate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quantum-key-distribution">
          <h4>🔑 Quantum Key Distribution (QKD)</h4>
          <div className="qkd-controls">
            <button 
              className={`qkd-toggle ${quantumStatus.qkdActive ? 'active' : 'inactive'}`}
              onClick={activateQKD}
            >
              {quantumStatus.qkdActive ? '🟢 QKD Active' : '⚫ Activate QKD'}
            </button>
          </div>
          
          {quantumStatus.qkdActive && (
            <div className="qkd-metrics">
              <div className="qkd-metric">
                <span className="metric-label">Active Channels</span>
                <span className="metric-value">{quantumKeyDistribution.activeChannels}</span>
              </div>
              <div className="qkd-metric">
                <span className="metric-label">Key Generation Rate</span>
                <span className="metric-value">{quantumKeyDistribution.keyGenerationRate}/min</span>
              </div>
              <div className="qkd-metric">
                <span className="metric-label">Quantum Error Rate</span>
                <span className="metric-value">{(quantumKeyDistribution.quantumErrorRate * 100).toFixed(3)}%</span>
              </div>
              <div className="qkd-metric">
                <span className="metric-label">Secure Distance</span>
                <span className="metric-value">{quantumKeyDistribution.secureDistance} km</span>
              </div>
              <div className="qkd-metric">
                <span className="metric-label">Entangled Pairs</span>
                <span className="metric-value">{quantumKeyDistribution.entangledPairs.toLocaleString()}</span>
              </div>
              <div className="qkd-metric">
                <span className="metric-label">Fidelity</span>
                <span className="metric-value">{quantumKeyDistribution.fidelity.toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="threat-assessment">
          <h4>⚠️ Quantum Threat Assessment</h4>
          <div className="threats-list">
            {threatAssessment.map((threat, index) => (
              <div key={index} className={`threat-card ${threat.probability}`}>
                <div className="threat-header">
                  <span className="threat-category">{threat.category}</span>
                  <span className={`threat-probability ${threat.probability}`}>
                    {threat.probability === 'high' && '🔴 High'}
                    {threat.probability === 'medium' && '🟡 Medium'}
                    {threat.probability === 'low' && '🟢 Low'}
                  </span>
                </div>
                <div className="threat-description">{threat.threat}</div>
                <div className="threat-details">
                  <span className="threat-timeframe">⏰ {threat.timeframe}</span>
                  <span className="threat-mitigation">🛡️ {threat.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quantum-protocols">
          <h4>📡 Quantum Communication Protocols</h4>
          <div className="protocols-list">
            {quantumProtocols.map((protocol, index) => (
              <div key={index} className={`protocol-card ${protocol.status}`}>
                <div className="protocol-header">
                  <span className="protocol-name">{protocol.name}</span>
                  <span className={`protocol-status ${protocol.status}`}>
                    {protocol.status === 'active' && '🟢 Active'}
                    {protocol.status === 'testing' && '🔵 Testing'}
                    {protocol.status === 'available' && '🟡 Available'}
                    {protocol.status === 'development' && '🔄 Development'}
                  </span>
                </div>
                <div className="protocol-description">{protocol.description}</div>
                <div className="protocol-details">
                  <span className="protocol-security">🛡️ {protocol.security} Security</span>
                  <span className="protocol-implementation">🔧 {protocol.implementation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="migration-progress">
          <h4>🔄 Post-Quantum Migration Progress</h4>
          <div className="migration-categories">
            {Object.entries(migrationStatus).map(([category, data]) => (
              <div key={category} className="migration-category">
                <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                <div className="migration-stats">
                  <div className="migration-bar">
                    <div className="migrated" style={{ width: `${(data.migrated / data.total) * 100}%` }}></div>
                    <div className="in-progress" style={{ width: `${(data.inProgress / data.total) * 100}%` }}></div>
                  </div>
                  <div className="migration-legend">
                    <span className="legend-item migrated">✅ {data.migrated} Migrated</span>
                    <span className="legend-item in-progress">🔄 {data.inProgress} In Progress</span>
                    <span className="legend-item pending">⏳ {data.pending} Pending</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumSecurity;