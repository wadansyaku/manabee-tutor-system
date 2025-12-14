// Manabee Tutor System - Service Worker
const CACHE_NAME = 'manabee-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Network first, cache fallback strategy
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip Firebase and external requests
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/__/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response to store in cache
                const responseClone = response.clone();

                // Only cache successful responses
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-questions') {
        event.waitUntil(syncOfflineQuestions());
    } else if (event.tag === 'sync-reflections') {
        event.waitUntil(syncOfflineReflections());
    }
});

// Sync offline questions to server
async function syncOfflineQuestions() {
    console.log('[SW] Syncing offline questions');

    try {
        const db = await openIndexedDB();
        const questions = await getOfflineData(db, 'offline-questions');

        for (const question of questions) {
            try {
                // Post to Firestore (assumes Firebase is initialized)
                const response = await fetch('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(question)
                });

                if (response.ok) {
                    await deleteOfflineData(db, 'offline-questions', question.id);
                    console.log(`[SW] Synced question ${question.id}`);
                }
            } catch (error) {
                console.error(`[SW] Failed to sync question ${question.id}:`, error);
            }
        }
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Sync offline reflections
async function syncOfflineReflections() {
    console.log('[SW] Syncing offline reflections');
    // Similar implementation for reflections
}

// IndexedDB helpers
function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('manabee-offline', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('offline-questions')) {
                db.createObjectStore('offline-questions', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('offline-reflections')) {
                db.createObjectStore('offline-reflections', { keyPath: 'id' });
            }
        };
    });
}

function getOfflineData(db, storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

function deleteOfflineData(db, storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// Helper to store offline data (can be called from main app via postMessage)
self.addEventListener('message', (event) => {
    if (event.data.type === 'STORE_OFFLINE_QUESTION') {
        storeOfflineQuestion(event.data.question);
    } else if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

async function storeOfflineQuestion(question) {
    try {
        const db = await openIndexedDB();
        const tx = db.transaction('offline-questions', 'readwrite');
        const store = tx.objectStore('offline-questions');

        await new Promise((resolve, reject) => {
            const request = store.put(question);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });

        console.log('[SW] Stored offline question:', question.id);

        // Register for sync when online
        if ('sync' in self.registration) {
            await self.registration.sync.register('sync-questions');
        }
    } catch (error) {
        console.error('[SW] Failed to store offline question:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'Manabeeからのお知らせ',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: '開く' },
            { action: 'close', title: '閉じる' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Manabee', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Focus existing window if available
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Open new window
            return self.clients.openWindow(url);
        })
    );
});
