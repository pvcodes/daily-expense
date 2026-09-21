const CACHE = "expense-tracker-v4";
// App shell only. Do NOT precache "/" — it 307-redirects to /login when
// unauthenticated and cache.addAll rejects non-200, failing install.
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const TXN_PATH = "/api/transactions";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for the transactions API: fresh data when online (cached for
// next time), last-known data tagged X-Offline when the fetch fails. Non-GET
// requests always pass through untouched. This is the app's offline read path.
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.status === 200) {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-Offline", "1");
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "X-Offline": "1" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // Transactions API: network-first with cache fallback.
  if (url.pathname === TXN_PATH) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Don't cache other API routes.
  if (url.pathname.startsWith("/api")) return;

  // Network-first for navigations so users always get fresh HTML when online
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});