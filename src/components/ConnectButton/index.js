import React from 'react';
import './ConnectButton.css';

const ConnectButton = ({ isConnected, onToggle, disabled = false, connectionState, isElectron = false }) => {
  const isSimulated = connectionState === 'simulated';

  return (
    <button 
      className={`connect-button ${isConnected ? 'connected' : 'disconnected'}`}
      onClick={onToggle}
      disabled={disabled}
    >
      {isConnected ? (isSimulated ? 'Stop Simulation' : 'Disconnect') : (isElectron ? 'Connect' : 'Simulate VPN')}
    </button>
  );
};

export default ConnectButton;