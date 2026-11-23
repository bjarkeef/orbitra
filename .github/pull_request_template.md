## What and why

<!-- What does this change, and what problem does it solve? Link the issue: "Closes #123". -->

## How to check it

<!-- Pages or URLs to open, filters to try, before/after screenshots for UI changes. -->

## Checklist

- [ ] `npm run lint`, `npm run typecheck`, `npm run knip` and `npm run build` pass
- [ ] No secrets or `TMDB_API` in client code or `NUXT_PUBLIC_*` config
- [ ] New TMDB endpoints are added to `server/utils/tmdbAllowlist.ts`
- [ ] Per-visitor UI (region, local ratings) stays inside `<ClientOnly>` on cached pages
