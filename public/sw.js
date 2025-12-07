// public/sw.js

const CACHE_NAME = "nebula-gpa-cache-v1";

const STATIC_ASSETS = [
    "/",
    "/manifest.json",
    "/logo192.png",
    "/logo512.png",
];

// Install — cache essential static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch — static: cache-first, dynamic: network-first
self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip Supabase and Next.js API routes — never cache them
    if (url.pathname.startsWith("/api") || url.href.includes("supabase")) {
        return;
    }

    // If static asset → use cache-first
    if (STATIC_ASSETS.includes(url.pathname)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, response.clone());
                    });
                    return response;
                });
            })
        );
        return;
    }

    // All other GET requests → network-first fallback
    if (request.method === "GET") {
        event.respondWith(
            fetch(request)
                .then((response) => response)
                .catch(() => caches.match(request))
        );
    }
});
