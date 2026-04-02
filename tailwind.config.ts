import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
          lighter: "#334155",
        },
        accent: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          light: "#FEF3C7",
        },
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        sand: "#FAFAF9",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'medium': '0 4px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)',
        'glow': '0 4px 14px rgba(245, 158, 11, 0.35)',
        'glow-lg': '0 6px 20px rgba(245, 158, 11, 0.45)',
      },
    },
  },
  plugins: [],
};
export default config;
