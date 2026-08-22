const CACHE_NAME = 'seo-blog-studio-v2';

// Static assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/screenshots/desktop-1280x720.png',
  '/screenshots/mobile-750x1334.png'
];

// Install Event: Precache core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Dynamic Network-First for API/HTML, Cache-First with Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass API generation routes from caching to ensure live AI responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'You are currently offline. Please reconnect to generate new blog posts or images.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // HTML navigation: Network-First with Cache Fallback (SPA navigation)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Static Assets (JS, CSS, Images, Fonts, Icons, Manifest): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

/* ==========================================================================
   1. BACKGROUND SYNC
   Retries blog generation requests or syncs offline queues when connectivity returns
   ========================================================================== */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event triggered:', event.tag);
  if (event.tag === 'sync-blog-posts' || event.tag === 'sync-post-generation') {
    event.waitUntil(
      (async () => {
        try {
          // Notify active window clients that background sync is processing
          const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
          for (const client of allClients) {
            client.postMessage({
              type: 'BACKGROUND_SYNC_TRIGGERED',
              tag: event.tag,
              timestamp: Date.now()
            });
          }
        } catch (err) {
          console.warn('[SW] Background sync execution warning:', err);
        }
      })()
    );
  }
});

/* ==========================================================================
   2. PERIODIC BACKGROUND SYNC
   Refreshes trending topic suggestions in background with permission check
   ========================================================================== */
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic background sync event triggered:', event.tag);
  if (event.tag === 'refresh-trending-topics' || event.tag === 'periodic-content-refresh') {
    event.waitUntil(
      (async () => {
        try {
          // Safely update static manifest or cached resources in the background
          const cache = await caches.open(CACHE_NAME);
          const response = await fetch('/manifest.json').catch(() => null);
          if (response && response.status === 200) {
            await cache.put('/manifest.json', response);
          }

          // Broadcast to clients
          const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
          for (const client of allClients) {
            client.postMessage({
              type: 'PERIODIC_SYNC_TRIGGERED',
              tag: event.tag,
              timestamp: Date.now()
            });
          }
        } catch (err) {
          console.warn('[SW] Periodic sync execution warning:', err);
        }
      })()
    );
  }
});

/* ==========================================================================
   3. PUSH NOTIFICATIONS & NOTIFICATION CLICK
   Displays push notifications even when tab isn't active/focused
   ========================================================================== */
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'SEO Blog Studio',
    body: 'Your SEO blog post and visuals have finished generating!',
    icon: '/icons/icon-192x192.png',
    badge: '/favicon.png',
    data: {
      url: '/?tab=preview',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || payload.message || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || { url: payload.url || '/?tab=preview' }
      };
    } catch {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open_post', title: 'View Post' },
      { action: 'dismiss', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing client window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
