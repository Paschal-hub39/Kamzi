const CACHE_NAME = 'kamzi-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/kamzi-icon-72.png',
  '/icons/kamzi-icon-96.png',
  '/icons/kamzi-icon-128.png',
  '/icons/kamzi-icon-144.png',
  '/icons/kamzi-icon-152.png',
  '/icons/kamzi-icon-192.png',
  '/icons/kamzi-icon-384.png',
  '/icons/kamzi-icon-512.png',
  '/icons/kamzi-maskable-192.png',
  '/icons/kamzi-maskable-512.png'
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch — cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase API calls — network only
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(fetch(request));
    return;
  }

  // API calls — network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  const db = await openDB('kamzi-offline', 1);
  const messages = await db.getAll('pendingMessages');
  
  for (const msg of messages) {
    try {
      // Attempt to send via Firebase
      await fetch('/api/send-message', {
        method: 'POST',
        body: JSON.stringify(msg),
        headers: { 'Content-Type': 'application/json' }
      });
      await db.delete('pendingMessages', msg.id);
    } catch (err) {
      console.error('Sync failed for message:', msg.id);
    }
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Kamzi', {
      body: data.body || 'New message',
      icon: '/icons/kamzi-icon-192.png',
      badge: '/icons/kamzi-icon-72.png',
      tag: data.tag || 'kamzi-message',
      data: data.payload || {},
      actions: [
        { action: 'reply', title: 'Reply' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: true
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, notification } = event;
  const data = notification.data || {};
  
  if (action === 'reply') {
    // Open chat with reply focus
    event.waitUntil(
      clients.openWindow(`/?chat=${data.chatId}&action=reply`)
    );
  } else {
    // Just open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
          clientList[0].postMessage({
            type: 'navigate',
            chatId: data.chatId
          });
        } else {
          clients.openWindow('/?chat=' + data.chatId);
        }
      })
    );
  }
});

// IndexedDB helper for offline storage
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id' });
      }
    };
  });
}

