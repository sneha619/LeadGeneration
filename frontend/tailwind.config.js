/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark theme surfaces
        surface: {
          base:        "#0B0F19",  // main page background
          nav:         "#111827",  // top navbar
          card:        "#151C2C",  // cards, panels
          elevated:    "#1A2235",  // slightly elevated surfaces
          tableHeader: "#1B2537",  // table thead — distinct from card
          border:      "#2A3548",  // all borders (richer than before)
          hover:       "#1E2D45",  // hover highlight
        },
        // Accent
        accent: {
          DEFAULT: "#5B8CFF",  // slightly brighter blue
          hover:   "#7AA3FF",
          muted:   "#1E3A6E",
          dim:     "#0D1F42",
        },
        // Text
        text: {
          primary:   "#F1F5F9",  // crisp near-white
          secondary: "#94A3B8",
          muted:     "#4B607A",
          inverse:   "#0B0F19",
        },
        // Status colors (semantic)
        status: {
          success: "#10B981",
          successDim: "#052E1C",
          warning: "#F59E0B",
          warningDim: "#2D1B06",
          error:   "#EF4444",
          errorDim:"#2D0A0A",
          info:    "#38BDF8",
          infoDim: "#0B2035",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        modal: "0 20px 60px rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
};
