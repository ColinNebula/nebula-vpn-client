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

reportWebVitals();

// ── Service Worker registration with update prompt ────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // A new SW is installed and waiting — prompt the user
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              const banner = document.createElement('div');
              banner.id = 'sw-update-banner';
              Object.assign(banner.style, {
                position: 'fixed',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1a1a2e',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: '99999',
                fontSize: '14px',
                fontFamily: 'sans-serif',
              });

              const msg = document.createElement('span');
              msg.textContent = '🚀 A new version of Nebula VPN is available.';

              const btn = document.createElement('button');
              btn.textContent = 'Update now';
              Object.assign(btn.style, {
                background: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: '600',
              });

              btn.addEventListener('click', () => {
                // Tell the waiting SW to take over immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                banner.remove();
              });

              banner.appendChild(msg);
              banner.appendChild(btn);
              document.body.appendChild(banner);
            }
          });
        });

        // When the new SW takes over, reload to get the fresh assets
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      })
      .catch((err) => console.error('SW registration failed:', err));
  });
}
