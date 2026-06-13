// Service worker for the Games Gallery.
// Strategy: precache the shell + every game + all fonts/icons on install.
// Runtime: cache-first for precached entries, network-first-then-cache for
// anything else; offline fallback to the landing page for navigations.

const CACHE = 'games-v24';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './lib/lock.js',

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
  '../assets/images/logo-blue.jpeg',
  '../assets/images/icon-192.png',
  '../assets/images/icon-512.png',
  '../assets/images/icon-maskable-512.png',

  // Game pages — cache BOTH the directory form (what the gallery links use,
  // e.g. "food_chain_game/") AND the explicit index.html form (what a direct
  // URL paste resolves to). Different cache keys; same bytes.
  './add_subtract_race/',
  './add_subtract_race/index.html',
  './alphabet_game/',
  './alphabet_game/index.html',
  './animal_cell/',
  './animal_cell/index.html',
  './animal_classification_paint_and_makes/',
  './animal_classification_paint_and_makes/index.html',
  './area_shape_game/',
  './area_shape_game/index.html',
  './calculator_game/',
  './calculator_game/index.html',
  './castle_defense/',
  './castle_defense/index.html',
  './code_robot/',
  './code_robot/index.html',
  './coin_counter/',
  './coin_counter/index.html',
  './division_dash/',
  './division_dash/index.html',
  './color_lab/',
  './color_lab/index.html',
  './cosmic_quest/',
  './cosmic_quest/index.html',
  './food_chain_game/',
  './food_chain_game/index.html',
  './math_man/',
  './math_man/index.html',
  './maze/',
  './maze/index.html',
  './memory_match/',
  './memory_match/index.html',
  './number_twins/',
  './number_twins/index.html',
  './on_time/',
  './on_time/index.html',
  './pattern_pop/',
  './pattern_pop/index.html',
  './pile_of_balls/',
  './pile_of_balls/index.html',
  './shapes_splat/',
  './shapes_splat/index.html',
  './smart_board/',
  './smart_board/index.html',
  './ten_frame_math_game/',
  './ten_frame_math_game/index.html',
  './times_table_blaster/',
  './times_table_blaster/index.html',
  './word_wizard/',
  './word_wizard/index.html',
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

  event.respondWith((async () => {
    // 1. Direct cache hit
    let hit = await caches.match(req);
    if (hit) return hit;

    // 2. Normalised variants: cache may hold "foo/" while request is "foo/index.html"
    //    or vice-versa. Try the alternate form before going to network.
    if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html')) {
      const alt = url.pathname.endsWith('/')
        ? url.pathname + 'index.html'
        : url.pathname.replace(/index\.html$/, '');
      if (alt && alt !== url.pathname) {
        hit = await caches.match(url.origin + alt);
        if (hit) return hit;
      }
    }

    // 3. Network → cache the response on the way back
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
      }
      return res;
    } catch (_) {
      // 4. Offline + not cached → fall back to landing for navigations
      if (req.mode === 'navigate') {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
      return Response.error();
    }
  })());
});
