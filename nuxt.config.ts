// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0f172a' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    tmdbAPI: process.env.TMDB_API,
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

  // One CSS entry via the module — avoids Vite also loading node_modules/tailwindcss/tailwind.css as a module.
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
    viewer: false,
  },
})
