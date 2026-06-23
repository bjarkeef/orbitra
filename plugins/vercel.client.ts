/**
 * Client-only analytics. Must not affect SSR HTML (avoids hydration drift).
 */
export default defineNuxtPlugin(() => {
  // Defer past first paint so Vue can hydrate cleanly first
  if (!import.meta.client) return

  const run = () => {
    import('@vercel/analytics')
      .then(({ inject }) => {
        try {
          inject()
        } catch {
          /* analytics must never break the app */
        }
      })
      .catch(() => {})
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => run(), { timeout: 3000 })
  } else {
    setTimeout(run, 0)
  }
})
