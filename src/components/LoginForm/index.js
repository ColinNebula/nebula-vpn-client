import React, { useState, useEffect } from 'react';
import './LoginForm.css';

const LoginForm = ({ onLogin, isDarkMode }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLogging, setIsLogging] = useState(false);
  const [errors, setErrors] = useState({});

  // Apply dark mode to document even on login screen
  useEffect(() => {
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
    
    // Simulate API call
    setTimeout(() => {
      onLogin(credentials);
      setIsLogging(false);
    }, 1000);
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

  const handleDemoLogin = () => {
    setCredentials({
      email: 'demo@nebula.com',
      password: 'demo123'
    });
  };

  return (
    <div className={`login-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="login-form">
        <div className="login-header">
          <h1>🛡️ Nebula VPN</h1>
          <p>Secure your connection</p>
        </div>
        
        <form onSubmit={handleSubmit}>
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
            disabled={isLogging}
          >
            {isLogging ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="demo-section">
          <p>Try the demo:</p>
          <button 
            type="button" 
            className="demo-btn"
            onClick={handleDemoLogin}
          >
            Fill Demo Credentials
          </button>
        </div>
        
        <div className="login-footer">
          <p>Don't have an account? <a href="#signup">Sign up</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;