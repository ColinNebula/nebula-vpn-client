import React, { useState, useEffect } from 'react';
import './CustomizationCenter.css';

const CustomizationCenter = () => {
  const [activeTheme, setActiveTheme] = useState('default');
  const [customColors, setCustomColors] = useState({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#10b981',
    background: '#1a1a2e'
  });
  const [fontSize, setFontSize] = useState('medium'); // small, medium, large
  const [uiDensity, setUIDensity] = useState('comfortable'); // compact, comfortable, spacious
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const themes = [
    {
      id: 'default',
      name: '🌌 Default Dark',
      colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#10b981', background: '#1a1a2e' }
    },
    {
      id: 'ocean',
      name: '🌊 Ocean Blue',
      colors: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#14b8a6', background: '#0c4a6e' }
    },
    {
      id: 'forest',
      name: '🌲 Forest Green',
      colors: { primary: '#10b981', secondary: '#059669', accent: '#84cc16', background: '#064e3b' }
    },
    {
      id: 'sunset',
      name: '🌅 Sunset Orange',
      colors: { primary: '#f59e0b', secondary: '#fb923c', accent: '#ef4444', background: '#7c2d12' }
    },
    {
      id: 'midnight',
      name: '🌙 Midnight Purple',
      colors: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#ec4899', background: '#1e1b4b' }
    },
    {
      id: 'neon',
      name: '⚡ Neon Cyber',
      colors: { primary: '#ec4899', secondary: '#8b5cf6', accent: '#06b6d4', background: '#0a0a0a' }
    },
    {
      id: 'classic',
      name: '📘 Classic Light',
      colors: { primary: '#3b82f6', secondary: '#6366f1', accent: '#10b981', background: '#f8fafc' }
    }
  ];

  const applyTheme = (theme) => {
    setActiveTheme(theme.id);
    setCustomColors(theme.colors);
    
    // Apply to document
    const root = document.documentElement;
    root.style.setProperty('--accent-color', theme.colors.accent);
    root.style.setProperty('--bg-primary', theme.colors.primary);
    root.style.setProperty('--bg-secondary', theme.colors.background);
  };

  const applyFontSize = (size) => {
    setFontSize(size);
    const root = document.documentElement;
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    root.style.setProperty('--base-font-size', sizes[size]);
  };

  const applyUIDensity = (density) => {
    setUIDensity(density);
    const root = document.documentElement;
    const spacings = { compact: '0.8', comfortable: '1', spacious: '1.2' };
    root.style.setProperty('--spacing-multiplier', spacings[density]);
  };

  const handleColorChange = (colorKey, value) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    
    // Apply custom color
    const root = document.documentElement;
    if (colorKey === 'accent') root.style.setProperty('--accent-color', value);
    if (colorKey === 'primary') root.style.setProperty('--bg-primary', value);
    if (colorKey === 'background') root.style.setProperty('--bg-secondary', value);
  };

  const saveCustomization = () => {
    const settings = {
      theme: activeTheme,
      customColors,
      fontSize,
      uiDensity,
      animationsEnabled
    };
    localStorage.setItem('nebulaCustomization', JSON.stringify(settings));
    alert('✓ Customization saved!');
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset all customization settings to defaults?')) {
      applyTheme(themes[0]);
      applyFontSize('medium');
      applyUIDensity('comfortable');
      setAnimationsEnabled(true);
      localStorage.removeItem('nebulaCustomization');
    }
  };

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('nebulaCustomization');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        const theme = themes.find(t => t.id === settings.theme) || themes[0];
        applyTheme(theme);
        if (settings.fontSize) applyFontSize(settings.fontSize);
        if (settings.uiDensity) applyUIDensity(settings.uiDensity);
        if (typeof settings.animationsEnabled === 'boolean') {
          setAnimationsEnabled(settings.animationsEnabled);
        }
      } catch (e) {
        console.error('Failed to load customization settings', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="customization-center">
      <div className="customization-header">
        <h3>🎨 Customization Center</h3>
        <div className="header-actions">
          <button className="save-btn" onClick={saveCustomization}>
            💾 Save Settings
          </button>
          <button className="reset-btn" onClick={resetToDefaults}>
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="customization-section">
        <h4>🌈 Themes</h4>
        <div className="themes-grid">
          {themes.map(theme => (
            <div 
              key={theme.id}
              className={`theme-card ${activeTheme === theme.id ? 'active' : ''}`}
              onClick={() => applyTheme(theme)}
            >
              <div className="theme-preview">
                <div 
                  className="preview-color"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
                ></div>
                <div 
                  className="preview-accent"
                  style={{ background: theme.colors.accent }}
                ></div>
              </div>
              <span className="theme-name">{theme.name}</span>
              {activeTheme === theme.id && <span className="active-badge">✓ Active</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="customization-section">
        <h4>🎨 Custom Colors</h4>
        <div className="color-pickers">
          <div className="color-picker-item">
            <label>Primary Color</label>
            <div className="picker-wrapper">
              <input 
                type="color"
                value={customColors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
              />
              <span className="color-value">{customColors.primary}</span>
            </div>
          </div>
          <div className="color-picker-item">
            <label>Secondary Color</label>
            <div className="picker-wrapper">
              <input 
                type="color"
                value={customColors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
              />
              <span className="color-value">{customColors.secondary}</span>
            </div>
          </div>
          <div className="color-picker-item">
            <label>Accent Color</label>
            <div className="picker-wrapper">
              <input 
                type="color"
                value={customColors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
              />
              <span className="color-value">{customColors.accent}</span>
            </div>
          </div>
          <div className="color-picker-item">
            <label>Background Color</label>
            <div className="picker-wrapper">
              <input 
                type="color"
                value={customColors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
              />
              <span className="color-value">{customColors.background}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="customization-section">
        <h4>🔤 Font Size</h4>
        <div className="option-buttons">
          <button 
            className={`option-btn ${fontSize === 'small' ? 'active' : ''}`}
            onClick={() => applyFontSize('small')}
          >
            <span className="option-icon" style={{ fontSize: '12px' }}>Aa</span>
            <span>Small</span>
          </button>
          <button 
            className={`option-btn ${fontSize === 'medium' ? 'active' : ''}`}
            onClick={() => applyFontSize('medium')}
          >
            <span className="option-icon" style={{ fontSize: '16px' }}>Aa</span>
            <span>Medium</span>
          </button>
          <button 
            className={`option-btn ${fontSize === 'large' ? 'active' : ''}`}
            onClick={() => applyFontSize('large')}
          >
            <span className="option-icon" style={{ fontSize: '20px' }}>Aa</span>
            <span>Large</span>
          </button>
        </div>
      </div>

      {/* UI Density */}
      <div className="customization-section">
        <h4>📏 UI Density</h4>
        <div className="option-buttons">
          <button 
            className={`option-btn ${uiDensity === 'compact' ? 'active' : ''}`}
            onClick={() => applyUIDensity('compact')}
          >
            <span className="option-icon">☰</span>
            <div className="option-details">
              <span className="option-title">Compact</span>
              <span className="option-desc">More content</span>
            </div>
          </button>
          <button 
            className={`option-btn ${uiDensity === 'comfortable' ? 'active' : ''}`}
            onClick={() => applyUIDensity('comfortable')}
          >
            <span className="option-icon">≡</span>
            <div className="option-details">
              <span className="option-title">Comfortable</span>
              <span className="option-desc">Balanced</span>
            </div>
          </button>
          <button 
            className={`option-btn ${uiDensity === 'spacious' ? 'active' : ''}`}
            onClick={() => applyUIDensity('spacious')}
          >
            <span className="option-icon">━</span>
            <div className="option-details">
              <span className="option-title">Spacious</span>
              <span className="option-desc">More breathing room</span>
            </div>
          </button>
        </div>
      </div>

      {/* Other Options */}
      <div className="customization-section">
        <h4>⚙️ Advanced Options</h4>
        <div className="toggle-options">
          <label className="toggle-option">
            <div className="toggle-content">
              <span className="toggle-icon">✨</span>
              <div className="toggle-info">
                <span className="toggle-title">Animations</span>
                <span className="toggle-desc">Enable smooth transitions and effects</span>
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox"
                checked={animationsEnabled}
                onChange={() => setAnimationsEnabled(!animationsEnabled)}
              />
              <span className="toggle-slider"></span>
            </label>
          </label>
        </div>
      </div>

      {/* Preview Section */}
      <div className="customization-section">
        <h4>👀 Preview</h4>
        <div className="preview-panel">
          <div className="preview-card">
            <h5>Sample Card</h5>
            <p>This is how your interface will look with the selected theme and settings.</p>
            <button className="preview-btn">Sample Button</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationCenter;
