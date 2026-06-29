# Orbitra

**Map the orbits of film & television.**

Open-source **movie & TV discovery** app — [Nuxt 3](https://nuxt.com/), [Tailwind CSS](https://tailwindcss.com/), [TMDB API](https://www.themoviedb.org/). Built as a public portfolio / learning repo, not a commercial product.

[![CI](https://github.com/bjarkeef/orbitra/actions/workflows/ci.yml/badge.svg)](https://github.com/bjarkeef/orbitra/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate.svg)](./LICENSE)
[![Live demo](https://img.shields.io/badge/demo-Vercel-black)](https://orbitra-livid.vercel.app)

**Live demo:** [orbitra-livid.vercel.app](https://orbitra-livid.vercel.app)

<p align="center">
  <img src="docs/screenshots/01-home.png" alt="Orbitra home — hero and trending rails" width="900" />
</p>

<p align="center">
  <img src="docs/screenshots/06-person-orbit.png" alt="Person page Orbit co-star graph" width="900" />
</p>

---

## Why Orbitra?

Most TMDB portfolio apps are thin clients that put the API key in the browser and stop at posters and search. Orbitra is built around a clearer story:

1. **Server-only TMDB access** — the browser never sees `TMDB_API`; all calls go through Nitro.
2. **Orbit graph** — open a person → **Orbit** tab → co-star collaboration graph. Topology is built **on the server**; the canvas only renders.
3. **Practical discovery** — region-aware watch providers, Discover filters, collections with local ratings, rich person and title pages.

No accounts, no watchlists synced to TMDB — keep it simple and self-contained.

---

## What you can do

| Area | Highlights |
|------|------------|
| **Home** | Hero + trending / popular rails |
| **Discover** | Filter by streaming service, monetization type, and watch region |
| **Search** | Debounced multi-search (movies, TV, people); optional “on my services” filter |
| **Top 100** | Top-rated movie & TV charts |
| **Collections** | Franchise browse, watch order, **local** star ratings (browser storage) |
| **Title pages** | Overview, cast, providers (“where to watch”), recommended + similar rails, videos/trailers where wired |
| **Person pages** | Bio, birthplace map, career timeline, role breakdown, social / IMDb links |
| **Orbit graph** | Opt-in co-star network — topology built **on the server**, canvas is render-only |
| **Settings** | Watch region for providers and Discover |

Signature feature: open a person → **Orbit** tab → co-star collaboration graph without N+1 browser calls to TMDB.

---

## Architecture

![Orbitra request flow](docs/architecture.svg)

```
Browser  →  Nuxt (Vue 3)  →  Nitro routes
                              ├─ /api/tmdb/*            proxy (API key never leaves the server; include_adult always false)
                              ├─ /api/actors/:id/graph  builds orbit nodes/edges (+ cache)
                              └─ /api/collections       curated franchise catalog
```

- Client data access is centralized in [`composables/useTmdb.ts`](./composables/useTmdb.ts).
- The proxy strips client `api_key` / `include_adult` and forces mainstream catalogue defaults.

### Screenshots

| Home | Search |
|:----:|:------:|
| ![Home](docs/screenshots/01-home.png) | ![Search](docs/screenshots/03-search.png) |
| **Movie detail** | **Discover** |
| ![Movie](docs/screenshots/04-movie.png) | ![Discover](docs/screenshots/02-discover.png) |
| **Person** | **Collections** |
| ![Person](docs/screenshots/05-person.png) | ![Collections](docs/screenshots/07-collections.png) |

Regenerate after UI changes (app must be running on port 3000):

```bash
npm i -D playwright
npx playwright install chromium
npm run build && node .output/server/index.mjs   # other terminal
node scripts/capture-screenshots.mjs
```

### Design decisions

- **TMDB key stays on the server** — safer defaults for a public demo and any fork.
- **Graph topology is server-built** — fewer round-trips, consistent rate/cache behavior.
- **Local-only ratings** — no OAuth or TMDB user sessions by choice.
- **npm + lockfile only** — reproducible installs (`package-lock.json`).

---

## Quick start

Requirements: **Node.js ≥ 20.19** (CI uses Node 22). Free [TMDB API key](https://www.themoviedb.org/settings/api) (v3 key is fine).

```bash
npm install
cp .env.example .env   # set TMDB_API=your_key
npm run dev            # http://localhost:3000
```

**Use npm only** — this repo ships `package-lock.json`. Don’t add yarn/pnpm lockfiles.

```bash
npm run lint
npm run typecheck
npm run knip
npm run build
npm run preview
```

CI runs prepare → lint → knip → typecheck → build on `main` (see [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

### Deploy (e.g. Vercel)

1. Import the repo and use the Nuxt preset (or default Node build).
2. Set **`TMDB_API`** in the host environment (server-only — never `NUXT_PUBLIC_*`).
3. Deploy. The live demo uses the same pattern.

---

## Project layout

| Path | Role |
|------|------|
| `pages/` | File-based routes (home, discover, search, movie/TV/person, settings) |
| `components/` | UI, rails, posters, actor graph canvas |
| `composables/` | TMDB client, watch region, local ratings |
| `server/api/` | Nitro proxies and graph / collections endpoints |
| `utils/personCredits.ts` | Credit aggregation for person timelines |
| `ROADMAP.md` | Next ideas (graph UX polish, small product wins) |
| `CONTRIBUTING.md` | How to propose changes |

---

## Contributing

Issues and focused PRs welcome. Prefer small changes that match existing patterns (proxy-only TMDB, Tailwind tokens in `assets/css/main.css`, TypeScript in Vue SFCs).

See [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [ROADMAP.md](./ROADMAP.md).

---

## License

[MIT](./LICENSE).

---

## Attribution

This product uses the TMDB API but is **not** endorsed or certified by TMDB.  
Streaming availability is supplied through TMDB and attributed to [JustWatch](https://www.justwatch.com/) where shown.
