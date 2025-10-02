import React, { useState } from 'react';
import './BandwidthScheduler.css';

const BandwidthScheduler = () => {
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [activeProfile, setActiveProfile] = useState('balanced');
  const [showAddSchedule, setShowAddSchedule] = useState(false);

  const profiles = [
    { 
      id: 'unlimited', 
      name: '🚀 Unlimited', 
      icon: '∞',
      download: 'No Limit', 
      upload: 'No Limit',
      description: 'Maximum speed, no restrictions'
    },
    { 
      id: 'balanced', 
      name: '⚖️ Balanced', 
      icon: '⚖️',
      download: '50 Mbps', 
      upload: '10 Mbps',
      description: 'Good balance for everyday use'
    },
    { 
      id: 'gaming', 
      name: '🎮 Gaming', 
      icon: '🎮',
      download: '100 Mbps', 
      upload: '20 Mbps',
      description: 'Optimized for low latency gaming'
    },
    { 
      id: 'streaming', 
      name: '📺 Streaming', 
      icon: '📺',
      download: '80 Mbps', 
      upload: '5 Mbps',
      description: 'High download for 4K streaming'
    },
    { 
      id: 'work', 
      name: '💼 Work Mode', 
      icon: '💼',
      download: '30 Mbps', 
      upload: '15 Mbps',
      description: 'Balanced for video calls & uploads'
    },
    { 
      id: 'conservation', 
      name: '🔋 Data Saver', 
      icon: '🔋',
      download: '10 Mbps', 
      upload: '2 Mbps',
      description: 'Minimize data usage'
    },
  ];

  const [schedules, setSchedules] = useState([
    { 
      id: 1, 
      name: 'Work Hours Limit', 
      profile: 'work',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '09:00',
      endTime: '17:00',
      enabled: true 
    },
    { 
      id: 2, 
      name: 'Night Gaming Session', 
      profile: 'gaming',
      days: ['Fri', 'Sat'],
      startTime: '20:00',
      endTime: '02:00',
      enabled: true 
    },
    { 
      id: 3, 
      name: 'Weekend Streaming', 
      profile: 'streaming',
      days: ['Sat', 'Sun'],
      startTime: '10:00',
      endTime: '22:00',
      enabled: false 
    },
  ]);

  const [appLimits, setAppLimits] = useState([
    { id: 1, app: 'Chrome', icon: '🌐', downloadLimit: 50, uploadLimit: 10, enabled: true },
    { id: 2, app: 'Steam', icon: '🎮', downloadLimit: 100, uploadLimit: 5, enabled: true },
    { id: 3, app: 'Netflix', icon: '📺', downloadLimit: 80, uploadLimit: 2, enabled: true },
    { id: 4, app: 'Zoom', icon: '📞', downloadLimit: 30, uploadLimit: 15, enabled: true },
    { id: 5, app: 'Spotify', icon: '🎵', downloadLimit: 10, uploadLimit: 1, enabled: false },
  ]);

  const [currentUsage] = useState({
    download: 45.2,
    upload: 8.7,
    activeApps: 3,
    totalToday: 12.5
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleSchedule = (id) => {
    setSchedules(schedules.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const deleteSchedule = (id) => {
    if (window.confirm('Delete this schedule?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const toggleAppLimit = (id) => {
    setAppLimits(appLimits.map(app => 
      app.id === id ? { ...app, enabled: !app.enabled } : app
    ));
  };

  const getProfileById = (id) => profiles.find(p => p.id === id);

  return (
    <div className="bandwidth-scheduler">
      <div className="scheduler-header">
        <h3>⏰ Bandwidth Scheduler</h3>
      </div>

      {/* Status Banner */}
      <div className={`status-banner ${schedulerEnabled ? 'active' : 'inactive'}`}>
        <span className="banner-icon">{schedulerEnabled ? '✅' : '⏸️'}</span>
        <div className="banner-content">
          <h4>Scheduler {schedulerEnabled ? 'Active' : 'Paused'}</h4>
          <p>
            {schedulerEnabled 
              ? `${schedules.filter(s => s.enabled).length} schedules active • Current: ${getProfileById(activeProfile)?.name}`
              : 'All bandwidth schedules are paused'}
          </p>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={schedulerEnabled}
            onChange={() => setSchedulerEnabled(!schedulerEnabled)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Current Usage */}
      <div className="usage-overview">
        <h4>📊 Current Usage</h4>
        <div className="usage-grid">
          <div className="usage-card">
            <span className="usage-icon">⬇️</span>
            <div className="usage-details">
              <span className="usage-label">Download</span>
              <span className="usage-value">{currentUsage.download} Mbps</span>
              <div className="usage-bar">
                <div 
                  className="usage-fill download" 
                  style={{width: `${Math.min((currentUsage.download / 100) * 100, 100)}%`}}
                ></div>
              </div>
            </div>
          </div>
          <div className="usage-card">
            <span className="usage-icon">⬆️</span>
            <div className="usage-details">
              <span className="usage-label">Upload</span>
              <span className="usage-value">{currentUsage.upload} Mbps</span>
              <div className="usage-bar">
                <div 
                  className="usage-fill upload" 
                  style={{width: `${Math.min((currentUsage.upload / 20) * 100, 100)}%`}}
                ></div>
              </div>
            </div>
          </div>
          <div className="usage-card">
            <span className="usage-icon">📱</span>
            <div className="usage-details">
              <span className="usage-label">Active Apps</span>
              <span className="usage-value">{currentUsage.activeApps}</span>
            </div>
          </div>
          <div className="usage-card">
            <span className="usage-icon">📈</span>
            <div className="usage-details">
              <span className="usage-label">Today's Total</span>
              <span className="usage-value">{currentUsage.totalToday} GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bandwidth Profiles */}
      <div className="profiles-section">
        <h4>🎯 Bandwidth Profiles</h4>
        <p className="section-description">Quick presets for different scenarios</p>
        
        <div className="profiles-grid">
          {profiles.map(profile => (
            <label 
              key={profile.id}
              className={`profile-card ${activeProfile === profile.id ? 'active' : ''}`}
            >
              <input 
                type="radio"
                name="profile"
                value={profile.id}
                checked={activeProfile === profile.id}
                onChange={(e) => setActiveProfile(e.target.value)}
              />
              <div className="profile-icon">{profile.icon}</div>
              <div className="profile-info">
                <h5>{profile.name}</h5>
                <p className="profile-desc">{profile.description}</p>
                <div className="profile-limits">
                  <span>⬇️ {profile.download}</span>
                  <span>⬆️ {profile.upload}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Time-based Schedules */}
      <div className="schedules-section">
        <div className="section-header">
          <h4>📅 Time-based Schedules</h4>
          <button 
            className="add-schedule-btn"
            onClick={() => setShowAddSchedule(!showAddSchedule)}
          >
            {showAddSchedule ? '✕ Cancel' : '+ Add Schedule'}
          </button>
        </div>

        {showAddSchedule && (
          <div className="add-schedule-form">
            <h5>Create New Schedule</h5>
            <div className="form-grid">
              <div className="form-group">
                <label>Schedule Name</label>
                <input type="text" placeholder="e.g., Evening Gaming" />
              </div>
              <div className="form-group">
                <label>Bandwidth Profile</label>
                <select>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" defaultValue="18:00" />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="time" defaultValue="23:00" />
              </div>
            </div>
            <div className="form-group">
              <label>Active Days</label>
              <div className="day-selector">
                {weekDays.map(day => (
                  <label key={day} className="day-checkbox">
                    <input type="checkbox" />
                    {day}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="save-btn">💾 Save Schedule</button>
              <button className="cancel-btn" onClick={() => setShowAddSchedule(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="schedules-list">
          {schedules.map(schedule => {
            const profile = getProfileById(schedule.profile);
            return (
              <div key={schedule.id} className={`schedule-card ${!schedule.enabled ? 'disabled' : ''}`}>
                <div className="schedule-main">
                  <div className="schedule-icon">{profile?.icon}</div>
                  <div className="schedule-info">
                    <h5>{schedule.name}</h5>
                    <div className="schedule-details">
                      <span className="detail-item">
                        <strong>Profile:</strong> {profile?.name}
                      </span>
                      <span className="detail-item">
                        <strong>Time:</strong> {schedule.startTime} - {schedule.endTime}
                      </span>
                      <span className="detail-item">
                        <strong>Days:</strong> {schedule.days.join(', ')}
                      </span>
                    </div>
                    <div className="schedule-limits">
                      <span>⬇️ {profile?.download}</span>
                      <span>⬆️ {profile?.upload}</span>
                    </div>
                  </div>
                  <div className="schedule-controls">
                    <label className="toggle-switch small">
                      <input 
                        type="checkbox" 
                        checked={schedule.enabled}
                        onChange={() => toggleSchedule(schedule.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteSchedule(schedule.id)}
                      title="Delete schedule"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-App Limits */}
      <div className="app-limits-section">
        <h4>📱 Per-App Bandwidth Limits</h4>
        <p className="section-description">Set individual speed limits for specific applications</p>
        
        <div className="app-limits-list">
          {appLimits.map(app => (
            <div key={app.id} className={`app-limit-card ${!app.enabled ? 'disabled' : ''}`}>
              <div className="app-main">
                <span className="app-icon">{app.icon}</span>
                <div className="app-info">
                  <h5>{app.app}</h5>
                  <div className="app-limits">
                    <span className="limit-badge download">⬇️ {app.downloadLimit} Mbps</span>
                    <span className="limit-badge upload">⬆️ {app.uploadLimit} Mbps</span>
                  </div>
                </div>
                <label className="toggle-switch small">
                  <input 
                    type="checkbox" 
                    checked={app.enabled}
                    onChange={() => toggleAppLimit(app.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Information */}
      <div className="scheduler-info">
        <h4>ℹ️ How It Works</h4>
        <div className="info-grid">
          <div className="info-card">
            <span className="info-icon">⚡</span>
            <h5>Dynamic Control</h5>
            <p>Schedules automatically apply bandwidth limits at specified times without manual intervention.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🎯</span>
            <h5>Priority System</h5>
            <p>Per-app limits take priority over global profiles, ensuring critical apps get needed bandwidth.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">📊</span>
            <h5>Usage Tracking</h5>
            <p>Monitor real-time bandwidth consumption and adjust limits based on your needs.</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🔄</span>
            <h5>Overlapping Schedules</h5>
            <p>When schedules overlap, the most restrictive limit applies automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandwidthScheduler;
