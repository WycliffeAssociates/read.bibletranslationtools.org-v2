/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { clientsClaim } from "workbox-core"
import { registerRoute } from "workbox-routing"
import { NetworkFirst, Strategy, CacheFirst } from "workbox-strategies"
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { ExpirationPlugin } from "workbox-expiration"
import { get } from "idb-keyval"
import type { StrategyHandler } from "workbox-strategies"

declare const self: ServiceWorkerGlobalScope

// Adds an activate event listener which will clean up incompatible precaches that were created by older versions of Workbox.
self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

async function tryNetwork(handler: StrategyHandler, request: Request) {
  try {
    const response = await handler.fetchAndCachePut(request)
    if (response && response.ok) {
      return response
    }
  } catch (error) {
    console.error(error)
    return
  }
}
async function tryLocalCache(handler: StrategyHandler, request: Request) {
  try {
    // cache first
    const response = await handler.cacheMatch(request)
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
  _handle(
    request: Request,
    handler: StrategyHandler
  ): Promise<Response | undefined> {
    const isPagesReq =
      request.mode == "navigate" && this.cacheName == "lr-pages"
    function regularRace(
      resolve: (
        value: Response | PromiseLike<Response | undefined> | undefined
      ) => void,
      reject: (reason?: unknown) => void
    ) {
      const fetchAndCachePutDone = handler.fetchAndCachePut(request)
      const cacheMatchDone = handler.cacheMatch(request)

      cacheMatchDone.then((response) => response && resolve(response))
      fetchAndCachePutDone.then(resolve)

      // Reject if both network and cache error or find no response.
      Promise.allSettled([fetchAndCachePutDone, cacheMatchDone]).then(
        (results) => {
          const [fetchAndCachePutResult, cacheMatchResult] = results
          if (
            fetchAndCachePutResult.status === "rejected" &&
            !cacheMatchResult
          ) {
            reject(fetchAndCachePutResult.reason)
          }
        }
      )
    }

    return new Promise((resolve, reject) => {
      if (isPagesReq) {
        const url = new URL(request.url)
        let pathname = url.pathname
        if (pathname.lastIndexOf("/") === pathname.length - 1) {
          pathname = pathname.slice(0, -1)
        }
        const urlCompleteWithSearchParams = `${url.origin}${pathname}/complete`
        handler.cacheMatch(urlCompleteWithSearchParams).then((successVal) => {
          if (successVal) {
            resolve(successVal)
          } else {
            regularRace(resolve, reject)
          }
        })
      } else regularRace(resolve, reject)
    })
  }
}

// todo: debug this. Having to use race strategy right now instead of giving variable run time control
// todo: maybe instead of a custom strategy, see if you can read Index DB and use the outtheBox strategies to respond.
// https://developer.chrome.com/docs/workbox/modules/workbox-strategies/#advanced-usage
// On a throttled network, this consistetly has issues: Will need further troubleshooting.
class variableCacheOrNetwork extends Strategy {
  // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
  // handler: A StrategyHandler instance automatically created for the current strategy.
  // handle(): Perform a request strategy and return a Promise that will resolve with a Response, invoking all relevant plugin callbacks.
  async _handle(
    request: Request,
    handler: StrategyHandler
  ): Promise<Response | undefined> {
    // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
    return new Promise(async (res, rej) => {
      const cacheStrategy = await get("cacheStrategy")
      if (cacheStrategy === "networkFirst" || !cacheStrategy) {
        const response = await tryNetwork(handler, request)
        if (response && response.ok) {
          return res(response)
        } else {
          const resp = await tryLocalCache(handler, request)
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
          const resp = tryNetwork(handler, request)
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
    ({ request }) => {
      if (request.mode == "navigate") return true
    },
    new NetworkFirst({
      cacheName: "all-dev"
      // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    })
    // new CacheFirst({
    //   cacheName: "lr-pages"
    //   // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    // })
    // new CacheNetworkRace({
    //   cacheName: "lr-pages"
    // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    // })
  )

  //----- HTML DOCS ----
  registerRoute(
    ({ request, url }) => {
      const isSameOrigin = self.origin === url.origin
      const isDoc = request.destination === "document"

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
          maxEntries: 50000
        })
      ]
    })
  )
}

// @ PROD ROUTES
if (import.meta.env.PROD) {
  const precacheUrls = self.__WB_MANIFEST

  precacheAndRoute(precacheUrls)

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
          maxEntries: 50000
        })
      ]
    })
  )
  // # API / Serverless responses
  registerRoute(
    ({ url }) => {
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
          maxEntries: 50000
        })
      ]
    })
  )

  // images
  registerRoute(
    ({ request, sameOrigin }) => {
      return sameOrigin && request.destination === "image"
    },
    new CacheFirst({
      cacheName: "live-reader-assets",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200]
        }),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 25
        })
      ]
    })
  )
}
