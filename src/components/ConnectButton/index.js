import React from 'react';
import './ConnectButton.css';

const ConnectButton = ({ isConnected, onToggle, disabled = false }) => {
  return (
    <button 
      className={`connect-button ${isConnected ? 'connected' : 'disconnected'}`}
      onClick={onToggle}
      disabled={disabled}
    >
      {isConnected ? 'Disconnect' : 'Connect'}
    </button>
  );
};

export default ConnectButton;