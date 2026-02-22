import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        "tm-bg": "#e5e5ea",
        "tm-pill-bg": "#ddeeff",
        "tm-card": "#3d3d4e",
        "tm-card-dark": "#2e2e3e",
        "tm-blue": "#2070e8",
        "tm-green": "#4cde5e",
        "tm-gray-bar": "#6b6b80",
        "tm-muted": "#bcbccc",
        "tm-text-dim": "#b8b8c8",
      },
    },
  },
  plugins: [],
};
export default config;
