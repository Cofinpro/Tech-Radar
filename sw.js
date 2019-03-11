self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open('tech-radar').then(function (cache) {
            return cache.addAll([
                'index.html',
                'd3.min.js',
                'tech-radar.js',
                'style.css',
                'tech/radar.json',
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
