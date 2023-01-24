import { defineConfig } from "astro/config"

// https://astro.build/config
import tailwind from "@astrojs/tailwind"

// https://astro.build/config
import cloudflare from "@astrojs/cloudflare"

// https://astro.build/config
import solidJs from "@astrojs/solid-js"
// https://vite-pwa-org.netlify.app/frameworks/astro.html
import AstroPWA from "@vite-pwa/astro"
import { manifest } from "./manifest"
import { visualizer } from "rollup-plugin-visualizer"

// TODO: SET SITE:
// site: 'https://www.my-site.dev'
// https://docs.astro.build/en/reference/configuration-reference/#site

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    mode: "directory"
  }),
  integrations: [
    tailwind(),
    solidJs(),
    AstroPWA({
      /* your pwa options */
      srcDir: "src",
      filename: "sw.js",
      strategies: "injectManifest",
      registerType: "autoUpdate",
      manifest: manifest,
      injectManifest: {
        globIgnores: [
          "**/node_modules/**/*",
          "**/_worker.js",
          "$server_build/_worker.js"
        ]
      },
      devOptions: {
        enabled: true,
        type: "module"
        /* other options */
      }
    })
  ],
  vite: {
    plugins: [
      visualizer({
        // open: true,
        // goal:  ~100kib of HTML/CSS/Fonts (e.g. check network tab for amount loaded), and then ~300-350kib JS gzipped: see readme for link to article
        gzipSize: true
      })
    ]
  }
})
