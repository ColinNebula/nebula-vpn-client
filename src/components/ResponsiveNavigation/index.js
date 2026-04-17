import React, { useState, useEffect } from 'react';
import './ResponsiveNavigation.css';

const ResponsiveNavigation = ({ 
  activeTab, 
  setActiveTab, 
  hasFeature, 
  effectivePlan,
  onAdminToggle,
  isCompactMode = false 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  
  // Detect if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && (
    typeof window.electron !== 'undefined' || 
    typeof window.nebulaVPN !== 'undefined' ||
    /Electron/i.test(navigator.userAgent || '')
  );
  
  // In Electron, prefer accordion navigation; in web browser, use responsive breakpoints
  const [isMobile, setIsMobile] = useState(
    isElectron ? true : window.innerWidth <= 768
  );

  // Handle window resize (only for web browser, not Electron)
  useEffect(() => {
    if (isElectron) return; // Don't change navigation style in Electron
    
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
        setExpandedSections({});
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isElectron]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.nav-mobile-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = (e) => {
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Navigation items organized by category
  const navigationItems = [
    {
      category: 'Core',
      icon: '🏠',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', alwaysShow: true },
        { id: 'servers', label: 'Servers', icon: '🌍', alwaysShow: true },
        { id: 'multihop', label: 'Multi-Hop', icon: '🔗', feature: 'multiHop' },
        { id: 'splittunnel', label: 'Split Tunnel', icon: '⚡', feature: 'splitTunneling' },
        { id: 'nextgen', label: 'Next-Gen', icon: '🚀', feature: 'collaborativeVPN' },
        { id: 'mobile', label: 'Mobile', icon: '📱', feature: 'mobileOptimizations' }
      ]
    },
    {
      category: 'Analytics & Testing',
      icon: '📈',
      items: [
        { id: 'analytics', label: 'Analytics', icon: '📊', feature: 'trafficAnalytics' },
        { id: 'experience', label: 'Experience', icon: '⭐', feature: 'liveDashboard' },
        { id: 'speedtest', label: 'Speed Test', icon: '⚡', feature: 'speedTest' },
        { id: 'leaktest', label: 'Leak Test', icon: '🔒', alwaysShow: true },
        { id: 'traffic', label: 'Traffic', icon: '📊', alwaysShow: true },
        { id: 'logs', label: 'Logs', icon: '📋', alwaysShow: true }
      ]
    },
    {
      category: 'Security & Privacy',
      icon: '🛡️',
      items: [
        { id: 'security', label: 'Security', icon: '🛡️', badge: '🛡', feature: 'threatDetection' },
        { id: 'ai', label: 'AI/ML', icon: '🤖', feature: 'aiNetworkOptimizer' },
        { id: 'darkweb', label: 'Dark Web', icon: '🌐', alwaysShow: true },
        { id: 'profiles', label: 'Profiles', icon: '👤', alwaysShow: true }
      ]
    },
    {
      category: 'Settings & Advanced',
      icon: '⚙️',
      items: [
        { id: 'automation', label: 'Automation', icon: '🤖', feature: 'automationRules' },
        { id: 'enterprise', label: 'Enterprise', icon: '🏢', feature: 'networkTopology' },
        { id: 'settings', label: 'Settings', icon: '⚙️', alwaysShow: true },
        { id: 'trust', label: 'Trust', icon: '🔐', alwaysShow: true }
      ]
    }
  ];

  // Filter items based on plan features
  const getVisibleItems = (items) => {
    return items.filter(item => 
      item.alwaysShow || (item.feature && hasFeature(effectivePlan, item.feature))
    );
  };

  // Desktop navigation (horizontal tabs)
  const renderDesktopNav = () => {
    const allItems = navigationItems.flatMap(category => getVisibleItems(category.items));
    
    return (
      <nav className="tab-navigation desktop-nav">
        {allItems.map(item => (
          <button
            key={item.id}
            className={`tab ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            ● {item.label}
            {item.badge && <span className="tab-shield-badge" title="Active">{item.badge}</span>}
          </button>
        ))}
      </nav>
    );
  };

  // Mobile hamburger navigation
  const renderMobileNav = () => (
    <div className="nav-mobile-container">
      <button 
        className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <nav className="mobile-navigation">
            <div className="mobile-nav-header">
              <span className="mobile-nav-title">Navigation</span>
              <button 
                className="mobile-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >✕</button>
            </div>

            <div className="mobile-nav-content">
              {navigationItems.map(category => {
                const visibleItems = getVisibleItems(category.items);
                if (visibleItems.length === 0) return null;

                const isExpanded = expandedSections[category.category];
                
                return (
                  <div key={category.category} className="nav-category">
                    <button 
                      className="category-header"
                      onClick={() => toggleSection(category.category)}
                    >
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-title">{category.category}</span>
                      <span className={`category-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
                    </button>
                    
                    <div className={`category-items ${isExpanded ? 'expanded' : ''}`}>
                      {visibleItems.map(item => (
                        <button
                          key={item.id}
                          className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                          onClick={() => handleTabClick(item.id)}
                        >
                          <span className="nav-item-icon">{item.icon}</span>
                          <span className="nav-item-label">{item.label}</span>
                          {item.badge && (
                            <span className="nav-item-badge" title="Active">{item.badge}</span>
                          )}
                          {activeTab === item.id && <span className="active-indicator">●</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Admin Panel Access */}
              {onAdminToggle && (
                <div className="nav-category">
                  <button 
                    className="category-header admin-section"
                    onClick={onAdminToggle}
                  >
                    <span className="category-icon">👤</span>
                    <span className="category-title">Admin Panel</span>
                    <span className="category-arrow">→</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );

  return (
    <div className={`responsive-navigation ${isCompactMode ? 'compact' : ''}`}>
      {isMobile ? renderMobileNav() : renderDesktopNav()}
    </div>
  );
};

export default ResponsiveNavigation;