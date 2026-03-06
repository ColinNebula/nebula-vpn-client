/**
 * Nebula VPN – WireGuard Tunnel Manager
 * ======================================
 * Manages the OS-level WireGuard tunnel, kill switch, and DNS on behalf of the
 * Electron main process.  All privileged OS operations happen here so the
 * renderer (React) never touches the file system or network stack directly.
 *
 * Platform support:
 *   Windows – wireguard.exe (WireGuard for Windows, https://wireguard.com/install/)
 *   Linux   – wg-quick (wireguard-tools package)
 *   macOS   – wg-quick (brew install wireguard-tools)
 *
 * Required env vars on the API server (see server/.env):
 *   WG_SERVER_PUBLIC_KEY   – server's Curve25519 public key (base64)
 *   WG_SERVER_ENDPOINT     – host:port of the WireGuard server (UDP)
 *   WG_DNS                 – comma-separated DNS IPs provided to the client
 */

'use strict';

const { execFile, exec } = require('child_process');
const { promisify }      = require('util');
const crypto             = require('crypto');
const fs                 = require('fs');
const os                 = require('os');
const path               = require('path');

const execFileAsync = promisify(execFile);
const execAsync     = promisify(exec);

// ─── helpers ────────────────────────────────────────────────────────────────

/** Validate a base64 string that should encode exactly 32 bytes. */
function isValidWGKey(b64) {
  if (typeof b64 !== 'string') return false;
  try {
    return Buffer.from(b64, 'base64').length === 32;
  } catch { return false; }
}

/** Validate an IPv4 address. */
function isValidIPv4(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every(n => parseInt(n, 10) <= 255);
}

/** Validate host:port (endpoint). */
function isValidEndpoint(ep) {
  const match = ep.match(/^([a-zA-Z0-9.\-]+):(\d{1,5})$/);
  if (!match) return false;
  const port = parseInt(match[2], 10);
  return port > 0 && port <= 65535;
}

// ─── WireGuardTunnel ────────────────────────────────────────────────────────

class WireGuardTunnel {
  constructor() {
    this.platform        = process.platform; // 'win32' | 'linux' | 'darwin'
    this.tunnelName      = 'nebula0';
    this.configDir       = this._resolveConfigDir();
    this.configPath      = path.join(this.configDir, `${this.tunnelName}.conf`);
    this.connected       = false;
    this.originalDNS     = null;   // saved before override (Linux only)
    this.killSwitchActive = false;
    this.keyPair         = null;   // { privateKey, publicKey } – raw base64
    this._vpnServerIP    = null;   // extracted from endpoint for kill switch
  }

  _resolveConfigDir() {
    switch (this.platform) {
      case 'win32':  return path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'WireGuard');
      case 'linux':  return '/etc/wireguard';
      case 'darwin': return '/usr/local/etc/wireguard';
      default:       return path.join(os.homedir(), '.wireguard');
    }
  }

  // ── Key generation ─────────────────────────────────────────────────────

  /**
   * Generate a proper Curve25519 key pair for WireGuard.
   *
   * Node.js crypto natively supports x25519 (Curve25519) since v15.
   * The raw 32-byte keys are extracted from their DER-encoded wrappers:
   *   PKCS8 private key DER: 16-byte ASN.1 header + 32-byte key
   *   SPKI  public  key DER: 12-byte ASN.1 header + 32-byte key
   *
   * @returns {{ privateKey: string, publicKey: string }}  Base64 encoded.
   */
  generateKeyPair() {
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

  // ── Config file ────────────────────────────────────────────────────────

  /**
   * Write the WireGuard config file with mode 0600.
   * Inputs are validated before writing to disk.
   */
  writeConfig({ privateKey, assignedIP, dns, serverPublicKey, serverEndpoint,
                allowedIPs = '0.0.0.0/0, ::/0' }) {
    if (!isValidWGKey(privateKey))    throw new Error('Invalid client private key');
    if (!isValidWGKey(serverPublicKey)) throw new Error('Invalid server public key');
    if (!isValidEndpoint(serverEndpoint)) throw new Error('Invalid server endpoint');
    if (!isValidIPv4(assignedIP))     throw new Error('Invalid assigned IP');

    const dnsStr = Array.isArray(dns) ? dns.join(', ') : String(dns);

    const config = [
      '[Interface]',
      `PrivateKey = ${privateKey}`,
      `Address = ${assignedIP}/24`,
      `DNS = ${dnsStr}`,
      '',
      '[Peer]',
      `PublicKey = ${serverPublicKey}`,
      `Endpoint = ${serverEndpoint}`,
      `AllowedIPs = ${allowedIPs}`,
      'PersistentKeepalive = 25',
      '',
    ].join('\n');

    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(this.configPath, config, { mode: 0o600 });
  }

  // ── Tunnel up / down ───────────────────────────────────────────────────

  async _up() {
    if (this.platform === 'win32') {
      // WireGuard for Windows installs the tunnel as a Windows service.
      // WIREGUARD_PATH env var overrides the default install location.
      const wgExe = process.env.WIREGUARD_PATH ||
        'C:\\Program Files\\WireGuard\\wireguard.exe';
      await execFileAsync(wgExe, ['/installtunnelservice', this.configPath]);
      // Service start is async on Windows – poll until the interface is ready.
      await this._waitForInterface(8000);
    } else {
      await execFileAsync('wg-quick', ['up', this.configPath]);
    }
    this.connected = true;
  }

  async _down() {
    try {
      if (this.platform === 'win32') {
        const wgExe = process.env.WIREGUARD_PATH ||
          'C:\\Program Files\\WireGuard\\wireguard.exe';
        await execFileAsync(wgExe, ['/uninstalltunnelservice', this.tunnelName]);
      } else {
        await execFileAsync('wg-quick', ['down', this.configPath]);
      }
    } catch (err) {
      // Log but continue cleanup – we still want DNS/firewall restored.
      console.error('[WireGuard] Error bringing tunnel down:', err.message);
    }
    this.connected = false;
  }

  /** Poll `wg show` until the interface appears (Windows only). */
  _waitForInterface(timeoutMs) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(async () => {
        try {
          await execAsync(`wg show ${this.tunnelName}`);
          clearInterval(timer);
          resolve();
        } catch {
          if (Date.now() - start > timeoutMs) {
            clearInterval(timer);
            reject(new Error('WireGuard interface did not come up in time'));
          }
        }
      }, 500);
    });
  }

  // ── Kill switch ────────────────────────────────────────────────────────

  /**
   * Block all outbound traffic except:
   *   • UDP to the VPN server endpoint (WireGuard handshake / data)
   *   • Traffic that leaves via the VPN tunnel interface
   *   • Loopback
   */
  async enableKillSwitch(serverIP) {
    this._vpnServerIP = serverIP;
    if      (this.platform === 'win32')  await this._ksWindows('add', serverIP);
    else if (this.platform === 'linux')  await this._ksLinux('add');
    else if (this.platform === 'darwin') await this._ksMacOS('add', serverIP);
    this.killSwitchActive = true;
    console.log('[KillSwitch] Enabled – blocking non-VPN traffic');
  }

  async disableKillSwitch() {
    if      (this.platform === 'win32')  await this._ksWindows('remove', this._vpnServerIP);
    else if (this.platform === 'linux')  await this._ksLinux('remove');
    else if (this.platform === 'darwin') await this._ksMacOS('remove', this._vpnServerIP);
    this.killSwitchActive = false;
    console.log('[KillSwitch] Disabled');
  }

  async _ksWindows(action, serverIP) {
    const rules = [
      { name: 'NebulaVPN-BlockAll',      cmd: `action=block` },
      { name: 'NebulaVPN-AllowWG',       cmd: `action=allow protocol=UDP remoteip=${serverIP}` },
      { name: 'NebulaVPN-AllowLoopback', cmd: `action=allow remoteip=127.0.0.1` },
      { name: 'NebulaVPN-AllowVPNNet',   cmd: `action=allow localip=10.8.0.0/24` },
    ];

    if (action === 'add') {
      for (const { name, cmd } of rules) {
        await execAsync(
          `netsh advfirewall firewall add rule name="${name}" dir=out ${cmd}`
        ).catch(e => console.warn('[KillSwitch] Windows add rule failed:', e.message));
      }
    } else {
      for (const { name } of rules) {
        await execAsync(
          `netsh advfirewall firewall delete rule name="${name}"`
        ).catch(() => {}); // ignore "rule not found" errors
      }
    }
  }

  async _ksLinux(action) {
    // Use WireGuard's fwmark to distinguish tunnel traffic.
    const mark = '0xca6c';
    const v4Rule = `! -o ${this.tunnelName} -m mark ! --mark ${mark} -m addrtype ! --dst-type LOCAL -j REJECT --reject-with icmp-net-unreachable`;
    const v6Rule = `! -o ${this.tunnelName} -m mark ! --mark ${mark} -m addrtype ! --dst-type LOCAL -j REJECT`;
    const flag = action === 'add' ? '-I OUTPUT 1' : '-D OUTPUT';
    await execAsync(`iptables  ${flag} ${v4Rule}`).catch(e => console.warn('[KillSwitch] iptables:', e.message));
    await execAsync(`ip6tables ${flag} ${v6Rule}`).catch(e => console.warn('[KillSwitch] ip6tables:', e.message));
  }

  async _ksMacOS(action, serverIP) {
    if (action === 'add') {
      const rules = [
        '# Nebula VPN Kill Switch – generated file, do not edit',
        'block drop out all',
        'pass out on lo0 all',
        `pass out proto udp to ${serverIP}`,
        'pass out on utun0 all',
      ].join('\n');
      const pfFile = path.join(os.tmpdir(), 'nebula-ks.conf');
      fs.writeFileSync(pfFile, rules, { mode: 0o600 });
      await execAsync(`pfctl -F all -f ${pfFile} && pfctl -e`).catch(e =>
        console.warn('[KillSwitch] pfctl:', e.message));
    } else {
      await execAsync('pfctl -d').catch(() => {});
    }
  }

  // ── DNS management ─────────────────────────────────────────────────────

  async setDNS(dnsServers) {
    const servers = Array.isArray(dnsServers) ? dnsServers : [dnsServers];
    if      (this.platform === 'win32')  await this._dnsWindows('set', servers);
    else if (this.platform === 'linux')  await this._dnsLinux('set', servers);
    else if (this.platform === 'darwin') await this._dnsMacOS('set', servers);
  }

  async restoreDNS() {
    if      (this.platform === 'win32')  await this._dnsWindows('restore');
    else if (this.platform === 'linux')  await this._dnsLinux('restore');
    else if (this.platform === 'darwin') await this._dnsMacOS('restore');
  }

  async _getWindowsAdapters() {
    try {
      const { stdout } = await execAsync('netsh interface show interface');
      return stdout.split('\n')
        .filter(l => /connected/i.test(l))
        .map(l => l.trim().split(/\s{2,}/).pop())
        .filter(Boolean);
    } catch { return []; }
  }

  async _dnsWindows(action, servers = []) {
    const adapters = await this._getWindowsAdapters();
    for (const adapter of adapters) {
      if (action === 'set') {
        await execAsync(
          `netsh interface ipv4 set dnsservers name="${adapter}" source=static address=${servers[0]} register=primary validate=no`
        ).catch(e => console.warn('[DNS] Windows set primary:', e.message));
        if (servers[1]) {
          await execAsync(
            `netsh interface ipv4 add dnsservers name="${adapter}" address=${servers[1]} index=2 validate=no`
          ).catch(e => console.warn('[DNS] Windows set secondary:', e.message));
        }
      } else {
        // Restore to DHCP-assigned DNS
        await execAsync(
          `netsh interface ipv4 set dnsservers name="${adapter}" source=dhcp`
        ).catch(() => {});
      }
    }
  }

  async _dnsLinux(action, servers = []) {
    const resolvPath = '/etc/resolv.conf';
    if (action === 'set') {
      if (!this.originalDNS && fs.existsSync(resolvPath)) {
        this.originalDNS = fs.readFileSync(resolvPath, 'utf8');
      }
      const content = servers.map(ip => `nameserver ${ip}`).join('\n') + '\n';
      fs.writeFileSync(resolvPath, content, { mode: 0o644 });
    } else if (this.originalDNS) {
      fs.writeFileSync(resolvPath, this.originalDNS, { mode: 0o644 });
      this.originalDNS = null;
    }
  }

  async _dnsMacOS(action, servers = []) {
    try {
      const { stdout } = await execAsync('networksetup -listallnetworkservices');
      const services = stdout.split('\n').filter(s => s && !s.startsWith('*'));
      for (const svc of services) {
        if (action === 'set') {
          await execAsync(
            `networksetup -setdnsservers "${svc}" ${servers.join(' ')}`
          ).catch(() => {});
        } else {
          await execAsync(
            `networksetup -setdnsservers "${svc}" empty`
          ).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[DNS] macOS:', e.message);
    }
  }

  // ── Real-time stats ────────────────────────────────────────────────────

  /**
   * Read actual rx/tx byte counts from the WireGuard interface.
   * `wg show <iface> transfer` prints: <peer-pubkey> <rx-bytes> <tx-bytes>
   */
  async getStats() {
    if (!this.connected) return { download: 0, upload: 0 };
    try {
      const { stdout } = await execAsync(`wg show ${this.tunnelName} transfer`);
      let totalRx = 0, totalTx = 0;
      for (const line of stdout.trim().split('\n')) {
        const [, rx, tx] = line.trim().split(/\s+/);
        totalRx += parseInt(rx, 10) || 0;
        totalTx += parseInt(tx, 10) || 0;
      }
      return { download: totalRx, upload: totalTx };
    } catch {
      return { download: 0, upload: 0 };
    }
  }

  // ── Public connect / disconnect ────────────────────────────────────────

  /**
   * Full connect flow:
   *   1. Generate Curve25519 key pair
   *   2. Write WireGuard config file
   *   3. Bring tunnel up (wg-quick / wireguard.exe service)
   *   4. Override system DNS to VPN DNS
   *   5. Optionally enable kill switch
   *
   * @param {object} params
   * @param {string} params.serverPublicKey   – Server's WireGuard public key (base64)
   * @param {string} params.serverEndpoint    – "host:port" of WireGuard server
   * @param {string} params.assignedIP        – Client's IP inside the VPN (e.g. 10.8.0.5)
   * @param {string|string[]} params.dns      – DNS server(s) to use inside tunnel
   * @param {boolean} [params.enableKillSwitch=false]
   * @returns {{ publicKey: string, assignedIP: string }}
   */
  async connect({ serverPublicKey, serverEndpoint, assignedIP, dns, enableKillSwitch = false }) {
    if (this.connected) await this.disconnect();

    this.keyPair = this.generateKeyPair();

    this.writeConfig({
      privateKey:    this.keyPair.privateKey,
      assignedIP,
      dns,
      serverPublicKey,
      serverEndpoint,
    });

    await this._up();
    await this.setDNS(Array.isArray(dns) ? dns : [dns]);

    if (enableKillSwitch) {
      const serverIP = serverEndpoint.split(':')[0];
      await this.enableKillSwitch(serverIP);
    }

    console.log(`[WireGuard] Connected – interface ${this.tunnelName}, IP ${assignedIP}`);
    return { publicKey: this.keyPair.publicKey, assignedIP };
  }

  /**
   * Full disconnect flow:
   *   1. Disable kill switch (if active)
   *   2. Restore system DNS
   *   3. Bring tunnel down
   *   4. Delete config file (contains private key – wipe on disconnect)
   */
  async disconnect() {
    if (this.killSwitchActive) {
      await this.disableKillSwitch().catch(e =>
        console.error('[WireGuard] Kill switch teardown error:', e.message));
    }

    await this.restoreDNS().catch(e =>
      console.error('[WireGuard] DNS restore error:', e.message));

    await this._down();

    // Securely delete config (contains private key)
    try {
      if (fs.existsSync(this.configPath)) {
        // Overwrite with zeros before unlinking
        const size = fs.statSync(this.configPath).size;
        fs.writeFileSync(this.configPath, Buffer.alloc(size, 0));
        fs.unlinkSync(this.configPath);
      }
    } catch (e) {
      console.warn('[WireGuard] Could not wipe config file:', e.message);
    }

    this.keyPair = null;
    console.log('[WireGuard] Disconnected');
  }

  /** Return the client's public key (null if not connected). */
  getPublicKey() {
    return this.keyPair?.publicKey ?? null;
  }

  isConnected() {
    return this.connected;
  }
}

module.exports = WireGuardTunnel;
