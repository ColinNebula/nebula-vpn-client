/**
 * Nebula VPN — Post-Quantum Cryptography Handshake Wrapper
 * =========================================================
 * Implements a hybrid classical + post-quantum key exchange for the
 * WireGuard Pre-Shared Key (PSK) layer, following NIST FIPS 203 ML-KEM-768.
 *
 *  KEY AGREEMENT PROTOCOL
 *  ──────────────────────
 *  1.  Client generates ML-KEM-768 keypair:  (encapKey, decapKey)
 *  2.  Client sends encapKey to the server alongside the WireGuard pubkey.
 *  3.  Server:  { ciphertext, sharedSecret } = ML_KEM_768.Encapsulate(encapKey)
 *              Returns ciphertext to client.
 *  4.  Client: sharedSecret = ML_KEM_768.Decapsulate(ciphertext, decapKey)
 *  5.  Both sides derive the same hybrid PSK:
 *        hybridPSK = HKDF-SHA256(ikm = sharedSecret,
 *                                salt = wgClientPublicKey,
 *                                info = "nebula-pqc-v1")
 *  6.  hybridPSK is written into WireGuard [Peer] PresharedKey.
 *
 *  SECURITY PROPERTIES
 *  ───────────────────
 *  • Classic (X25519) and PQ (ML-KEM-768) paths are independent.
 *    Breaking either alone does NOT compromise the session key.
 *  • ML-KEM-768 → NIST Level 3 (~AES-192 classical / 186-bit quantum).
 *  • Protects against "harvest-now, decrypt-later" quantum attacks on
 *    today's recorded WireGuard handshakes.
 *  • Graceful degradation: if @noble/post-quantum is not installed,
 *    the connect() flow continues without a PSK (same as before this PR).
 *
 *  DEPENDENCY
 *  ──────────
 *  npm install @noble/post-quantum
 *  https://github.com/paulmillr/noble-post-quantum
 *  Audited pure-JS FIPS 203/204/205 implementation by Paul Miller.
 */

'use strict';

const crypto = require('crypto');

// ─── HKDF-SHA256 (RFC 5869, one-block expand) ────────────────────────────────

function hkdfSha256(ikm, salt, info) {
  // Extract phase: PRK = HMAC-SHA256(salt, IKM)
  const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
  // Expand phase: T(1) = HMAC-SHA256(PRK, info || 0x01)
  // One block (32 bytes) is sufficient since len ≤ 32.
  return crypto
    .createHmac('sha256', prk)
    .update(Buffer.concat([Buffer.from(info), Buffer.from([1])]))
    .digest();
}

// ─── ML-KEM-768 loader ───────────────────────────────────────────────────────

let _mlkem768 = undefined; // undefined = not yet attempted; null = unavailable

function loadMlKem768() {
  if (_mlkem768 !== undefined) return _mlkem768;
  try {
    // @noble/post-quantum ships CommonJS and ESM exports.
    // CJS require path works in Electron main process.
    ({ ml_kem768: _mlkem768 } = require('@noble/post-quantum/ml-kem'));
    console.log('[PQC] Loaded @noble/post-quantum ml_kem768 (FIPS 203)');
  } catch {
    _mlkem768 = null;
    console.warn(
      '[PQC] @noble/post-quantum not installed — PQC PSK layer disabled.\n' +
      '      Run: npm install @noble/post-quantum  then restart.'
    );
  }
  return _mlkem768;
}

// ─── PqcHandshake ─────────────────────────────────────────────────────────────

class PqcHandshake {
  constructor() {
    this._decapKey = null;   // ML-KEM-768 decapsulation key (private, secret key)
    this._encapKey = null;   // ML-KEM-768 encapsulation key (public key)
    this._mlkem    = null;   // loaded library reference
  }

  /** True when @noble/post-quantum is importable and PQC is available. */
  get available() {
    return loadMlKem768() !== null;
  }

  /**
   * Generate an ML-KEM-768 keypair.
   * The encapsulation key (public) is returned as base64 for transmission to the server.
   *
   * @returns {{ encapKeyB64: string }} — base64-encoded 1184-byte encapsulation key
   * @throws  Error if @noble/post-quantum is not installed
   */
  generateKeypair() {
    const mlkem = loadMlKem768();
    if (!mlkem) {
      throw new Error(
        '[PQC] Cannot generate keypair: @noble/post-quantum is not installed.\n' +
        'Run: npm install @noble/post-quantum'
      );
    }
    this._mlkem = mlkem;
    const { publicKey, secretKey } = mlkem.keygen();
    this._encapKey = publicKey;   // Uint8Array(1184)
    this._decapKey = secretKey;   // Uint8Array(2400)
    return { encapKeyB64: Buffer.from(publicKey).toString('base64') };
  }

  /**
   * Decapsulate the server's ML-KEM ciphertext and derive the 32-byte hybrid PSK.
   *
   * The hybrid PSK is suitable for use as a WireGuard [Peer] PresharedKey.
   * Both sides (client and server) compute the same value independently.
   *
   * @param {string} pqcCiphertextB64  — base64 ML-KEM-768 ciphertext from server (1088 bytes raw)
   * @param {string} wgClientPublicKey — base64 WireGuard X25519 client public key (salt)
   * @returns {string} hybridPSK — base64-encoded 32-byte WireGuard PresharedKey
   * @throws  Error if keypair not generated or library unavailable
   */
  deriveHybridPSK(pqcCiphertextB64, wgClientPublicKey) {
    if (!this._mlkem || !this._decapKey) {
      throw new Error('[PQC] Keypair not generated — call generateKeypair() first');
    }

    const ciphertext  = Uint8Array.from(Buffer.from(pqcCiphertextB64, 'base64'));
    const sharedSecret = this._mlkem.decapsulate(ciphertext, this._decapKey);

    // Mix in the WireGuard X25519 public key as HKDF salt so that the PSK
    // is unique per-session even if the same ML-KEM keypair is reused.
    const psk = hkdfSha256(
      Buffer.from(sharedSecret),
      Buffer.from(wgClientPublicKey, 'base64'),
      'nebula-pqc-v1'
    );

    return psk.toString('base64');
  }

  /**
   * Securely erase the decapsulation key from memory.
   * Call immediately after deriveHybridPSK() — the secret key is no longer needed.
   */
  wipe() {
    if (this._decapKey) {
      // Best-effort zeroisation — JS does not guarantee GC timing or memory layout,
      // but filling the buffer prevents casual inspection if the object persists.
      try { this._decapKey.fill(0); } catch {}
      this._decapKey = null;
    }
    this._encapKey = null;
    this._mlkem    = null;
  }
}

module.exports = PqcHandshake;
