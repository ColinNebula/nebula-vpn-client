import React, { useState, useEffect } from 'react';
import './LoginForm.css';

// ─── Provider brand icons ─────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#00a4ef"/>
    <rect x="1" y="11" width="9" height="9" fill="#7fba00"/>
    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
  </svg>
);

const SOCIAL_PROVIDERS = [
  { id: 'google',    label: 'Google',    Icon: GoogleIcon },
  { id: 'apple',     label: 'Apple',     Icon: AppleIcon },
  { id: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon },
];

// ─── Component ────────────────────────────────────────────────────────────────

const LoginForm = ({ onLogin, onSwitchToSignup, onSocialLogin, isDarkMode }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLogging, setIsLogging] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // which provider is in-flight
  const [errors, setErrors] = useState({});

  // Apply dark mode to document even on login screen
  useEffect(() => {
    console.log('🔑 Login form mounted and ready');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsLogging(true);
    setErrors({});

    try {
      await onLogin(credentials);
    } catch (err) {
      setErrors({ form: err.message || 'Login failed. Please check your credentials.' });
    } finally {
      setIsLogging(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSocialLogin = async (provider) => {
    if (!onSocialLogin) return;
    setSocialLoading(provider);
    setErrors({});
    try {
      // Demo simulation: in production this would open the provider OAuth popup/redirect.
      // Replace this block with the real provider SDK call (e.g. google.accounts.oauth2,
      // AppleID.auth.signIn(), or MSAL PublicClientApplication.loginPopup()).
      await new Promise(r => setTimeout(r, 1600));
      const demoProfiles = {
        google:    { email: 'demo.google@gmail.com',      name: 'Google Demo User',    sub: 'google_demo_001' },
        apple:     { email: 'demo.apple@icloud.com',      name: 'Apple Demo User',     sub: 'apple_demo_001' },
        microsoft: { email: 'demo.microsoft@outlook.com', name: 'Microsoft Demo User', sub: 'ms_demo_001' },
      };
      await onSocialLogin(provider, demoProfiles[provider]);
    } catch (err) {
      setErrors({ form: err.message || `${provider} sign-in failed. Please try again.` });
    } finally {
      setSocialLoading(null);
    }
  };

  const isBusy = isLogging || socialLoading !== null;

  return (
    <div className={`login-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="login-form">
        <div className="login-header">
          <h1>🛡️ Nebula VPN</h1>
          <p>Secure your connection</p>
        </div>

        {/* Social sign-in buttons */}
        <div className="social-login-section">
          {SOCIAL_PROVIDERS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`social-login-btn social-login-btn--${id}`}
              onClick={() => handleSocialLogin(id)}
              disabled={isBusy}
              aria-label={`Sign in with ${label}`}
            >
              {socialLoading === id ? (
                <span className="social-spinner" aria-hidden="true" />
              ) : (
                <Icon />
              )}
              <span>{socialLoading === id ? `Connecting…` : `Continue with ${label}`}</span>
            </button>
          ))}
        </div>

        <div className="login-divider">
          <span>OR SIGN IN WITH EMAIL</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          {errors.form && (
            <div className="form-error-banner">{errors.form}</div>
          )}
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={credentials.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isBusy}
          >
            {isLogging ? 'Logging in…' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? 
            <button 
              type="button"
              className="signup-link" 
              onClick={onSwitchToSignup}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
