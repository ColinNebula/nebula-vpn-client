// API Service for Nebula VPN
// Connects React frontend to Node.js backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
      throw new Error(data.error || 'API request failed');
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

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // VPN Operations
  async getVPNStatus() {
    const response = await fetch(`${API_BASE_URL}/vpn/status`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async connectVPN(serverId, protocol = 'wireguard') {
    const response = await fetch(`${API_BASE_URL}/vpn/connect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ serverId, protocol }),
    });

    return this.handleResponse(response);
  }

  async disconnectVPN() {
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

  async getDataUsage() {
    const response = await fetch(`${API_BASE_URL}/analytics/usage`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }
}

// Singleton instance
const apiService = new APIService();

export default apiService;
