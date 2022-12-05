import {
  createSignal,
  onMount,
  Show,
  createEffect,
  on,
  batch,
  Accessor,
  onCleanup,
  Signal
} from "solid-js"

const [pos, setPos] = createSignal({
  x: "0px",
  y: "0px"
})
const [showFootnote, setShowFootnote] = createSignal(false)
const [footnoteText, setFootnoteText] = createSignal("")
const [lastFocused, setLastFocused] =
  createSignal() as Signal<HTMLElement | null>
let previewCloseButton: HTMLButtonElement //ref

function clickOutside(el: Element, accessor: () => any) {
  const onClick = (e: Event) => !el.contains(e.target as Node) && accessor()?.()
  document.body.addEventListener("click", onClick)
  onCleanup(() => document.body.removeEventListener("click", onClick))
}
function escapeOut(el: Element, accessor: () => any) {
  const onKeypress = (e: KeyboardEvent) => {
    e.key === "Escape" && accessor()?.()
  }
  document.body.addEventListener("keyup", onKeypress)
  onCleanup(() => document.body.removeEventListener("keyup", onKeypress))
}
function closeModal() {
  setShowFootnote(false)
  lastFocused()?.focus()
}
function focusWithinClose(ev: FocusEvent) {
  let currentTarget = ev.currentTarget as Node
  let relatedTaret = ev.relatedTarget as Node
  if (!currentTarget) return
  if (!relatedTaret) return

  if (!currentTarget?.contains(relatedTaret)) {
    closeModal()
  }
}

export function PreviewPane() {
  return (
    <Show when={showFootnote()}>
      <div
        use:clickOutside={closeModal}
        use:escapeOut={closeModal}
        onFocusOut={focusWithinClose}
        style={{ left: pos().x, top: pos().y }}
        id="previewPane"
        class="theText absolute z-30 mx-auto max-h-[50vh]  w-1/3 overflow-y-scroll border border-accent bg-white p-2  shadow shadow-neutral-500"
      >
        <div class="relative h-full w-full">
          <button
            ref={previewCloseButton}
            class="absolute top-0 right-0 text-red-300 hover:text-red-700"
            onClick={() => setShowFootnote(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <div class="p-6" innerHTML={footnoteText()} />
      </div>
    </Show>
  )
}

export function hoverOnCrossReferences() {
  let crossReferences = document.querySelectorAll("a[href*='tn-chunk-'")

  async function populatePreviewPane(e: Event) {
    let target = e.target as HTMLAnchorElement
    let rect = target.getBoundingClientRect()
    let href = target.href
    let url = new URL(href)
    let hashWithoutHashTag = url.hash?.slice(1)
    let parts = url.hash?.split("-")
    let book = parts[2]
    let chapter = parts[3]
    let response: Response
    let text: string

    try {
      response = await fetch(`?book=${book}&chapter=${chapter}`)
      text = await response.text()
    } catch (error) {
      console.error(error)
      return
    }

    const newDom = document.createElement("html")
    newDom.innerHTML = text
    // '[id="#tn-chunk-gen-22-01"] not valid
    let corresponding = newDom.querySelector(`[id="${hashWithoutHashTag}"]`)
    let htmlContainer: any[] = [corresponding]

    let firstSib = corresponding && corresponding.nextElementSibling
    if (!firstSib) return
    getSiblingsUntil(firstSib, "tn-chunk")

    function getSiblingsUntil(node: Element, idToSearch: string) {
      if (node.id && node.id.includes(idToSearch)) {
        return false
      } else {
        htmlContainer.push(node)
        if (!node.nextElementSibling) return
        getSiblingsUntil(node.nextElementSibling, idToSearch)
      }
    }

    let html = htmlContainer.map((el) => el.outerHTML).join("")

    let windowMidPoint = window.innerWidth / 2
    console.log({ rect })
    setShowFootnote(true)
    let previewPane = document.querySelector("#previewPane") //stick in DOM to measure it's vh client height. This runs quickly enough that you won't get some flashing before we position it;
    if (!previewPane) return
    let posX = rect.x > windowMidPoint ? rect.x - 50 + "px" : rect.x + 50 + "px"
    let posY =
      rect.y > window.innerHeight / 2
        ? rect.y - previewPane.clientHeight
        : rect.y + 30
    setPos({
      x: posX,
      y: posY + "px"
    })
    setFootnoteText(html)
    console.log({ corresponding })
    // debugger
    setLastFocused(document.activeElement as HTMLElement)
    previewCloseButton.focus()
  }

  crossReferences.forEach((ref) => {
    ref.addEventListener("mouseover", populatePreviewPane)
    // ref.addEventListener("focus", populatePreviewPane)
  })
}

export function hoverOnFootnotes() {
  let footnotes: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
    'a[href*="footnote-target"]'
  )

  function manageNote(ev: MouseEvent | FocusEvent) {
    let target = ev.target as HTMLAnchorElement
    let rect = target.getBoundingClientRect()
    let last = target.href.split("-").pop()
    setShowFootnote(true)
    setShowFootnote(true)
    let previewPane = document.querySelector("#previewPane") //stick in DOM to measure it's vh client height. This runs quickly enough that you won't get some flashing before we position it;

    if (!previewPane) return
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
    // footnote-caller-1
    // footnote-target-1
    let correspondingA = document.querySelector(
      `a[href*="footnote-caller-${last}"]`
    )
    if (!correspondingA) return
    let parent = correspondingA.parentElement?.parentElement
    let footnoteText = parent ? parent.innerText : ""
    setFootnoteText(footnoteText)
  }

  footnotes.forEach((note) => {
    note.addEventListener("mouseenter", manageNote)
    // note.addEventListener("focus", manageNote)

    // note.addEventListener("mouseout", () => {
    //   setShowFootnote(false)
    // })
    // note.addEventListener("focusout", () => {
    //   setShowFootnote(false)
    // })
  })
}
