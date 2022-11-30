import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { clientsClaim } from "workbox-core"
import { registerRoute, setCatchHandler } from "workbox-routing"
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  CacheOnly,
  Strategy
} from "workbox-strategies"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { ExpirationPlugin } from "workbox-expiration"
import { warmStrategyCache } from "workbox-recipes"

import { get, set } from "idb-keyval"

// Adds an activate event listener which will clean up incompatible precaches that were created by older versions of Workbox.
self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

// manually clear all the caches for host for dev:
// console.log("clearing all the caches");
// caches.keys().then((keyList) =>
//   Promise.all(
//     keyList.map((key) => {
//       return caches.delete(key);
//     })
//   )
// );
class variableCacheOrNetworkdevtest extends Strategy {
  // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
  // handler: A StrategyHandler instance automatically created for the current strategy.
  // handle(): Perform a request strategy and return a Promise that will resolve with a Response, invoking all relevant plugin callbacks.
  async _handle(request, handler) {
    // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
    return new Promise(async (res, rej) => {
      const cacheStrategy = await get("cacheStrategy")
      // console.log({ cacheStrategy })
      if (cacheStrategy === "networkFirst") {
        try {
          // try network
          let response = await handler.fetch(request)
          response && res(response)
          // if no network, check cache;
          if (!response) {
            return handler.cacheMatch(request).then((response) => res(response))
          }
        } catch (error) {
          rej(error)
        }
      } else if (cacheStrategy === "cacheFirst" || !cacheStrategy) {
        try {
          // cache first
          let response = await handler.cacheMatch(request)
          // network fallback
          if (!response) {
            res(handler.fetchAndCachePut(request))
          } else {
            let clone = response.clone()
            res(clone)
          }
        } catch (error) {
          rej(error)
        }
      } else if (cacheStrategy === "cacheOnly") {
        try {
          // cache only
          let response = await handler.cacheMatch(request)
          response && res(response)
          !response && rej("no match")
        } catch (error) {
          rej(error)
        }
      }
    })
  }
}
class variableCacheOrNetwork extends Strategy {
  // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
  // handler: A StrategyHandler instance automatically created for the current strategy.
  // handle(): Perform a request strategy and return a Promise that will resolve with a Response, invoking all relevant plugin callbacks.
  async _handle(request, handler) {
    // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
    return new Promise(async (res, rej) => {
      const cacheStrategy = await get("cacheStrategy")
      if (cacheStrategy === "networkFirst" || !cacheStrategy) {
        try {
          // try network
          let response = await handler.fetch(request)
          response && res(response)
          // if no network, check cache;
          if (!response) {
            return handler.cacheMatch(request).then((response) => res(response))
          }
        } catch (error) {
          rej(error)
        }
      } else if (cacheStrategy === "cacheFirst") {
        try {
          // cache first
          let response = await handler.cacheMatch(request)
          // network fallback and put
          if (!response) {
            res(handler.fetchAndCachePut(request))
          } else {
            let clone = response.clone()

            res(clone)
          }
        } catch (error) {
          rej(error)
        }
      } else if (cacheStrategy === "cacheOnly") {
        try {
          // cache only
          let response = await handler.cacheMatch(request)
          response && res(response)
          if (import.meta.env.DEV) {
            res(handler.fetch(request))
          } else {
            rej("No cache match")
          }
        } catch (error) {
          rej(error)
        }
      }
    })
  }
}

//@ DEV DON'T CACHE

if (import.meta.env.DEV) {
  console.log(import.meta.env)

  // todo: remove
  registerRoute(
    ({ request, url }) => {
      if (url.href.includes("/devtest")) {
        return false
      }
    },
    // new NetworkFirst({
    //   cacheName: "all-dev-api",
    //   // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    // })
    new variableCacheOrNetworkdevtest({
      cacheName: "dev-test"
    })
  )

  // Avoid caching on dev: force always go to the server
  registerRoute(
    ({ request, url }) => {
      if (url.href.includes("/api/")) {
        return false
      }
      if (request.mode == "navigate") return false
      return true
    },
    new NetworkFirst({
      cacheName: "all-dev"
      // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    })
  )
  registerRoute(
    ({ request, url }) => {
      if (request.mode == "navigate") return true
    },
    new NetworkFirst({
      cacheName: "all-dev"
      // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    })
    // new variableCacheOrNetwork()
  )
  registerRoute(
    ({ request, url }) => {
      if (url.href.includes("/api/")) {
        return true
      }
    },
    // new NetworkFirst({
    //   cacheName: "all-dev-api",
    //   // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    // })
    new variableCacheOrNetwork()
  )
}

// @ PROD ROUTES
if (import.meta.env.PROD) {
  let precacheUrls = self.__WB_MANIFEST
  let route404 = location.origin.concat("/404")
  const FALLBACK_STRATEGY = new CacheFirst()

  precacheAndRoute(precacheUrls)
  warmStrategyCache({
    urls: [route404],
    strategy: FALLBACK_STRATEGY
  })

  //----- HTML DOCS
  registerRoute(
    ({ request, url }) => {
      const isSameOrigin = self.origin === url.origin
      const isDoc = request.destination === "document"
      if (isSameOrigin && isDoc) {
        return true
      }
      return false
    },
    new variableCacheOrNetwork({
      cacheName: "lr-pages",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200]
        }),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 1000
        })
      ]
    })
  )
  // # API / Serverless responses
  registerRoute(
    ({ request, url }) => {
      if (url.href.includes("/api/")) {
        return true
      }
    },
    new variableCacheOrNetwork({
      cacheName: "live-reader-api",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200]
        }),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 1000
        })
      ]
    })
  )

  // Cache CSS, and (non pre-cached JS)
  registerRoute(
    ({ request }) => {
      const isStyleOrScript =
        request.destination === "style" || request.destination === "script"
      const isSameOrigin = self.origin === url.origin
      if (isSameOrigin && isStyleOrScript) {
        return true
      } else {
        return false
      }
    },
    new StaleWhileRevalidate({
      cacheName: "lr-assets",
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 30
        })
      ]
    })
  )
  setCatchHandler(async ({ request }) => {
    // The warmStrategyCache recipe is used to add the fallback assets ahead of
    // time to the runtime cache, and are served in the event of an error below.
    // Use `event`, `request`, and `url` to figure out how to respond, or
    // use request.destination to match requests for specific resource types.
    switch (request.destination) {
      case "document":
        return FALLBACK_STRATEGY.handle({ event, request: route404 })

      default:
        // If we don't have a fallback, return an error response.
        return Response.error()
    }
  })
}
// SKIP WAITING prompt comes from the sw update process; Used for updating SW between builds
self.addEventListener("message", (event) => {
  console.log(event)
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting()
  // window.reload();
})
