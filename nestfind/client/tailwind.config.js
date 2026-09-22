// nestfind/nestfind/client/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: "#07080f",
        surface: {
          card: "#13141f",
          light: "#1a1b26",
          border: "#2a2b3a",
        },
        gold: {
          DEFAULT: "#c9a84c",
          light: "#e2c06a",
          dark: "#a0802e",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 4px 20px rgba(201,168,76,0.25)",
        "gold-lg": "0 8px 32px rgba(201,168,76,0.35)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "pulse-gold": "pulse-gold 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in": "fadeIn 0.4s ease-out forwards",
      },
      keyframes: {
        "pulse-gold": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(201,168,76,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(201,168,76,0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #c9a84c, #e2c06a, #a0802e)",
      },
    },
  },
  plugins: [],
};
