/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep transit-blue as the brand anchor, kept out of the "AI demo
        // teal/terracotta" defaults. Status colors are used sparingly and
        // only for status badges, never as decoration.
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          400: "#3b6fd9",
          500: "#1f4fb8",
          600: "#173e91",
          700: "#122f6e",
          900: "#0b1c40",
        },
        ink: "#12172b",
        paper: "#f6f7fb",
        live: "#1a9e6d",
        warn: "#c98a1d",
        danger: "#c94a3b",
        muted: "#8a90a6",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18,23,43,0.06), 0 8px 24px -12px rgba(18,23,43,0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
