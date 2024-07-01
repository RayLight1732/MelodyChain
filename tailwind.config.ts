import { transform } from "next/dist/build/swc";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { PluginAPI } from "tailwindcss/types/config";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    backgroundColor: (theme: any) => ({
      ...theme("colors"),
    }),
    extend: {
      colors: {
        primary: "var(--primary)",
        hprimary: "var(--hprimary)",
        accent: "var(--accent)",
        secondary: "var(--secondary)",
        hsecondary: "var(--hsecondary)",
        warn: "var(--warn)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "wave-animation": {
          "0%, 10%, 20%, 90%, 100%": {
            transform: "translateY(0px)",
          },
          "30%": {
            transform: "translateY(-20px)",
          },
          "40%, 50%, 60%": {
            transform: "translateY(0px)",
          },
          "70%": {
            transform: "translateY(20px)",
          },
          "80%": {
            transform: "translateY(0px)",
          },
        },
        "heart-animation": {
          "20%": {
            transform: "scale(0.4)",
          },

          "100%": {
            transform: "scale(1)",
            animationTimingFunction: "ease-in",
          },
        },
      },
      animation: {
        "wave-animation": "wave-animation 2s infinite ease-in-out",
        "heart-animation": "heart-animation 0.5s",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }: { matchUtilities: PluginAPI["matchUtilities"]; theme: PluginAPI["theme"] }) {
      matchUtilities(
        {
          "mask-shadow": (value: string, modifier) => ({ boxShadow: `0px 0px 0px 99999px ${value}` }),
        },
        {
          type: ["color"],
          values: theme("colors"),
        }
      );
    }),
  ],
  darkMode: "class",
};
export default config;
