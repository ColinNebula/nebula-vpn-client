import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Suppress errors injected by browser extensions (e.g. MetaMask) into the
// Electron Chromium context — they are not our code and must not crash the app.
// Use capture phase (true) so these handlers fire before CRA's dev error overlay.
const isExtensionError = (filename, message, stack) => {
  return (
    (filename && filename.startsWith('chrome-extension://')) ||
    (stack && stack.includes('chrome-extension://')) ||
    (message && (
      message.includes('Failed to connect to MetaMask') ||
      message.includes('Could not establish connection') ||
      message.includes('Receiving end does not exist') ||
      message.includes('Extension context invalidated')
    ))
  );
};

window.addEventListener('error', (event) => {
  if (isExtensionError(event.filename, event.message, event.error?.stack)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || '';
  const stack = event.reason?.stack || '';
  if (isExtensionError(null, message, stack)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
