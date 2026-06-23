# Orbitra

Movie & TV discovery on **Nuxt 3** + **Tailwind**, powered by [TMDB](https://www.themoviedb.org/).  
Direction: map collaboration — **orbital co-star graphs** on person pages (in progress; see [ROADMAP.md](./ROADMAP.md)).

## Setup

```bash
# install
yarn install
# or: npm install

# env (server-only — never expose to the client)
cp .env.example .env
# edit .env and set TMDB_API=your_key
```

Get a key from [TMDB API settings](https://www.themoviedb.org/settings/api).

## Scripts

```bash
yarn dev        # http://localhost:3000
yarn build      # production build
yarn preview    # preview production build
yarn generate   # static generation (if used)
```

## Architecture notes

- The browser calls **`/api/tmdb/*` only**. Nitro appends the TMDB key on the server.
- Prefer `useTmdb()` helpers from `composables/useTmdb.ts` instead of talking to TMDB directly.
- Track work in **ROADMAP.md** (Phase 1 foundation → Phase 2 orbital graph → polish).

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
