export default {
  // Knip auto-detects nuxt.config.ts / app.vue — list only extra app entry points.
  entry: [
    'pages/**/*.{vue,ts}',
    'layouts/**/*.{vue,ts}',
    'plugins/**/*.{ts,js}',
    'server/**/*.{ts,js}',
    'composables/**/*.{ts,js}',
    'utils/**/*.ts',
    'components/**/*.vue',
    'tailwind.config.js',
    // Manual tooling (npm scripts)
    'scripts/**/*.{mjs,ts,js}',
  ],
  project: [
    '**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,vue}',
    '!node_modules/**',
    '!.nuxt/**',
    '!.output/**',
  ],
  ignoreFiles: [],
  ignoreDependencies: [
    '@nuxt/devtools',
    'vue-tsc',
    // Transitive via @nuxtjs/tailwindcss; config file imports by name
    'tailwindcss',
    // Runtime pin: Nuxt 4.5 SSR renderer imports createConsoleReporter; without a
    // direct dep + override, devframe hoists nostics@0.2.0 and Vercel 500s.
    'nostics',
  ],
  ignoreBinaries: [],
}
