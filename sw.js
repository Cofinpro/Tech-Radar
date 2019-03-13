const CACHE_NAME="tech-radar-v5";

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (CACHE_NAME !== cacheName && cacheName.startsWith("tech-radar")) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll([
                'index.html',
                'd3.min.js',
                'tech-radar.js',
                'style.css',
                'tech/radar.json',
                'img/logo_cofinpro.svg'
            ]);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});
