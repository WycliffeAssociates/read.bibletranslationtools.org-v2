// Type imports
import type { ManifestOptions } from "vite-plugin-pwa"

/**
 * Defines the configuration for PWA webmanifest.
 */
export const manifest: Partial<ManifestOptions> = {
  name: "Read Bible Translation Tools", // Change this to your website's name.
  short_name: "Live Reader", // Change this to your website's short name.
  description: "A place to read Scripture online", // Change this to your websites description.
  theme_color: "#015AD9", // Change this to your primary color.
  background_color: "#ffffff", // Change this to your background color.
  // display: "minimal-ui",
  display: "minimal-ui",
  start_url: "/",
  icons: [
    {
      src: "icons/icon-72x72.png",
      sizes: "72x72",
      type: "image/png"
    },
    {
      src: "icons/icon-96x96.png",
      sizes: "96x96",
      type: "image/png"
    },
    {
      src: "icons/icon-128x128.png",
      sizes: "128x128",
      type: "image/png"
    },
    {
      src: "icons/icon-144x144.png",
      sizes: "144x144",
      type: "image/png"
    },
    {
      src: "icons/icon-152x152.png",
      sizes: "152x152",
      type: "image/png"
    },
    {
      src: "icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png"
    }
  ]
}
