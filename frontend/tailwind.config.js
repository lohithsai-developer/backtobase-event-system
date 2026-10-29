/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#08090c',
          charcoal: '#11141c',
          surface: '#171b26',
          surfaceLight: '#1f2433',
          border: '#272d3f',
          borderLight: '#37415a',
          turquoise: '#00e5ff',
          turquoiseHover: '#33ebff',
          gold: '#e6be6d',
          goldHover: '#eed08c',
          textMuted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}
