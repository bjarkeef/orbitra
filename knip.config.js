export default {
  entry: [
    'nuxt.config.ts',
    'pages/**/*.{vue,ts}',
    'layouts/**/*.{vue,ts}',
    'plugins/**/*.{ts,js}',
    'server/**/*.{ts,js}',
    'composables/**/*.{ts,js}',
    'utils/**/*.ts',
    'components/**/*.vue',
    'app.vue',
    'tailwind.config.js',
  ],
  project: [
    '**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,vue}',
    '!node_modules/**',
    '!.nuxt/**',
    '!.output/**',
  ],
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
