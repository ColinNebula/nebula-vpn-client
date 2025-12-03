/**
 * Outline VPN Integration Service
 * Connects Nebula VPN backend to Outline servers
 */

class OutlineService {
  constructor() {
    this.servers = new Map();
    this.connections = new Map();
    this.loadServersFromEnv();
  }

  /**
   * Load Outline server access keys from environment
   */
  loadServersFromEnv() {
    const serverKeys = process.env.OUTLINE_SERVERS?.split(',') || [];
    
    serverKeys.forEach((key, index) => {
      const server = this.parseAccessKey(key.trim());
      if (server) {
        this.servers.set(`outline-${index + 1}`, server);
      }
    });

    console.log(`Loaded ${this.servers.size} Outline servers`);
  }

  /**
   * Parse Outline access key
   * Format: ss://base64encoded@host:port/?outline=1
   */
  parseAccessKey(accessKey) {
    try {
      const url = new URL(accessKey);
      
      if (url.protocol !== 'ss:') {
        throw new Error('Invalid protocol');
      }

      // Decode method and password from base64
      const auth = Buffer.from(url.username, 'base64').toString();
      const [method, password] = auth.split(':');

      return {
        method,
        password,
        host: url.hostname,
        port: parseInt(url.port) || 8388,
        accessKey,
        protocol: 'shadowsocks'
      };
    } catch (error) {
      console.error('Failed to parse access key:', error);
      return null;
    }
  }

  /**
   * Get all available Outline servers
   */
  getServers() {
    return Array.from(this.servers.entries()).map(([id, server]) => ({
      id,
      name: `Outline ${id}`,
      host: server.host,
      port: server.port,
      protocol: server.protocol,
      method: server.method
    }));
  }

  /**
   * Connect to Outline server
   */
  async connect(userId, serverId) {
    const server = this.servers.get(serverId);
    
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // In a real implementation, this would:
    // 1. Configure local SOCKS5 proxy
    // 2. Start Shadowsocks client
    // 3. Route traffic through proxy
    
    const connection = {
      userId,
      serverId,
      server,
      connectedAt: new Date(),
      status: 'connected',
      localPort: 1080 + Math.floor(Math.random() * 1000), // Mock local proxy port
      bytesTransferred: 0
    };

    this.connections.set(userId, connection);

    console.log(`User ${userId} connected to Outline server ${serverId}`);

    return {
      success: true,
      connection: {
        serverId,
        localProxy: `socks5://localhost:${connection.localPort}`,
        status: 'connected'
      }
    };
  }

  /**
   * Disconnect from Outline server
   */
  async disconnect(userId) {
    const connection = this.connections.get(userId);
    
    if (!connection) {
      return { success: true, message: 'Not connected' };
    }

    // In real implementation: stop Shadowsocks client
    this.connections.delete(userId);

    console.log(`User ${userId} disconnected from Outline`);

    return {
      success: true,
      duration: Date.now() - connection.connectedAt.getTime()
    };
  }

  /**
   * Get connection status
   */
  getStatus(userId) {
    const connection = this.connections.get(userId);
    
    if (!connection) {
      return {
        connected: false
      };
    }

    return {
      connected: true,
      serverId: connection.serverId,
      connectedAt: connection.connectedAt,
      duration: Date.now() - connection.connectedAt.getTime(),
      bytesTransferred: connection.bytesTransferred
    };
  }

  /**
   * Test server connectivity
   */
  async testServer(serverId) {
    const server = this.servers.get(serverId);
    
    if (!server) {
      throw new Error('Server not found');
    }

    // In real implementation: actual ping test
    const latency = 50 + Math.random() * 100; // Mock latency

    return {
      serverId,
      host: server.host,
      port: server.port,
      latency: Math.round(latency),
      status: 'online'
    };
  }

  /**
   * Generate Outline access key for sharing
   */
  generateAccessKey(serverId) {
    const server = this.servers.get(serverId);
    
    if (!server) {
      throw new Error('Server not found');
    }

    return server.accessKey;
  }

  /**
   * Add a new Outline server
   */
  addServer(accessKey, name) {
    const server = this.parseAccessKey(accessKey);
    
    if (!server) {
      throw new Error('Invalid access key');
    }

    const serverId = name || `outline-${this.servers.size + 1}`;
    this.servers.set(serverId, server);

    console.log(`Added Outline server: ${serverId}`);

    return { serverId, server };
  }

  /**
   * Remove Outline server
   */
  removeServer(serverId) {
    const deleted = this.servers.delete(serverId);
    
    if (!deleted) {
      throw new Error('Server not found');
    }

    console.log(`Removed Outline server: ${serverId}`);
    return { success: true };
  }

  /**
   * Get traffic statistics
   */
  getTrafficStats(userId) {
    const connection = this.connections.get(userId);
    
    if (!connection) {
      return {
        bytesTransferred: 0,
        duration: 0
      };
    }

    // In real implementation: query actual traffic from Shadowsocks
    const duration = Date.now() - connection.connectedAt.getTime();
    const bytesTransferred = Math.floor(duration / 1000 * (500 + Math.random() * 500)); // Mock traffic

    connection.bytesTransferred = bytesTransferred;

    return {
      bytesTransferred,
      duration: Math.floor(duration / 1000),
      downloadSpeed: Math.floor(Math.random() * 10000000), // Mock speed in bytes/sec
      uploadSpeed: Math.floor(Math.random() * 5000000)
    };
  }
}

module.exports = OutlineService;
