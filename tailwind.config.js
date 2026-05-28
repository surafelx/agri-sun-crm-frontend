/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#F59E0B', dark: '#D97706', light: '#FCD34D' },
        surface: { DEFAULT: '#1C1C1E', card: '#2C2C2E', border: '#3A3A3C' },
      },
    },
  },
  plugins: [],
}

