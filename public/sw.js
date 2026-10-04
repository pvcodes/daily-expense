const CACHE = "expense-tracker-v6";
// App shell only. Do NOT precache "/" — it 307-redirects to /login when
// unauthenticated and cache.addAll rejects non-200, failing install.
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const TXN_PATH = "/api/transactions";

// Caches below are per-browser, not per-user: whoever signs in last sees them
// offline. The app therefore purges Cache Storage on login and logout
// (see purgeUserScopedState in lib/storage.ts). Bump CACHE on any change that
// could serve another user's stored data.

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

// Serve the last ledger immediately, then revalidate it. This keeps the UI
// responsive on repeat visits while still syncing fresh data in the background.
async function ledgerStaleWhileRevalidate(req, clientId) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const update = fetch(req)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Ledger request failed (${res.status})`);
      const copy = res.clone();
      await cache.put(req, copy.clone());
      if (cached && clientId) {
        const client = await self.clients.get(clientId);
        if (client) {
          const body = await copy.json();
          client.postMessage({ type: "TRANSACTIONS_UPDATED", transactions: body.transactions });
        }
      }
      return res;
    })
    .catch(async () => {
      if (cached && clientId) {
        const client = await self.clients.get(clientId);
        if (client) client.postMessage({ type: "TRANSACTIONS_SYNC_FAILED" });
      }
      return null;
    });

  if (cached) {
    // Keep background work alive after returning the cached response.
    const headers = new Headers(cached.headers);
    headers.set("X-Stale", "1");
    return {
      response: new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      }),
      update,
    };
  }

  const fresh = await update;
  return {
    response: fresh || new Response(JSON.stringify({ error: "Offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "X-Offline": "1" },
    }),
    update: Promise.resolve(),
  };
}

async function invalidateLedgerCache() {
  const cache = await caches.open(CACHE);
  await cache.delete(new Request(new URL(TXN_PATH, self.location.origin)));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return;

  // Keep cached ledger data consistent after writes.
  if (url.pathname === TXN_PATH) {
    if (req.method === "GET") {
      const result = ledgerStaleWhileRevalidate(req, event.clientId);
      event.waitUntil(result.then((r) => r.update));
      event.respondWith(result.then((r) => r.response));
    } else if (req.method === "POST" || req.method === "DELETE") {
      event.respondWith(fetch(req).then(async (res) => {
        if (res.ok) await invalidateLedgerCache();
        return res;
      }));
    }
    return;
  }

  if (req.method !== "GET") return;

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
