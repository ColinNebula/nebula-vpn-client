import React, { useState } from 'react';
import './SignupForm.css';

// ─── Provider brand icons (same set as LoginForm) ─────────────────────────────

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

const SignupForm = ({ onSignupSuccess, onSwitchToLogin, onSocialAuth }) => {
  const [step, setStep] = useState(1); // 1: Account Info, 2: Personal Details, 3: Plan Selection, 4: Verification
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: '',
    referralCode: '',
    selectedPlan: 'free',
    agreeToTerms: false,
    agreeToMarketing: false
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationSent, setVerificationSent] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'apple' | 'microsoft' | null

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Switzerland', 'Austria', 'Belgium', 'Portugal',
    'Ireland', 'New Zealand', 'Singapore', 'Japan', 'South Korea',
    'Hong Kong', 'India', 'Brazil', 'Mexico', 'Argentina', 'Other'
  ];

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

  const getPasswordStrengthLabel = (strength) => {
    if (strength < 30) return { label: 'Weak', color: '#f44336' };
    if (strength < 60) return { label: 'Fair', color: '#ff9800' };
    if (strength < 80) return { label: 'Good', color: '#2196F3' };
    return { label: 'Strong', color: '#4CAF50' };
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      // Password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (passwordStrength < 60) {
        newErrors.password = 'Password is too weak. Add uppercase, numbers, and symbols';
      }

      // Confirm password
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Terms agreement
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the Terms of Service';
      }
    }

    if (currentStep === 2) {
      // First name
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      } else if (formData.firstName.length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters';
      }

      // Last name
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      } else if (formData.lastName.length < 2) {
        newErrors.lastName = 'Last name must be at least 2 characters';
      }

      // Country
      if (!formData.country) {
        newErrors.country = 'Please select your country';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 3) {
        // Send verification email before going to step 4
        sendVerificationEmail();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const sendVerificationEmail = () => {
    setIsLoading(true);
    // Simulate sending verification email
    setTimeout(() => {
      setVerificationSent(true);
      setIsLoading(false);
      setStep(4);
    }, 2000);
  };

  const handleVerificationCodeChange = (index, value) => {
    if (value.length > 1) return; // Only allow single character
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerificationCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyAndSignup = () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setErrors({ verification: 'Please enter the complete 6-digit code' });
      return;
    }

    setIsLoading(true);
    
    // Simulate verification and signup
    setTimeout(() => {
      setIsLoading(false);
      
      // Create user object
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        country: formData.country,
        plan: formData.selectedPlan,
        verified: true,
        createdAt: new Date().toISOString()
      };

      // Call success callback
      onSignupSuccess(userData);
    }, 2000);
  };

  const resendVerificationCode = () => {
    setVerificationCode(['', '', '', '', '', '']);
    sendVerificationEmail();
  };

  const handleSocialAuth = async (provider) => {
    if (!onSocialAuth) return;
    setSocialLoading(provider);
    setErrors({});
    try {
      // Demo simulation: in production this would open the provider OAuth popup/redirect.
      await new Promise(r => setTimeout(r, 1600));
      const demoProfiles = {
        google:    { email: 'demo.google@gmail.com',      name: 'Google Demo User',    sub: 'google_demo_001' },
        apple:     { email: 'demo.apple@icloud.com',      name: 'Apple Demo User',     sub: 'apple_demo_001' },
        microsoft: { email: 'demo.microsoft@outlook.com', name: 'Microsoft Demo User', sub: 'ms_demo_001' },
      };
      await onSocialAuth(provider, demoProfiles[provider]);
    } catch (err) {
      setErrors({ social: err.message || `${provider} sign-up failed. Please try again.` });
    } finally {
      setSocialLoading(null);
    }
  };

  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className="signup-form-container">
      <div className="signup-form">
        <div className="signup-header">
          <h2>Create Your Account</h2>
          <p>Join thousands of users protecting their privacy</p>
        </div>

        {/* Progress Steps */}
        <div className="signup-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="step-label">Account</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">
              {step > 2 ? '✓' : '2'}
            </div>
            <span className="step-label">Details</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-circle">
              {step > 3 ? '✓' : '3'}
            </div>
            <span className="step-label">Plan</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
            <div className="step-circle">4</div>
            <span className="step-label">Verify</span>
          </div>
        </div>

        {/* Step 1: Account Information */}
        {step === 1 && (
          <div className="signup-step">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter a strong password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: strengthInfo.color
                      }}
                    ></div>
                  </div>
                  <span className="strength-label" style={{ color: strengthInfo.color }}>
                    {strengthInfo.label}
                  </span>
                </div>
              )}
              {errors.password && <span className="error-message">{errors.password}</span>}
              <div className="password-requirements">
                <div className={formData.password.length >= 8 ? 'req-met' : ''}>
                  {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                </div>
                <div className={/[A-Z]/.test(formData.password) ? 'req-met' : ''}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'} Uppercase letter
                </div>
                <div className={/[a-z]/.test(formData.password) ? 'req-met' : ''}>
                  {/[a-z]/.test(formData.password) ? '✓' : '○'} Lowercase letter
                </div>
                <div className={/[0-9]/.test(formData.password) ? 'req-met' : ''}>
                  {/[0-9]/.test(formData.password) ? '✓' : '○'} Number
                </div>
                <div className={/[^a-zA-Z0-9]/.test(formData.password) ? 'req-met' : ''}>
                  {/[^a-zA-Z0-9]/.test(formData.password) ? '✓' : '○'} Special character
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                />
                <span>I agree to the <a href="#terms" className="link">Terms of Service</a> and <a href="#privacy" className="link">Privacy Policy</a> *</span>
              </label>
              {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToMarketing"
                  checked={formData.agreeToMarketing}
                  onChange={handleInputChange}
                />
                <span>Send me tips, updates, and special offers</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {step === 2 && (
          <div className="signup-step">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={errors.country ? 'error' : ''}
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="referralCode">Referral Code (Optional)</label>
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleInputChange}
                placeholder="Enter referral code for bonus"
              />
              <small className="field-hint">Have a referral code? Get 1 month free!</small>
            </div>
          </div>
        )}

        {/* Step 3: Plan Selection */}
        {step === 3 && (
          <div className="signup-step">
            <div className="plan-selection">
              <div 
                className={`plan-option ${formData.selectedPlan === 'free' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, selectedPlan: 'free' }))}
              >
                <input
                  type="radio"
                  name="selectedPlan"
                  value="free"
                  checked={formData.selectedPlan === 'free'}
                  onChange={handleInputChange}
                />
                <div className="plan-details">
                  <h3>Free Plan</h3>
                  <div className="plan-price">$0<span>/month</span></div>
                  <ul className="plan-features">
                    <li>✓ 3 Server Locations</li>
                    <li>✓ 10GB/month Bandwidth</li>
                    <li>✓ 1 Device</li>
                    <li>✓ Basic Protection</li>
                  </ul>
                </div>
              </div>

              <div 
                className={`plan-option ${formData.selectedPlan === 'premium' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, selectedPlan: 'premium' }))}
              >
                <div className="plan-badge">POPULAR</div>
                <input
                  type="radio"
                  name="selectedPlan"
                  value="premium"
                  checked={formData.selectedPlan === 'premium'}
                  onChange={handleInputChange}
                />
                <div className="plan-details">
                  <h3>Premium Plan</h3>
                  <div className="plan-price">$9.99<span>/month</span></div>
                  <ul className="plan-features">
                    <li>✓ 50+ Server Locations</li>
                    <li>✓ Unlimited Bandwidth</li>
                    <li>✓ 5 Devices</li>
                    <li>✓ Multi-Hop VPN</li>
                    <li>✓ Split Tunneling</li>
                    <li>✓ Email Support</li>
                  </ul>
                </div>
              </div>

              <div 
                className={`plan-option ${formData.selectedPlan === 'ultimate' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, selectedPlan: 'ultimate' }))}
              >
                <div className="plan-badge best">BEST VALUE</div>
                <input
                  type="radio"
                  name="selectedPlan"
                  value="ultimate"
                  checked={formData.selectedPlan === 'ultimate'}
                  onChange={handleInputChange}
                />
                <div className="plan-details">
                  <h3>Ultimate Plan</h3>
                  <div className="plan-price">$19.99<span>/month</span></div>
                  <ul className="plan-features">
                    <li>✓ 100+ Global Servers</li>
                    <li>✓ Unlimited Everything</li>
                    <li>✓ AI Optimization</li>
                    <li>✓ Quantum Security</li>
                    <li>✓ Dedicated IP</li>
                    <li>✓ 24/7 Priority Support</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="plan-note">You can upgrade or downgrade anytime</p>
          </div>
        )}

        {/* Step 4: Email Verification */}
        {step === 4 && (
          <div className="signup-step verification-step">
            <div className="verification-icon">📧</div>
            <h3>Verify Your Email</h3>
            <p>We've sent a 6-digit code to <strong>{formData.email}</strong></p>
            
            <div className="verification-code-input">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleVerificationCodeKeyDown(index, e)}
                  className="code-digit"
                />
              ))}
            </div>
            {errors.verification && <span className="error-message">{errors.verification}</span>}

            <button 
              className="resend-code-btn"
              onClick={resendVerificationCode}
              disabled={isLoading}
            >
              Didn't receive the code? Resend
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="signup-actions">
          {step > 1 && step < 4 && (
            <button 
              className="btn-secondary"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </button>
          )}
          
          {step < 4 && (
            <button 
              className="btn-primary"
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : step === 3 ? 'Continue' : 'Next'}
            </button>
          )}

          {step === 4 && (
            <button 
              className="btn-primary"
              onClick={handleVerifyAndSignup}
              disabled={isLoading || verificationCode.join('').length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          )}
        </div>

        {/* Social Signup */}
        {step === 1 && (
          <>
            <div className="divider">
              <span>OR CONTINUE WITH</span>
            </div>

            {errors.social && (
              <div className="error-message" style={{ textAlign: 'center', marginBottom: 10 }}>
                {errors.social}
              </div>
            )}

            <div className="social-signup">
              {SOCIAL_PROVIDERS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`social-btn ${id}`}
                  onClick={() => handleSocialAuth(id)}
                  disabled={isLoading || socialLoading !== null}
                  aria-label={`Sign up with ${label}`}
                >
                  {socialLoading === id ? (
                    <span className="social-icon social-spinner-sm" aria-hidden="true">⏳</span>
                  ) : (
                    <span className="social-icon"><Icon /></span>
                  )}
                  {socialLoading === id ? `Connecting…` : label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Switch to Login */}
        <div className="signup-footer">
          Already have an account? 
          <button className="link-btn" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
