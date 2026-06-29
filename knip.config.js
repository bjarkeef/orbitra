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
  ],
  project: [
    '**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,vue}',
    '!node_modules/**',
    '!.nuxt/**',
    '!.output/**',
  ],
  // Dev/docs helpers invoked manually (not imported by the app).
  ignoreFiles: ['scripts/**'],
  ignoreDependencies: [
    '@nuxt/devtools',
    'sass',
    'sass-loader',
    'vue-tsc',
    // Transitive via @nuxtjs/tailwindcss; config file imports by name
    'tailwindcss',
  ],
  ignoreBinaries: [],
}
