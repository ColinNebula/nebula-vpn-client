import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/api';
import './AdminDashboard.css';

const PLANS = ['free', 'premium', 'ultimate', 'enterprise'];
const ROLES = ['user', 'admin'];

const AdminDashboard = ({ currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userRes, statsRes] = await Promise.all([
        apiService.adminGetUsers(),
        apiService.adminGetStats()
      ]);
      setUsers(userRes.users);
      setStats(statsRes);
    } catch (err) {
      setError(err.message || 'Failed to load admin data — is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRoleChange = async (email, role) => {
    try {
      const res = await apiService.adminSetRole(email, role);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role: res.user.role } : u));
      showToast(`Role updated for ${email}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handlePlanChange = async (email, plan) => {
    try {
      const res = await apiService.adminSetPlan(email, plan);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, plan: res.user.plan } : u));
      showToast(`Plan updated for ${email}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (email) => {
    try {
      await apiService.adminDeleteUser(email);
      setUsers(prev => prev.filter(u => u.email !== email));
      setConfirmDelete(null);
      showToast(`User ${email} deleted`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ad-header">
          <div className="ad-header-left">
            <span className="ad-crown">👑</span>
            <div>
              <h2>Admin Dashboard</h2>
              <p>Signed in as <strong>{currentUser.email}</strong></p>
            </div>
          </div>
          <button className="ad-close" onClick={onClose}>✕</button>
        </div>

        {/* Toast */}
        {toast && <div className="ad-toast">{toast}</div>}

        {/* Tabs */}
        <div className="ad-tabs">
          <button className={`ad-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            👥 Users {users.length > 0 && <span className="ad-badge">{users.length}</span>}
          </button>
          <button className={`ad-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            📊 Stats
          </button>
        </div>

        {/* Body */}
        <div className="ad-body">
          {loading && <div className="ad-loading">Loading…</div>}
          {error && (
            <div className="ad-error">
              <span>⚠️ {error}</span>
              <button onClick={loadData}>Retry</button>
            </div>
          )}

          {/* ── Users Tab ── */}
          {!loading && !error && activeTab === 'users' && (
            <>
              <div className="ad-toolbar">
                <input
                  className="ad-search"
                  type="text"
                  placeholder="Search users…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button className="ad-refresh-btn" onClick={loadData}>🔄 Refresh</button>
              </div>

              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Plan</th>
                      <th>Devices</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="ad-empty">No users found</td></tr>
                    )}
                    {filtered.map(user => (
                      <tr key={user.email} className={user.email === currentUser.email ? 'ad-self-row' : ''}>
                        <td>
                          <div className="ad-user-cell">
                            <div className="ad-avatar">{user.email.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="ad-email">{user.email}</div>
                              <div className="ad-name">{user.name || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className={`ad-select role-${user.role}`}
                            value={user.role}
                            disabled={user.email === currentUser.email}
                            onChange={e => handleRoleChange(user.email, e.target.value)}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            className={`ad-select plan-${user.plan}`}
                            value={user.plan}
                            onChange={e => handlePlanChange(user.email, e.target.value)}
                          >
                            {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="ad-center">{user.deviceCount ?? 0}</td>
                        <td className="ad-muted">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          {user.email !== currentUser.email && (
                            <button
                              className="ad-delete-btn"
                              title="Delete user"
                              onClick={() => setConfirmDelete(user.email)}
                            >🗑</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Stats Tab ── */}
          {!loading && !error && activeTab === 'stats' && stats && (
            <div className="ad-stats-grid">
              <div className="ad-stat-card">
                <div className="ad-stat-icon">👥</div>
                <div className="ad-stat-value">{stats.totalUsers}</div>
                <div className="ad-stat-label">Total Users</div>
              </div>
              <div className="ad-stat-card">
                <div className="ad-stat-icon">⏱</div>
                <div className="ad-stat-value">{Math.floor(stats.serverUptime / 60)}m</div>
                <div className="ad-stat-label">Server Uptime</div>
              </div>
              <div className="ad-stat-card">
                <div className="ad-stat-icon">🧠</div>
                <div className="ad-stat-value">{stats.memoryUsageMB} MB</div>
                <div className="ad-stat-label">Memory Usage</div>
              </div>
              <div className="ad-stat-card">
                <div className="ad-stat-icon">🟢</div>
                <div className="ad-stat-value">{stats.nodeVersion}</div>
                <div className="ad-stat-label">Node Version</div>
              </div>

              <div className="ad-breakdown-card">
                <h4>Plan Breakdown</h4>
                {Object.entries(stats.planBreakdown || {}).map(([plan, count]) => (
                  <div key={plan} className="ad-breakdown-row">
                    <span className={`ad-plan-dot plan-${plan}`}></span>
                    <span className="ad-breakdown-label">{plan}</span>
                    <span className="ad-breakdown-count">{count}</span>
                  </div>
                ))}
              </div>

              <div className="ad-breakdown-card">
                <h4>Role Breakdown</h4>
                {Object.entries(stats.roleBreakdown || {}).map(([role, count]) => (
                  <div key={role} className="ad-breakdown-row">
                    <span className={`ad-role-dot role-${role}`}></span>
                    <span className="ad-breakdown-label">{role}</span>
                    <span className="ad-breakdown-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm delete modal */}
        {confirmDelete && (
          <div className="ad-confirm-overlay">
            <div className="ad-confirm-box">
              <p>Delete <strong>{confirmDelete}</strong>?</p>
              <p className="ad-confirm-sub">This cannot be undone.</p>
              <div className="ad-confirm-actions">
                <button className="ad-confirm-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="ad-confirm-delete" onClick={() => handleDelete(confirmDelete)}>Delete User</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
