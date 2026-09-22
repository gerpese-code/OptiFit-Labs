import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
        },
        gym: {
          black: "#020503",
          dark: "#050e08",
          card: "#08160e",
          "card-hover": "#0d2417",
          border: "rgba(16, 185, 129, 0.2)",
          neon: "#00ff87",
          emerald: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
export default config;
