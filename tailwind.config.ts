import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14151a",
        paper: "#fbfbfa",
        accent: { DEFAULT: "#4f46e5", soft: "#eef2ff", ring: "#c7d2fe" },
        risk: { high: "#dc2626", med: "#d97706", low: "#16a34a" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
