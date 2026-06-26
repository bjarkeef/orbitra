# Orbitra

Open-source **movie & TV discovery** app built with [Nuxt 3](https://nuxt.com/) and [Tailwind CSS](https://tailwindcss.com/), powered by the [TMDB](https://www.themoviedb.org/) API.

Browse titles, search, charts, franchises, streaming availability (via TMDB / JustWatch data), and rich person pages — including an optional co-star **orbit** graph.

## Features

- Home rails, **Discover** (filter by streaming service / region), **Search**, **Top 100**
- **Collections** — franchises with watch order and local rating progress
- **Where to watch** on titles (region preference in Settings)
- **Person pages** — bio, birthplace map, career timeline, role breakdown, social / IMDb links, co-star orbit
- TMDB key stays **server-only** (`/api/tmdb/*` proxy)

## Setup

You need a free [TMDB API key](https://www.themoviedb.org/settings/api).

```bash
npm install          # or: yarn install
cp .env.example .env # set TMDB_API=your_key
npm run dev          # http://localhost:3000
```

```bash
npm run build
npm run preview
```

## Notes

- Client code should use `composables/useTmdb.ts` — never call TMDB with the API key in the browser.
- Longer-term ideas live in [ROADMAP.md](./ROADMAP.md); this README only describes what works today.
- Contributions welcome: open an issue or PR. Keep changes focused.

## License

See [LICENSE](./LICENSE) (MIT).

## Attribution

This product uses the TMDB API but is **not** endorsed or certified by TMDB. Streaming availability data is provided through TMDB and attributed to JustWatch where shown.
