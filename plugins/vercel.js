import { inject } from '@vercel/analytics'

// Only inject analytics on the client in production (avoids noise / errors in local dev).
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  if (import.meta.dev) return
  inject()
})

