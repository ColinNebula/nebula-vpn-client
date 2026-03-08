// Bump this version string on every deploy — it forces the SW to update.
const CACHE_VERSION = 'nebula-vpn-v1.0.2';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE_URLS = [
  '/manifest.json',
  '/logo.svg',
];

// ── Install: pre-cache only minimal shell assets ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
    // Do NOT call skipWaiting here — we wait for the user to accept the update.
  );
});

// ── Activate: delete every cache from previous versions ──────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Message: UI sends SKIP_WAITING after user accepts the update ──────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: network-first for HTML navigation; cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigation (ensures new deploys are picked up)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Cache-first for versioned static assets (/static/...)
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for everything else (API calls, etc.) — fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'vpn-reconnect') {
    event.waitUntil(handleVPNReconnect());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'VPN status update',
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open VPN Client',
        icon: '/logo.svg'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/logo.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Nebula VPN', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for VPN reconnection
async function handleVPNReconnect() {
  try {
    // Attempt to reconnect VPN
    console.log('Attempting VPN reconnect in background');
    // This would typically communicate with your VPN service
  } catch (error) {
    console.error('Background VPN reconnect failed:', error);
  }
}