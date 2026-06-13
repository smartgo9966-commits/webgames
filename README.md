# 🎮 Smart Go — Educational Games Gallery

A collection of **24 browser-based educational games** for kids, covering math, science, language, logic, coding, and creativity. Each game is a single self-contained HTML file, works on desktops, tablets, and interactive smart boards, is bilingual (English / العربية), and installs as an offline-capable web app.

> Open `pages/` in a browser to launch the gallery. Each game tracks progress and awards stars.

---

## 📚 Games Catalog

Listed in gallery order. Folder names are under [`pages/`](pages/).

| # | Game | Subject | What you do | Levels |
|---|------|---------|-------------|--------|
| 1 | 🌿 **Food Chain Game** — `food_chain_game` | Science | Drag animals into the correct order, from producer to top predator, across forest, ocean, and grassland ecosystems. | 5 |
| 2 | ⏰ **On Time!** — `on_time` | Math | Read the clock and drag the hands to match the right time. | 4 |
| 3 | 🔢 **10 Frame Math Game** — `ten_frame_math_game` | Math | Count the dots in a ten frame and pick the right number, at your own pace or against the clock. | 3 speed modes |
| 4 | 🔬 **Animal Cell** — `animal_cell` | Science | Label the organelles of an animal cell with drag-and-drop, then take a click-to-answer quiz. | Quiz |
| 5 | 🖊 **Smart Board** — `smart_board` | Creativity | A full digital whiteboard: draw, add shapes, type text, fill with color, and save as PNG. | Freeform |
| 6 | 🎨 **Animal Classification Paint & Makes** — `animal_classification_paint_and_makes` | Science / Art | Pick an animal category, color the outlines with a 48-color palette, and decorate with stickers. | 6 categories |
| 7 | 🔴 **Pile of Balls** — `pile_of_balls` | Logic | A falling-block puzzle: rotate and drop ball clusters to connect 4+ of the same color and trigger chains. | Endless |
| 8 | 🌀 **Maze** — `maze` | Logic | Steer the red ball through a winding maze to the star, beating the clock for a 5-star rating. | Timed |
| 9 | 🏰 **Castle Defense** — `castle_defense` | Logic | A tower-defense skirmish: buy cannons, place them along the path, and stop invaders. | Waves |
| 10 | 🔤 **Alphabet Game** — `alphabet_game` | Language | Press the letters in order (A–Z or a–z) to complete the alphabet, with optional star hints. | A–Z |
| 11 | **Shapes Splat!** — `shapes_splat` | Geometry | Identify 2D and 3D shapes before the clock runs out — relaxed or timed. | 4 |
| 12 | **Area Shape Game** — `area_shape_game` | Geometry | Spot every shape that covers the target number of square units. | 4 |
| 13 | 🧮 **Calculator Puzzle** — `calculator_game` | Math | Fill the empty circles so every row and column equation balances, up to a 5×5 cross-math grid. | 5 |
| 14 | 🔗 **Number Twins** — `number_twins` | Math | Tap pairs of balls that add up to the target, connected by a line that turns at most twice. | 12 |
| 15 | 👻 **Math Man** — `math_man` | Math | Pac-Man style: gobble only the ghost whose fraction reduces to the target. | 4 |
| 16 | 🪄 **Word Wizard** — `word_wizard` | Language | See the picture, tap letter tiles to spell the word, from 3-letter to 7-letter words. | 4 |
| 17 | 🤖 **Code Robot** — `code_robot` | Coding | Stack Forward / Turn / Repeat blocks to steer the robot through puzzles — coding without typing. | 12 |
| 18 | 🧠 **Memory Match** — `memory_match` | Cognitive | Classic flip-and-find pairs across themed levels: animals, counting, sums, and opposites. | 4 |
| 19 | 🎨 **Color Lab** — `color_lab` | Science / Art | Drip Red, Yellow, Blue (plus Black & White later) into the bowl to match a target color. | 4 |
| 20 | 🧩 **Pattern Pop** — `pattern_pop` | Logic | Spot the repeating or growing rule and tap the tile that finishes the pattern. | 4 |
| 21 | 🪐 **Cosmic Quest** — `cosmic_quest` | Science | Build the solar system orbit by orbit, placing each planet in the right ring and learning space facts. | 4 |
| 22 | 💰 **Coin Counter** — `coin_counter` | Math | Make the exact price by tapping coins into the cash register, from pennies to dollar coins. | 4 |
| 23 | 🚀 **Times Table Blaster** — `times_table_blaster` | Math | A space shooter: blast the falling asteroid showing the correct product for the multiplication question. | 4 + endless |
| 24 | ➗ **Division Dash** — `division_dash` | Math | A sliding-pod catcher: tap the pod showing the correct quotient for the division question before it dashes off-screen. | 4 + endless |

---

## 🏗 How it's built

- **One file per game.** Every game lives in `pages/<game>/index.source.html` with all CSS and JavaScript inline — **no frameworks, no bundler, no npm dependencies** for the game itself. The only shared external references are the web fonts, the favicon/icons, and the PWA manifest.
- **Shared look & feel.** Fonts come from [`assets/fonts/`](assets/fonts/): *Fredoka One* (titles), *Patrick Hand* (subtitles), and *Nunito* (body). A top-left "Smart Go" badge returns to the gallery on every game.
- **Canvas and DOM.** Action games like Castle Defense and Times Table Blaster render on an HTML5 `<canvas>` with a `requestAnimationFrame` loop; others (Shapes Splat, Food Chain) use DOM/SVG. All of them scale a fixed virtual stage (960×540 / 920×620) to fill any screen via a `fitStage()` helper, and accept mouse, touch, and pen input so they work on tablets and interactive smart boards.
- **Progress.** Each game saves stars and unlocked levels to the browser's `localStorage`.

## 🌍 Bilingual (English / العربية)

Most games and the gallery itself include an **EN / ع toggle** (top corner). It uses `data-i18n` attributes backed by an `I18N` dictionary, persists the choice under the `smartgo_lang` localStorage key, and flips the whole page to right-to-left for Arabic via `document.documentElement.dir`. Numbers, alphabet letters, and English spelling words intentionally stay in their original script.

> The hub, 17 of the older games, and Times Table Blaster are translated. Five games — Memory Match, Color Lab, Pattern Pop, Cosmic Quest, and Coin Counter — are English-only for now.

## 📲 Progressive Web App (offline)

A service worker ([`pages/sw.js`](pages/sw.js)) precaches the gallery shell, every game, and all fonts and icons (cache version `games-v22`), so the whole collection is **installable and works offline**. The root [`index.html`](index.html) simply redirects to `pages/`.

## 🔐 The PIN lock (build step)

The `index.html` that ships in each game folder is **not** the editable source — it's an **encrypted loader**. [`tools/lock.js`](tools/lock.js) derives a key from an 8-digit PIN (PBKDF2-SHA256, 500,000 iterations) and encrypts each `index.source.html` with AES-256-GCM. When a player opens a game, a PIN pad appears; once entered, the PIN is cached in `sessionStorage` so they aren't asked again that session.

**Editing workflow:**

```bash
# 1. Edit the SOURCE file (never the encrypted index.html):
#    pages/<game>/index.source.html

# 2. Re-encrypt every game from the repo root with your 8-digit PIN:
node tools/lock.js 12345678
```

Step 2 regenerates all `pages/*/index.html` loaders (re-encrypted with fresh salt/IV each run, so the diff touches every game — this is expected).

## ▶ Run locally

The games need a real HTTP origin (WebCrypto and the service worker require a secure context, so `file://` will not work). Serve the repo root:

```bash
npx http-server . -p 8000
# then open http://localhost:8000/pages/
```

- To play through the locked gallery, open `http://localhost:8000/pages/` and enter the PIN.
- To preview a game's editable source **without** the PIN, open its source file directly, e.g. `http://localhost:8000/pages/times_table_blaster/index.source.html`.

> Node.js is only required for the lock build (`tools/lock.js`); playing the games needs only a browser and a static file server.

## 📁 Repository layout

```
games/
├── index.html                 # redirects to pages/
├── README.md
├── assets/
│   ├── fonts/                 # Fredoka One, Patrick Hand, Nunito, …
│   └── images/                # logo, PWA icons
├── pages/
│   ├── index.source.html      # the gallery hub (source)
│   ├── index.html             # the gallery hub (encrypted loader)
│   ├── sw.js                  # service worker (offline precache)
│   ├── manifest.webmanifest   # PWA manifest
│   ├── lib/                   # lock runtime (PIN pad + decryptor)
│   └── <game>/                # one folder per game
│       ├── index.source.html  # editable source
│       └── index.html         # encrypted loader (built by lock.js)
└── tools/
    └── lock.js                # PIN-encrypts every index.source.html
```
