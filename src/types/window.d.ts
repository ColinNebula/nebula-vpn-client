// TypeScript declarations for Window object extensions

interface ElectronVPNAPI {
  connect: (config: any) => Promise<any>;
  disconnect: (config?: any) => Promise<any>;
  getStatus: () => Promise<any>;
  [key: string]: any;
}

interface ElectronAPI {
  vpn?: ElectronVPNAPI;
  isElectron?: boolean;
  DEBUG_PRELOAD_LOADED?: boolean;
  DEBUG_TIMESTAMP?: string;
  [key: string]: any;
}

interface NebulaVPNAPI {
  vpn?: ElectronVPNAPI;
  minimal?: boolean;
  [key: string]: any;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
    nebulaVPN?: NebulaVPNAPI;
    __oauthError?: string;
    analyticsSubTab?: string;
    securitySubTab?: string;
    automationSubTab?: string;
    experienceSubTab?: string;
    enterpriseSubTab?: string;
    aiSubTab?: string;
    nextgenSubTab?: string;
    trustSubTab?: string;
  }
}

export {};
