import { onCleanup } from "solid-js"

// todo: MAYBE move to a different UI utils file?
/* @===============  UI UTILS   =============   */

export function clickOutside(el: Element, accessor: () => any) {
  const onClick = (e: Event) => !el.contains(e.target as Node) && accessor()?.()
  document.body.addEventListener("click", onClick)
  onCleanup(() => document.body.removeEventListener("click", onClick))
}
