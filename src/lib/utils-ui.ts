import { onCleanup, Setter } from "solid-js"

/* @===============  UI UTILS   =============   */

export function getHtmlWithinSpan(
  node: Element,
  predicate: (element: Element) => boolean
): string {
  const truthyFunction = predicate
  const htmlBucket: Array<Element> = []

  function recursivelyGatherDomUntil(
    node: Element,
    predicate: (element: Element) => boolean
  ) {
    if (predicate(node)) {
      return htmlBucket
    } else {
      htmlBucket.push(node)
      const nextNode = node.nextElementSibling as Element
      if (!nextNode) return htmlBucket
      const newPredicate = () => truthyFunction(nextNode)
      recursivelyGatherDomUntil(nextNode, newPredicate)
    }
  }
  recursivelyGatherDomUntil(node, predicate)
  const outerHtml = htmlBucket.map((el) => el.outerHTML).join("")
  return outerHtml
}

/* @===============  CUSTOM SOLID DIRECTIVES  =============   */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clickOutside(el: Element, accessor: () => any) {
  const onClick = (e: Event) => !el.contains(e.target as Node) && accessor()?.()
  document.body.addEventListener("click", onClick)
  onCleanup(() => document.body.removeEventListener("click", onClick))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function escapeOut(el: Element, accessor: () => any) {
  const onKeypress = (e: KeyboardEvent) => {
    e.key === "Escape" && accessor()?.()
  }
  document.body.addEventListener("keyup", onKeypress)
  onCleanup(() => document.body.removeEventListener("keyup", onKeypress))
}

interface positionPreviewPaneParams {
  target: HTMLElement
  previewPaneSelector: string
  previewPaneSetter: Setter<boolean>
  setPos: Setter<{
    x: string
    y: string
  }>
}
export function positionPreviewPane({
  target,
  previewPaneSelector,
  previewPaneSetter,
  setPos
}: positionPreviewPaneParams) {
  const rect = target.getBoundingClientRect()
  previewPaneSetter(true)
  const previewPane = document.querySelector(previewPaneSelector) //stick in DOM to measure it's vh client height. This runs quickly enough that you won't get some flashing before we position it;
  if (!previewPane) return previewPaneSetter(false)
  const windowMidPoint = window.innerWidth / 2
  const posX = rect.x > windowMidPoint ? rect.x - 50 + "px" : rect.x + 50 + "px"
  const posY =
    rect.y > window.innerHeight / 2
      ? rect.y - previewPane.clientHeight
      : rect.y + 30
  setPos({
    x: posX,
    y: posY + "px"
  })
}
export function debounce(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (...params: any[]) => void,
  wait: number
) {
  let timeoutId: number | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback(...args)
    }, wait)
  }
}
