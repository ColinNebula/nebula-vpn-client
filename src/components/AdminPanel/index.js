import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = ({ onClose, currentUser, onUpdateUser }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [adminData, setAdminData] = useState({
    // Profile Settings
    email: currentUser?.email || '',
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    country: currentUser?.country || '',
    avatarUrl: currentUser?.avatarUrl || '',
    phone: currentUser?.phone || '',
    
    // Security Settings
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: currentUser?.twoFactorEnabled || false,
    backupCodes: currentUser?.backupCodes || [],
    
    // Preferences
    language: currentUser?.language || 'en',
    timezone: currentUser?.timezone || 'UTC',
    theme: currentUser?.theme || 'auto',
    notifications: {
      email: currentUser?.notifications?.email ?? true,
      push: currentUser?.notifications?.push ?? true,
      sms: currentUser?.notifications?.sms ?? false,
      marketing: currentUser?.notifications?.marketing ?? false
    },
    
    // Data & Privacy
    dataRetention: currentUser?.dataRetention || '90days',
    shareAnalytics: currentUser?.shareAnalytics ?? true,
    autoDeleteLogs: currentUser?.autoDeleteLogs ?? false
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Load admin data from secure storage
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    try {
      const storedData = localStorage.getItem('nebula_admin_data');
      if (storedData) {
        const decryptedData = JSON.parse(atob(storedData));
        setAdminData(prev => ({ ...prev, ...decryptedData }));
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const saveAdminData = (data) => {
    try {
      // Encrypt and save to localStorage
      const encryptedData = btoa(JSON.stringify(data));
      localStorage.setItem('nebula_admin_data', encryptedData);
      
      // Also save to secure session storage
      sessionStorage.setItem('nebula_session', btoa(JSON.stringify({
        email: data.email,
        lastActivity: new Date().toISOString()
      })));
      
      return true;
    } catch (error) {
      console.error('Error saving admin data:', error);
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., notifications.email)
      const [parent, child] = name.split('.');
      setAdminData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setAdminData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!adminData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!adminData.firstName || adminData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!adminData.lastName || adminData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (adminData.phone && !/^[\d\s\-\+\(\)]+$/.test(adminData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    return newErrors;
  };

  const validateSecurity = () => {
    const newErrors = {};

    if (adminData.newPassword) {
      if (!adminData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }

      if (adminData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }

      if (adminData.newPassword !== adminData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Password strength check
      const strength = calculatePasswordStrength(adminData.newPassword);
      if (strength < 60) {
        newErrors.newPassword = 'Password is too weak';
      }
    }

    return newErrors;
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const handleSaveProfile = () => {
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const saved = saveAdminData(adminData);
      if (saved) {
        onUpdateUser({
          ...currentUser,
          email: adminData.email,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          country: adminData.country,
          phone: adminData.phone,
          avatarUrl: adminData.avatarUrl
        });
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveSecurity = () => {
    const validationErrors = validateSecurity();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const saved = saveAdminData({
        ...adminData,
        // In production, hash the password before saving
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      if (saved) {
        setSuccessMessage('Security settings updated successfully!');
        setAdminData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSavePreferences = () => {
    setIsLoading(true);
    setTimeout(() => {
      const saved = saveAdminData(adminData);
      if (saved) {
        onUpdateUser({
          ...currentUser,
          language: adminData.language,
          timezone: adminData.timezone,
          theme: adminData.theme,
          notifications: adminData.notifications
        });
        setSuccessMessage('Preferences saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleGenerateBackupCodes = () => {
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );
    setAdminData(prev => ({ ...prev, backupCodes: codes }));
    setSuccessMessage('Backup codes generated! Please save them securely.');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleExportData = () => {
    const dataToExport = {
      profile: {
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        country: adminData.country
      },
      preferences: {
        language: adminData.language,
        timezone: adminData.timezone,
        theme: adminData.theme
      },
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nebula-vpn-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSuccessMessage('Data exported successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleClearStorage = (type) => {
    if (window.confirm(`Are you sure you want to clear ${type} storage? This cannot be undone.`)) {
      if (type === 'local') {
        localStorage.clear();
        setSuccessMessage('Local storage cleared!');
      } else if (type === 'session') {
        sessionStorage.clear();
        setSuccessMessage('Session storage cleared!');
      } else if (type === 'all') {
        localStorage.clear();
        sessionStorage.clear();
        setSuccessMessage('All storage cleared!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-header">
          <h2>⚙️ Admin Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {successMessage && (
          <div className="success-banner">
            ✓ {successMessage}
          </div>
        )}

        <div className="admin-content">
          {/* Sidebar Navigation */}
          <div className="admin-sidebar">
            <button
              className={`sidebar-btn ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <span className="icon">👤</span>
              Profile
            </button>
            <button
              className={`sidebar-btn ${activeSection === 'security' ? 'active' : ''}`}
              onClick={() => setActiveSection('security')}
            >
              <span className="icon">🔒</span>
              Security
            </button>
            <button
              className={`sidebar-btn ${activeSection === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveSection('preferences')}
            >
              <span className="icon">🎨</span>
              Preferences
            </button>
            <button
              className={`sidebar-btn ${activeSection === 'storage' ? 'active' : ''}`}
              onClick={() => setActiveSection('storage')}
            >
              <span className="icon">💾</span>
              Storage
            </button>
            <button
              className={`sidebar-btn ${activeSection === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveSection('privacy')}
            >
              <span className="icon">🛡️</span>
              Privacy
            </button>
          </div>

          {/* Main Content Area */}
          <div className="admin-main">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="admin-section">
                <h3>Profile Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={adminData.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={adminData.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={adminData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={adminData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={adminData.country}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Avatar URL</label>
                  <input
                    type="url"
                    name="avatarUrl"
                    value={adminData.avatarUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <button 
                  className="save-btn"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="admin-section">
                <h3>Security Settings</h3>
                
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={adminData.currentPassword}
                      onChange={handleInputChange}
                      className={errors.currentPassword ? 'error' : ''}
                    />
                    <button 
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={adminData.newPassword}
                    onChange={handleInputChange}
                    className={errors.newPassword ? 'error' : ''}
                  />
                  {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={adminData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="twoFactorEnabled"
                      checked={adminData.twoFactorEnabled}
                      onChange={handleInputChange}
                    />
                    <span>Enable Two-Factor Authentication (2FA)</span>
                  </label>
                </div>

                {adminData.twoFactorEnabled && (
                  <div className="backup-codes-section">
                    <h4>Backup Codes</h4>
                    <p>Save these codes in a secure location. Each can be used once if you lose access to your 2FA device.</p>
                    <button 
                      className="secondary-btn"
                      onClick={handleGenerateBackupCodes}
                    >
                      Generate Backup Codes
                    </button>
                    {adminData.backupCodes.length > 0 && (
                      <div className="backup-codes">
                        {adminData.backupCodes.map((code, index) => (
                          <div key={index} className="backup-code">{code}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className="save-btn"
                  onClick={handleSaveSecurity}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Update Security Settings'}
                </button>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="admin-section">
                <h3>Preferences</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      name="language"
                      value={adminData.language}
                      onChange={handleInputChange}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      name="timezone"
                      value={adminData.timezone}
                      onChange={handleInputChange}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Theme</label>
                  <select
                    name="theme"
                    value={adminData.theme}
                    onChange={handleInputChange}
                  >
                    <option value="auto">Auto (System)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <h4>Notifications</h4>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.email"
                      checked={adminData.notifications.email}
                      onChange={handleInputChange}
                    />
                    <span>Email Notifications</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.push"
                      checked={adminData.notifications.push}
                      onChange={handleInputChange}
                    />
                    <span>Push Notifications</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.sms"
                      checked={adminData.notifications.sms}
                      onChange={handleInputChange}
                    />
                    <span>SMS Notifications</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notifications.marketing"
                      checked={adminData.notifications.marketing}
                      onChange={handleInputChange}
                    />
                    <span>Marketing Emails</span>
                  </label>
                </div>

                <button 
                  className="save-btn"
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}

            {/* Storage Section */}
            {activeSection === 'storage' && (
              <div className="admin-section">
                <h3>Storage Management</h3>
                
                <div className="storage-info">
                  <div className="storage-item">
                    <h4>Local Storage</h4>
                    <p>Used: {(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB</p>
                    <button 
                      className="danger-btn"
                      onClick={() => handleClearStorage('local')}
                    >
                      Clear Local Storage
                    </button>
                  </div>

                  <div className="storage-item">
                    <h4>Session Storage</h4>
                    <p>Used: {(JSON.stringify(sessionStorage).length / 1024).toFixed(2)} KB</p>
                    <button 
                      className="danger-btn"
                      onClick={() => handleClearStorage('session')}
                    >
                      Clear Session Storage
                    </button>
                  </div>

                  <div className="storage-item">
                    <h4>Export Data</h4>
                    <p>Download all your data in JSON format</p>
                    <button 
                      className="secondary-btn"
                      onClick={handleExportData}
                    >
                      Export Data
                    </button>
                  </div>

                  <div className="storage-item danger-zone">
                    <h4>⚠️ Danger Zone</h4>
                    <p>Clear all storage data. This action cannot be undone.</p>
                    <button 
                      className="danger-btn"
                      onClick={() => handleClearStorage('all')}
                    >
                      Clear All Storage
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Section */}
            {activeSection === 'privacy' && (
              <div className="admin-section">
                <h3>Privacy & Data</h3>
                
                <div className="form-group">
                  <label>Data Retention Period</label>
                  <select
                    name="dataRetention"
                    value={adminData.dataRetention}
                    onChange={handleInputChange}
                  >
                    <option value="30days">30 Days</option>
                    <option value="90days">90 Days</option>
                    <option value="180days">180 Days</option>
                    <option value="1year">1 Year</option>
                    <option value="forever">Forever</option>
                  </select>
                  <small>How long to keep your connection logs and activity data</small>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="shareAnalytics"
                      checked={adminData.shareAnalytics}
                      onChange={handleInputChange}
                    />
                    <span>Share anonymous usage analytics</span>
                  </label>
                  <small>Helps us improve the service</small>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="autoDeleteLogs"
                      checked={adminData.autoDeleteLogs}
                      onChange={handleInputChange}
                    />
                    <span>Automatically delete connection logs</span>
                  </label>
                  <small>Logs will be deleted based on retention period</small>
                </div>

                <button 
                  className="save-btn"
                  onClick={handleSavePreferences}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
