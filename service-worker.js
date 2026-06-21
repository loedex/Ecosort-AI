// ──────────────────────────────────────────────
// EcoSort AI — Service Worker
// Handles caching for offline support
// ──────────────────────────────────────────────

const CACHE_NAME = 'ecosort-ai-v2';
const OFFLINE_URL   = '/index.html';

// Files to cache on install
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/stats.html',
    '/map.html',
    '/how-it-works.html',
    '/css/style.css',
    '/css/map.css',
    '/js/app.js',
    '/js/camera.js',
    '/js/pwa.js',
    '/js/stats.js',
    '/js/map.js',
    '/assets/waste-data.js',
    '/data/centers.json',
    '/images/hero-image.png',
    '/images/icon-192.png',
    '/images/icon-512.png',
    '/model/model.json',
    '/model/group1-shard1of3.bin',
    '/model/group1-shard2of3.bin',
    '/model/group1-shard3of3.bin',
    '/model/class_labels.json',
];

// ── Install Event ────────────────────────────────
// Triggered when service worker is first installed
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching app files...');
                // Cache files one by one
                // so one failure doesn't break everything
                return Promise.allSettled(
                    FILES_TO_CACHE.map(url =>
                        cache.add(url).catch(err => {
                            console.warn(
                                `⚠️ Failed to cache: ${url}`, err
                            );
                        })
                    )
                );
            })
            .then(() => {
                console.log('✅ App files cached!');
                // Activate immediately without waiting
                return self.skipWaiting();
            })
    );
});

// ── Activate Event ───────────────────────────────
// Triggered when service worker takes control
self.addEventListener('activate', event => {
    console.log('✅ Service Worker activated!');

    event.waitUntil(
        // Delete old caches from previous versions
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log(`🗑️ Deleting old cache: ${name}`);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// ── Fetch Event ──────────────────────────────────
// Intercepts every network request
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome extension requests
    if (event.request.url.startsWith('chrome-extension')) return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {

                // ── Cache Hit → Return cached version ──
                if (cachedResponse) {
                    return cachedResponse;
                }

                // ── Cache Miss → Fetch from network ────
                return fetch(event.request)
                    .then(networkResponse => {
                        // Only cache successful responses
                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === 'basic'
                        ) {
                            // Clone because response can only be used once
                            const responseToCache =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(
                                        event.request,
                                        responseToCache
                                    );
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed → show offline page
                        if (event.request.destination === 'document') {
                            return caches.match(OFFLINE_URL);
                        }
                    });
            })
    );
});