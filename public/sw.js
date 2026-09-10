// Service Worker — Purasafe PTS
// Estrategia: cache-first para assets estáticos, network-first para páginas,
// cola IndexedDB para POSTs offline.

const CACHE_NAME = "purasafe-pts-v1";
const OFFLINE_PAGE = "/pts/offline";

// Assets a pre-cachear al instalar
const PRECACHE = [
  "/pts",
  "/pts/permits/new",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar mismo origen
  if (url.origin !== location.origin) return;

  // POST a /api/pts → cola offline si no hay red
  if (request.method === "POST" && url.pathname.startsWith("/api/pts")) {
    event.respondWith(handleOfflinePost(request));
    return;
  }

  // GET: network-first con fallback a cache
  if (request.method === "GET") {
    event.respondWith(networkFirstWithCache(request));
  }
});

async function networkFirstWithCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fallback para páginas de navegación
    if (request.mode === "navigate") {
      const fallback = await cache.match("/pts");
      if (fallback) return fallback;
    }
    return new Response("Sin conexión. Intenta más tarde.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function handleOfflinePost(request) {
  try {
    return await fetch(request);
  } catch {
    // Sin red: guardar en IndexedDB y responder con 202
    const body = await request.clone().json().catch(() => ({}));
    await enqueueOfflineRequest({ url: request.url, body, timestamp: Date.now() });
    return new Response(
      JSON.stringify({ queued: true, message: "Guardado localmente. Se enviará al reconectar." }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── Background Sync ────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "pts-sync") {
    event.waitUntil(flushOfflineQueue());
  }
});

// ─── IndexedDB helpers ──────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("purasafe-offline", 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueOfflineRequest(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("queue", "readwrite");
    tx.objectStore("queue").add(data);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function flushOfflineQueue() {
  const db = await openDB();
  const items = await new Promise((resolve) => {
    const tx = db.transaction("queue", "readonly");
    const req = tx.objectStore("queue").getAll();
    req.onsuccess = () => resolve(req.result);
  });

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        await new Promise((resolve) => {
          const tx = db.transaction("queue", "readwrite");
          tx.objectStore("queue").delete(item.id);
          tx.oncomplete = resolve;
        });
      }
    } catch {
      // Dejar en cola para el próximo intento
    }
  }
}

// Notificar a los clientes cuántos PTS están en cola offline
async function notifyQueueCount() {
  const db = await openDB();
  const count = await new Promise((resolve) => {
    const tx = db.transaction("queue", "readonly");
    const req = tx.objectStore("queue").count();
    req.onsuccess = () => resolve(req.result);
  });
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: "OFFLINE_QUEUE_COUNT", count }));
}
