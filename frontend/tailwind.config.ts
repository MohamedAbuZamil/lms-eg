import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Premium Purple LMS Design System
        lms: {
          // Primary Purple Scale
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",

          // Accent Colors
          accent: {
            pink: "#ec4899",
            blue: "#3b82f6",
            cyan: "#06b6d4",
            emerald: "#10b981",
            amber: "#f59e0b",
            rose: "#f43f5e",
          },

          // Semantic Colors
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#3b82f6",

          // Background Variants
          background: {
            primary: "#faf5ff",
            secondary: "#f3e8ff",
            tertiary: "#ede9fe",
          },
        },

        // Shadcn/UI semantic tokens mapped to LMS purple
        border: "hsl(262, 30%, 90%)",
        input: "hsl(262, 30%, 90%)",
        ring: "hsl(262, 80%, 60%)",
        background: "hsl(270, 100%, 98%)",
        foreground: "hsl(262, 50%, 15%)",
        primary: {
          DEFAULT: "hsl(262, 83%, 58%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(270, 60%, 95%)",
          foreground: "hsl(262, 50%, 20%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        muted: {
          DEFAULT: "hsl(270, 40%, 96%)",
          foreground: "hsl(262, 20%, 45%)",
        },
        accent: {
          DEFAULT: "hsl(270, 60%, 92%)",
          foreground: "hsl(262, 50%, 20%)",
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(262, 50%, 15%)",
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(262, 50%, 15%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "Tajawal", "system-ui", "sans-serif"],
        display: ["Inter", "Tajawal", "system-ui", "sans-serif"],
        arabic: ["Tajawal", "Noto Sans Arabic", "sans-serif"],
      },
      boxShadow: {
        // Premium shadows
        "soft-xs": "0 1px 2px 0 rgb(139 92 246 / 0.05)",
        "soft-sm": "0 1px 3px 0 rgb(139 92 246 / 0.1), 0 1px 2px -1px rgb(139 92 246 / 0.1)",
        "soft-md": "0 4px 6px -1px rgb(139 92 246 / 0.1), 0 2px 4px -2px rgb(139 92 246 / 0.1)",
        "soft-lg": "0 10px 15px -3px rgb(139 92 246 / 0.1), 0 4px 6px -4px rgb(139 92 246 / 0.1)",
        "soft-xl": "0 20px 25px -5px rgb(139 92 246 / 0.1), 0 8px 10px -6px rgb(139 92 246 / 0.1)",
        "glow-purple": "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-purple-lg": "0 0 40px rgba(139, 92, 246, 0.4)",
        // Elevation shadows
        elevated: "0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
        "elevated-lg": "0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08)",
      },
      backgroundImage: {
        // Premium gradients
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "lms-gradient": "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
        "lms-gradient-dark": "linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #a855f7 100%)",
        "lms-gradient-light": "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #ddd6fe 100%)",
        "hero-gradient": "linear-gradient(135deg, #2e1065 0%, #4c1d95 25%, #5b21b6 50%, #7c3aed 75%, #8b5cf6 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(245,243,255,0.9) 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(237,233,254,0.6) 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(139, 92, 246, 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
