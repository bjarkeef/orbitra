# Orbitra — Roadmap

Neutral movie/TV discovery app powered by TMDB, with an **orbital co-star graph** as the differentiating direction.

Public portfolio repo: https://github.com/bjarkeef/orbitra

---

## Identity

| Field | Value |
|--------|--------|
| **Name** | **Orbitra** |
| **Tagline** | Map the orbits of film & television |
| **Why this name** | Orbital metaphor fits the co-star / collaboration graph; neutral, short, memorable |

---

## Done (foundation)

- [x] Server-only TMDB key via Nitro proxy (`/api/tmdb/*`) + `composables/useTmdb.ts`
- [x] Actor orbit graph built server-side (`GET /api/actors/:id/graph`), client is render-only
- [x] Discover (providers / region), Search, Top 100, Collections + local ratings
- [x] Rich person pages (bio, map, timeline, roles, social)
- [x] SEO meta on detail pages; `HomePosterCard` as shared media card
- [x] **TypeScript** across Vue SFCs, composables, server routes
- [x] **ESLint** via `@nuxt/eslint` (`npm run lint`)
- [x] **CI** — GitHub Actions: prepare, lint, knip, typecheck, build
- [x] Mainstream-only catalogue (`include_adult` always false on the proxy; adult preference UI removed)

---

## Next (portfolio-friendly)

### Orbit graph UX (signature feature)
- [x] Mobile defaults for `maxProjects` / co-star caps in the UI
- [x] Deeper selected-node insights panel (+ top collaborators from server)
- [x] Split force-layout into `utils/orbitSim.ts`; canvas stays in `ActorGraph.vue`

### Product polish (small wins)
- [x] Episode prev/next within a season
- [x] Watch providers: clearer stream / rent / buy grouping
- [x] Lazy images via `@nuxt/image` (`NuxtImg` on posters / heroes)

### Platform (when convenient)
- [x] **Nuxt 4** (`nuxt@^4.4`, compatibilityDate `2025-07-15`) — root-level `pages/` / `components/` kept (no forced `app/` move)
- [ ] Optional Playwright smoke (home → search → movie → person → graph tab)
- [x] README screenshots + architecture SVG for the portfolio storefront
- [x] Genre-first Discover filters (`genre/{media}/list` + `with_genres`)
- [x] Trailer embeds from `append_to_response` videos (movie + TV)
- [x] Home rails: upcoming / on the air / airing today

---

## TMDB API — not leveraged yet (audit 2026-06-28)

Reference: [TMDB API docs](https://developer.themoviedb.org/docs) / [OpenAPI reference](https://developer.themoviedb.org/reference).

### Already in use (high level)
Trending, now playing, popular / top-rated lists, multi-search, movie & TV details + credits, watch providers (title + region catalogue), videos (movies), person + combined credits + images + external IDs, collection detail, discover (movie/TV), TV season/episode + season credits, TV external IDs.

### High value for Orbitra (recommend next)
| Opportunity | TMDB surface | Why it fits |
|-------------|--------------|-------------|
| **`append_to_response`** on movie/TV/person | Details endpoints | Fewer round-trips (credits + providers + videos + images in one call) |
| **Upcoming / on the air / airing today** | `movie/upcoming`, `tv/on_the_air`, `tv/airing_today` | Fresh home rails without inventing data |
| **Genre lists + genre-first browse** | `genre/movie/list`, `genre/tv/list` | Named genres in Discover / filters |
| **Keywords** on titles & discover | `movie/{id}/keywords`, `with_keywords` on discover | Deeper “mood / trope” discovery |
| **Reviews** | `movie/{id}/reviews`, `tv/{id}/reviews` | Social proof on detail pages |
| **TV videos / images** | `tv/{id}/videos`, `…/images` (movie images too) | Parity with movie trailers; still galleries |
| **Search by type** | `search/movie`, `search/tv`, `search/person` | Faster typed search vs multi + client filter |
| **Find by external ID** | `GET /find/{external_id}` | Deep links from IMDb IDs already on person/title pages |
| **Configuration** (image sizes) | `GET /configuration` | Drive `imageUrl` sizes from API instead of hardcoding |

### Medium value / portfolio nice-to-have
| Opportunity | TMDB surface | Notes |
|-------------|--------------|-------|
| **Companies / networks** | `company/{id}`, `network/{id}`, discover `with_companies` / `with_networks` | Studio / network hubs (e.g. “A24”, “HBO”) |
| **Alternative titles / translations** | `…/alternative_titles`, `…/translations` | International catalogue |
| **Release dates & certs detail** | `movie/{id}/release_dates` | Richer cert UI |
| **Content ratings (TV)** | `tv/{id}/content_ratings` | Same idea for TV |
| **Tagged images** (person) | `person/{id}/tagged_images` | Extra person gallery |
| **Trending people** | `trending/person/{day\|week}` | “People of the week” rail |
| **Popular people** | `person/popular` | Cast discovery entry point |
| **Keywords search** | `search/keyword` | Power-user discover |
| **Watch provider regions** | `watch/providers/regions` | Settings region picker from API, not a static list |

### Lower priority for this portfolio scope
- **Account / lists / ratings / watchlist** (v3 session or v4 user auth) — needs user login; fights “local ratings only” story unless you want OAuth complexity.
- **Changes** endpoints — for sync jobs, not a browse UI.
- **Guest sessions** — same auth surface as account.

Prefer implementing **append_to_response + one new home rail (upcoming / on the air)** before anything account-related.

---

## Branch policy

| Branch | Status |
|--------|--------|
| **`main`** (`orbitra/main`) | Only active line — ship features here |

---

## Status log

| Date | Note |
|------|------|
| 2026-06-23 | Roadmap created; rebrand to Orbitra |
| 2026-06-27 | Phase 1/2 verified; collections, person pages on main |
| 2026-06-28 | TS migration, ESLint, CI; roadmap trimmed |
| 2026-06-29 | Removed adult preference / age gate / session APIs; mainstream-only proxy; README + CONTRIBUTING portfolio pass |
| 2026-06-29 | Clean public history (orphan root); upgrade to Nuxt 4.4 |
| 2026-07-10 | Genres, trailers, airing today, orbit insights/mobile caps, @nuxt/image, provider grouping polish |
