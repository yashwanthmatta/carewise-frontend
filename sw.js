const CAREWISE_CACHE = "carewise-shell-v131";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=carewise-product-131",
  "/script.js?v=carewise-product-131",
  "/manifest.webmanifest?v=carewise-product-131",
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

  // Pages are network-first so an update shows on the next visit; the saved
  // copy is only used offline. Versioned files (script.js?v=...) stay cache-first.
  if (event.request.mode === "navigate" || requestUrl.pathname === "/" || requestUrl.pathname === "/index.html") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response.ok) return caches.match("/index.html").then((cached) => cached || response);
          const copy = response.clone();
          caches.open(CAREWISE_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html").then((cached) => cached || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
