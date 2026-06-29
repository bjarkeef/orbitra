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
        // App palette — prefer these over ad-hoc hex / gray-* in components
        orbit: {
          ink: '#0b1220',
          panel: '#0f172a',
          line: '#1e293b',
          accent: '#6366f1',
          muted: '#94a3b8',
          soft: '#cbd5e1',
        },
      },
      maxWidth: {
        page: '1536px', // screen-2xl — single page width token
      },
      aspectRatio: {
        poster: '2 / 3',
      },
      minHeight: {
        'hero': '22rem',
        'hero-sm': '28rem',
        'hero-copy': '11rem',
        'hero-copy-sm': '13rem',
      },
      minWidth: {
        control: '12rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px meta / badges
      },
      letterSpacing: {
        hero: '0.2em',
      },
      zIndex: {
        progress: '60',
      },
      scale: {
        103: '1.03',
      },
    },
  },
  plugins: [],
}
