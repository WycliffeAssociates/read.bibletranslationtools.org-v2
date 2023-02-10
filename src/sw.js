import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL
} from "workbox-precaching"
import { clientsClaim } from "workbox-core"
import { registerRoute } from "workbox-routing"
import {
  NetworkFirst,
  // StaleWhileRevalidate,
  // CacheFirst,
  // CacheOnly,
  Strategy
} from "workbox-strategies"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { ExpirationPlugin } from "workbox-expiration"
// import { warmStrategyCache } from "workbox-recipes"

import { get } from "idb-keyval"

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
// class variableCacheOrNetworkdevtest extends Strategy {
//   // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
//   // handler: A StrategyHandler instance automatically created for the current strategy.
//   // handle(): Perform a request strategy and return a Promise that will resolve with a Response, invoking all relevant plugin callbacks.
//   async _handle(request, handler) {
//     // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
//     return new Promise(async (res, rej) => {
//       const cacheStrategy = await get("cacheStrategy")
//       // console.log({ cacheStrategy })
//       if (cacheStrategy === "networkFirst") {
//         try {
//           // try network
//           let response = await handler.fetch(request)
//           response && res(response)
//           // if no network, check cache;
//           if (!response) {
//             return handler.cacheMatch(request).then((response) => res(response))
//           }
//         } catch (error) {
//           rej(error)
//         }
//       } else if (cacheStrategy === "cacheFirst" || !cacheStrategy) {
//         try {
//           // cache first
//           let response = await handler.cacheMatch(request)
//           // network fallback
//           if (!response) {
//             res(handler.fetchAndCachePut(request))
//           } else {
//             let clone = response.clone()
//             res(clone)
//           }
//         } catch (error) {
//           rej(error)
//         }
//       } else if (cacheStrategy === "cacheOnly") {
//         try {
//           // cache only
//           let response = await handler.cacheMatch(request)
//           response && res(response)
//           !response && rej("no match")
//         } catch (error) {
//           rej(error)
//         }
//       }
//     })
//   }
// }
async function tryNetwork(handler, request) {
  try {
    let response = await handler.fetchAndCachePut(request)
    if (response && response.ok) {
      return response
    }
  } catch (error) {
    console.log(error)
    return
  }
}
async function tryLocalCache(handler, request) {
  try {
    // cache first
    let response = await handler.cacheMatch(request)
    // default to sending cache match if there
    if (response && response.ok) {
      return response
    } else {
      throw new Error("No response or not ok")
    }
  } catch (error) {
    // network fallback and put
    console.log(error)
    return
  }
}
// provided here
// https://developer.chrome.com/docs/workbox/modules/workbox-strategies/#custom-cache-network-race-strategy
class CacheNetworkRace extends Strategy {
  _handle(request, handler) {
    const fetchAndCachePutDone = handler.fetchAndCachePut(request)
    const cacheMatchDone = handler.cacheMatch(request)

    return new Promise((resolve, reject) => {
      fetchAndCachePutDone.then(resolve)
      cacheMatchDone.then((response) => response && resolve(response))

      // Reject if both network and cache error or find no response.
      Promise.allSettled([fetchAndCachePutDone, cacheMatchDone]).then(
        (results) => {
          const [fetchAndCachePutResult, cacheMatchResult] = results
          if (
            fetchAndCachePutResult.status === "rejected" &&
            !cacheMatchResult.value
          ) {
            reject(fetchAndCachePutResult.reason)
          }
        }
      )
    })
  }
}

// todo: debug this
// todo: maybe instead of a custom strategy, see if you can read Index DB and use the outtheBox strategies to respond.
// https://developer.chrome.com/docs/workbox/modules/workbox-strategies/#advanced-usage
// On a throttled network, this consistetly has issues: Will need further troubleshooting.
class variableCacheOrNetwork extends Strategy {
  // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
  // handler: A StrategyHandler instance automatically created for the current strategy.
  // handle(): Perform a request strategy and return a Promise that will resolve with a Response, invoking all relevant plugin callbacks.
  async _handle(request, handler) {
    // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
    return new Promise(async (res, rej) => {
      const cacheStrategy = await get("cacheStrategy")
      if (cacheStrategy === "networkFirst" || !cacheStrategy) {
        const response = await tryNetwork(handler, request)
        if (response && response.ok) {
          return res(response)
        } else {
          let resp = await tryLocalCache(handler, request)
          if (resp) {
            res(resp)
          } else {
            rej("cannot fetch from network and not in cache.")
          }
        }
      } else if (cacheStrategy === "cacheFirst") {
        const response = await tryLocalCache(handler, request)
        if (response && response.ok) {
          return res(response)
        } else {
          let resp = tryNetwork(handler, request)
          if (resp) {
            res(resp)
          } else {
            rej("Not in cache and cannot fetch from network")
          }
        }
      } else if (cacheStrategy === "cacheOnly") {
        try {
          // cache only
          const response = await tryLocalCache(handler, request)
          if (response && response.ok) {
            return res(response)
          } else {
            rej("no cache match")
          }
        } catch (error) {
          console.error({ error })
          // can't go to network to fetch;  Must reject since wasn't in cache.
          rej(error)
        }
      }
    })
  }
}

//@ DEV DON'T CACHE

if (import.meta.env.DEV) {
  // DEV... For testing the variableCacheNet strategy as desired
  // Can just return true
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

  //----- HTML DOCS ----
  registerRoute(
    ({ request, url }) => {
      const isSameOrigin = self.origin === url.origin
      const isDoc = request.destination === "document"
      // console.log(url.href)

      if (isSameOrigin && isDoc && !url.href?.includes("sw.js")) {
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
          maxEntries: 2000
        })
      ]
    })
  )
}

// @ PROD ROUTES
if (import.meta.env.PROD) {
  let precacheUrls = self.__WB_MANIFEST
  console.log({ precacheUrls })
  // let route404 = location.origin.concat("/404")
  // const FALLBACK_STRATEGY = new CacheFirst()

  precacheAndRoute(precacheUrls)
  // warmStrategyCache({
  //   urls: [route404],
  //   strategy: FALLBACK_STRATEGY
  // })

  //----- HTML DOCS ----
  registerRoute(
    ({ request, url }) => {
      const isSameOrigin = self.origin === url.origin
      const isDoc = request.destination === "document"
      if (isSameOrigin && isDoc) {
        return true
      }
      return false
    },
    new CacheNetworkRace({
      cacheName: "lr-pages",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200]
        }),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 2000
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
    new CacheNetworkRace({
      cacheName: "live-reader-api",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200]
        }),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 2000
        })
      ]
    })
  )

  // Cache CSS, and (non pre-cached JS)
  // registerRoute(
  //   ({ request, url }) => {
  //     const isStyleOrScript =
  //       request.destination === "style" || request.destination === "script"
  //     // const isSameOrigin = self.origin === url.origin
  //     if (isStyleOrScript) {
  //       return true
  //     } else {
  //       return false
  //     }
  //   },
  //   new CacheFirst({
  //     cacheName: "lr-assets",
  //     plugins: [
  //       new CacheableResponsePlugin({ statuses: [200] }),
  //       new ExpirationPlugin({
  //         purgeOnQuotaError: true,
  //         maxEntries: 50
  //       })
  //     ]
  //   })
  // )
  // setCatchHandler(async ({ request }) => {
  //   // The warmStrategyCache recipe is used to add the fallback assets ahead of
  //   // time to the runtime cache, and are served in the event of an error below.
  //   // Use `event`, `request`, and `url` to figure out how to respond, or
  //   // use request.destination to match requests for specific resource types.
  //   switch (request.destination) {
  //     case "document":
  //       return caches.match(route404)

  //     default:
  //       // If we don't have a fallback, return an error response.
  //       return Response.error()
  //   }
  // })
}
// SKIP WAITING prompt comes from the sw update process; Used for updating SW between builds
// self.addEventListener("message", (event) => {
//   console.log(event)
//   if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting()
//   // window.reload();
// })
