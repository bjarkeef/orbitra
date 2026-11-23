// https://nuxt.com/docs/api/configuration/nuxt-config

/** Public, CDN-cacheable page response: fresh for `ttlSec`, then served stale while one request refreshes it. */
function pageCache(ttlSec: number): string {
  return `public, max-age=0, s-maxage=${ttlSec}, stale-while-revalidate=${ttlSec * 24}`
}
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint', '@nuxt/image'],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f172a' },
      ],
      // Nunito is self-hosted via @font-face in assets/css/main.css (no Google Fonts).
    },
  },

  runtimeConfig: {
    tmdbAPI: process.env.TMDB_API,
  },

  /**
   * CDN caching for server-rendered pages. Without these every page view (and every
   * crawler hit) is a fresh function invocation plus TMDB calls. Only pages whose HTML is
   * the same for every visitor are listed: per-user bits (watch region, local ratings)
   * render inside <ClientOnly>. Query-driven pages (search, discover, tonight, settings)
   * and the ratings-heavy collection pages stay uncached.
   */
  routeRules: {
    '/': { headers: { 'cache-control': pageCache(600) } },
    '/100': { headers: { 'cache-control': pageCache(3600) } },
    '/orbit': { headers: { 'cache-control': pageCache(3600) } },
    '/orbit/**': { headers: { 'cache-control': pageCache(86400) } },
    '/m/**': { headers: { 'cache-control': pageCache(3600) } },
    '/tv/**': { headers: { 'cache-control': pageCache(3600) } },
    '/actor/**': { headers: { 'cache-control': pageCache(3600) } },
  },

  // Nuxt 4 defaults; root-level pages/components remain supported (no app/ move required).
  compatibilityDate: '2025-07-15',

  nitro: {
    // Prevent accidental PWA/service-worker caching in dev previews.
    devProxy: {},
  },

  // Windows / Firefox: keep HMR websocket on the same host/port as the page.
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
        clientPort: 3000,
      },
      watch: {
        usePolling: false,
      },
    },
    css: {
      devSourcemap: true,
    },
  },

  eslint: {
    config: {
      stylistic: {
        indent: 2,
        semi: false,
        quotes: 'single',
      },
    },
  },

  // TMDB already serves pre-sized images (w185/w500/…) from its own CDN, and `imageUrl`
  // picks the size. Passing them through unchanged avoids Vercel Image Optimization,
  // which is metered per source image and was exhausted by poster grids.
  image: {
    provider: 'none',
  },

  // One CSS entry via the module — avoids Vite also loading node_modules/tailwindcss/tailwind.css as a module.
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
    viewer: false,
  },
})
