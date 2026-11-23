/**
 * Keep failed renders out of the CDN.
 *
 * `routeRules` in nuxt.config mark detail pages as publicly cacheable. If TMDB hiccups
 * during SSR, the page still renders (with an error state) as a 200, and without this
 * hook that broken page would be served from the CDN for the whole cache window.
 * Any page-level error or failed `useAsyncData` call downgrades the response to `no-store`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:rendered', ({ ssrContext }) => {
    const event = ssrContext?.event
    if (!event) return
    const asyncErrors = Object.values(nuxtApp.payload._errors || {})
    if (nuxtApp.payload.error || asyncErrors.some(Boolean)) {
      event.node.res.setHeader('cache-control', 'no-store')
    }
  })
})
