/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#07080f',
        surface: {
          card: '#13141f',
          light: '#1a1b26',
          border: '#2a2b3a',
        },
        gold: { DEFAULT: '#c9a84c', light: '#e2c06a', dark: '#a0802e' },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 20px rgba(201,168,76,0.25)',
        'gold-lg': '0 8px 32px rgba(201,168,76,0.35)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
