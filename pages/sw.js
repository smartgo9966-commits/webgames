// Service worker for the Games Gallery.
// Strategy: precache the shell + every game + all fonts/icons on install.
// Runtime: cache-first for precached entries, network-first-then-cache for
// anything else; offline fallback to the landing page for navigations.

const CACHE = 'games-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',

  // Fonts
  '../assets/fonts/fonts.css',
  '../assets/fonts/fredoka-one-400.woff2',
  '../assets/fonts/nunito.woff2',
  '../assets/fonts/patrick-hand-400.woff2',
  '../assets/fonts/caveat-700.woff2',
  '../assets/fonts/playfair-display-700-italic.woff2',
  '../assets/fonts/cinzel.woff2',
  '../assets/fonts/raleway.woff2',

  // Icons + favicon
  '../assets/images/logo.png',
  '../assets/images/icon-192.png',
  '../assets/images/icon-512.png',
  '../assets/images/icon-maskable-512.png',

  // Game pages
  './alphabet_game/index.html',
  './animal_cell/index.html',
  './animal_classification_paint_and_makes/index.html',
  './area_shape_game/index.html',
  './castle_defense/index.html',
  './food_chain_game/index.html',
  './maze/index.html',
  './on_time/index.html',
  './pile_of_balls/index.html',
  './shapes_splat/index.html',
  './smart_board/index.html',
  './ten_frame_math_game/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Skip cross-origin (e.g. analytics, third-party CDNs) — let the network handle it.
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline + not cached → fall back to landing page for navigations.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
