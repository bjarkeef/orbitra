# Orbit Graph Centerpiece Plan

**Branch:** `feature/orbit-graph-centerpiece`  
**Date:** 2026-07-11  
**Scope:** Elevate the co-star orbit graph from a person-page tab into Orbitra’s signature experience  
**Status:** Implemented on `feature/orbit-graph-centerpiece` (B + light C) — verified with unit tests, lint, typecheck, production build, API smoke, and Playwright visual smoke  

---

## 1. Product thesis

Orbitra’s name and README promise one differentiator: **map the orbits of film & television** via a server-built co-star graph. Today the graph is real and architecturally sound (Nitro builds topology; canvas only renders), but product-wise it is still a **third view mode** under “Career timeline” on the person page — easy to miss, visually flat (colored circles), and weakly connected to discovery elsewhere in the app.

**Goal:** Make Orbit feel like the reason someone opens Orbitra: a place you *explore*, not a diagram you glance at once.

**Non-goals (for this centerpiece program):**
- TMDB account / OAuth / synced watchlists  
- Multiplayer / real-time collab  
- Replacing Discover/Home as general browse (Orbit complements them)  
- Client-side N+1 TMDB fan-out (keep server-built topology)  

---

## 2. Current architecture (as-built)

### 2.1 Stack map

```
pages/actor/[pid].vue          viewMode: timeline | grid | graph
  ├─ ActorOrbitInsightsPanel   counts + top collaborators chips
  ├─ ActorGraph.vue            canvas, camera, pointer, RAF loop
  │    └─ utils/orbitSim.ts    seedOrbitLayout + stepOrbitPhysics
  └─ ActorOrbitNodePanel       selected node card + deep link

GET /api/actors/:id/graph
  ├─ person + combined_credits
  ├─ top N projects by vote_count (cap maxProjects)
  ├─ per-title credits (batched, paced) → co-stars
  ├─ promote collabCount ≥ 2 → type "repeat"
  ├─ insights { totalProjects, totalCostars, repeatCollaborators, topCollaborators }
  └─ MemoryCache 24h (process-local, max 200 keys)
```

### 2.2 Data model (today)

| Node type | Role | Visual |
|-----------|------|--------|
| `actor` | Center person, fixed at origin | Indigo circle |
| `project` | Movie/TV from credits | Amber circle, radius ~ popularity |
| `costar` | Cast member on a title | Emerald circle |
| `repeat` | Co-star on ≥2 selected titles | Rose circle, larger |

| Link kind | Meaning | Spring target |
|-----------|---------|---------------|
| `acted-in` | Center → project | 160px |
| `cast-in` | Project → co-star | 90px |

### 2.3 Strengths already in place

1. **Correct security model** — graph builder uses server TMDB key; browser never sees it.  
2. **Bounded cost** — `maxProjects` / `topCast` clamps, batching + 120ms pacing, truncation flag.  
3. **Mobile-aware caps** — `orbitGraphDefaults()` shrinks graph on narrow viewports.  
4. **Separation of concerns** — physics pure in `orbitSim.ts`; Vue owns input + paint.  
5. **Insights payload** — server already computes top collaborators; UI surfaces them.  
6. **Interaction basics** — pan, zoom, drag nodes, pause sim, select → detail panel.  

### 2.4 Gaps that block “centerpiece” status

| Area | Gap | Why it hurts |
|------|-----|--------------|
| **Discoverability** | Orbit is a tab inside career section | Users never find the signature feature |
| **Visual language** | Solid circles + thin lines; no posters/faces | Looks like a debug force layout, not a film product |
| **Narrative** | No story (“who keeps orbiting them?”) | Insights are stats, not a guided experience |
| **Exploration loop** | Click → card → leave page | No in-graph focus / expand / history / compare |
| **Physics** | O(n²) repulsion every frame; no clustering | Dense graphs jitter; mobile pays full cost |
| **Graph semantics** | Only vote_count ranking of titles | Career peaks, franchises, eras invisible |
| **Edge richness** | Binary links only | No weight by shared titles, department, year |
| **Performance story** | Cold build can be slow; no progress events | Loading is a fake pulse bar |
| **Shareability** | No URL state for selected node / filters | Can’t share “look at this orbit” |
| **Entry points** | Person page only | Home/search never surface Orbit |
| **Accessibility** | Canvas-only; no keyboard/list fallback | Portfolio demos fail a11y bar |
| **Testing** | No unit tests on sim/API; no e2e orbit path | ROADMAP already notes Playwright gap |
| **Code quality** | `ActorGraph.vue` is Options API + `@ts-nocheck` | Harder to extend safely |
| **Screenshot quality** | Capture may miss Orbit toggle | README can under-sell the feature |

---

## 3. North-star experience

### 3.1 One-sentence UX

> Open anyone → land in a living constellation of their work and people → filter by era/medium → click a co-star to **re-center** the universe → open a title without losing place → share the view.

### 3.2 Signature moments (what demos must nail)

1. **First paint:** Within ~1s of cache hit (or progressive reveal on miss), posters and faces appear in orbital rings — not bare dots.  
2. **“Oh” moment:** Repeat collaborators glow / pulse; hover shows “×N films together”.  
3. **Focus mode:** Click co-star → graph re-centers (or nested orbit) with path highlight.  
4. **Time scrub:** Decade slider dimms titles outside range; career eras become visible.  
5. **Share:** URL encodes person + filters + selected node; paste works.  
6. **Mobile:** Usable one-handed graph with reduced node set + list companion.  

### 3.3 Success metrics (portfolio-friendly, qualitative + light quantitative)

- Time-to-first-interactive graph (p50 cache hit / cold)  
- % of person sessions that open Orbit (instrument later if desired)  
- Subjective: README screenshot of Orbit is unmistakably “the product”  
- Technical: graph build stays under TMDB rate comfort; no client N+1  

---

## 4. Strategic approaches (pick a spine)

### Approach A — **Polish the tab** (small)
Improve canvas rendering, panels, loading, a11y list.  
- **Pros:** Fast, low risk  
- **Cons:** Still buried; won’t feel like a centerpiece  

### Approach B — **Orbit as person primary surface** (recommended spine)
Person page leads with Orbit (hero-height canvas); timeline/grid become secondary. Deepen focus, filters, visual design.  
- **Pros:** Aligns product with brand; reuses existing API  
- **Cons:** Person page redesign; mobile layout care  

### Approach C — **Orbit product surface** (largest)
Dedicated `/orbit` and `/orbit/:personId` routes, home “Orbit of the week”, multi-hop session history.  
- **Pros:** Maximum centerpiece energy; shareable routes  
- **Cons:** More IA work; risk of overbuilding for portfolio  

**Recommendation:** **B as v1 spine**, borrow **C’s URL + home teaser** early, defer full multi-hop “universe browser” to v2.

---

## 5. Capability roadmap (phased)

Phases are sequenced so each ships something demoable. Dependencies flow downward.

---

### Phase 0 — Foundation & correctness (1–2 days)

**Intent:** Make the current graph trustworthy to extend.

| Work item | Detail |
|-----------|--------|
| Type-safe canvas module | Convert `ActorGraph.vue` toward `<script setup>` + typed sim state; drop `@ts-nocheck` where possible |
| Shared types | Extract `GraphNode` / `GraphPayload` / insights types to `shared/orbitTypes.ts` (or `types/orbit.ts`) imported by server + client |
| Unit tests | `orbitSim` seed + step invariants; graph handler project selection / repeat promotion with mocked TMDB |
| Physics budget | Cap nodes drawn; optional spatial hash or skip repulsion when `alpha < threshold`; pause when tab hidden (`document.visibilityState`) |
| Loading truth | Surface server timing / cache HIT-MISS in UI; real progress if we add streaming later |
| Capture script | Ensure Orbit tab is active and scrolled into view for `06-person-orbit.png` |

**Exit criteria:** CI green; types shared; sim tests cover seed + one step; Orbit screenshot shows real graph.

---

### Phase 1 — Visual centerpiece (2–4 days)

**Intent:** Make the canvas look like a film product.

| Work item | Detail |
|-----------|--------|
| Image nodes | Draw circular clipped posters/profiles (offscreen image cache); fallback initials |
| Edge styling | `acted-in` thicker/indigo; `cast-in` thinner; **repeat co-star edges** weighted by `collabCount` |
| Selection halo | Soft glow + dim non-neighborhood (1-hop highlight) |
| Mini-map / fit | “Fit all” camera; optional focus-on-selected zoom |
| Empty / truncated UX | Clear CTA when truncated (“Show more titles” increases caps and refetches) |
| Theme tokens | Align with `tailwind` `orbit` palette; consistent with shell |

**Exit criteria:** At default zoom, titles show posters; co-stars show faces when available; selected neighborhood is obvious.

---

### Phase 2 — Person page as Orbit-first (2–3 days)

**Intent:** Stop hiding the feature.

| Work item | Detail |
|-----------|--------|
| Layout | Orbit block near top of person page (below hero), full content width, taller desktop height |
| Controls bar | Filters, density, medium toggle live *above* canvas (not buried) |
| Timeline/grid | Secondary tabs or accordion under Orbit |
| Deep link | `?view=orbit` default; honor explicit `view=timeline` |
| Prefetch | Warm graph fetch when person page loads (not only when tab clicked) |
| Node panel | Sticky side panel on `lg+`; bottom sheet on mobile |

**Exit criteria:** Landing on a person shows Orbit without an extra click (desktop); mobile has clear Orbit entry with sensible defaults.

---

### Phase 3 — Graph intelligence (server) (3–5 days)

**Intent:** Richer topology without client TMDB storms.

| Work item | Detail |
|-----------|--------|
| Ranking modes | Query `rank=popular\|recent\|top_rated\|diverse` — change which projects enter the cap |
| Medium filter | `media=all\|movie\|tv` server-side before cap |
| Decade / year range | Filter credits by year; insights recompute |
| Edge weights | `sharedCount` between center and co-star across included projects; encode on links |
| Shared-title lists | For each repeat collaborator, return up to K shared title ids/labels for panel |
| Department awareness | Optional: include key crew (director) as distinct node type — **feature-flagged** |
| Cluster metadata | Server tags projects by franchise/collection id when cheap (`belongs_to_collection`) for client color bands |
| Cache keys | Include all query dimensions; consider slightly lower TTL for highly parametrized keys |
| Build budget | Hard wall-clock budget; partial payload + `partial: true` rather than timeout failure |

**Exit criteria:** Filters change graph meaningfully; repeat edges show strength; cache still hits on revisit.

---

### Phase 4 — Exploration loops (3–5 days)

**Intent:** Orbit becomes a browser, not a static chart.

| Work item | Detail |
|-----------|--------|
| Re-center | “Make this person the center” → navigate to `/actor/:id?view=orbit` with transition |
| Focus mode | Without navigation: dim to ego-neighborhood; breadcrumb of focus stack |
| Path highlight | Center → project → co-star path on hover |
| Double-click project | Open title in new tab *or* preview drawer with poster + “Open” |
| Compare strip | Pin up to 3 co-stars; list shared titles (from payload) |
| Keyboard | Arrow focus among nodes list; Enter selects; Esc clears |
| URL state | `?view=orbit&media=movie&from=2000&to=2015&node=person-123` |

**Exit criteria:** Can hop person→co-star→person without using the rest of the site chrome; shareable filtered URLs work.

---

### Phase 5 — Product surfaces beyond person page (2–4 days)

**Intent:** Orbit is a product pillar, not a page widget.

| Work item | Detail |
|-----------|--------|
| Route `/orbit` | Landing: search person, featured orbits (curated ids or trending people) |
| Route `/orbit/:personId` | Canonical share URL (redirects or embeds person orbit layout) |
| Home teaser | “Orbit spotlight” card — one person + mini static preview image or lightweight canvas |
| Title page bridge | On movie/TV cast list: “Show orbit around X” |
| Search | Person results show small “Orbit” action |
| Collections bridge | Optional later: franchise as project-only subgraph |

**Exit criteria:** New user can start an orbit session from Home or `/orbit` without hunting the person career tab.

---

### Phase 6 — Performance, resilience, polish (ongoing / parallel)

| Work item | Detail |
|-----------|--------|
| Progressive build | Optional: return skeleton (center + projects) first, stream co-stars via second request or SSE |
| Image loading | Decode budget; LOD (draw circle until image ready) |
| Web Worker physics | Move `stepOrbitPhysics` off main thread if node count grows |
| Cache tier | Optional Vercel KV / filesystem cache for multi-instance (only if traffic needs it) |
| Rate-limit shield | Single-flight in-process build per cache key (dedupe concurrent MISS) |
| Error taxonomy | Distinct UI for 404 person / TMDB down / partial graph |
| Reduced motion | Respect `prefers-reduced-motion` (static layout, no perpetual RAF) |
| a11y companion | Always-visible list of nodes + insights (not canvas-only) |

---

## 6. Detailed design notes

### 6.1 Visual system (“constellation”, not “d3 demo”)

- **Center:** large portrait with ring; name label always on.  
- **Projects:** rounded poster discs on mid ring; size by `log(vote_count)`.  
- **Co-stars:** small portraits clustered near their densest project (seed already partially does this).  
- **Repeats:** rose ring + badge `×N`.  
- **Background:** subtle radial gradient + very faint grid or star noise (keep tasteful).  
- **Motion:** settle then idle “breathing” only on center / repeats; pause when offscreen.

### 6.2 Interaction model

| Input | Behavior |
|-------|----------|
| Hover node | Tooltip (name, year / ×N); highlight 1-hop |
| Click | Select + panel; URL `node=` |
| Drag node | Temporary pin (current) |
| Drag background | Pan |
| Wheel / buttons | Zoom toward cursor (improve vs center-only) |
| Long-press (mobile) | Same as click + haptic if available |
| “Expand density” | Bump caps, refetch, animate new nodes in |

### 6.3 Server algorithm improvements

Current sort: **vote_count desc** only. Extend:

1. **Score hybrid:** `0.6 * norm(vote_count) + 0.3 * vote_average + 0.1 * recency`  
2. **Diversity:** after taking top K, inject up to M titles from sparse decades so early career isn’t erased  
3. **Repeat detection quality:** collab counts only among *included* projects (already true) — document that truncation undercounts repeats  
4. **Optional second pass:** for top R co-stars by collabCount, fetch their shared credits summary (careful budget)  

### 6.4 API shape evolution (backward compatible)

```ts
// Additive query params
rank?: 'popular' | 'recent' | 'top_rated' | 'hybrid'
media?: 'all' | 'movie' | 'tv'
yearFrom?: number
yearTo?: number
includeCrew?: boolean

// Additive payload fields
links: { sourceId, targetId, kind, weight?: number }[]
insights: {
  // existing...
  yearSpan?: { min: number; max: number }
  mediumSplit?: { movie: number; tv: number }
  topCollaborators: {
    tmdbId, label, image, collabCount
    sharedTitles?: { id, mediaType, title, year }[]
  }[]
}
meta: { cache: 'HIT' | 'MISS'; buildMs?: number; partial?: boolean }
```

### 6.5 Component architecture (target)

```
components/orbit/
  OrbitStage.vue          // layout chrome: filters + canvas + panels
  OrbitCanvas.vue         // rename/refactor from ActorGraph
  OrbitInsights.vue
  OrbitNodeDetail.vue
  OrbitNodeList.vue       // a11y / mobile companion
  OrbitFilters.vue
  OrbitMiniPreview.vue    // home / cards
utils/orbit/
  physics.ts              // current orbitSim
  render.ts               // pure draw helpers (testable)
  camera.ts
  types.ts
server/api/actors/[id]/graph.get.ts
server/utils/orbitBuild.ts  // extract pure builder from handler
```

Keep Nuxt auto-import naming consistent (`Orbit*` prefix).

### 6.6 State ownership

| State | Owner |
|-------|-------|
| Graph payload | `useAsyncData` / fetch in OrbitStage (SSR-optional; graph is heavy — **client-first OK**) |
| Filters | URL query + local ref sync |
| Selection | URL `node` + canvas selectedId |
| Camera | Component-local (not URL unless sharing exact view later) |
| Physics alpha / paused | Component-local |

SSR note: full graph build on every person SSR would hammer TMDB. Prefer **client fetch with skeleton**, optional server prefetch only when cache warm (advanced).

---

## 7. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| TMDB rate limits on cold popular actors | Keep batching/pacing; single-flight; cache; lower default caps |
| Canvas a11y | Parallel list UI always available |
| Scope creep into “graph database product” | Phases 0–2 are enough for portfolio wow; 3–5 optional |
| Image CORS / drawImage | TMDB images are CDN; if tainted canvas, draw via proxied images or stick to `<img>` HTML overlay layer |
| Performance on low-end mobile | Caps + reduced motion + pause offscreen + fewer labels |
| WIP branch noise | Land orbit work in focused PRs; don’t mix unrelated PosterCard/trailer WIP |

---

## 8. Suggested PR sequence (implementation order)

1. **PR-O0** — Types, tests, physics pause/offscreen, capture-script fix  
2. **PR-O1** — Visual nodes (images, edge weights, neighborhood dim)  
3. **PR-O2** — Person page Orbit-first layout + URL `view=orbit`  
4. **PR-O3** — Server filters (media/year/rank) + richer insights  
5. **PR-O4** — Focus / re-center / keyboard / node list  
6. **PR-O5** — `/orbit` landing + home spotlight  
7. **PR-O6** — Worker/progressive/polish as needed  

Each PR must stay green on existing CI: prepare → lint → knip → typecheck → build.

---

## 9. Explicit backlog of “extend” ideas (prioritized)

### P0 — Must for centerpiece
- Image-based nodes  
- Orbit-first person layout  
- 1-hop highlight + stronger selection panel  
- Filters: movie/TV + decade  
- Shareable URL state  
- a11y node list  

### P1 — High leverage
- Edge weights + shared titles on collaborators  
- Hybrid ranking + diversity injection  
- Re-center navigation with history stack  
- `/orbit` landing + home teaser  
- Single-flight cache build  
- Fit-to-graph camera  

### P2 — Delight
- Time scrub animation  
- Franchise/collection color bands  
- Mini map  
- Compare pin tray  
- Static OG image generation for shared orbits (hard; optional)  
- Crew nodes (director links)  

### P3 — Later / maybe never
- Multi-person union graph  
- Path-finding “degrees of separation” game mode  
- Persistent server graph DB  
- WebGL renderer  
- User-uploaded custom graphs  

---

## 10. How this relates to existing WIP

Working tree already contains orbit-related WIP (`orbitSim.ts`, `OrbitInsightsPanel`, `OrbitNodePanel`, graph insights API, person page wiring). Treat that as **Phase 0–1 head start**, then:

1. Inventory and commit only orbit-related files on this branch (or split unrelated WIP away).  
2. Stabilize types/tests.  
3. Proceed through PR-O1+ without mixing Discover/trailer/home experiments unless they feed Orbit entry points.

---

## 11. Demo script (target state)

1. Home → “Orbit spotlight: Leonardo DiCaprio”.  
2. Canvas shows posters + faces; insights: top collaborators.  
3. Filter 2010–2020 · Movies only.  
4. Click a rose node → panel lists shared titles → “Open orbit”.  
5. New person centers; browser back returns.  
6. Copy URL; open in private window; same filter + selection.  
7. Mobile: list companion + reduced graph still readable.

---

## 12. Open decisions (need product calls)

1. **Default surface:** Orbit-first on person page (B) vs dedicated `/orbit` first (C)?  
2. **Crew nodes:** In or out of v1?  
3. **SSR:** Client-only graph vs warm-cache SSR?  
4. **Density default:** Current 24/8 desktop — keep or raise after visual perf work?  
5. **Brand moment:** More “NASA mission control” or “editorial film magazine”?  

---

## 13. Immediate next step

Confirm Approach **B (+ light C)** and P0 scope, then write an implementation plan for **PR-O0 + PR-O1** only (small enough to ship). Avoid boiling the ocean in one PR.
