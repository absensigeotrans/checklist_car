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
        primary: {
          red: "hsl(354, 85%, 48%)",
          "red-hover": "hsl(354, 85%, 40%)",
          blue: "hsl(211, 100%, 42%)",
          "blue-hover": "hsl(211, 100%, 35%)",
          green: "hsl(145, 63%, 42%)",
          "green-hover": "hsl(145, 63%, 35%)",
        },
        bg: {
          main: "hsl(210, 20%, 98%)",
          card: "hsl(0, 0%, 100%)",
          sidebar: "hsl(220, 20%, 97%)",
        },
        text: {
          main: "hsl(220, 15%, 15%)",
          muted: "hsl(220, 10%, 45%)",
        },
        border: {
          DEFAULT: "hsl(210, 14%, 90%)",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        sm: "0 2px 4px rgba(0, 0, 0, 0.05)",
        md: "0 4px 12px rgba(0, 0, 0, 0.08)",
        lg: "0 10px 30px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-damage": "pulse 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(230, 23, 44, 0.7)" },
          "70%": { boxShadow: "0 0 0 6px rgba(230, 23, 44, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(230, 23, 44, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
