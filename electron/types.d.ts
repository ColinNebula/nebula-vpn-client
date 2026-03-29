// TypeScript declarations for Electron VPN tunnel module

import { App } from 'electron';

export interface WireGuardConfig {
  serverPublicKey: string;
  serverEndpoint: string;
  assignedIP: string;
  dns: string | string[];
  presharedKey?: string | null;
  enableKillSwitch?: boolean;
  splitTunnelApps?: any[];
  dohUrl?: string;
  dohMode?: 'doh' | 'dot';
  dotHost?: string;
  dotPort?: number;
  obfuscation?: any;
}

export interface VPNConnectionResult {
  publicKey: string;
  assignedIP: string;
  tunnelVerified?: boolean;
  verificationMethod?: string;
  verification?: {
    verified: boolean;
    lastHandshakeAt: string;
    ageSeconds: number;
    devMode: boolean;
  };
}

export interface VPNStatusResponse {
  connected: boolean;
  ip?: string;
  server?: string;
  tunnelVerified?: boolean;
  verificationMethod?: string | null;
  verification?: any | null;
}

// Augment Electron's App interface
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}
