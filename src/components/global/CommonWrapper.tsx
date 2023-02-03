import { set } from "idb-keyval"
import type { JSX } from "solid-js"

interface CommonWrapperProps {
  children: JSX.Element
  resourceType: string
}

export default function CommonWrapper(props: CommonWrapperProps) {
  // INSTEAD OF WORRYING ABOUT PASSING PROPS HOWEVER DEEP DOWN TO COMPONENTS IN THE TREE... FOR A FAIRLY SIMPLE BIT OF FUNCTIONALITY TO BE SHARED ACCROSS ANY/ALL COMPONENTS, TYPES.TS DEFINES THE INTERFACE FOR THESE CUSTOM EVENTS. THAT WAY ALL TEMPLATE TYPES CAN JUST CREATE AN EVENT AND FIRE IT OFF FOR THE HISTORY API SW CACHE.  THE SW API CALLS ARE CACHED (WHEN JS IS AVAILABLE), BUT ITS NICE TO HAVE THE CURRENT HTML PAGE ALSO CACHED SINCE THE API RESPONSE IS NOT ENOUGH BY ITSELF TO GENERATE A PAGE IF HAVING GONE OFFLINE.
  function setLastPageVisited(url: string) {
    return set("lastPageVisited", url)
  }
  function addNewPageToSWCache(cacheName: string = "lr-pages", url: string) {
    // console.log("setting cache (if in prod)")
    if (!url) return
    if (import.meta.env.PROD) {
      setTimeout(() => {
        if (typeof window != undefined) {
          caches.open(cacheName).then((cache) => cache.add(url))
        }
      }, 100)
    }
  }

  return (
    <div
      data-resourcetype={`resource-${props.resourceType}`}
      data-testid="page-container"
      id="commonWrapper"
      class={`h-full bg-neutral-50 font-sans resourceType-${props.resourceType}`}
      on:setLastPageVisited={(
        e: CustomEvent<{
          url: string
        }>
      ) => {
        setLastPageVisited(e.detail.url)
      }}
      on:addCurrentPageToSw={(
        e: CustomEvent<{
          cacheName: string | undefined
          url: string
        }>
      ) => {
        addNewPageToSWCache(e.detail.cacheName, e.detail.url)
      }}
    >
      {props.children}
    </div>
  )
}
