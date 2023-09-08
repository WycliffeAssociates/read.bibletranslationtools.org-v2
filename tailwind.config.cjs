// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTheme = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        accent: "#015AD9",
        secondary: "#FAA83C",
        darkAccent: "#001533"
      },
      maxWidth: {
        container: "1400px"
      },
      fontFamily: {
        sans: ["'Atkinson Hyperlegible'", ...defaultTheme.fontFamily.sans]
      },
      fontSize: {
        varBase: "var(--font-size-base)"
      },
      keyframes: {
        slideLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0%)" }
        },
        slideRight: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" }
        },
        fadeIn: {
<<<<<<< HEAD
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
=======
          "0%": { transform: "opacity(0)" },
          "100%": { transform: "opacity(1)" }
        },
        fadeOut: {
          "0%": { transform: "opacity(1)" },
          "100%": { transform: "opacity(0)" }
>>>>>>> read-prod
        }
      }
    }
  },
  plugins: []
}
