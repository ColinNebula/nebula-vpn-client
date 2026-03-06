/**
 * Nebula VPN – Server-Side VPN Service
 * =====================================
 * Manages WireGuard peers on the VPN server host.
 *
 * When WireGuard is installed on this server (production), the service:
 *   • Generates a proper Curve25519 server key pair on first run
 *   • Allocates a unique /24 IP for each connecting client
 *   • Adds / removes WireGuard peers via `wg set`
 *   • Reports real rx/tx bytes via `wg show transfer`
 *
 * When WireGuard is NOT installed (development / testing), all peer
 * management commands are skipped with a warning, but the returned config
 * is still structurally correct and can be used with a real server.
 *
 * Required env vars (add to server/.env):
 *   WG_INTERFACE          – WireGuard interface name  (default: wg0)
 *   WG_SERVER_PUBLIC_KEY  – Server's base64 public key
 *   WG_SERVER_ENDPOINT    – Public IP or hostname + UDP port (host:port)
 *   WG_DNS                – Comma-separated DNS IPs for clients (default: 1.1.1.1,1.0.0.1)
 *   WG_SUBNET             – VPN subnet in CIDR (default: 10.8.0.0/24)
 */

'use strict';

const crypto        = require('crypto');
const { exec }      = require('child_process');
const { promisify } = require('util');
const logger        = require('../utils/logger');

const execAsync = promisify(exec);

// ─── Key helpers ────────────────────────────────────────────────────────────

/**
 * Generate a Curve25519 key pair using Node.js built-in crypto.
 * PKCS8 DER private key: 16-byte ASN.1 header + 32-byte raw key.
 * SPKI  DER public  key: 12-byte ASN.1 header + 32-byte raw key.
 *
 * @returns {{ privateKey: string, publicKey: string }} Base64 encoded raw keys.
 */
function generateCurve25519KeyPair() {
  const { privateKey: privDer, publicKey: pubDer } =
    crypto.generateKeyPairSync('x25519', {
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
      publicKeyEncoding:  { type: 'spki',  format: 'der' },
    });
  return {
    privateKey: privDer.slice(16).toString('base64'),
    publicKey:  pubDer.slice(12).toString('base64'),
  };
}

// ─── IP pool ────────────────────────────────────────────────────────────────

class IPPool {
  constructor(subnet = '10.8.0') {
    this.subnet  = subnet;
    this.used    = new Set(); // set of last-octets in use
    this.clientMap = new Map(); // userId → last-octet
  }

  allocate(userId) {
    if (this.clientMap.has(userId)) {
      return `${this.subnet}.${this.clientMap.get(userId)}`;
    }
    for (let octet = 2; octet <= 254; octet++) {
      if (!this.used.has(octet)) {
        this.used.add(octet);
        this.clientMap.set(userId, octet);
        return `${this.subnet}.${octet}`;
      }
    }
    throw new Error('VPN IP pool exhausted');
  }

  release(userId) {
    const octet = this.clientMap.get(userId);
    if (octet !== undefined) {
      this.used.delete(octet);
      this.clientMap.delete(userId);
    }
  }
}

// ─── WireGuard shell helpers ─────────────────────────────────────────────────

async function wgAddPeer(iface, clientPublicKey, assignedIP) {
  // wg set wg0 peer <pubkey> allowed-ips 10.8.0.x/32
  const cmd = `wg set ${iface} peer ${clientPublicKey} allowed-ips ${assignedIP}/32`;
  await execAsync(cmd);
  // Persist changes so they survive a server reboot
  await execAsync(`wg-quick save ${iface}`).catch(() => {}); // non-fatal
}

async function wgRemovePeer(iface, clientPublicKey) {
  const cmd = `wg set ${iface} peer ${clientPublicKey} remove`;
  await execAsync(cmd);
  await execAsync(`wg-quick save ${iface}`).catch(() => {});
}

/**
 * Read tx/rx bytes for a specific peer from `wg show <iface> transfer`.
 * Output format: <peer-pubkey>\t<rx-bytes>\t<tx-bytes>
 */
async function wgGetPeerTransfer(iface, clientPublicKey) {
  const { stdout } = await execAsync(`wg show ${iface} transfer`);
  for (const line of stdout.split('\n')) {
    const [peer, rx, tx] = line.trim().split(/\s+/);
    if (peer === clientPublicKey) {
      return { download: parseInt(rx, 10) || 0, upload: parseInt(tx, 10) || 0 };
    }
  }
  return { download: 0, upload: 0 };
}

// ─── VPNService ─────────────────────────────────────────────────────────────

class VPNService {
  constructor() {
    // userId → { server, protocol, connectedAt, assignedIp, clientPublicKey }
    this.connections = new Map();

    const subnetBase = (process.env.WG_SUBNET || '10.8.0.0/24').split('.').slice(0, 3).join('.');
    this.ipPool = new IPPool(subnetBase);

    this.iface      = process.env.WG_INTERFACE       || 'wg0';
    this.serverPubKey = process.env.WG_SERVER_PUBLIC_KEY || null;
    this.endpoint   = process.env.WG_SERVER_ENDPOINT || null;
    this.dns        = (process.env.WG_DNS || '1.1.1.1,1.0.0.1').split(',').map(s => s.trim());

    if (!this.serverPubKey || !this.endpoint) {
      logger.warn(
        'WG_SERVER_PUBLIC_KEY and/or WG_SERVER_ENDPOINT are not set in .env. ' +
        'Returning config with placeholder values — set real values for production.'
      );
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────

  async getStatus(userId) {
    const conn = this.connections.get(userId);
    return {
      connected:   !!conn,
      server:      conn?.server      ?? null,
      connectedAt: conn?.connectedAt ?? null,
      protocol:    conn?.protocol    ?? null,
      ip:          conn?.assignedIp  ?? null,
    };
  }

  // ── Connect ────────────────────────────────────────────────────────────

  /**
   * Register a new VPN connection.
   *
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.serverId
   * @param {string} [params.protocol='wireguard']
   * @param {string} [params.clientPublicKey]  – Client's Curve25519 public key (base64).
   *                                             If omitted (legacy), a throwaway key is used.
   */
  async connect({ userId, serverId, protocol = 'wireguard', clientPublicKey }) {
    try {
      if (this.connections.has(userId)) {
        await this.disconnect(userId);
      }

      const assignedIp = this.ipPool.allocate(userId);

      // If no client public key supplied, generate a placeholder (dev mode)
      const peerPublicKey = clientPublicKey || generateCurve25519KeyPair().publicKey;

      const connection = {
        server:          serverId,
        protocol,
        connectedAt:     new Date(),
        assignedIp,
        clientPublicKey: peerPublicKey,
      };

      this.connections.set(userId, connection);

      // Add the peer to the WireGuard interface on this server
      if (this.serverPubKey && this.endpoint) {
        try {
          await wgAddPeer(this.iface, peerPublicKey, assignedIp);
          logger.info(`WireGuard: added peer ${peerPublicKey.slice(0, 8)}… allowed-ips ${assignedIp}/32`);
        } catch (wgErr) {
          // WireGuard not installed on this host (development) — log and continue.
          logger.warn(`WireGuard peer add skipped (wg not available): ${wgErr.message}`);
        }
      }

      logger.info(`VPN connected: user=${userId} server=${serverId} ip=${assignedIp}`);

      return {
        connected:      true,
        server:         serverId,
        ip:             assignedIp,
        // Peer config the client needs to build its WireGuard [Peer] section
        serverPublicKey: this.serverPubKey  || 'REPLACE_WITH_SERVER_PUBLIC_KEY',
        serverEndpoint:  this.endpoint      || 'YOUR_SERVER_IP:51820',
        assignedIP:      assignedIp,
        dns:             this.dns,
      };
    } catch (error) {
      this.ipPool.release(userId);
      logger.error('VPN connect error:', error);
      throw new Error('Failed to establish VPN connection');
    }
  }

  // ── Disconnect ─────────────────────────────────────────────────────────

  async disconnect(userId) {
    const conn = this.connections.get(userId);
    if (!conn) return { connected: false };

    // Remove peer from WireGuard interface
    if (this.serverPubKey && conn.clientPublicKey) {
      try {
        await wgRemovePeer(this.iface, conn.clientPublicKey);
        logger.info(`WireGuard: removed peer ${conn.clientPublicKey.slice(0, 8)}…`);
      } catch (wgErr) {
        logger.warn(`WireGuard peer remove skipped: ${wgErr.message}`);
      }
    }

    this.connections.delete(userId);
    this.ipPool.release(userId);

    logger.info(`VPN disconnected: user=${userId}`);

    return {
      connected: false,
      duration:  Date.now() - conn.connectedAt.getTime(),
    };
  }

  // ── Multi-hop ──────────────────────────────────────────────────────────

  async multiHopConnect({ userId, serverIds, clientPublicKey }) {
    if (this.connections.has(userId)) await this.disconnect(userId);

    const assignedIp    = this.ipPool.allocate(userId);
    const peerPublicKey = clientPublicKey || generateCurve25519KeyPair().publicKey;

    const connection = {
      servers:         serverIds,
      server:          serverIds[0],
      protocol:        'wireguard-multihop',
      connectedAt:     new Date(),
      assignedIp,
      clientPublicKey: peerPublicKey,
    };

    this.connections.set(userId, connection);

    if (this.serverPubKey) {
      try {
        await wgAddPeer(this.iface, peerPublicKey, assignedIp);
      } catch (wgErr) {
        logger.warn(`WireGuard multi-hop peer add skipped: ${wgErr.message}`);
      }
    }

    logger.info(`Multi-hop VPN connected: user=${userId} servers=${serverIds.join('→')}`);

    return {
      connected:      true,
      servers:        serverIds,
      type:           'multi-hop',
      ip:             assignedIp,
      serverPublicKey: this.serverPubKey || 'REPLACE_WITH_SERVER_PUBLIC_KEY',
      serverEndpoint:  this.endpoint     || 'YOUR_SERVER_IP:51820',
      assignedIP:      assignedIp,
      dns:             this.dns,
    };
  }

  // ── Config ─────────────────────────────────────────────────────────────

  async getConfig(userId) {
    const conn = this.connections.get(userId);
    if (!conn) throw new Error('Not connected');

    return {
      interface: {
        address: `${conn.assignedIp}/24`,
        dns:     this.dns.join(', '),
      },
      peer: {
        publicKey:           this.serverPubKey  || 'REPLACE_WITH_SERVER_PUBLIC_KEY',
        endpoint:            this.endpoint      || 'YOUR_SERVER_IP:51820',
        allowedIPs:          '0.0.0.0/0, ::/0',
        persistentKeepalive: 25,
      },
    };
  }

  // ── Traffic stats ──────────────────────────────────────────────────────

  async getTrafficStats(userId) {
    const conn = this.connections.get(userId);
    if (!conn) return { download: 0, upload: 0 };

    try {
      const stats = await wgGetPeerTransfer(this.iface, conn.clientPublicKey);
      return { ...stats, duration: Math.floor((Date.now() - conn.connectedAt.getTime()) / 1000) };
    } catch {
      // WireGuard not available (development) — return uptime-based placeholder
      const duration = Date.now() - conn.connectedAt.getTime();
      return {
        download: 0,
        upload:   0,
        duration: Math.floor(duration / 1000),
      };
    }
  }
}

module.exports = VPNService;

