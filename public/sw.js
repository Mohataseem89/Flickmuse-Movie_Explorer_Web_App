const VERSION = "flickmuse-v2";

const SHELL = `${VERSION}-shell`;
const IMAGES = `${VERSION}-tmdb-images`;

const SHELL_ASSETS = [
  "/",
  "/site.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/og-flickmuse.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("flickmuse-") &&
              key !== SHELL &&
              key !== IMAGES
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  while (keys.length > max) {
    await cache.delete(keys.shift());
  }
}

function isFresh(response, maxAgeMs) {
  const date = response?.headers.get("date");
  return !date || Date.now() - new Date(date).getTime() < maxAgeMs;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // API responses must always come from the network.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Vite emits content-hashed JS/CSS chunks under /assets/.
  // Do not put them behind a service-worker cache. A stale service worker can
  // otherwise keep an old application shell alive after a deployment and make
  // that shell request chunks that no longer exist.
  if (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/assets/")
  ) {
    return;
  }

  if (url.hostname === "image.tmdb.org") {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const cached = await cache.match(request);

        if (cached && !isFresh(cached, 7 * 24 * 60 * 60 * 1000)) {
          await cache.delete(request);
        }

        const freshCached =
          cached && isFresh(cached, 7 * 24 * 60 * 60 * 1000)
            ? cached
            : null;

        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
              trim(IMAGES, 60);
            }

            return response;
          })
          .catch(() => freshCached);

        return freshCached || network;
      })
    );

    return;
  }

  // Always prefer the current deployed HTML for navigations. The cached root
  // remains only as an offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(SHELL).then((cache) => cache.put("/", response.clone()));
          }

          return response;
        })
        .catch(() => caches.match("/"))
    );

    return;
  }

  // Cache-first is safe for the small, stable PWA shell files above, but not
  // for Vite's deployment-specific /assets/ chunks (explicitly excluded).
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
