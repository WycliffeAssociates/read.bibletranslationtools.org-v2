import { defineConfig } from "astro/config";

// https://astro.build/config
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
// https://vite-pwa-org.netlify.app/frameworks/astro.html
import AstroPWA from "@vite-pwa/astro";
import { manifest } from "./manifest";
import { visualizer } from "rollup-plugin-visualizer";
const siteUrl = import.meta.env.PROD
  ? "https://read.bibleineverylanguage.org"
  : import.meta.env.DEV
    ? "https://read-dev.bibleineverylanguage.org"
    : "";
const isDev = import.meta.env.DEV;

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: ".dev.vars"
    }
  }),
  integrations: [
    tailwind(),
    solidJs(),
    AstroPWA({
      /* your pwa options */
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",
      registerType: "autoUpdate",
      manifest: manifest,
      injectManifest: {
        globIgnores: ["**/_worker.js/**"]
      },
      devOptions: {
        enabled: false,
        type: "module"
        /* other options */
      }
    })
  ],
  vite: {
    // https://discord.com/channels/830184174198718474/1239920931510554655/1249724228794585178
    /* 
    For anyone that might land here in the future, due to the hydration being broken in Solid it creates an unfortunate situation with an easy workaround, at least until it gets fixed in core:

In local development everytinhg will work fine by default but it won't build with the problem I described in the post, by applying a manual resolver to vite it will break the development server  but the production build will work just fine, so in order to have both, in your astro.config.mjs:

last checked: June 13, 2024
    */
    resolve: {
      conditions: !isDev ? ["worker", "webworker"] : [],
      mainFields: !isDev ? ["module"] : []
    },
    plugins: [
      // @ts-expect-error Not sure why error, but works for when you want tto look at bundle a little closer
      visualizer({
        brotliSize: true,
        template: "treemap",
        // open: true,
        // goal:  ~100kib of HTML/CSS/Fonts (e.g. check network tab for amount loaded), and then ~300-350kib JS gzipped: see readme for link to article
        gzipSize: true
      })
    ]
  }
});
