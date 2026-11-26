// Speichert die ganze Seite samt Plakaten, damit sie im Unterricht
// auch ohne WLAN laeuft. Neue Fassung -> VERSION hochzaehlen.
const VERSION = "dystopia-v1";
const DATEIEN = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "books.json",
  "bg.jpg",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "thumbs/we.jpg",
  "thumbs/brave-new-world.jpg",
  "thumbs/animal-farm.jpg",
  "thumbs/1984.jpg",
  "thumbs/clockwork-orange.jpg",
  "thumbs/handmaids-tale.jpg",
  "thumbs/children-of-men-1.jpg",
  "thumbs/children-of-men-2.jpg",
  "thumbs/parable-of-the-sower.jpg",
  "thumbs/the-giver.jpg",
  "thumbs/oryx-and-crake.jpg",
  "thumbs/never-let-me-go.jpg",
  "thumbs/hunger-games.jpg",
  "thumbs/maze-runner.jpg",
  "thumbs/stolen-time.jpg",
  "posters/we.jpg",
  "posters/brave-new-world.jpg",
  "posters/animal-farm.jpg",
  "posters/1984.jpg",
  "posters/clockwork-orange.jpg",
  "posters/handmaids-tale.jpg",
  "posters/children-of-men-1.jpg",
  "posters/children-of-men-2.jpg",
  "posters/parable-of-the-sower.jpg",
  "posters/the-giver.jpg",
  "posters/oryx-and-crake.jpg",
  "posters/never-let-me-go.jpg",
  "posters/hunger-games.jpg",
  "posters/maze-runner.jpg",
  "posters/stolen-time.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
    for (const c of await self.clients.matchAll()) c.postMessage("offline-bereit");
  })());
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((treffer) => treffer || fetch(e.request)),
  );
});
