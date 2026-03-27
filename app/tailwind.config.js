/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          charcoal: "#121212",
          off: "#F5F5F5",
          solana: "#14F195",
        },
        solana: {
          purple: "#9945FF",
          green: "#14F195",
        },
        surface: {
          DEFAULT: "#0a0a0f",
          raised: "#12121a",
          border: "#1e1e2e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
