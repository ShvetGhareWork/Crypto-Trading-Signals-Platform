/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crypto: {
          dark: '#0a0e27',
          darker: '#060918',
          accent: '#10b981',
          'accent-dark': '#059669',
          gold: '#f59e0b',
          danger: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
