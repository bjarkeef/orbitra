/**
 * Stale Service Workers (from prior PWA experiments or other localhost:3000 apps)
 * intercept /_nuxt/*.css and break Vite/Nuxt CSS module loading in Firefox.
 * Always clear them in development; in production only unregister if present so
 * we never fight an intentional SW (this app does not register one).
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.client || !('serviceWorker' in navigator)) return

  const clear = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
      if (regs.length && 'caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
      if (import.meta.dev && regs.length) {
        console.info(
          `[orbitra] Unregistered ${regs.length} service worker(s) that were intercepting assets.`,
        )
      }
    } catch {
      /* ignore */
    }
  }

  // Run ASAP; also on next tick in case SW activates late.
  void clear()
  if (import.meta.dev) {
    setTimeout(() => void clear(), 500)
  }
})
