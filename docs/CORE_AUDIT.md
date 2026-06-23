# Orbitra — Core audit (Phase 1.5)

Date: 2026-06-23 · Branch: `orbitra-phase-1.5` · Baseline: `main` (Phase 0/1 only; Phase 2 isolated on `orbitra-phase-2`)

## Goal

Hardening **before** more feature phases: Nuxt/runtime, handlers, shared TS utilities, and broken core UI paths (cards, layout, plugins).

---

## Stack snapshot (before 1.5)

| Area | Was | Issue |
|------|-----|--------|
| Nuxt | `^3.6.5` (lock often ~3.11) | Stale vs current Nuxt 3 line; no `compatibilityDate` |
| Node types | `@types/node` 18 | Fine but outdated |
| Sass packages | `sass`, `sass-loader` | Unused by app CSS (Tailwind only) |
| Lockfiles | `yarn.lock` + `package-lock.json` | Dual lockfile drift risk |
| Client API | Options API everywhere | Acceptable short-term; migrate incrementally |
| Server | Single proxy handler, logic inlined | Duplicated if new server routes appear |
| Plugin | `plugins/vercel.js` not `defineNuxtPlugin` | Nuxt 3 warning / future breakage |
| Layout | Nuxt 2 `transition: "home"` on layout | No effect / misleading |
| Header | `<li>` outside `<ul>` | Invalid HTML |
| Cards (`MMovie`) | `class="..."` typo; mutates `movie` prop; requires `media_type` | Top 100 / popular movies often **render blank** |
| Pages | `created()` client fetch, limited errors | OK for 1.x; prefer `useAsyncData` later |
| TS | `tsconfig` present; Vue SFCs plain JS | Gradual typing via composables/server only |

Latest Nuxt on npm at audit time: **4.x** available. **Decision:** stay on **Nuxt 3.15+** for this phase (smaller blast radius than Nuxt 4 migration). Nuxt 4 is Phase 4+ territory.

---

## Handlers

### `GET /api/tmdb/**` (keep)
- Must remain the only browser-facing TMDB entry.
- Validate path segments (no `..`).
- Strip client-supplied `api_key` query (server injects key).

### Phase 2 `GET /api/actors/:id/graph` (not on this branch)
- Lives on `orbitra-phase-2` only until Phase 1.5 merges to `main` and Phase 2 rebases.

### Shared server util (1.5)
- `server/utils/tmdb.ts` → `requireTmdbApiKey`, `buildTmdbUrl`, `tmdbFetch`
- Auto-imported by Nitro; proxy delegates to `tmdbFetch`.

---

## Client data (`composables/useTmdb.ts`)

Keep as the single client gateway. Future improvements (not all in first 1.5 commit):
- Prefer `useAsyncData` wrappers for pages (SSR + cache keys).
- Movie detail `append_to_response=credits,watch/providers,videos`.

---

## Core feature checklist

| Feature | Status | Action in 1.5 |
|---------|--------|----------------|
| Home hero / trending | Works via proxy | Keep; later SSR |
| Search | Debounced; length fix | Keep |
| Movie page | Proxy + errors | Optional append later |
| TV / season / episode | Proxy | Keep |
| Actor filmography | Proxy | Grid only on main |
| Top 100 / popular | Cards often broken | **Fix MMovie kind** |
| Collections | Proxy | Keep |
| Analytics plugin | Warns | **defineNuxtPlugin** |
| Layout / chrome | Legacy | **Simplify** |

---

## Phase 1.5 exit criteria

1. App boots on Nuxt 3.15+ with `compatibilityDate` set.
2. No dual unused Sass deps unless SCSS files return.
3. Server TMDB logic centralized in `server/utils/tmdb.ts`.
4. Top 100 and popular movie grids show posters (kind = movie).
5. Plugin uses `defineNuxtPlugin`; layout has no fake Nuxt 2 transition API.
6. Audit doc committed; ROADMAP lists Phase 1.5.

---

## Out of scope (later phases)

- Nuxt 4 migration
- Full `<script setup>` conversion of all SFCs
- Phase 2 orbital graph merge
- SEO / `@nuxt/image` / episode prev-next (Phase 3)
