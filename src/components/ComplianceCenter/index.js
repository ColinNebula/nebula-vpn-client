import React, { useState } from 'react';
import './ComplianceCenter.css';

const ComplianceCenter = () => {
  const [activeFramework, setActiveFramework] = useState('gdpr');
  const [complianceScores, setComplianceScores] = useState({
    gdpr: 92,
    hipaa: 87,
    sox: 94,
    pci: 89
  });

  const frameworks = [
    {
      id: 'gdpr',
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      icon: '🇪🇺',
      description: 'EU data protection and privacy regulation',
      requirements: 12,
      compliant: 11
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      fullName: 'Health Insurance Portability and Accountability Act',
      icon: '🏥',
      description: 'US healthcare data protection standards',
      requirements: 18,
      compliant: 16
    },
    {
      id: 'sox',
      name: 'SOX',
      fullName: 'Sarbanes-Oxley Act',
      icon: '📊',
      description: 'Financial reporting and corporate governance',
      requirements: 8,
      compliant: 8
    },
    {
      id: 'pci',
      name: 'PCI-DSS',
      fullName: 'Payment Card Industry Data Security Standard',
      icon: '💳',
      description: 'Credit card data protection requirements',
      requirements: 15,
      compliant: 13
    }
  ];

  const auditTrail = [
    {
      id: 1,
      timestamp: '2025-10-02 14:32:15',
      event: 'Data Access Request',
      user: 'john.doe@company.com',
      framework: 'GDPR',
      severity: 'normal',
      details: 'User requested personal data export'
    },
    {
      id: 2,
      timestamp: '2025-10-02 13:45:22',
      event: 'Encryption Key Rotation',
      user: 'system',
      framework: 'HIPAA',
      severity: 'important',
      details: 'Automated encryption key rotation completed'
    },
    {
      id: 3,
      timestamp: '2025-10-02 12:18:44',
      event: 'Compliance Violation Detected',
      user: 'jane.smith@company.com',
      framework: 'PCI-DSS',
      severity: 'critical',
      details: 'Unencrypted credit card data transmission detected'
    },
    {
      id: 4,
      timestamp: '2025-10-02 11:05:33',
      event: 'Access Control Updated',
      user: 'admin@company.com',
      framework: 'SOX',
      severity: 'normal',
      details: 'Financial system access permissions modified'
    }
  ];

  const currentFramework = frameworks.find(f => f.id === activeFramework);

  const generateReport = (framework) => {
    alert(`📋 Generating ${framework.name} compliance report...\n\nReport will include:\n• Compliance score analysis\n• Violation details\n• Remediation recommendations\n• Audit trail export\n\nReport will be ready in 2-3 minutes.`);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      important: '#f59e0b',
      normal: '#3b82f6'
    };
    return colors[severity] || colors.normal;
  };

  return (
    <div className="compliance-center">
      <div className="compliance-header">
        <h3>📋 Compliance Center</h3>
        <button className="generate-report-btn" onClick={() => generateReport(currentFramework)}>
          📄 Generate Report
        </button>
      </div>

      {/* Framework Selector */}
      <div className="framework-selector">
        {frameworks.map(framework => (
          <button
            key={framework.id}
            className={`framework-card ${activeFramework === framework.id ? 'active' : ''}`}
            onClick={() => setActiveFramework(framework.id)}
          >
            <div className="framework-icon">{framework.icon}</div>
            <div className="framework-info">
              <h4>{framework.name}</h4>
              <p>{framework.description}</p>
              <div className="compliance-score">
                <span className="score-value">{complianceScores[framework.id]}%</span>
                <span className="score-label">Compliant</span>
              </div>
            </div>
            <div className="requirements-badge">
              {framework.compliant}/{framework.requirements}
            </div>
          </button>
        ))}
      </div>

      {/* Detailed View */}
      <div className="compliance-details">
        <div className="details-grid">
          {/* Requirements Checklist */}
          <div className="requirements-panel">
            <h4>📝 {currentFramework.name} Requirements</h4>
            <div className="requirements-list">
              {[...Array(currentFramework.requirements)].map((_, index) => {
                const isCompliant = index < currentFramework.compliant;
                return (
                  <div key={index} className={`requirement-item ${isCompliant ? 'compliant' : 'non-compliant'}`}>
                    <span className="requirement-status">
                      {isCompliant ? '✅' : '❌'}
                    </span>
                    <div className="requirement-content">
                      <span className="requirement-title">
                        Requirement {index + 1}: {getRequirementTitle(currentFramework.id, index)}
                      </span>
                      <span className="requirement-desc">
                        {getRequirementDescription(currentFramework.id, index)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compliance Metrics */}
          <div className="metrics-panel">
            <h4>📊 Compliance Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">📈</div>
                <div className="metric-content">
                  <div className="metric-value">{complianceScores[activeFramework]}%</div>
                  <div className="metric-label">Overall Score</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">✅</div>
                <div className="metric-content">
                  <div className="metric-value">{currentFramework.compliant}</div>
                  <div className="metric-label">Requirements Met</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">⚠️</div>
                <div className="metric-content">
                  <div className="metric-value">{currentFramework.requirements - currentFramework.compliant}</div>
                  <div className="metric-label">Gaps Identified</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🔄</div>
                <div className="metric-content">
                  <div className="metric-value">Daily</div>
                  <div className="metric-label">Monitoring</div>
                </div>
              </div>
            </div>

            {/* Compliance Score Circle */}
            <div className="score-circle">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth="10"
                />
                <circle
                  cx="75"
                  cy="75"
                  r="65"
                  fill="none"
                  stroke={complianceScores[activeFramework] >= 90 ? '#10b981' : complianceScores[activeFramework] >= 75 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${complianceScores[activeFramework] * 4.08} 408`}
                  strokeLinecap="round"
                  transform="rotate(-90 75 75)"
                />
                <text
                  x="75"
                  y="75"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="32"
                  fontWeight="bold"
                  fill="var(--text-primary)"
                >
                  {complianceScores[activeFramework]}%
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="audit-trail">
        <h4>📜 Recent Audit Trail</h4>
        <div className="audit-list">
          {auditTrail.map(entry => (
            <div key={entry.id} className="audit-entry">
              <div className="audit-time">{entry.timestamp}</div>
              <div className="audit-content">
                <div className="audit-header">
                  <span className="audit-event">{entry.event}</span>
                  <span 
                    className="audit-severity"
                    style={{ color: getSeverityColor(entry.severity) }}
                  >
                    {entry.severity}
                  </span>
                </div>
                <div className="audit-details">
                  <span className="audit-user">User: {entry.user}</span>
                  <span className="audit-framework">Framework: {entry.framework}</span>
                </div>
                <div className="audit-description">{entry.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper functions for dynamic content
const getRequirementTitle = (framework, index) => {
  const titles = {
    gdpr: ['Data Processing Lawfulness', 'Consent Management', 'Data Minimization', 'Privacy by Design', 'Data Subject Rights', 'Breach Notification', 'Data Protection Officer', 'Impact Assessments', 'Cross-Border Transfers', 'Record Keeping', 'Technical Safeguards', 'Organizational Measures'],
    hipaa: ['Administrative Safeguards', 'Physical Safeguards', 'Technical Safeguards', 'Access Control', 'Audit Controls', 'Integrity', 'Person Authentication', 'Transmission Security', 'Minimum Necessary', 'Notice of Privacy Practices', 'Access Rights', 'Amendment Rights', 'Accounting Disclosures', 'Restriction Requests', 'Confidential Communications', 'Business Associates', 'Workforce Training', 'Incident Response'],
    sox: ['Internal Controls', 'Financial Reporting', 'Executive Certification', 'Auditor Independence', 'Corporate Responsibility', 'Disclosure Controls', 'Real-time Disclosures', 'Code of Ethics'],
    pci: ['Firewall Configuration', 'Default Passwords', 'Cardholder Data Protection', 'Encrypted Transmission', 'Anti-virus Software', 'Secure Systems', 'Access Control', 'Unique IDs', 'Physical Access Restriction', 'Network Monitoring', 'Regular Testing', 'Information Security Policy', 'Vendor Management', 'Incident Response Plan', 'Vulnerability Management']
  };
  return titles[framework]?.[index] || `Requirement ${index + 1}`;
};

const getRequirementDescription = (framework, index) => {
  const descriptions = {
    gdpr: ['Ensure lawful basis for processing personal data', 'Implement proper consent mechanisms', 'Process only necessary data', 'Build privacy into system design', 'Enable individual rights exercise', 'Report breaches within 72 hours', 'Appoint DPO where required', 'Conduct privacy impact assessments', 'Ensure adequate protection for transfers', 'Maintain processing records', 'Implement appropriate technical measures', 'Establish organizational safeguards'],
    hipaa: ['Implement administrative controls', 'Secure physical access to systems', 'Deploy technical security measures', 'Control system access', 'Monitor and log activities', 'Ensure data integrity', 'Verify user identity', 'Secure data transmission', 'Limit access to minimum necessary', 'Provide privacy notices', 'Enable patient access rights', 'Allow data amendments', 'Track disclosure accounting', 'Honor restriction requests', 'Secure communications', 'Manage business associate agreements', 'Train workforce on privacy', 'Establish incident procedures'],
    sox: ['Establish internal control framework', 'Ensure accurate financial reporting', 'CEO/CFO certification of reports', 'Maintain auditor independence', 'Define corporate responsibilities', 'Implement disclosure controls', 'Provide real-time disclosures', 'Establish code of ethics'],
    pci: ['Configure firewall rules properly', 'Change default system passwords', 'Protect stored cardholder data', 'Encrypt data transmission', 'Use updated anti-virus software', 'Develop secure systems', 'Restrict data access by business need', 'Assign unique ID to each user', 'Restrict physical access to systems', 'Track and monitor network access', 'Test security systems regularly', 'Maintain information security policy', 'Regularly update anti-virus', 'Maintain incident response plan', 'Regularly update anti-virus']
  };
  return descriptions[framework]?.[index] || 'Compliance requirement description';
};

export default ComplianceCenter;