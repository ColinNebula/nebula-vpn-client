// API Service for Nebula VPN
// Connects React frontend to Node.js backend

// Determine API URL based on environment
let API_BASE_URL;
if (window.electron || process.env.NODE_ENV === 'development') {
  // Use localhost for development or Electron environment
  API_BASE_URL = 'http://localhost:3001/api';
} else {
  // Use production API for web builds
  API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.nebula3ddev.com/api';
}

console.log('🔗 API_BASE_URL:', API_BASE_URL, 'window.electron:', !!window.electron);

class APIService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Handle response
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.error || 'API request failed');
      err.status = response.status;  // preserve HTTP status so callers can distinguish auth vs network errors
      throw err;
    }

    return data;
  }

  // Authentication
  async register(email, password, name) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, name }),
    });

    const data = await this.handleResponse(response);
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }

    return data;
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse(response);
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }

    return data;
  }

  async verifyToken() {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Social / OAuth sign-in — provider is 'google' | 'apple' | 'microsoft'
  // profile: { email, name, sub } as returned by the provider SDK
  async oauthLogin(provider, profile) {
    const response = await fetch(`${API_BASE_URL}/auth/oauth`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ provider, profile }),
    });

    const data = await this.handleResponse(response);

    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }

    return data;
  }

  async saveSettings(prefs) {
    const response = await fetch(`${API_BASE_URL}/user/settings`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(prefs),
    });
    return this.handleResponse(response);
  }

  async logout() {
    // Revoke the token server-side first so it can't be reused if stolen
    const token = this.token || localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getHeaders(),
        });
      } catch { /* best-effort — clear locally regardless */ }
    }
    this.token = null;
    localStorage.removeItem('token');
  }

  // VPN Operations
  // When running inside Electron, VPN commands go through IPC so the main
  // process can manipulate the OS network stack (WireGuard, kill switch, DNS).
  // In a plain browser / PWA context they fall back to the REST API.

  _isElectron() {
    return typeof window !== 'undefined' && window.electron?.vpn?.connect;
  }

  async getVPNStatus() {
    const response = await fetch(`${API_BASE_URL}/vpn/status`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async connectVPN(serverId, protocol = 'wireguard', killSwitch = false) {
    if (this._isElectron()) {
      const result = await window.electron.vpn.connect({
        serverId,
        protocol,
        token: this.token,
        killSwitch,
      });
      if (!result.success) throw new Error(result.error || 'Tunnel connect failed');
      return result;
    }

    const response = await fetch(`${API_BASE_URL}/vpn/connect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ serverId, protocol }),
    });

    return this.handleResponse(response);
  }

  async disconnectVPN() {
    if (this._isElectron()) {
      const result = await window.electron.vpn.disconnect({ token: this.token });
      if (!result.success) throw new Error(result.error || 'Tunnel disconnect failed');
      return result;
    }

    const response = await fetch(`${API_BASE_URL}/vpn/disconnect`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async multiHopConnect(serverIds) {
    const response = await fetch(`${API_BASE_URL}/vpn/multihop`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ serverIds }),
    });

    return this.handleResponse(response);
  }

  async getTrafficStats() {
    if (this._isElectron()) {
      // Read real rx/tx bytes directly from the WireGuard interface
      const result = await window.electron.vpn.getStats();
      return result;
    }

    const response = await fetch(`${API_BASE_URL}/vpn/traffic`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getVPNConfig() {
    const response = await fetch(`${API_BASE_URL}/vpn/config`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Server Operations
  async getServers() {
    const response = await fetch(`${API_BASE_URL}/servers`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getServer(serverId) {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async pingServer(serverId) {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}/ping`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // User Operations
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async upgradePlan(plan) {
    const response = await fetch(`${API_BASE_URL}/user/upgrade`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ plan }),
    });

    return this.handleResponse(response);
  }

  // Analytics
  async getConnectionHistory() {
    const response = await fetch(`${API_BASE_URL}/analytics/history`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async logConnection(entry) {
    const response = await fetch(`${API_BASE_URL}/analytics/connections`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(entry),
    });
    return this.handleResponse(response);
  }

  async getDataUsage() {
    const response = await fetch(`${API_BASE_URL}/analytics/usage`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ── Admin Operations (role: admin only) ──────────────────────────────────

  async adminGetUsers() {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async adminGetStats() {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async adminSetRole(email, role) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(email)}/role`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    return this.handleResponse(response);
  }

  async adminSetPlan(email, plan) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(email)}/plan`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ plan }),
    });
    return this.handleResponse(response);
  }

  async adminDeleteUser(email) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // ── Vulnerability Scan ────────────────────────────────────────────────────
  // Queries OSV.dev via the server proxy — returns { scannedAt, packagesChecked, findings[] }
  async vulnScan() {
    const response = await fetch(`${API_BASE_URL}/security/vuln-scan`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

// Singleton instance
const apiService = new APIService();

export default apiService;
