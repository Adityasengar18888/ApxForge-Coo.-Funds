import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "system-ui",
          "sans-serif"
        ],
      },
      colors: {
        ios: {
          bg: "var(--ios-bg)",
          secondaryBg: "var(--ios-secondary-bg)",
          card: "var(--ios-card)",
          grouped: "var(--ios-grouped)",
          separator: "var(--ios-separator)",
          hairline: "var(--ios-hairline)",
          text: "var(--ios-text)",
          secondaryText: "var(--ios-secondary-text)",
          tertiaryText: "var(--ios-tertiary-text)",
          blue: "var(--ios-blue)",
          green: "var(--ios-green)",
          red: "var(--ios-red)",
          orange: "var(--ios-orange)",
          yellow: "var(--ios-yellow)",
          purple: "var(--ios-purple)",
          teal: "var(--ios-teal)",
          pink: "var(--ios-pink)",
          indigo: "var(--ios-indigo)",
        },
      },
      borderRadius: {
        card: "18px",
        sheet: "24px",
        pill: "9999px",
        control: "10px",
      },
      backdropBlur: {
        ios: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
