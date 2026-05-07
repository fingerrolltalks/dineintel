import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050607",
        smoke: "#0b0f12",
        card: "#11161a",
        lime: "#c6ff00",
        gold: "#ffbf31",
      },
      boxShadow: {
        glow: "0 0 42px rgba(198, 255, 0, 0.24)",
        gold: "0 0 34px rgba(255, 191, 49, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
