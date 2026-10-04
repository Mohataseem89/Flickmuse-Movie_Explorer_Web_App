const VERSION = "flickmuse-v1";

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
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(SHELL_ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (k) =>
              k.startsWith("flickmuse-") &&
              k !== SHELL &&
              k !== IMAGES
          )
          .map((k) => caches.delete(k))
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

  return (
    !date ||
    Date.now() - new Date(date).getTime() < maxAgeMs
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Never cache API requests.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // TMDB image caching
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const cached = await cache.match(request);

        if (
          cached &&
          !isFresh(
            cached,
            7 * 24 * 60 * 60 * 1000
          )
        ) {
          await cache.delete(request);
        }

        const freshCached =
          cached &&
          isFresh(
            cached,
            7 * 24 * 60 * 60 * 1000
          )
            ? cached
            : null;

        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(
                request,
                response.clone()
              );

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

  // Navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();

          caches
            .open(SHELL)
            .then((cache) => cache.put("/", copy));

          return response;
        })
        .catch(() => caches.match("/"))
    );

    return;
  }

  // Same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches
        .match(request)
        .then(
          (cached) =>
            cached || fetch(request)
        )
    );
  }
});