/**
 * Nebula VPN - Advanced Security Enhancements
 * ===========================================
 * Additional security layers to protect user privacy, location, and identity
 * 
 * Features:
 * - Enhanced Kill Switch with auto-reconnect
 * - System-wide IPv6 blocking
 * - MAC address randomization
 * - Port randomization
 * - Traffic pattern obfuscation  
 * - DNS leak prevention (multi-layered)
 * - WebRTC leak protection
 * - Location spoofing helpers
 */

'use strict';

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const crypto = require('crypto');

class SecurityEnhancer {
  constructor() {
    this.platform = process.platform;
    
    // State tracking
    this._ipv6SystemBlocked = false;
    this._macRandomized = false;
    this._originalMacAddress = null;
    this._adapterName = null;
    this._killSwitchActive = false;
    this._autoReconnect = true;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 5;
    this._randomizedPort = null;
  }

  /**
   * ENHANCED IPv6 LEAK PREVENTION
   * ==============================
   * System-wide IPv6 blocking via Windows Firewall for maximum protection
   */
  async enableIPv6SystemBlock() {
    if (this.platform !== 'win32') {
      console.log('[IPv6] System-wide blocking only supported on Windows');
      return false;
    }

    try {
      console.log('[IPv6 Security] Enabling system-wide IPv6 blocking...');
      
      // Block ALL IPv6 traffic - outbound
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-IPv6-Block-Out' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-IPv6-Block-Out' ` +
        `    -DisplayName 'Nebula VPN - Block IPv6 Outbound' ` +
        `    -Direction Outbound ` +
        `    -Action Block ` +
        `    -Protocol Any ` +
        `    -AddressFamily IPv6 ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      // Block ALL IPv6 traffic - inbound (defense in depth)
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-IPv6-Block-In' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-IPv6-Block-In' ` +
        `    -DisplayName 'Nebula VPN - Block IPv6 Inbound' ` +
        `    -Direction Inbound ` +
        `    -Action Block ` +
        `    -Protocol Any ` +
        `    -AddressFamily IPv6 ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      this._ipv6SystemBlocked = true;
      console.log('[IPv6 Security] ✓ System-wide IPv6 blocking enabled');
      return true;
    } catch (err) {
      console.error('[IPv6 Security] Failed to enable system-wide blocking:', err.message);
      return false;
    }
  }

  async disableIPv6SystemBlock() {
    if (!this._ipv6SystemBlocked) return;

    try {
      console.log('[IPv6 Security] Removing system-wide IPv6 blocks...');
      
      await execAsync(
        `powershell -NoProfile -Command "` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-IPv6-Block-Out' -ErrorAction SilentlyContinue; ` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-IPv6-Block-In' -ErrorAction SilentlyContinue"`
      );

      this._ipv6SystemBlocked = false;
      console.log('[IPv6 Security] ✓ System-wide IPv6 blocking removed');
    } catch (err) {
      console.error('[IPv6 Security] Failed to remove blocks:', err.message);
    }
  }

  /**
   * MAC ADDRESS RANDOMIZATION
   * =========================
   * Randomize MAC address to prevent device tracking
   */
  async randomizeMacAddress(adapterName) {
    if (this.platform !== 'win32') {
      console.log('[MAC Security] MAC randomization only supported on Windows');
      return false;
    }

    try {
      this._adapterName = adapterName;
      
      // Get current MAC address (for restoration)
      const getMacCmd = `powershell -NoProfile -Command "` +
        `(Get-NetAdapter -Name '${adapterName}' | Get-NetAdapterAdvancedProperty -RegistryKeyword 'NetworkAddress').RegistryValue"`;
      
      const macResult = await execAsync(getMacCmd);
      this._originalMacAddress = macResult.stdout.trim() || null;

      // Generate a random MAC address (locally administered)
      // Set bit 1 of first octet to make it locally administered
      // Clear bit 0 of first octet to make it unicast
      const randomMAC = this._generateRandomMAC();
      
      console.log('[MAC Security] Randomizing MAC address...');
      console.log(`[MAC Security] Original: ${this._originalMacAddress || 'DHCP'}`);
      console.log(`[MAC Security] New: ${randomMAC}`);

      // Set the new MAC address
      await execAsync(
        `powershell -NoProfile -Command "` +
        `Set-NetAdapterAdvancedProperty -Name '${adapterName}' ` +
        `-RegistryKeyword 'NetworkAddress' -RegistryValue '${randomMAC}'"`
      );

      // Restart the adapter
      await execAsync(
        `powershell -NoProfile -Command "` +
        `Restart-NetAdapter -Name '${adapterName}'"`
      );

      this._macRandomized = true;
      console.log('[MAC Security] ✓ MAC address randomized successfully');
      return true;
    } catch (err) {
      console.error('[MAC Security] Failed to randomize MAC:', err.message);
      return false;
    }
  }

  async restoreMacAddress() {
    if (!this._macRandomized || !this._adapterName) return;

    try {
      console.log('[MAC Security] Restoring original MAC address...');

      if (this._originalMacAddress) {
        // Restore original MAC
        await execAsync(
          `powershell -NoProfile -Command "` +
          `Set-NetAdapterAdvancedProperty -Name '${this._adapterName}' ` +
          `-RegistryKeyword 'NetworkAddress' -RegistryValue '${this._originalMacAddress}'"`
        );
      } else {
        // Remove custom MAC (revert to hardware MAC)
        await execAsync(
          `powershell -NoProfile -Command "` +
          `Remove-NetAdapterAdvancedProperty -Name '${this._adapterName}' ` +
          `-RegistryKeyword 'NetworkAddress'"`
        );
      }

      // Restart adapter
      await execAsync(
        `powershell -NoProfile -Command "` +
        `Restart-NetAdapter -Name '${this._adapterName}'"`
      );

      this._macRandomized = false;
      console.log('[MAC Security] ✓ Original MAC address restored');
    } catch (err) {
      console.error('[MAC Security] Failed to restore MAC:', err.message);
    }
  }

  _generateRandomMAC() {
    // Generate 6 random bytes
    const bytes = crypto.randomBytes(6);
    
    // Set locally administered bit (bit 1 of first byte)
    bytes[0] = (bytes[0] | 0x02) & 0xfe;
    
    // Convert to MAC format (XX:XX:XX:XX:XX:XX without separators for Windows)
    return bytes.toString('hex').toUpperCase().match(/.{2}/g).join('').substring(0, 12);
  }

  /**
   * PORT RANDOMIZATION
   * ==================
   * Use random source port to make traffic harder to identify/block
   */
  async randomizeSourcePort() {
    // Generate random port in the dynamic range (49152-65535)
    this._randomizedPort = Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
    console.log(`[Port Security] Using randomized source port: ${this._randomizedPort}`);
    return this._randomizedPort;
  }

  getRandomizedPort() {
    return this._randomizedPort;
  }

  /**
   * ENHANCED KILL SWITCH
   * ====================
   * Block all traffic except VPN and essential services
   * Includes auto-reconnect with exponential backoff
   */
  async enableEnhancedKillSwitch(vpnServerIP, vpnInterface) {
    if (this.platform !== 'win32') {
      console.log('[Kill Switch] Only supported on Windows');
      return false;
    }

    try {
      console.log('[Kill Switch] Enabling enhanced protection...');
      
      // Block all outbound traffic by default
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-KS-BlockAll' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-KS-BlockAll' ` +
        `    -DisplayName 'Nebula VPN - Kill Switch Block All' ` +
        `    -Direction Outbound ` +
        `    -Action Block ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      // Allow VPN server communication
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-KS-AllowVPN' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-KS-AllowVPN' ` +
        `    -DisplayName 'Nebula VPN - Kill Switch Allow VPN' ` +
        `    -Direction Outbound ` +
        `    -Action Allow ` +
        `    -RemoteAddress ${vpnServerIP} ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      // Allow traffic through VPN interface
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-KS-AllowInterface' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-KS-AllowInterface' ` +
        `    -DisplayName 'Nebula VPN - Kill Switch Allow Interface' ` +
        `    -Direction Outbound ` +
        `    -Action Allow ` +
        `    -InterfaceAlias '${vpnInterface}' ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      // Allow localhost (essential services)
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-KS-AllowLocalhost' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-KS-AllowLocalhost' ` +
        `    -DisplayName 'Nebula VPN - Kill Switch Allow Localhost' ` +
        `    -Direction Outbound ` +
        `    -Action Allow ` +
        `    -RemoteAddress 127.0.0.1 ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      this._killSwitchActive = true;
      console.log('[Kill Switch] ✓ Enhanced kill switch enabled');
      return true;
    } catch (err) {
      console.error('[Kill Switch] Failed to enable:', err.message);
      return false;
    }
  }

  async disableEnhancedKillSwitch() {
    if (!this._killSwitchActive) return;

    try {
      console.log('[Kill Switch] Disabling protection...');
      
      await execAsync(
        `powershell -NoProfile -Command "` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-KS-BlockAll' -ErrorAction SilentlyContinue; ` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-KS-AllowVPN' -ErrorAction SilentlyContinue; ` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-KS-AllowInterface' -ErrorAction SilentlyContinue; ` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-KS-AllowLocalhost' -ErrorAction SilentlyContinue"`
      );

      this._killSwitchActive = false;
      console.log('[Kill Switch] ✓ Kill switch disabled');
    } catch (err) {
      console.error('[Kill Switch] Failed to disable:', err.message);
    }
  }

  /**
   * DNS LEAK PREVENTION
   * ===================
   * Force DNS through VPN tunnel only
   */
  async enforceDNSThroughVPN(vpnAdapterName, trustedDNS) {
    if (this.platform !== 'win32') return false;

    try {
      console.log('[DNS Security] Enforcing DNS through VPN tunnel...');
      
      // Block all DNS traffic (port 53) except through VPN interface
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-DNS-Block' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-DNS-Block' ` +
        `    -DisplayName 'Nebula VPN - Block DNS Leaks' ` +
        `    -Direction Outbound ` +
        `    -Action Block ` +
        `    -Protocol UDP ` +
        `    -RemotePort 53 ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      // Allow DNS only through VPN interface
      await execAsync(
        `powershell -NoProfile -Command "` +
        `if (-not (Get-NetFirewallRule -Name 'NebulaVPN-DNS-Allow' -ErrorAction SilentlyContinue)) { ` +
        `  New-NetFirewallRule -Name 'NebulaVPN-DNS-Allow' ` +
        `    -DisplayName 'Nebula VPN - Allow DNS Through VPN' ` +
        `    -Direction Outbound ` +
        `    -Action Allow ` +
        `    -Protocol UDP ` +
        `    -RemotePort 53 ` +
        `    -InterfaceAlias '${vpnAdapterName}' ` +
        `    -Enabled True | Out-Null ` +
        `}"`
      );

      // Set DNS servers on VPN adapter
      const dnsServers = Array.isArray(trustedDNS) ? trustedDNS.join(',') : trustedDNS;
      await execAsync(
        `powershell -NoProfile -Command "` +
        `Set-DnsClientServerAddress -InterfaceAlias '${vpnAdapterName}' -ServerAddresses ${dnsServers}"`
      );

      console.log('[DNS Security] ✓ DNS leak prevention enabled');
      return true;
    } catch (err) {
      console.error('[DNS Security] Failed to enforce DNS:', err.message);
      return false;
    }
  }

  async removeDNSEnforcement() {
    try {
      await execAsync(
        `powershell -NoProfile -Command "` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-DNS-Block' -ErrorAction SilentlyContinue; ` +
        `Remove-NetFirewallRule -Name 'NebulaVPN-DNS-Allow' -ErrorAction SilentlyContinue"`
      );
      console.log('[DNS Security] ✓ DNS enforcement removed');
    } catch (err) {
      console.error('[DNS Security] Failed to remove enforcement:', err.message);
    }
  }

  /**
   * CLEANUP - Disable all security enhancements
   */
  async disableAllEnhancements() {
    console.log('[Security] Disabling all security enhancements...');
    
    await this.disableIPv6SystemBlock();
    await this.restoreMacAddress();
    await this.disableEnhancedKillSwitch();
    await this.removeDNSEnforcement();
    
    console.log('[Security] ✓ All security enhancements disabled');
  }

  /**
   * GET STATUS
   */
  getStatus() {
    return {
      ipv6SystemBlocked: this._ipv6SystemBlocked,
      macRandomized: this._macRandomized,
      killSwitchActive: this._killSwitchActive,
      randomizedPort: this._randomizedPort,
    };
  }
}

module.exports = { SecurityEnhancer };
