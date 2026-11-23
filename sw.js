const CACHE_NAME = "clara-cache-v43";
const RUNTIME_CACHE = "clara-runtime";
const MAX_RUNTIME_BYTES = 150 * 1024;
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./claramente.html",
  "./claramente.css",
  "./claramente.js",
  "./shell-router.js",
  "./clara-core.js",
  "./clara-store.js",
  "./clara-exchange.js",
  "./clara-sw-register.js",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    const url = new URL(event.request.url);
    const fallbackAsset = url.pathname.endsWith("/claramente.html") ? "./claramente.html" : "./index.html";
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(fallbackAsset, responseCopy);
          });
          return response;
        })
        .catch(() => caches.match(fallbackAsset))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        rememberRuntime(event.request, response.clone());
        return response;
      }).catch(() => {
        return new Response("", { status: 503, statusText: "Offline" });
      });
    })
  );
});

function rememberRuntime(request, response) {
  if (request.method !== "GET" || !response || !response.ok || response.type !== "basic") return;
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_RUNTIME_BYTES) return;
  response.arrayBuffer().then(async (buffer) => {
    if (buffer.byteLength > MAX_RUNTIME_BYTES) return;
    try {
      if (self.navigator && self.navigator.storage && self.navigator.storage.estimate) {
        const estimate = await self.navigator.storage.estimate();
        if (estimate.quota && estimate.usage / estimate.quota > 0.8) {
          await caches.delete(RUNTIME_CACHE);
        }
      }
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, new Response(buffer, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }));
    } catch (error) {
      return;
    }
  }).catch(() => {});
}
