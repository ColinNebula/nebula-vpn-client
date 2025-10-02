import React, { useState } from 'react';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Security Alert',
      message: 'Connection to US East was interrupted. Kill switch activated.',
      timestamp: new Date(Date.now() - 300000),
      read: false,
      icon: '🚨'
    },
    {
      id: 2,
      type: 'important',
      title: 'Privacy Audit Complete',
      message: 'Privacy score: 87/100. WebRTC leak detected.',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      icon: '🔒'
    },
    {
      id: 3,
      type: 'normal',
      title: 'Connected Successfully',
      message: 'Connected to UK London (45ms latency)',
      timestamp: new Date(Date.now() - 7200000),
      read: true,
      icon: '✓'
    },
    {
      id: 4,
      type: 'info',
      title: 'New Server Available',
      message: 'Japan Gaming server now available in your region',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      icon: 'ℹ️'
    },
  ]);

  const [filter, setFilter] = useState('all'); // all, unread, critical, important, normal, info
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    critical: true,
    important: true,
    normal: true,
    info: true,
    sound: true,
    desktop: false
  });

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getRelativeTime = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getPriorityColor = (type) => {
    const colors = {
      critical: '#ef4444',
      important: '#f59e0b',
      normal: '#3b82f6',
      info: '#6b7280'
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="notification-center">
      <div className="notification-header">
        <div className="header-left">
          <h3>🔔 Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={markAllAsRead}>
            ✓ Mark all read
          </button>
          <button className="header-btn" onClick={clearAll}>
            🗑️ Clear all
          </button>
          <button 
            className={`header-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      {showSettings && (
        <div className="settings-panel">
          <h4>🔔 Notification Preferences</h4>
          <div className="settings-grid">
            <label className="setting-item">
              <input 
                type="checkbox"
                checked={settings.critical}
                onChange={(e) => setSettings({...settings, critical: e.target.checked})}
              />
              <span>Critical alerts</span>
            </label>
            <label className="setting-item">
              <input 
                type="checkbox"
                checked={settings.important}
                onChange={(e) => setSettings({...settings, important: e.target.checked})}
              />
              <span>Important notifications</span>
            </label>
            <label className="setting-item">
              <input 
                type="checkbox"
                checked={settings.normal}
                onChange={(e) => setSettings({...settings, normal: e.target.checked})}
              />
              <span>Normal updates</span>
            </label>
            <label className="setting-item">
              <input 
                type="checkbox"
                checked={settings.info}
                onChange={(e) => setSettings({...settings, info: e.target.checked})}
              />
              <span>Info messages</span>
            </label>
            <label className="setting-item">
              <input 
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => setSettings({...settings, sound: e.target.checked})}
              />
              <span>Sound alerts</span>
            </label>
            <label className="setting-item">
              <input 
                type="checkbox"
                checked={settings.desktop}
                onChange={(e) => setSettings({...settings, desktop: e.target.checked})}
              />
              <span>Desktop notifications</span>
            </label>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`filter-tab ${filter === 'critical' ? 'active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          🚨 Critical
        </button>
        <button 
          className={`filter-tab ${filter === 'important' ? 'active' : ''}`}
          onClick={() => setFilter('important')}
        >
          ⚠️ Important
        </button>
        <button 
          className={`filter-tab ${filter === 'normal' ? 'active' : ''}`}
          onClick={() => setFilter('normal')}
        >
          ℹ️ Normal
        </button>
        <button 
          className={`filter-tab ${filter === 'info' ? 'active' : ''}`}
          onClick={() => setFilter('info')}
        >
          📢 Info
        </button>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔕</span>
            <h4>No notifications</h4>
            <p>You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map(notif => (
            <div 
              key={notif.id}
              className={`notification-card ${notif.read ? 'read' : 'unread'} priority-${notif.type}`}
              style={{ borderLeftColor: getPriorityColor(notif.type) }}
            >
              <div className="notif-icon">{notif.icon}</div>
              <div className="notif-content">
                <div className="notif-header">
                  <h5>{notif.title}</h5>
                  <span className="notif-time">{getRelativeTime(notif.timestamp)}</span>
                </div>
                <p className="notif-message">{notif.message}</p>
                <div className="notif-actions">
                  {!notif.read && (
                    <button 
                      className="notif-action-btn"
                      onClick={() => markAsRead(notif.id)}
                    >
                      Mark as read
                    </button>
                  )}
                  <button 
                    className="notif-action-btn delete"
                    onClick={() => deleteNotification(notif.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
