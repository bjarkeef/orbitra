// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Quieter / fewer layout surprises while stabilizing Nuxt 4
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    /** Server-only TMDB v3 API key (never expose via public runtimeConfig). */
    tmdbAPI: process.env.TMDB_API || '',
  },

  app: {
    head: {
      title: 'Orbitra',
      meta: [
        {
          name: 'description',
          content: 'Orbitra — map the orbits of film and television (TMDB).',
        },
      ],
      htmlAttrs: { lang: 'en' },
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: false,
    typeCheck: false,
  },

  vite: {
    // Avoid aggressive HMR edge cases while layouts settle on Nuxt 4
    server: {
      watch: {
        usePolling: false,
      },
    },
  },
})
