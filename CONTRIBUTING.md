# Contributing to Orbitra

Thanks for considering a contribution. Orbitra is a portfolio / learning Nuxt app — keep changes focused and consistent with the existing stack.

## Prerequisites

- Node.js **≥ 20.19** (22 recommended; matches CI)
- npm (this repo uses `package-lock.json` only — no yarn/pnpm lockfiles)
- A free [TMDB v3 API key](https://www.themoviedb.org/settings/api)

## Local setup

```bash
npm install
cp .env.example .env   # set TMDB_API=your_key
npm run dev
```

Before opening a PR, run:

```bash
npm run lint
npm run typecheck
npm run knip
npm run build
```

CI runs the same checks on `main` and pull requests.

## What fits well

- Bug fixes and accessibility improvements
- Orbit graph UX (without turning the client into an N+1 TMDB caller)
- Discover / search / provider polish that reuses `composables/useTmdb.ts`
- Docs and README clarity

## What to avoid

- Putting `TMDB_API` (or any secret) in client / `NUXT_PUBLIC_*` config
- Client-side `include_adult` toggles or adult catalogue features — Orbitra is mainstream-only; the proxy always forces `include_adult=false`
- Large unrelated refactors in the same PR as a feature
- Adding a second package manager lockfile

## Pull requests

1. Prefer a focused branch and a clear description of *what* and *why*.
2. Match existing patterns: Nitro proxy for TMDB, Tailwind tokens in `assets/css/main.css`, `<script setup lang="ts">` in Vue SFCs.
3. Keep PRs reviewable — small beats clever.

## Code of conduct

Be respectful. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Questions

Open an issue on GitHub if something in setup or architecture is unclear.
