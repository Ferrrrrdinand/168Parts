/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e04b4b',
          dark: '#b91c1c',
          light: '#f87171',
          soft: '#fff1f2',
          crimson: '#be123c',
          deep: '#881337'
        },
        shopee: {
          orange: '#ee4d2d',
          darkOrange: '#d73211',
          bg: '#f5f5f5'
        }
      }
    },
  },
  plugins: [],
}

