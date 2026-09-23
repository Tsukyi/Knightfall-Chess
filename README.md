# Knightfall Chess

**Make your next move.** A calm, customisable chess playground built with plain JavaScript, HTML, and CSS.

## Play, learn, make it yours

- **Play a bot:** four levels — Sprout (Beginner), Scout (Easy), Sage (Medium), and Sentinel (Hard). Play white, black, or a random side.
- **Play a friend:** local two-player games on the same computer, tablet, or phone.
- **The academy:** ten interactive lessons with Clover, a coach that replies on the board. Covers piece movement, opening development, checks, castling, knight forks, promotion, en passant, and checkmate.
- **Board studio:** six colour palettes, custom square and piece colours, and three original SVG piece designs (Classic, Modern, Letterpress).
- Legal move guides, check indicators, castling, en passant, all four promotions, checkmate and draw detection.
- Undo a turn, request a hint, flip the board, resign, and download your game as PGN.
- Your current regular game, theme, and completed lessons save automatically in this browser. A normal game is preserved while you visit the academy.
- Click/tap or drag pieces. Keyboard users can tab to squares, use arrow keys to navigate, and press Enter or Space to select. Escape clears selection.
- Responsive layouts and optional move sounds. No ads, account, backend, API keys, or runtime network calls.

## Host on GitHub Pages

All site files are served directly from the repository — no build is required for Pages.

1. Open **[Settings → Pages](https://github.com/Tsukyi/Knightfall-Chess/settings/pages)**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose **main** and **/ (root)**, then **Save**.
4. After GitHub finishes its Pages deployment, open **https://tsukyi.github.io/Knightfall-Chess/**.

The `.nojekyll` file keeps this a plain static site. Relative URLs work at a repository subpath or custom domain. See [GitHub’s Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Run on your machine

Install [Node.js](https://nodejs.org/) 20 or later, then:

```sh
git clone https://github.com/Tsukyi/Knightfall-Chess.git
cd Knightfall-Chess
npm start
```

Open **http://localhost:5173**. No `npm install` is needed to run the game. Use an HTTP server rather than double-clicking `index.html`; JavaScript modules and bot workers require an HTTP origin.

For another static host:

```sh
npm run build
```

Upload the contents of `dist/`.

## Tests

```sh
npm test
```

The rule/engine suite checks reference perft counts (including castling positions), illegal moves, en passant, all promotions, game endings, PGN reload, every lesson sequence, legal moves for all bot levels, and a forced mate.

The GitHub Actions workflow also runs browser checks for bot replies, hints, undo, local turns, reload, drag, PGN download, resignation, checkmate, all lessons, saved styles, and mobile overflow. It saves desktop and mobile screenshots as a workflow artifact.

To run those browser checks locally (separate terminal while `npm start` is running):

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run test:e2e
```

## How it works

- `src/app.js`: interface, game state, persistence, lessons, and input.
- `src/engine.js`: iterative-deepening negamax search with alpha-beta pruning, material/position evaluation, and deliberate beginner mistakes.
- `src/bot-worker.js`: runs bot searches away from the interface; cancelled when a game changes.
- `src/lessons.js`: teaching positions and verified player/coach move sequences.
- `src/pieces.js`: original SVG designs and interface icons.
- `src/style.css`: responsive board, studio, and academy layouts.
- `vendor/chess.js`: locally bundled [chess.js v0.13.4](https://github.com/jhlywa/chess.js/blob/v0.13.4/chess.js), with its BSD licence preserved in the file.

The bot is a lightweight custom engine, **not Stockfish**. Difficulty labels are relative and do not claim a rated Elo. The search is capped at one to four plies and a time budget; slower devices may search fewer plies. Hints are suggestions, not guaranteed best moves.

Lessons use deliberate, scripted coach replies. Full games use the search engine. Games are untimed. Draws are automatically declared on threefold repetition and the fifty-move rule. Local multiplayer means sharing one screen; online multiplayer and cross-device accounts are not included. Browser storage does not sync between devices or private sessions.

## Licence

Original app code and SVG artwork: MIT. Vendored chess.js: BSD-2-Clause, copyright Jeff Hlywa and contributors; see the preserved notice in `vendor/chess.js`.
