import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#007749",
          dark: "#005a37",
          light: "#e6f5ee",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          muted: "#5c5c5c",
          faint: "#8a8a8a",
        },
        stage: {
          bg: "#f8f9fa",
          panel: "#ffffff",
          border: "#e5e7eb",
        },
        accent: {
          green: "#007749",
          gold: "#ffb81c",
          blue: "#000c8b",
          red: "#e03c31",
          pink: "#ec4899",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "grow-bar": {
          "0%": { width: "0%" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.25s ease-out",
        "grow-bar": "grow-bar 0.6s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
