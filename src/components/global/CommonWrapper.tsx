import { set } from "idb-keyval"
import type { JSX } from "solid-js"

interface CommonWrapperProps {
  children: JSX.Element
  resourceType: string
}

export default function CommonWrapper(props: CommonWrapperProps) {
  /* 
  instead of worrying about passing props however deep down to components in the tree... for a fairly simple bit of functionality to be shared accross any/all components, types.ts defines the interface for these custom events. that way all template types can just create an event and fire it off for the history api or sw cache.  the sw api calls are cached (when js is available), but its nice to have the current html page also cached since the api response is not enough by itself to generate a page if having gone offline.
  */
  function setLastPageVisited(url: string) {
    return set("lastPageVisited", url)
  }

  return (
    <div
      data-resourcetype={`resource-${props.resourceType}`}
      data-testid="page-container"
      id="commonWrapper"
      class={` bg-neutral-50 font-sans resourceType-${props.resourceType}`}
      on:setLastPageVisited={(
        e: CustomEvent<{
          url: string
        }>
      ) => {
        setLastPageVisited(e.detail.url)
      }}
    >
      {props.children}
    </div>
  )
}
