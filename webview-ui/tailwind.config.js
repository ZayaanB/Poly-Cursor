/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cursor: {
          bg: "#1e1e1e",
          surface: "#252526",
          elevated: "#2d2d2d",
          border: "#3c3c3c",
          muted: "#858585",
          fg: "#cccccc",
          bright: "#e0e0e0",
        },
        solana: {
          green: "#14F195",
        },
      },
      boxShadow: {
        "glass-focus":
          "0 0 0 1px rgba(20, 241, 149, 0.35), 0 0 20px rgba(20, 241, 149, 0.12)",
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
};
