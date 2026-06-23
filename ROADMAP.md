# Orbitra — Roadmap

Neutral movie/TV discovery app powered by TMDB, with an **orbital co-star graph** as the differentiating direction.

> Track progress by flipping status: `todo` → `doing` → `done` (or check boxes below).

---

## Identity

| Field | Value |
|--------|--------|
| **Name** | **Orbitra** |
| **Tagline** | Map the orbits of film & television |
| **Why this name** | Orbital metaphor fits the co-star / collaboration graph; neutral, not personal; short and memorable for a private repo |
| **Old names to remove** | Legacy personal portfolio branding (cleared from UI/docs) |

---

## Phase 0 — Identity & WIP safety

- [x] Choose neutral project name (**Orbitra**)
- [x] Create this roadmap
- [x] Neutralize UI/docs branding (header, footer, README, package name)
- [x] Keep actor graph WIP on branch-friendly files (grid default, no key in client long-term)
- [x] Private remote `bjarkeef/orbitra` (`main` default; phase branches for work)

---

## Phase 1 — Foundation (security + data layer)

Goal: API key never reaches the browser; hot paths use one proxy + composable; basic errors; search not broken.

### 1.1 Server proxy (P0)
- [x] Nitro catch-all `server/api/tmdb/[...path].ts` forwards to TMDB with server-only key
- [x] Remove key-disclosure route (`server/api/tmdb.ts` that returned `{ tmdbAPI }`)
- [x] `runtimeConfig.tmdbAPI` stays **private** (not `public`)
- [x] `.env.example` documents `TMDB_API=`

### 1.2 Client data access (P0)
- [x] `composables/useTmdb.ts` — path helpers, image URLs, no secrets
- [x] Migrate: Hero, Trending, movie page, actor page, search, Poster, Information
- [x] Migrate remaining TMDB callers (TV, collection, Top*, season/episode)
- [x] ActorGraph calls proxy paths only (no `apiKey` prop)

### 1.3 Reliability & search (P1)
- [x] Friendly error state on movie / actor pages
- [x] Search: debounce, fix single-result / empty logic
- [ ] Optional: `append_to_response` on movie page (credits + providers in one call) — stretch

### 1.4 Project hygiene (P1)
- [x] README for Orbitra + correct scripts (`dev` / `build` / `preview`)
- [x] Clean merge-conflicted `.gitignore`
- [x] `package.json` name → `orbitra`
- [ ] Prefer single lockfile when re-seeding private repo (delete unused lock at copy time)

**Phase 1 exit criteria**
- [ ] Network tab shows only `/api/tmdb/...` — never `api_key=` query to themoviedb.org from the browser
- [ ] `TMDB_API` missing → clear server error, not silent blank UI on all pages
- [ ] Search with 1 result works; typing is debounced



---

## Phase 1.5 — Core revamp & audit  ← **current** (`orbitra-phase-1.5`)

Goal: make the **platform trustworthy** before Phase 2 merge / Phase 3 polish. No new product features unless they unblock broken core paths.

See also: [docs/CORE_AUDIT.md](./docs/CORE_AUDIT.md)

- [x] Branch from `main` (Phase 2 stays on `orbitra-phase-2`)
- [x] Written core audit (stack, handlers, cards, Nuxt)
- [x] `server/utils/tmdb.ts` shared Nitro helper; proxy delegates to it
- [x] Nuxt config: `compatibilityDate`, app title/meta, drop unused plugin array entry
- [x] Analytics plugin → `defineNuxtPlugin` (`plugins/vercel.client.ts`)
- [x] Layout/header semantics (remove Nuxt 2 transition, fix nav markup)
- [x] Fix `MMovie` media-kind resolution (Top 100 / popular lists)
- [x] Pin package intent to Nuxt 3.15+ (run `yarn` to refresh lock on implementer machine)
- [ ] Run `yarn install` + `yarn dev` smoke (hero, search, /100, movie page)
- [ ] Remove unused lockfile (`package-lock.json` **or** standardize on npm only)
- [ ] Optional: `useAsyncData` on home/movie as pilot for SSR

**Merge policy:** land Phase 1.5 on `main` before rebased Phase 2 PR.


---

## Phase 2 — Actor graph done right (orbital feature)

Goal: differentiating UX without N+1 client storms or key exposure.

- [ ] Default actor page to **grid**; Graph is opt-in tab
- [ ] Server endpoint `GET /api/actors/:id/graph` builds nodes/edges (cache ~24h)
- [ ] Client canvas is render-only (physics + draw)
- [ ] Split monolith SFC if still huge (`data` vs `canvas`)
- [ ] Mobile caps (`maxProjects`, co-stars)
- [ ] Commit graph + actor page together on feature branch
- [ ] Insights / selected-node panel polish

**Phase 2 exit criteria**
- [ ] Opening an actor page does not fan out dozens of browser→TMDB calls
- [ ] Graph works with proxy-only networking

---

## Phase 3 — Product polish

- [ ] Episode prev/next within a season
- [ ] Watch providers: region default + stream/rent/buy groups
- [ ] Backdrop/poster guards (no `url(undefined)`)
- [ ] `useSeoMeta` on movie / TV / actor pages
- [ ] Lazy images / optional `@nuxt/image`
- [ ] Standardize media cards (`MMovie` media-type logic)
- [ ] Remove leftover `console.log` / TODOs that are stale
- [ ] Lint script (`eslint` via Nuxt module)

---

## Phase 4 — Modernize platform

- [ ] Single package manager lockfile only
- [ ] Bump Nuxt 3 to current supported minor (deliberate, not lockfile-only churn)
- [ ] `defineNuxtPlugin` for analytics
- [ ] Drop Nuxt 2 leftovers (`static/` vs `public/`, dead transition config)
- [ ] Light TypeScript on composables/server first
- [ ] Optional smoke test (Playwright: home + search + movie)

---

## Phase 5 — Private repo launch checklist

When drafting the **private** GitHub/GitLab repo:

1. Create empty private repo **`orbitra`** (no README if pushing existing tree).
2. Ensure `.env` is gitignored; commit `.env.example` only.
3. Set remote host env: `TMDB_API` (server secret on Vercel/host).
4. Suggested first commits:
   - `chore: initialize orbitra from legacy codebase`
   - `feat: tmdb server proxy and useTmdb composable`
   - `feat(wip): orbital actor graph (client render)`
5. Do **not** include old public deploy URLs or personal contact in footer unless you want them.
6. Add `ROADMAP.md` so future sessions stay aligned.

---

## Status log

| Date | Note |
|------|------|
| 2026-06-23 | Roadmap created; rebrand to Orbitra; Phase 1 implementation started in workspace |

---

## Suggested session order

1. Finish / verify Phase 1 exit criteria locally (`yarn dev`, DevTools network).
2. Seed private `orbitra` remote.
3. Phase 2 graph endpoint before more graph UI chrome.
4. Phase 3 UX backlog as energy allows.
