import {precacheAndRoute, cleanupOutdatedCaches} from "workbox-precaching";
import {clientsClaim} from "workbox-core";
import {registerRoute} from "workbox-routing";
import {
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  CacheOnly,
  Strategy,
} from "workbox-strategies";
import {CacheableResponsePlugin} from "workbox-cacheable-response";
import {ExpirationPlugin} from "workbox-expiration";
import {get, set} from "idb-keyval";

// Adds an activate event listener which will clean up incompatible precaches that were created by older versions of Workbox.
cleanupOutdatedCaches();

// manually clear all the caches for host for dev:
// console.log("clearing all the caches");
// caches.keys().then((keyList) =>
//   Promise.all(
//     keyList.map((key) => {
//       return caches.delete(key);
//     })
//   )
// );
class variableCacheOrNetwork extends Strategy {
  // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
  // handler: A StrategyHandler instance automatically created for the current strategy.
  // handle(): Perform a request strategy and return a Promise that will resolve with a Response, invoking all relevant plugin callbacks.
  async _handle(request, handler) {
    // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
    return new Promise(async (res, rej) => {
      const cacheStrategy = await get("cacheStrategy");
      if (cacheStrategy === "networkFirst") {
        try {
          // try network
          let response = await handler.fetch(request);
          response && res(response);
          // if no network, check cache;
          if (!response) {
            return handler
              .cacheMatch(request)
              .then((response) => res(response));
          }
        } catch (error) {
          rej(error);
        }
      } else if (cacheStrategy === "cacheFirst" || !cacheStrategy) {
        try {
          // cache first
          let response = await handler.cacheMatch(request);
          // network fallback
          if (!response) {
            res(handler.fetch(request));
          } else {
            let clone = response.clone();
            // let data = await response.text();
            // console.log(data);
            console.log("handler cache match");
            res(clone);
          }
        } catch (error) {
          rej(error);
        }
      } else if (cacheStrategy === "cacheOnly") {
        try {
          // cache only
          let response = await handler.cacheMatch(request);
          response && res(response);
          if (import.meta.env.DEV) {
            res(handler.fetch(request));
          } else {
            rej("No cache match");
          }
        } catch (error) {
          rej(error);
        }
      }
    });
  }
}

//@ DEV DON'T CACHE
if (import.meta.env.DEV) {
  console.log(import.meta.env);
  // Avoid caching on dev: force always go to the server
  registerRoute(
    ({request, url}) => {
      if (url.href.includes("/api/")) {
        return false;
      }
      if (request.mode == "navigate") return false;
      return true;
    },
    new NetworkFirst({
      cacheName: "all-dev",
      // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    })
  );
  registerRoute(
    ({request, url}) => {
      if (request.mode == "navigate") return true;
    },
    // new NetworkFirst({
    //   cacheName: "all-dev",
    //   // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    // })
    new variableCacheOrNetwork()
  );
  registerRoute(
    ({request, url}) => {
      if (url.href.includes("/api/")) {
        console.log("api request!");
        return true;
      }
    },
    // new NetworkFirst({
    //   cacheName: "all-dev-api",
    //   // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    // })
    new variableCacheOrNetwork()
  );
}

// @ PROD ROUTES
if (import.meta.env.PROD) {
  // // todo:   remove test:  This is just to log out the manifest and see what it is:

  let test = self.__WB_MANIFEST;
  console.log({test});
  // todo: see about this 404 needing a revision?
  let route404 = location.origin.concat("/404");
  let page404 = {url: route404};
  precacheAndRoute([...test, page404]);

  //----- HTML DOCS
  registerRoute(
    ({request, url}) => {
      const isSameOrigin = self.origin === url.origin;
      const isDoc = request.destination === "document";

      // request.headers.forEach(function (val, key) {
      //   console.log(key + " -> " + val);
      // });

      if (isSameOrigin && isDoc) {
        return true;
      }
      // return request.mode === "navigate";
      return false;
    },
    new NetworkFirst({
      cacheName: "lr-pages",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200],
        }),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 500,
        }),
      ],
    })
  );
  // # API / Serverless responses
  registerRoute(
    ({request, url}) => {
      if (url.href.includes("/api/")) {
        return true;
      }
    },
    // new NetworkFirst({
    //   cacheName: "all-dev-api",
    //   // plugins: [new CacheableResponsePlugin({statuses: [-1]})],
    // })
    new variableCacheOrNetwork({
      cacheName: "live-reader-api",
    })
  );

  // Cache CSS, and (non pre-cached JS)
  registerRoute(
    ({request}) => {
      const isStyleOrScript =
        request.destination === "style" || request.destination === "script";
      const isSameOrigin = self.origin === url.origin;
      if (isSameOrigin && isStyleOrScript) {
        return true;
      } else {
        return false;
      }
    },
    new StaleWhileRevalidate({
      cacheName: "lr-assets",
      plugins: [
        new CacheableResponsePlugin({statuses: [200]}),
        new ExpirationPlugin({
          purgeOnQuotaError: true,
          maxEntries: 30,
        }),
      ],
    })
  );

  // 404 page:
  registerRoute(
    ({request, url}) => {
      const isSameOrigin = self.origin === url.origin;
      const is404 = url.href === location.origin.concat("/404");
      if (isSameOrigin && is404) {
        console.log("caching 404!");
        return true;
      }
      // return request.mode === "navigate";
      return false;
    },
    new StaleWhileRevalidate({
      cacheName: "astro-pages-404",
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200],
        }),
      ],
    })
  );

  // SKIP WAITING prompt comes from the sw update process; Used for updating SW between builds
  self.addEventListener("message", (event) => {
    console.log(event);
    if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
    // window.reload();
  });
}
