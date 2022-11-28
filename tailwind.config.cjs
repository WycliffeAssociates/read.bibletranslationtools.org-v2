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
      }
    }
  },
  plugins: []
}
astro.config.mjs
functions[[path]].js
api
getHtmlForChap.ts
isValidRepo.ts
repoIndex.ts
manifest.ts
package.json
playwright
playwright - ct.config.ts
playwright - report
playwright.config.ts
pnpm - lock.yaml
public
fonts / icons / README.md
src
assets
components
env.d.ts
layouts
lib
pages
pwa.ts
styles
sw.js
translations
types
stats.html
tailwind.config.cjs
tests
unit / component / e2e / tsconfig.json
vitest.config.ts

