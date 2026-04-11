import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Poppins", "Inter", "sans-serif"],
        body:    ["Inter", "Segoe UI", "sans-serif"],
      },
      colors: {
        brand: {
          blue:           "#1E3A8A",
          "blue-mid":     "#2563EB",
          "blue-light":   "#EFF6FF",
          green:          "#10B981",
          "green-light":  "#ECFDF5",
          orange:         "#F97316",
          "orange-light": "#FFF7ED",
          red:            "#EF4444",
          "red-light":    "#FEF2F2",
          gray:           "#F3F4F6",
          "gray-mid":     "#E5E7EB",
          dark:           "#111827",
          muted:          "#6B7280",
        },
      },
      boxShadow: {
        card:  "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 24px rgba(30,58,138,0.10)",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease both",
        "fade-in":    "fadeIn 0.3s ease both",
        shimmer:      "shimmer 1.4s infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
