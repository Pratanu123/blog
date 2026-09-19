/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f3ee",
          100: "#e8e1d4",
          200: "#d4c7b0",
          700: "#3b332b",
          800: "#241f1a",
          900: "#161310",
          950: "#0d0b09",
        },
        paper: {
          50: "#fbf7f0",
          100: "#f4ece0",
          200: "#e8d8c0",
        },
        rust: {
          400: "#e0895a",
          500: "#c45c26",
          600: "#a3481b",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        script: ["EB Garamond", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
      },
      boxShadow: {
        lift: "0 18px 40px -24px rgba(22, 19, 16, 0.45)",
      },
    },
  },
  plugins: [],
};
