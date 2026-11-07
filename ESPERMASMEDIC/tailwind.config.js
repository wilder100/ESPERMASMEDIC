/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#071a33', 900: '#0b2545', 800: '#13315c', 700: '#1d4274' },
        celeste: { 100: '#e6f4fb', 200: '#cfeaf7', 300: '#a9d9f0', 400: '#7cc3e6', 500: '#4aa8d4' },
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
