/// <reference types="vitest" />
import { getViteConfig } from "astro/config"

export default getViteConfig({
  // Vitest and Astro don't play 100% nice together yet.  You can peridoically uncomment this ignore and see if ts is still mad, but this works as is right now.
  test: {
    // @ts-ignore
    base: "http://localhost:3000",
    /* for example, use global to avoid globals imports (describe, test, expect): */
    // globals: true,
    // environment: "jsdom",
    // transformMode: {
    //   web: [/\.jsx?$/]
    // },
    // deps: {
    //   inline: [/solid-js/]
    // },
    include: ["./tests/unit/*"]
  }
})
