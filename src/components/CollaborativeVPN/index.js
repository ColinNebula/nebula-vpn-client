import React, { useState, useEffect } from 'react';
import './CollaborativeVPN.css';

const CollaborativeVPN = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Alice Johnson', role: 'Admin', status: 'online', location: 'US East', lastSeen: 'now', avatar: '👩‍💼' },
    { id: 2, name: 'Bob Chen', role: 'Developer', status: 'connected', location: 'Singapore', lastSeen: '2 min ago', avatar: '👨‍💻' },
    { id: 3, name: 'Carol Rodriguez', role: 'Security', status: 'away', location: 'UK London', lastSeen: '15 min ago', avatar: '👩‍🔬' },
    { id: 4, name: 'David Kim', role: 'Manager', status: 'offline', location: 'Japan', lastSeen: '2 hours ago', avatar: '👨‍💼' }
  ]);

  const [sharedSessions, setSharedSessions] = useState([
    { id: 1, name: 'Project Alpha Dev Team', members: 3, server: 'US West', created: '2 hours ago', owner: 'Alice Johnson', active: true },
    { id: 2, name: 'Security Audit Session', members: 2, server: 'EU Frankfurt', created: '1 day ago', owner: 'Carol Rodriguez', active: false },
    { id: 3, name: 'Marketing Campaign', members: 5, server: 'Canada', created: '3 days ago', owner: 'David Kim', active: true }
  ]);

  const [teamAnalytics, setTeamAnalytics] = useState({
    totalConnections: 247,
    activeUsers: 12,
    totalDataTransferred: 2.4, // TB
    averageSessionTime: 142, // minutes
    securityIncidents: 0,
    collaborationScore: 94
  });

  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Alice Johnson', message: 'New security update deployed to all servers', timestamp: '10:30 AM', type: 'system' },
    { id: 2, user: 'Bob Chen', message: 'Can someone help me with the Singapore server latency?', timestamp: '10:32 AM', type: 'question' },
    { id: 3, user: 'Carol Rodriguez', message: 'Looking into it now. Might be a routing issue.', timestamp: '10:33 AM', type: 'response' }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleJoinSession = (sessionId) => {
    const session = sharedSessions.find(s => s.id === sessionId);
    setActiveSession(session);
    
    // Update session members count
    setSharedSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, members: s.members + 1, active: true }
        : s
    ));
  };

  const handleLeaveSession = () => {
    if (activeSession) {
      setSharedSessions(prev => prev.map(s => 
        s.id === activeSession.id 
          ? { ...s, members: Math.max(1, s.members - 1) }
          : s
      ));
      setActiveSession(null);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: chatMessages.length + 1,
        user: 'You',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'message'
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setTeamAnalytics(prev => ({
        ...prev,
        totalConnections: prev.totalConnections + Math.floor(Math.random() * 3),
        totalDataTransferred: prev.totalDataTransferred + Math.random() * 0.01,
        collaborationScore: Math.max(85, Math.min(100, prev.collaborationScore + (Math.random() - 0.4)))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="collaborative-vpn">
      <div className="collab-header">
        <h3>👥 Collaborative VPN</h3>
        <div className="session-status">
          {activeSession ? (
            <div className="active-session">
              🟢 Connected to: {activeSession.name}
              <button className="leave-session-btn" onClick={handleLeaveSession}>
                Leave Session
              </button>
            </div>
          ) : (
            <span className="no-session">📱 Individual Session</span>
          )}
        </div>
      </div>

      <div className="collab-dashboard">
        <div className="team-overview">
          <h4>👥 Team Overview</h4>
          <div className="team-stats">
            <div className="stat-card">
              <span className="stat-value">{teamAnalytics.activeUsers}</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{teamAnalytics.totalConnections}</span>
              <span className="stat-label">Total Connections</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{teamAnalytics.totalDataTransferred.toFixed(1)} TB</span>
              <span className="stat-label">Data Transferred</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{teamAnalytics.collaborationScore}%</span>
              <span className="stat-label">Collaboration Score</span>
            </div>
          </div>

          <div className="team-members">
            <h5>Team Members</h5>
            <div className="members-list">
              {teamMembers.map(member => (
                <div key={member.id} className={`member-item ${member.status}`}>
                  <div className="member-avatar">{member.avatar}</div>
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                  </div>
                  <div className="member-status">
                    <span className={`status-indicator ${member.status}`}>
                      {member.status === 'online' && '🟢'}
                      {member.status === 'connected' && '🔵'}
                      {member.status === 'away' && '🟡'}
                      {member.status === 'offline' && '⚫'}
                    </span>
                    <div className="member-details">
                      <span className="member-location">{member.location}</span>
                      <span className="member-last-seen">{member.lastSeen}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="shared-sessions">
          <h4>🔗 Shared Sessions</h4>
          <div className="sessions-list">
            {sharedSessions.map(session => (
              <div key={session.id} className={`session-card ${session.active ? 'active' : 'inactive'}`}>
                <div className="session-header">
                  <span className="session-name">{session.name}</span>
                  <span className={`session-status ${session.active ? 'active' : 'inactive'}`}>
                    {session.active ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                </div>
                <div className="session-details">
                  <div className="session-info">
                    <span className="session-server">📍 {session.server}</span>
                    <span className="session-members">👥 {session.members} members</span>
                    <span className="session-owner">👤 Owner: {session.owner}</span>
                    <span className="session-created">🕒 Created: {session.created}</span>
                  </div>
                  <div className="session-actions">
                    {activeSession?.id === session.id ? (
                      <button className="session-btn joined" disabled>
                        ✅ Joined
                      </button>
                    ) : (
                      <button 
                        className="session-btn join"
                        onClick={() => handleJoinSession(session.id)}
                      >
                        🔗 Join Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="team-chat">
          <h4>💬 Team Communication</h4>
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.map(message => (
                <div key={message.id} className={`chat-message ${message.type}`}>
                  <div className="message-header">
                    <span className="message-user">{message.user}</span>
                    <span className="message-time">{message.timestamp}</span>
                  </div>
                  <div className="message-content">{message.message}</div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message to your team..."
                className="message-input"
              />
              <button className="send-message-btn" onClick={sendMessage}>
                📤
              </button>
            </div>
          </div>
        </div>

        <div className="collaboration-tools">
          <h4>🛠️ Collaboration Tools</h4>
          <div className="tools-grid">
            <div className="tool-card">
              <h5>📊 Shared Analytics</h5>
              <p>Real-time performance metrics visible to all team members</p>
              <button className="tool-btn">View Dashboard</button>
            </div>
            <div className="tool-card">
              <h5>🔒 Group Policies</h5>
              <p>Centralized security policies and access controls</p>
              <button className="tool-btn">Manage Policies</button>
            </div>
            <div className="tool-card">
              <h5>📈 Team Reports</h5>
              <p>Automated reports for team usage and security metrics</p>
              <button className="tool-btn">Generate Report</button>
            </div>
            <div className="tool-card">
              <h5>🎯 Load Balancing</h5>
              <p>Intelligent traffic distribution across team connections</p>
              <button className="tool-btn">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeVPN;