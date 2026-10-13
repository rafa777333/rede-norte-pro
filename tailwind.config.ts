import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { brand: { 50: '#fff1f2', 500: '#e11d48', 900: '#0f172a' } }
    },
  },
  plugins: [],
};
export default config;
