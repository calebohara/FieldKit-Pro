// FieldKit Pro Service Worker — minimal for PWA "Add to Home Screen" support
// Full offline caching will come in v1.3

const CACHE_NAME = "fieldkit-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network-first strategy — pass through to network
  // Offline caching will be added in v1.3
  event.respondWith(fetch(event.request));
});
