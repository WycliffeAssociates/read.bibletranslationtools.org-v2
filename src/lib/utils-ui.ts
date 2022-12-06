import { onCleanup, Setter } from "solid-js"

export function getHtmlWithinSpan(
  node: Element,
  predicate: (element: Element) => Boolean
): string {
  let truthyFunction = predicate
  let htmlBucket: Array<Element> = []

  function recursivelyGatherDomUntil(
    node: Element,
    predicate: (element: Element) => Boolean
  ) {
    if (predicate(node)) {
      return htmlBucket
    } else {
      htmlBucket.push(node)
      let nextNode = node.nextElementSibling as Element
      if (!nextNode) return htmlBucket
      let newPredicate = () => truthyFunction(nextNode)
      recursivelyGatherDomUntil(nextNode, newPredicate)
    }
  }
  recursivelyGatherDomUntil(node, predicate)
  let outerHtml = htmlBucket.map((el) => el.outerHTML).join("")
  return outerHtml
}

/* @===============  CUSTOM SOLID DIRECTIVES  =============   */
export function clickOutside(el: Element, accessor: () => any) {
  const onClick = (e: Event) => !el.contains(e.target as Node) && accessor()?.()
  document.body.addEventListener("click", onClick)
  onCleanup(() => document.body.removeEventListener("click", onClick))
}

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
  let rect = target.getBoundingClientRect()
  previewPaneSetter(true)
  let previewPane = document.querySelector(previewPaneSelector) //stick in DOM to measure it's vh client height. This runs quickly enough that you won't get some flashing before we position it;
  if (!previewPane) return previewPaneSetter(false)
  let windowMidPoint = window.innerWidth / 2
  let posX = rect.x > windowMidPoint ? rect.x - 50 + "px" : rect.x + 50 + "px"
  let posY =
    rect.y > window.innerHeight / 2
      ? rect.y - previewPane.clientHeight
      : rect.y + 30
  setPos({
    x: posX,
    y: posY + "px"
  })
}
