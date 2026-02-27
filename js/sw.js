/* ========================================
   Eco Innovation - Service Worker
   ======================================== */

const CACHE_NAME = 'eco-innovation-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/detect.html',
  '/history.html',
  '/map.html',
  '/manifest.json',
  '/css/style.css',
  '/css/responsive.css',
  '/css/animations.css',
  '/js/utils.js',
  '/js/app.js',
  '/js/camera.js',
  '/js/detection.js',
  '/js/db.js',
  '/js/history.js',
  '/js/map.js',
  '/js/firebase-config.js',
  '/data/waste-database.json'
];

/**
 * Install event - cache resources
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell...');
        return cache.addAll(URLS_TO_CACHE.filter(url => {
          // Don't cache files that might not exist
          return !url.includes('map') || url === '/map.html';
        }))
          .catch((error) => {
            console.log('Cache addAll error (some files may not exist):', error);
          });
      })
  );

  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );

  self.clients.claim();
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external API requests (like Google Maps)
  if (event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('firebase.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the new response for future use (only HTML, CSS, JS)
            if (shouldCache(event.request.url)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Offline - return cached response or offline page
            return caches.match(event.request)
              .then((response) => {
                if (response) {
                  return response;
                }

                // Return offline page for navigation requests
                if (event.request.headers.get('accept').includes('text/html')) {
                  return caches.match('/index.html');
                }

                return new Response('Offline - Resource not available', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'text/plain'
                  })
                });
              });
          });
      })
  );
});

/**
 * Determine if URL should be cached
 */
function shouldCache(url) {
  return url.includes('.js') ||
    url.includes('.css') ||
    url.includes('.json') ||
    url.includes('.html') ||
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.svg');
}

/**
 * Background sync for offline data
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scans') {
    event.waitUntil(syncScans());
  }
});

/**
 * Sync scans when online
 */
async function syncScans() {
  try {
    // This would sync offline scans to Firebase
    // Implementation would go here
    console.log('Syncing scans...');
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

/**
 * Push notifications
 */
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/manifest.json',
    badge: '/manifest.json',
    tag: 'eco-innovation',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification click
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if window already exists
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }

        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

console.log('Service Worker loaded');
