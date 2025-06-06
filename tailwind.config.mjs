import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    colors: {},
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        slate: {
          1: "var(--slate-1)",
          2: "var(--slate-2)",
          3: "var(--slate-3)",
          4: "var(--slate-4)",
          5: "var(--slate-5)",
          6: "var(--slate-6)",
          7: "var(--slate-7)",
          8: "var(--slate-8)",
          9: "var(--slate-9)",
          10: "var(--slate-10)",
          11: "var(--slate-11)",
          12: "var(--slate-12)",
        },
        "slate-alpha": {
          1: "var(--slate-a1)",
          2: "var(--slate-a2)",
          3: "var(--slate-a3)",
          4: "var(--slate-a4)",
          5: "var(--slate-a5)",
          6: "var(--slate-a6)",
          7: "var(--slate-a7)",
          8: "var(--slate-a8)",
          9: "var(--slate-a9)",
          10: "var(--slate-a10)",
          11: "var(--slate-a11)",
          12: "var(--slate-a12)",
        },
        teal: {
          1: "var(--teal-1)",
          2: "var(--teal-2)",
          3: "var(--teal-3)",
          4: "var(--teal-4)",
          5: "var(--teal-5)",
          6: "var(--teal-6)",
          7: "var(--teal-7)",
          8: "var(--teal-8)",
          9: "var(--teal-9)",
          10: "var(--teal-10)",
          11: "var(--teal-11)",
          12: "var(--teal-12)",
        },
        "teal-dark": {
          1: "var(--teal-dark-1)",
          2: "var(--teal-dark-2)",
          3: "var(--teal-dark-3)",
          4: "var(--teal-dark-4)",
          5: "var(--teal-dark-5)",
          6: "var(--teal-dark-6)",
          7: "var(--teal-dark-7)",
          8: "var(--teal-dark-8)",
          9: "var(--teal-dark-9)",
          10: "var(--teal-dark-10)",
          11: "var(--teal-dark-11)",
          12: "var(--teal-dark-12)",
        }
      },
    },
  },
  plugins: [
    typography
  ],
};