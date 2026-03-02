// FieldKit Pro Service Worker — Offline-capable PWA
// Caches tool pages so field engineers can look up fault codes without signal

const CACHE_VERSION = "fieldkit-v3";
const PRECACHE_URLS = [
  "/dashboard",
  "/dashboard/ppcl",
  "/dashboard/ppcl/reference",
  "/dashboard/ppcl/errors",
  "/dashboard/ppcl/analyzer",
  "/dashboard/drives/abb",
  "/dashboard/drives/yaskawa",
  "/dashboard/loop-tuning",
  "/dashboard/psychrometrics",
  "/dashboard/conversions",
  "/dashboard/bacnet",
  "/dashboard/settings",
  "/offline.html",
];

// Routes that should NEVER be cached (auth, API, Supabase)
const NO_CACHE_PATTERNS = [
  /^\/api\//,
  /^\/login/,
  /^\/signup/,
  /supabase/,
  /\/auth\//,
];

// ---- Install: precache key pages ----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ---- Activate: clean old caches ----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => clients.claim())
  );
});

// ---- Fetch: smart caching strategy ----
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Never cache auth routes or API calls
  if (NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) return;

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first for navigation (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Offline: try cache, then fallback page
          caches.match(request).then((cached) => cached || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Network-first for everything else (_next/data JSON, etc.)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
