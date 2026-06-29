import { inject } from '@vercel/analytics'

/** Client-only analytics in production (avoids noise / errors in local dev). */
export default defineNuxtPlugin(() => {
  if (!import.meta.client) return
  if (import.meta.dev) return
  inject()
})
