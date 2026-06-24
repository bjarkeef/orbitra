/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        orbit: {
          ink: '#0b1220',
          panel: '#0f172a',
          line: '#1e293b',
          accent: '#6366f1',
        },
      },
    },
  },
  plugins: [],
}
