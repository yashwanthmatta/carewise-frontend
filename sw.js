const CAREWISE_CACHE = "carewise-shell-v99";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=carewise-product-99",
  "/script.js?v=carewise-product-99",
  "/manifest.webmanifest?v=carewise-product-99",
  "/legal/privacy.html",
  "/legal/terms.html",
  "/legal/disclaimer.html",
  "/legal/data-deletion.html",
  "/legal/app-store-disclosures.html",
  "/assets/carewise-logo.svg",
  "/assets/carewise-app-icon.svg",
  "/disease_precaution_diet_matrix.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CAREWISE_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CAREWISE_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith("/auth") || requestUrl.pathname.startsWith("/reports") || requestUrl.pathname.startsWith("/patients")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
