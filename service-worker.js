// service-worker.js
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('financas-cache-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/app.js', // Include the new app.js file
                'https://cdn.tailwindcss.com',
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
                'https://cdn.jsdelivr.net/npm/chart.js',
                'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
                'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
                'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
