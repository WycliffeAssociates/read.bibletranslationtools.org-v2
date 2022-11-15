const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        accent: "#015AD9",
        secondary: "#FAA83C",
      },
      maxWidth: {
        container: '1400px'
      },
      fontFamily: {
        sans: ["'Atkinson Hyperlegible'", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
