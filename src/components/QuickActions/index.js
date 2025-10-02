import React, { useState } from 'react';
import './QuickActions.css';

const QuickActions = ({ onQuickConnect, onSpeedTest, isConnected, onDisconnect }) => {
  const [favoriteActions, setFavoriteActions] = useState([
    'quickconnect', 'speedtest', 'killswitch', 'splittunnel'
  ]);

  const allActions = [
    { id: 'quickconnect', name: 'Quick Connect', icon: '⚡', shortcut: 'Ctrl+Q', description: 'Connect to fastest server' },
    { id: 'disconnect', name: 'Disconnect', icon: '🔴', shortcut: 'Ctrl+D', description: 'Disconnect from VPN' },
    { id: 'fastest', name: 'Fastest Server', icon: '🚀', shortcut: 'Ctrl+F', description: 'Auto-select optimal server' },
    { id: 'lastused', name: 'Last Used', icon: '🕐', shortcut: 'Ctrl+L', description: 'Reconnect to last server' },
    { id: 'favorite', name: 'Favorite', icon: '⭐', shortcut: 'Ctrl+Shift+F', description: 'Connect to favorite' },
    { id: 'killswitch', name: 'Kill Switch', icon: '🛡️', shortcut: 'Ctrl+K', description: 'Toggle kill switch' },
    { id: 'splittunnel', name: 'Split Tunnel', icon: '📱', shortcut: 'Ctrl+S', description: 'Configure split tunneling' },
    { id: 'multihop', name: 'Multi-Hop', icon: '🔗', shortcut: 'Ctrl+M', description: 'Set up multi-hop chain' },
    { id: 'speedtest', name: 'Speed Test', icon: '📊', shortcut: 'Ctrl+T', description: 'Run speed test' },
    { id: 'logs', name: 'View Logs', icon: '📝', shortcut: 'Ctrl+Shift+L', description: 'Open connection logs' },
    { id: 'settings', name: 'Settings', icon: '⚙️', shortcut: 'Ctrl+,', description: 'Open settings panel' },
    { id: 'privacy', name: 'Privacy Audit', icon: '🔒', shortcut: 'Ctrl+P', description: 'Run privacy scan' },
  ];

  const handleAction = (actionId) => {
    switch(actionId) {
      case 'quickconnect':
        if (onQuickConnect) onQuickConnect();
        break;
      case 'disconnect':
        if (onDisconnect) onDisconnect();
        break;
      case 'speedtest':
        if (onSpeedTest) onSpeedTest();
        break;
      case 'fastest':
        alert('Selecting fastest server...');
        break;
      case 'lastused':
        alert('Connecting to last used server...');
        break;
      case 'killswitch':
        alert('Toggling kill switch...');
        break;
      case 'splittunnel':
        alert('Opening split tunnel configuration...');
        break;
      default:
        alert(`${actionId} action triggered!`);
    }
  };

  const toggleFavorite = (actionId) => {
    setFavoriteActions(prev => 
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  return (
    <div className="quick-actions">
      <div className="actions-header">
        <h3>⚡ Quick Actions</h3>
        <p className="actions-subtitle">Fast access to common tasks</p>
      </div>

      {/* Favorite Actions */}
      <div className="favorites-section">
        <h4>⭐ Favorites</h4>
        <div className="actions-grid">
          {allActions
            .filter(action => favoriteActions.includes(action.id))
            .map(action => (
              <button
                key={action.id}
                className="action-tile favorite"
                onClick={() => handleAction(action.id)}
              >
                <div className="tile-header">
                  <span className="tile-icon">{action.icon}</span>
                  <button
                    className="unfavorite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(action.id);
                    }}
                  >
                    ★
                  </button>
                </div>
                <div className="tile-content">
                  <span className="tile-name">{action.name}</span>
                  <span className="tile-desc">{action.description}</span>
                  <span className="tile-shortcut">{action.shortcut}</span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* All Actions */}
      <div className="all-actions-section">
        <h4>🎯 All Actions</h4>
        <div className="actions-list">
          {allActions.map(action => (
            <div key={action.id} className="action-row">
              <button
                className="action-button"
                onClick={() => handleAction(action.id)}
              >
                <span className="action-icon">{action.icon}</span>
                <div className="action-details">
                  <span className="action-name">{action.name}</span>
                  <span className="action-desc">{action.description}</span>
                </div>
                <span className="action-shortcut">{action.shortcut}</span>
              </button>
              <button
                className={`favorite-toggle ${favoriteActions.includes(action.id) ? 'active' : ''}`}
                onClick={() => toggleFavorite(action.id)}
                title={favoriteActions.includes(action.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                {favoriteActions.includes(action.id) ? '★' : '☆'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="shortcuts-info">
        <h4>⌨️ Keyboard Shortcuts</h4>
        <p className="shortcuts-desc">
          Use keyboard shortcuts for even faster access. Press the key combination shown next to each action.
        </p>
        <div className="shortcuts-grid">
          <div className="shortcut-tip">
            <span className="tip-icon">💡</span>
            <span>Hold Ctrl (or Cmd on Mac) for global shortcuts</span>
          </div>
          <div className="shortcut-tip">
            <span className="tip-icon">⌨️</span>
            <span>Add Shift for alternate actions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
