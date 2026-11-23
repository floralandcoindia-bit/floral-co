/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: token("bg"), // Deep Forest Black
        evergreen: token("surface"), // Dark Evergreen
        botanical: token("primary"), // Botanical Green
        sage: token("sage"), // Muted Sage
        gold: token("gold"), // Antique Gold (use sparingly)
        ivory: token("ivory"), // Warm Ivory
        mist: token("muted"), // Soft Sage Grey
      },
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
