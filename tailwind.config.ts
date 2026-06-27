import PrimeUI from 'tailwindcss-primeui'
import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: ['class', '.app-dark'],
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './error.vue',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#163E75',
          50: '#EEF5FF',
          100: '#DCEBFF',
          200: '#AECBF5',
          300: '#7AAEE8',
          400: '#4D82C4',
          500: '#225CA6',
          600: '#163E75',
          700: '#123461',
          900: '#0a1e3d',
        },
        danger: '#C43A34',
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [PrimeUI],
}
