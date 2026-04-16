import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream:   "#f5e9d8",
        "cream-dark": "#eddfc6",
        brown:   "#3e2c23",
        cyan:    "#2fa4d7",
        orange:  "#e76f2e",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "Space Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl":  "16px",
        "3xl":  "24px",
        "4xl":  "32px",
      },
    },
  },
  plugins: [],
};

export default config;
