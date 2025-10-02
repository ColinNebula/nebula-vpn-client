import { NativeModules } from 'react-native';
const { VPNModule } = NativeModules;

export const connectVPN = (config) => VPNModule.connect(config);
export const disconnectVPN = () => VPNModule.disconnect();
export const getStatus = () => VPNModule.getStatus();