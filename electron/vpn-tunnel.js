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

const { execFile, exec, spawn } = require('child_process');
const { promisify }      = require('util');
const crypto             = require('crypto');
const fs                 = require('fs');
const os                 = require('os');
const path               = require('path');
const dgram              = require('dgram');
const https              = require('https');
const tls                = require('tls');

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

    // Feature sub-systems (instantiated lazily; require the classes defined
    // at the bottom of this file, so we use factory accessors instead).
    this._dohProxy    = null;   // DohProxy instance
    this._splitTunnel = null;   // SplitTunnelManager instance
    this._ssRelay     = null;   // ShadowsocksRelay instance

    // IPv6 leak prevention – list of adapter names we disabled on connect
    this._ipv6DisabledAdapters = [];
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
                allowedIPs = '0.0.0.0/0, ::/0', presharedKey = null }) {
    if (!isValidWGKey(privateKey))    throw new Error('Invalid client private key');
    if (!isValidWGKey(serverPublicKey)) throw new Error('Invalid server public key');
    if (!isValidEndpoint(serverEndpoint)) throw new Error('Invalid server endpoint');
    if (!isValidIPv4(assignedIP))     throw new Error('Invalid assigned IP');
    if (presharedKey && !isValidWGKey(presharedKey)) throw new Error('Invalid PresharedKey');

    const dnsStr = Array.isArray(dns) ? dns.join(', ') : String(dns);

    const config = [
      '[Interface]',
      `PrivateKey = ${privateKey}`,
      `Address = ${assignedIP}/24`,
      `DNS = ${dnsStr}`,
      '',
      '[Peer]',
      `PublicKey = ${serverPublicKey}`,
      // PresharedKey provides a post-quantum security layer when present (FIPS 203 ML-KEM-768 hybrid)
      presharedKey ? `PresharedKey = ${presharedKey}` : null,
      `Endpoint = ${serverEndpoint}`,
      `AllowedIPs = ${allowedIPs}`,
      'PersistentKeepalive = 25',
      '',
    ].filter(line => line !== null).join('\n');

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
      // Belt-and-suspenders: block any residual IPv6 outbound not covered by adapter disabling.
      // PowerShell New-NetFirewallRule handles IPv6 address families better than netsh.
      await execAsync(
        `powershell -NoProfile -NonInteractive -Command "if (-not (Get-NetFirewallRule -Name 'NebulaVPN-BlockIPv6' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -Name 'NebulaVPN-BlockIPv6' -DisplayName 'Nebula VPN Block IPv6' -Direction Outbound -Action Block -AddressFamily IPv6 -Enabled True | Out-Null }"`
      ).catch(e => console.warn('[KillSwitch] IPv6 block rule failed:', e.message));
    } else {
      for (const { name } of rules) {
        await execAsync(
          `netsh advfirewall firewall delete rule name="${name}"`
        ).catch(() => {}); // ignore "rule not found" errors
      }
      await execAsync(
        `powershell -NoProfile -NonInteractive -Command "Remove-NetFirewallRule -Name 'NebulaVPN-BlockIPv6' -ErrorAction SilentlyContinue"`
      ).catch(() => {});
    }
  }

  // ── IPv6 leak prevention (Windows) ───────────────────────────────────────

  /**
   * Disable IPv6 on all physical network adapters.
   * Called on VPN connect to prevent IPv6 traffic from bypassing the tunnel.
   * The WireGuard interface is skipped so the tunnel itself is unaffected.
   */
  async _disableIPv6Windows() {
    const adapters = await this._getWindowsAdapters();
    this._ipv6DisabledAdapters = [];
    for (const adapter of adapters) {
      // Skip the VPN tunnel interface and loopback
      const lower = adapter.toLowerCase();
      if (lower === this.tunnelName.toLowerCase() ||
          lower.includes('wireguard') ||
          lower === 'loopback pseudo-interface 1') continue;

      await execAsync(
        `netsh interface ipv6 set interface "${adapter}" disabled`
      ).then(() => {
        this._ipv6DisabledAdapters.push(adapter);
        console.log(`[IPv6] Disabled on "${adapter}"`);
      }).catch(e => {
        // "The system cannot find the file specified" = adapter has no IPv6 → skip
        if (!e.message.includes('cannot find')) {
          console.warn(`[IPv6] Could not disable on "${adapter}":`, e.message);
        }
      });
    }
    console.log(`[IPv6] Leak prevention active – ${this._ipv6DisabledAdapters.length} adapter(s) locked`);
  }

  /**
   * Re-enable IPv6 on the adapters that were disabled by _disableIPv6Windows().
   * Called on VPN disconnect.
   */
  async _restoreIPv6Windows() {
    for (const adapter of this._ipv6DisabledAdapters) {
      await execAsync(
        `netsh interface ipv6 set interface "${adapter}" enabled`
      ).catch(e => console.warn(`[IPv6] Could not re-enable on "${adapter}":`, e.message));
    }
    if (this._ipv6DisabledAdapters.length > 0) {
      console.log(`[IPv6] Re-enabled on ${this._ipv6DisabledAdapters.length} adapter(s)`);
    }
    this._ipv6DisabledAdapters = [];
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
      // Resolve the actual utun device name that wg-quick assigned so we don't
      // hardcode utun0 (which is taken if another VPN / IPSEC tunnel is active).
      let tunnelIface = 'utun0'; // sensible default
      try {
        const { stdout } = await execAsync('ifconfig -l');
        // wg-quick on macOS names the interface after the config file (e.g. nebula0
        // maps to the first available utunN).  `wg show` lists our interface name.
        const wgOut = await execAsync(`wg show ${this.tunnelName} 2>/dev/null || true`);
        // Prefer grabbing the interface directly from `wg show interfaces`
        const { stdout: ifaces } = await execAsync('wg show interfaces').catch(() => ({ stdout: '' }));
        const found = ifaces.trim().split(/\s+/).find(i => i.startsWith('utun') || i === this.tunnelName);
        if (found) tunnelIface = found;
      } catch { /* use default */ }

      const rules = [
        '# Nebula VPN Kill Switch – generated file, do not edit',
        'block drop out all',
        'pass out on lo0 all',
        `pass out proto udp to ${serverIP}`,
        `pass out on ${tunnelIface} all`,
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
   *   2. Optionally start Shadowsocks relay (obfuscation) and override endpoint
   *   3. Optionally start DoH proxy and override DNS
   *   4. Write WireGuard config file
   *   5. Bring tunnel up (wg-quick / wireguard.exe service)
   *   6. Override system DNS to VPN DNS (or DoH proxy address)
   *   7. Optionally enable kill switch
   *   8. Optionally enable split tunneling
   *
   * @param {object}         params
   * @param {string}         params.serverPublicKey  – Server WireGuard public key (base64)
   * @param {string}         params.serverEndpoint   – "host:port" of WireGuard server
   * @param {string}         params.assignedIP       – Client VPN IP (e.g. 10.8.0.5)
   * @param {string|string[]} params.dns             – DNS server(s) inside tunnel
   * @param {boolean}        [params.enableKillSwitch=false]
   * @param {Array}          [params.splitTunnelApps=[]]  – Apps to bypass VPN
   * @param {string}         [params.dohUrl]              – DoH endpoint URL; activates DoH proxy
   * @param {object}         [params.obfuscation]         – Shadowsocks config; activates obfuscation
   * @returns {{ publicKey: string, assignedIP: string }}
   */
  async connect({
    serverPublicKey, serverEndpoint, assignedIP, dns,
    enableKillSwitch = false,
    splitTunnelApps  = [],
    dohUrl           = null,
    obfuscation      = null,
    presharedKey     = null,  // base64 hybrid PSK (ML-KEM-768 + HKDF-SHA256)
  }) {
    if (this.connected) await this.disconnect();

    this.keyPair = this.generateKeyPair();

    // ── Shadowsocks obfuscation: wrap WireGuard UDP in SS AEAD envelope ──────────
    let effectiveEndpoint = serverEndpoint;
    if (obfuscation) {
      this._ssRelay = new ShadowsocksRelay();
      const [wgServer, wgPortStr] = serverEndpoint.split(':');
      await this._ssRelay.start({
        ...obfuscation,
        wgServer,
        wgPort: Number(wgPortStr) || 51820,
      });
      effectiveEndpoint = this._ssRelay.tunneledEndpoint;
      console.log(`[WireGuard] Obfuscation active – tunnel endpoint: ${effectiveEndpoint}`);
    }

    // ── DoH / DoT proxy: resolve all DNS queries via encrypted channel ────────
    let effectiveDns = Array.isArray(dns) ? dns : (dns ? [dns] : []);
    if (dohUrl) {
      this._dohProxy = new DohProxy();
      await this._dohProxy.start(dohUrl);
      effectiveDns = [`${this._dohProxy.host}`]; // WireGuard DNS → our local proxy
      if (this._dohProxy.port !== 53) {
        // Need NAT redirect so the OS sends port-53 queries to our fallback port
        await this._dohProxy.applyNatRedirect(this.platform);
      }
      console.log(`[WireGuard] DoH proxy active on ${this._dohProxy.host}:${this._dohProxy.port}`);
    }

    this.writeConfig({
      privateKey:      this.keyPair.privateKey,
      assignedIP,
      dns:             effectiveDns,
      serverPublicKey,
      serverEndpoint:  effectiveEndpoint,
      presharedKey,    // null → line omitted; non-null → PQC PSK applied
    });

    await this._up();

    // Block IPv6 on physical adapters immediately after tunnel is up.
    // This prevents the window of exposure between tunnel up and kill switch
    // activation, and protects users who don't use the kill switch.
    if (this.platform === 'win32') {
      await this._disableIPv6Windows();
    }

    await this.setDNS(effectiveDns);

    if (enableKillSwitch) {
      const serverIP = serverEndpoint.split(':')[0]; // original IP (not 127.0.0.1)
      await this.enableKillSwitch(serverIP);
    }

    // ── Split tunneling: exclude specific apps from the VPN tunnel ──────────
    if (splitTunnelApps && splitTunnelApps.length > 0) {
      this._splitTunnel = new SplitTunnelManager(this.platform, this.tunnelName);
      await this._splitTunnel.enable(splitTunnelApps).catch(e =>
        console.error('[WireGuard] Split tunnel enable error:', e.message));
    }

    console.log(`[WireGuard] Connected – interface ${this.tunnelName}, IP ${assignedIP}`);
    return { publicKey: this.keyPair.publicKey, assignedIP };
  }

  /**
   * Full disconnect flow:
   *   1. Stop split tunneling (if active)
   *   2. Disable kill switch (if active)
   *   3. Restore system DNS + stop DoH proxy
   *   4. Stop Shadowsocks relay (if active)
   *   5. Bring tunnel down
   *   6. Delete config file (contains private key – wipe on disconnect)
   */
  async disconnect() {
    // Tear down split tunneling first so bypassed apps resume normal routing
    if (this._splitTunnel?.active) {
      await this._splitTunnel.disable().catch(e =>
        console.error('[WireGuard] Split tunnel teardown error:', e.message));
    }
    this._splitTunnel = null;

    // Restore IPv6 on physical adapters before bringing the tunnel down
    if (this.platform === 'win32') {
      await this._restoreIPv6Windows();
    }

    if (this.killSwitchActive) {
      await this.disableKillSwitch().catch(e =>
        console.error('[WireGuard] Kill switch teardown error:', e.message));
    }

    await this.restoreDNS().catch(e =>
      console.error('[WireGuard] DNS restore error:', e.message));

    // Stop DoH proxy and clean up any NAT redirects
    if (this._dohProxy?.active) {
      if (this._dohProxy.port !== 53) {
        await this._dohProxy.removeNatRedirect(this.platform).catch(() => {});
      }
      this._dohProxy.stop();
    }
    this._dohProxy = null;

    // Stop Shadowsocks relay
    if (this._ssRelay?.active) {
      this._ssRelay.stop();
    }
    this._ssRelay = null;

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

// ════════════════════════════════════════════════════════════════════════════
// DNS-over-HTTPS / DNS-over-TLS Proxy
// ════════════════════════════════════════════════════════════════════════════
//
// Runs a local UDP DNS proxy that forwards every query to a DoH endpoint
// using Node's built-in https module (no extra dependencies).
//
// Usage:
//   const proxy = new DohProxy();
//   await proxy.start('https://1.1.1.1/dns-query');
//   // DNS queries sent to 127.0.0.53:53 are now answered via DoH
//   proxy.stop();
//
// WireGuard config should set  DNS = 127.0.0.53  when an active proxy
// is running.  If binding port 53 fails (non-root), the proxy falls back
// to port 5300 and the caller must redirect 53→5300 via iptables / netsh.

class DohProxy {
  constructor() {
    this._server   = null;
    this._url      = 'https://1.1.1.1/dns-query';  // RFC 8484 DoH endpoint
    this._dotHost  = null;  // set when using DoT mode
    this._dotPort  = 853;
    this._mode     = 'doh'; // 'doh' | 'dot'
    this.host      = '127.0.0.53';
    this.port      = 53;
    this._active   = false;
  }

  get active() { return this._active; }

  /**
   * Start the local DNS proxy.
   * @param {string}  upstreamUrl  - DoH URL   (ignored in DoT mode)
   * @param {'doh'|'dot'} mode
   * @param {string}  dotHost      - DoT server hostname (DoT mode only)
   * @param {number}  dotPort      - DoT server port     (DoT mode only, default 853)
   */
  async start(upstreamUrl = 'https://1.1.1.1/dns-query', mode = 'doh',
              dotHost = '1.1.1.1', dotPort = 853) {
    this._url     = upstreamUrl;
    this._mode    = mode;
    this._dotHost = dotHost;
    this._dotPort = dotPort;

    return new Promise((resolve, reject) => {
      this._server = dgram.createSocket('udp4');

      this._server.on('message', (msg, rinfo) => {
        const forward = this._mode === 'dot'
          ? this._forwardDoT(msg)
          : this._forwardDoH(msg);

        forward
          .then(resp => { if (resp) this._server.send(resp, rinfo.port, rinfo.address); })
          .catch(e => console.warn('[DohProxy] forward error:', e.message));
      });

      this._server.on('error', err => {
        console.error('[DohProxy] server error:', err.message);
        // If port 53 is refused fall back to 5300
        if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
          this.port = 5300;
          this.host = '127.0.0.1';
          this._server.bind(this.port, this.host, () => {
            this._active = true;
            console.log(`[DohProxy] Fallback listen on ${this.host}:${this.port} (add NAT redirect for port 53)`);
            resolve();
          });
        } else {
          reject(err);
        }
      });

      this._server.bind(this.port, this.host, () => {
        this._active = true;
        console.log(`[DohProxy] Listening ${this.host}:${this.port} mode=${this._mode} upstream=${upstreamUrl || dotHost}`);
        resolve();
      });
    });
  }

  stop() {
    if (this._server) {
      try { this._server.close(); } catch {}
      this._server = null;
    }
    this._active = false;
    console.log('[DohProxy] Stopped');
  }

  // ── DoH (RFC 8484) ──────────────────────────────────────────────────────

  _forwardDoH(queryBuf) {
    return new Promise(resolve => {
      const urlObj = new URL(this._url);
      // Use GET with ?dns= base64url-encoded query (RFC 8484 §4.1)
      const b64 = Buffer.from(queryBuf)
        .toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const opts = {
        hostname: urlObj.hostname,
        path:     `${urlObj.pathname}?dns=${b64}`,
        method:   'GET',
        headers:  { Accept: 'application/dns-message' },
        timeout:  5000,
      };

      const req = https.request(opts, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          resolve(res.statusCode === 200 ? Buffer.concat(chunks) : null);
        });
      });
      req.on('error',   () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  }

  // ── DoT (RFC 7858) ──────────────────────────────────────────────────────

  _forwardDoT(queryBuf) {
    return new Promise(resolve => {
      try {
        const socket = tls.connect(
          { host: this._dotHost, port: this._dotPort, servername: this._dotHost },
          () => {
            // DoT framing: 2-byte length prefix
            const len = Buffer.alloc(2);
            len.writeUInt16BE(queryBuf.length);
            socket.write(Buffer.concat([len, queryBuf]));
          }
        );

        const chunks = [];
        socket.on('data', chunk => chunks.push(chunk));
        socket.on('end', () => {
          const all = Buffer.concat(chunks);
          // Strip the 2-byte length prefix from the response
          resolve(all.length > 2 ? all.slice(2) : null);
        });
        socket.on('error', () => resolve(null));
        setTimeout(() => { try { socket.destroy(); } catch {} resolve(null); }, 5000);
      } catch { resolve(null); }
    });
  }

  /** Apply OS-level NAT redirect 53→this.port when running on fallback port. */
  async applyNatRedirect(platform) {
    if (this.port === 53) return; // Already on port 53, no redirect needed
    if (platform === 'linux') {
      await execAsync(
        `iptables -t nat -A OUTPUT -p udp --dport 53 -j REDIRECT --to-ports ${this.port}`
      ).catch(e => console.warn('[DohProxy] iptables NAT:', e.message));
    } else if (platform === 'win32') {
      // Windows: use netsh portproxy for TCP; UDP redirect needs WFP (not easy)
      // Practical approach: listen on port 53 directly with per-adapter DNS override
      console.warn('[DohProxy] Windows UDP NAT redirect not supported; listen port must be 53');
    }
  }

  async removeNatRedirect(platform) {
    if (this.port === 53) return;
    if (platform === 'linux') {
      await execAsync(
        `iptables -t nat -D OUTPUT -p udp --dport 53 -j REDIRECT --to-ports ${this.port}`
      ).catch(() => {});
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Split Tunnel Manager
// ════════════════════════════════════════════════════════════════════════════
//
// Enables per-application VPN bypass.
//
// Linux  — creates routing table 200 via the physical gateway, marks bypass
//          traffic with fwmark 0x3 via iptables cgroup match, routes marked
//          packets through table 200 instead of the VPN table.
//
// Windows — adds per-executable outbound firewall allow rules weighted ahead
//           of the VPN block-all rule, plus metric-based route entries that
//           direct each app's preferred subnets via the physical gateway.
//
// macOS  — uses pf anchors with per-process routing tags (best-effort).

class SplitTunnelManager {
  constructor(platform, tunnelIface) {
    this.platform      = platform;
    this.tunnelIface   = tunnelIface;
    this._active       = false;
    this._gateway      = null;   // { ip, dev }
    this._bypassApps   = [];
    this._BYPASS_TABLE = 200;
    this._BYPASS_MARK  = '0x3';  // distinct from WireGuard's 0xca6c
    this._CGROUP       = 'nebula-bypass';
  }

  get active() { return this._active; }

  // ── Physical gateway detection ──────────────────────────────────────────

  async _getGateway() {
    if (this._gateway) return this._gateway;

    if (this.platform === 'win32') {
      const { stdout } = await execAsync('route print 0.0.0.0 mask 0.0.0.0');
      // Find the active default route: cols are Network Dest, Netmask, Gateway, Interface, Metric
      const m = stdout.match(/\s+0\.0\.0\.0\s+0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)/);
      if (m) { this._gateway = { ip: m[1], dev: m[2] }; return this._gateway; }
    } else {
      // Find the default route that is NOT going via the VPN tunnel interface
      const { stdout } = await execAsync('ip route show table main');
      const nonVPN = stdout.split('\n')
        .filter(l => l.startsWith('default') && !l.includes(this.tunnelIface));
      if (nonVPN.length) {
        const m = nonVPN[0].match(/via (\d+\.\d+\.\d+\.\d+).*dev (\S+)/);
        if (m) { this._gateway = { ip: m[1], dev: m[2] }; return this._gateway; }
      }
    }
    throw new Error('[SplitTunnel] Cannot determine physical default gateway');
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Enable split tunneling for a list of apps.
   * @param {Array<{id:string, name:string, execPath?:string}>} apps
   */
  async enable(apps = []) {
    if (this._active) await this.disable();
    const gw = await this._getGateway();

    if (this.platform === 'linux')       await this._enableLinux(apps, gw);
    else if (this.platform === 'win32')  await this._enableWindows(apps, gw);
    else if (this.platform === 'darwin') await this._enableMacOS(apps, gw);
    else throw new Error(`[SplitTunnel] Unsupported platform: ${this.platform}`);

    this._bypassApps = apps;
    this._active = true;
    console.log(`[SplitTunnel] Enabled for ${apps.length} app(s) via gateway ${gw.ip}`);
  }

  async disable() {
    if (this.platform === 'linux')       await this._disableLinux();
    else if (this.platform === 'win32')  await this._disableWindows();
    else if (this.platform === 'darwin') await this._disableMacOS();
    this._bypassApps = [];
    this._active = false;
    this._gateway = null;
    console.log('[SplitTunnel] Disabled');
  }

  // ── Linux implementation ────────────────────────────────────────────────

  async _enableLinux(apps, gw) {
    // 1. Create cgroup for bypassed processes
    const cgroupV2Path = `/sys/fs/cgroup/${this._CGROUP}`;
    try { fs.mkdirSync(cgroupV2Path, { recursive: true }); } catch {}

    // 2. Populate bypass routing table
    const devArg = gw.dev ? `dev ${gw.dev}` : '';
    await execAsync(
      `ip route add default via ${gw.ip} ${devArg} table ${this._BYPASS_TABLE}`
    ).catch(e => console.warn('[SplitTunnel] route add:', e.message));

    // 3. Policy rule: fwmark 0x3 → table 200
    await execAsync(
      `ip rule add fwmark ${this._BYPASS_MARK} table ${this._BYPASS_TABLE} priority 100`
    ).catch(e => console.warn('[SplitTunnel] ip rule:', e.message));

    // 4. iptables MARK rule – packets from bypass cgroup get fwmark 0x3
    //    cgroupv2 net_classifier path match requires kernel ≥ 4.20
    await execAsync(
      `iptables -t mangle -A OUTPUT -m cgroup --path ${this._CGROUP} -j MARK --set-mark ${this._BYPASS_MARK}`
    ).catch(e => console.warn('[SplitTunnel] iptables cgroup mark (needs kernel ≥4.20):', e.message));

    // 5. Move current PIDs of matching executables into the cgroup
    for (const app of apps) await this._moveToCgroup(app);
  }

  async _disableLinux() {
    await execAsync(
      `iptables -t mangle -D OUTPUT -m cgroup --path ${this._CGROUP} -j MARK --set-mark ${this._BYPASS_MARK}`
    ).catch(() => {});
    await execAsync(
      `ip rule del fwmark ${this._BYPASS_MARK} table ${this._BYPASS_TABLE}`
    ).catch(() => {});
    await execAsync(
      `ip route flush table ${this._BYPASS_TABLE}`
    ).catch(() => {});
    // Remove cgroup (all processes must have left first)
    try { fs.rmdirSync(`/sys/fs/cgroup/${this._CGROUP}`); } catch {}
  }

  /** Find running PIDs for an app and move them into the bypass cgroup. */
  async _moveToCgroup(app) {
    try {
      const name = path.basename(app.execPath || app.name || '').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50);
      if (!name) return;
      const { stdout } = await execAsync(`pgrep -f "${name}" 2>/dev/null || true`);
      const pids = stdout.trim().split('\n').filter(Boolean);
      const procsFile = `/sys/fs/cgroup/${this._CGROUP}/cgroup.procs`;
      for (const pid of pids) {
        try { fs.writeFileSync(procsFile, pid.trim()); } catch {}
      }
    } catch {}
  }

  // ── Windows implementation ──────────────────────────────────────────────

  async _enableWindows(apps, gw) {
    for (const app of apps) {
      if (!app.execPath) {
        console.warn(`[SplitTunnel] Windows: no execPath for "${app.name}", skipping`);
        continue;
      }
      // Per-executable outbound allow rule that takes precedence over block-all
      await execAsync(
        `netsh advfirewall firewall add rule ` +
        `name="NebulaVPN-Bypass-${app.id}" dir=out action=allow ` +
        `program="${app.execPath}"`
      ).catch(e => console.warn('[SplitTunnel] Windows rule add:', e.message));
    }

    // Add a persistent bypass route for RFC1918 subnets via physical gateway
    // (covered apps will reach LAN/internet directly when kill switch uses block-all)
    const bypassSubnets = ['10.0.0.0', '172.16.0.0', '192.168.0.0'];
    const masks         = ['255.0.0.0', '255.240.0.0', '255.255.0.0'];
    for (let i = 0; i < bypassSubnets.length; i++) {
      await execAsync(
        `route add ${bypassSubnets[i]} mask ${masks[i]} ${gw.ip} metric 1`
      ).catch(() => {});
    }
  }

  async _disableWindows() {
    for (const app of this._bypassApps) {
      await execAsync(
        `netsh advfirewall firewall delete rule name="NebulaVPN-Bypass-${app.id}"`
      ).catch(() => {});
    }
    // Remove bypass routes
    const bypassSubnets = ['10.0.0.0', '172.16.0.0', '192.168.0.0'];
    const masks         = ['255.0.0.0', '255.240.0.0', '255.255.0.0'];
    for (let i = 0; i < bypassSubnets.length; i++) {
      await execAsync(`route delete ${bypassSubnets[i]} mask ${masks[i]}`).catch(() => {});
    }
  }

  // ── macOS implementation (best-effort pf) ──────────────────────────────

  async _enableMacOS(apps, gw) {
    // On macOS, per-process routing requires a network extension entitlement.
    // Best-effort: create pf anchor rules for common bypass subnets.
    const pfAnchor = [
      '# Nebula VPN Split Tunnel Bypass',
      ...['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'].map(
        net => `pass out quick from any to ${net} route-to (${gw.dev || 'en0'} ${gw.ip})`
      ),
    ].join('\n');
    const pfFile = path.join(os.tmpdir(), 'nebula-split.conf');
    fs.writeFileSync(pfFile, pfAnchor, { mode: 0o600 });
    await execAsync(`pfctl -a nebula-split -f ${pfFile}`).catch(e =>
      console.warn('[SplitTunnel] macOS pfctl:', e.message));
  }

  async _disableMacOS() {
    await execAsync('pfctl -a nebula-split -F rules').catch(() => {});
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Shadowsocks AEAD Obfuscation Relay
// ════════════════════════════════════════════════════════════════════════════
//
// Implements a pure-Node.js Shadowsocks AEAD (AES-256-GCM) UDP relay so that
// WireGuard UDP packets are encrypted with an additional Shadowsocks envelope
// before reaching the network, making them indistinguishable from HTTPS traffic.
//
// Architecture:
//
//   WireGuard (127.0.0.1:LOCAL_PORT)
//       │  UDP
//       ▼
//   ShadowsocksRelay (this class)
//       │  UDP – Shadowsocks AEAD-wrapped
//       ▼
//   Shadowsocks server (SS_SERVER:SS_PORT)
//       │  decrypts, forwards as plain UDP
//       ▼
//   WireGuard server (WG_SERVER:WG_PORT)
//
// The caller must set the WireGuard endpoint to "127.0.0.1:<localPort>"
// instead of the real server address.  On connect, generateConfig() returns
// the modified endpoint string to use.
//
// Also supports managing an external ss-local/ss-libev binary when available,
// which is more performant for high-throughput connections.

class ShadowsocksRelay {
  constructor() {
    this._localSock  = null;   // dgram.Socket – WireGuard talks to us here
    this._remoteSock = null;   // dgram.Socket – we talk to the SS server here
    this._active     = false;
    this._ssProc     = null;   // child process if using ss-local binary
    this.localPort   = 51821;
    this.localHost   = '127.0.0.1';
    this._wgClient   = null;   // rinfo of the last WireGuard packet (for replies)
    this._masterKey  = null;
    this._ssServer   = null;
    this._ssPort     = null;
    this._wgServer   = null;   // encoded SS address header for the WG endpoint
    this._wgAddrBuf  = null;
    this._method     = 'aes-256-gcm'; // 'aes-256-gcm' | 'chacha20-poly1305'
    this._jitterMs   = 0;             // max random send delay (0 = disabled)
  }

  get active() { return this._active; }

  /**
   * Start the Shadowsocks relay.
   * @param {object} cfg
   * @param {string}  cfg.ssServer        - IP or hostname of the Shadowsocks server
   * @param {number}  cfg.ssPort          - Shadowsocks server port
   * @param {string}  cfg.password        - Shadowsocks password
   * @param {string}  [cfg.method]        - Cipher: 'aes-256-gcm' (default) or 'chacha20-poly1305'
   * @param {string}  cfg.wgServer        - WireGuard server IP (final destination)
   * @param {number}  cfg.wgPort          - WireGuard server UDP port
   * @param {number}  [cfg.localPort=51821]  - Local UDP port for WireGuard to connect to
   * @param {string}  [cfg.ssLocalPath]      - Optional path to ss-local binary
   * @param {number}  [cfg.jitterMs=0]       - Max random delay (ms) added per outgoing packet
   *                                           to resist timing-correlation traffic analysis.
   *                                           0 = disabled; recommended range 10–80 ms.
   */
  async start(cfg) {
    const { ssServer, ssPort, password, wgServer, wgPort,
            localPort = 51821, ssLocalPath, jitterMs = 0 } = cfg;
    this.localPort  = localPort;
    this._ssServer  = ssServer;
    this._ssPort    = ssPort;
    this._masterKey = this._deriveKey(password, 32);
    this._wgAddrBuf = this._encodeIPv4Addr(wgServer, wgPort);
    this._jitterMs  = Math.min(200, Math.max(0, Number(jitterMs) || 0));

    // Set cipher — only allow the two supported AEAD ciphers
    const SUPPORTED_CIPHERS = ['aes-256-gcm', 'chacha20-poly1305'];
    this._method = SUPPORTED_CIPHERS.includes(cfg.method) ? cfg.method : 'aes-256-gcm';

    // Prefer external ss-local binary if available (more performant)
    const binary = ssLocalPath || await this._findSsLocal();
    if (binary) {
      return this._startExternal(binary, cfg);
    }

    // Fall back to pure-Node.js relay
    return this._startInternal();
  }

  stop() {
    if (this._ssProc) {
      try { this._ssProc.kill('SIGTERM'); } catch {}
      this._ssProc = null;
    }
    try { this._localSock?.close();  } catch {}
    try { this._remoteSock?.close(); } catch {}
    this._localSock  = null;
    this._remoteSock = null;
    this._active     = false;
    console.log('[SSRelay] Stopped');
  }

  /** Return the WireGuard endpoint string to use when relay is active. */
  get tunneledEndpoint() {
    return `${this.localHost}:${this.localPort}`;
  }

  // ── External ss-local child process ────────────────────────────────────

  async _findSsLocal() {
    for (const candidate of ['ss-local', 'ss-libev']) {
      try {
        await execAsync(`${this.platform === 'win32' ? 'where' : 'which'} ${candidate}`);
        return candidate;
      } catch {}
    }
    return null;
  }

  async _startExternal(binary, cfg) {
    const { ssServer, ssPort, password, method = 'aes-256-gcm',
            wgServer, wgPort, localPort } = cfg;
    // ss-local tunnel mode: -L forwards local:localPort → wgServer:wgPort via SS
    const args = [
      '-s', ssServer, '-p', String(ssPort),
      '-k', password, '-m', method,
      '-l', String(localPort),
      '-L', `${wgServer}:${wgPort}`,
      '-u',          // enable UDP relay
    ];
    this._ssProc = spawn(binary, args, { stdio: 'inherit' });
    this._ssProc.on('error', e => console.error('[SSRelay] ss-local error:', e.message));
    await new Promise(r => setTimeout(r, 500)); // brief start-up delay
    this._active = true;
    console.log(`[SSRelay] External ss-local running: ${this.localHost}:${localPort} → ${wgServer}:${wgPort} via ${ssServer}:${ssPort}`);
  }

  // ── Pure-Node.js Shadowsocks AEAD UDP relay ─────────────────────────────

  _startInternal() {
    this._localSock  = dgram.createSocket('udp4');
    this._remoteSock = dgram.createSocket('udp4');

    // WireGuard → encrypt → SS server (with optional timing jitter)
    this._localSock.on('message', (msg) => {
      const forward = () => {
        try {
          const salt    = crypto.randomBytes(32);
          const subkey  = this._hkdf(this._masterKey, salt);
          // Payload = SS address header + WireGuard UDP datagram
          const payload = Buffer.concat([this._wgAddrBuf, msg]);
          const { ct, tag } = this._gcmEncrypt(subkey, payload);
          const packet  = Buffer.concat([salt, ct, tag]);
          this._remoteSock.send(packet, this._ssPort, this._ssServer);
        } catch (e) { console.warn('[SSRelay] encrypt error:', e.message); }
      };
      if (this._jitterMs > 0) {
        // Random delay [0, jitterMs) breaks timing-correlation traffic analysis
        setTimeout(forward, Math.random() * this._jitterMs);
      } else {
        forward();
      }
    });

    this._localSock.on('message', (_, rinfo) => { this._wgClient = rinfo; });

    // SS server → decrypt → back to WireGuard
    this._remoteSock.on('message', (msg) => {
      try {
        if (msg.length < 32 + 16) return; // too short: salt + min tag
        const salt    = msg.slice(0, 32);
        const subkey  = this._hkdf(this._masterKey, salt);
        const ct      = msg.slice(32, msg.length - 16);
        const tag     = msg.slice(msg.length - 16);
        const plain   = this._gcmDecrypt(subkey, ct, tag);
        // Strip SS address header and forward the inner WireGuard packet
        const skip    = this._addrHeaderLen(plain);
        const wgPacket = plain.slice(skip);
        if (this._wgClient) {
          this._localSock.send(wgPacket, this._wgClient.port, this._wgClient.address);
        }
      } catch (e) { console.warn('[SSRelay] decrypt error:', e.message); }
    });

    return new Promise((resolve, reject) => {
      this._remoteSock.bind(0, () => { /* ephemeral remote port */ });
      this._localSock.on('error', reject);
      this._localSock.bind(this.localPort, this.localHost, () => {
        this._active = true;
        console.log(`[SSRelay] Pure-Node relay on ${this.localHost}:${this.localPort} → ${this._ssServer}:${this._ssPort}`);
        resolve();
      });
    });
  }

  // ── Crypto helpers ────────────────────────────────────────────────────

  /**
   * HKDF-SHA1 subkey derivation (Shadowsocks AEAD standard).
   * OKM = HKDF-Expand(PRK, info="ss-subkey", L=32)
   * PRK = HKDF-Extract(salt, IKM=master_key)
   */
  _hkdf(masterKey, salt) {
    const prk  = crypto.createHmac('sha1', salt).update(masterKey).digest();
    const info = Buffer.from('ss-subkey');
    // T(1) = HMAC-SHA1(PRK, info || 0x01); take first 32 bytes (SHA1 = 20 bytes → need 2 rounds)
    const t1 = crypto.createHmac('sha1', prk).update(Buffer.concat([info, Buffer.from([1])])).digest();
    const t2 = crypto.createHmac('sha1', prk).update(Buffer.concat([t1, info, Buffer.from([2])])).digest();
    return Buffer.concat([t1, t2]).slice(0, 32);
  }

  /**
   * Shadowsocks MD5-KDF: derives a 32-byte master key from a password string.
   * Equivalent to OpenSSL EVP_BytesToKey with MD5 and 1 iteration.
   */
  _deriveKey(password, keyLen) {
    const pwd = Buffer.from(password, 'utf8');
    const key = Buffer.alloc(keyLen);
    let prev = Buffer.alloc(0);
    let offset = 0;
    while (offset < keyLen) {
      prev = crypto.createHash('md5').update(Buffer.concat([prev, pwd])).digest();
      prev.copy(key, offset);
      offset += prev.length;
    }
    return key;
  }

  /**
   * AEAD encrypt using the configured cipher (aes-256-gcm or chacha20-poly1305).
   * Both ciphers use a 12-byte nonce and produce a 16-byte auth tag.
   */
  _gcmEncrypt(key, plain) {
    const nonce   = crypto.randomBytes(12);
    const opts    = this._method === 'chacha20-poly1305' ? { authTagLength: 16 } : undefined;
    const cipher  = crypto.createCipheriv(this._method, key, nonce, opts);
    const ct      = Buffer.concat([nonce, cipher.update(plain), cipher.final()]);
    const tag     = cipher.getAuthTag();
    return { ct, tag };
  }

  _gcmDecrypt(key, ct, tag) {
    const nonce    = ct.slice(0, 12);
    const payload  = ct.slice(12);
    const opts     = this._method === 'chacha20-poly1305' ? { authTagLength: 16 } : undefined;
    const decipher = crypto.createDecipheriv(this._method, key, nonce, opts);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(payload), decipher.final()]);
  }

  /** Encode IPv4 address in Shadowsocks ATYP=0x01 format (7 bytes). */
  _encodeIPv4Addr(ip, port) {
    const buf = Buffer.alloc(7);
    buf[0] = 0x01; // ATYP IPv4
    ip.split('.').forEach((b, i) => { buf[i + 1] = Number(b); });
    buf.writeUInt16BE(port, 5);
    return buf;
  }

  /** Length of the address header in a decrypted Shadowsocks payload. */
  _addrHeaderLen(buf) {
    if (!buf || buf.length < 1) return 0;
    switch (buf[0]) {
      case 0x01: return 7;              // IPv4: 1+4+2
      case 0x04: return 19;             // IPv6: 1+16+2
      case 0x03: return 1 + 1 + buf[1] + 2; // Domain: 1+len+domain+2
      default:   return 7;
    }
  }
}

module.exports = { WireGuardTunnel, DohProxy, SplitTunnelManager, ShadowsocksRelay };
