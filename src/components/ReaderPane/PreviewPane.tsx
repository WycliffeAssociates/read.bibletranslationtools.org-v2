import { createSignal, Show, Signal } from "solid-js"
import {
  clickOutside,
  escapeOut,
  positionPreviewPane,
  getHtmlWithinSpan
} from "@lib/utils-ui"
import { getCommentarySectionHtml } from "@lib/api"

const [pos, setPos] = createSignal({
  x: "0px",
  y: "0px"
})
const [showFootnote, setShowFootnote] = createSignal(false)
const [footnoteText, setFootnoteText] = createSignal("")
const [lastFocused, setLastFocused] =
  createSignal() as Signal<HTMLElement | null>
let previewCloseButton: HTMLButtonElement //ref

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
  // these are hacks to keep typescript from stripping away "unused imports"
  // @ts-ignore
  const clickout = clickOutside
  // @ts-ignore
  const escape = escapeOut
  return (
    <Show when={showFootnote()}>
      <div
        use:clickOutside={() => closeModal()}
        use:escapeOut={() => closeModal()}
        onFocusOut={focusWithinClose}
        style={{ left: pos().x, top: pos().y }}
        id="previewPane"
        class="theText absolute z-30 mx-auto max-h-[50vh]  w-1/2 overflow-y-auto border border-accent bg-white p-2 shadow  shadow-neutral-500 md:w-1/3"
      >
        <div class="relative h-full w-full">
          <button
            data-testid="closePreviewPane"
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
  let crossReferences = document.querySelectorAll("a[data-crossref='true']")

  async function populatePreviewPane(e: Event) {
    let target = e.target as HTMLAnchorElement
    let hashWithoutHashTag = target.dataset.hash
    let book = target.dataset.book
    let chapter = target.dataset.chapter
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
    if (!corresponding) return
    // let htmlContainer: any[] = [corresponding]

    function truthyFunction(node: Element) {
      return (
        !!node.id &&
        node.id !== hashWithoutHashTag &&
        node.id.includes("tn-chunk")
      )
    }
    let html = getHtmlWithinSpan(corresponding, truthyFunction)
    setFootnoteText(html)

    // positionion logic:
    positionPreviewPane({
      target,
      previewPaneSelector: "#previewPane",
      previewPaneSetter: setShowFootnote,
      setPos
    })

    // manage focus
    setLastFocused(document.activeElement as HTMLElement)
    previewCloseButton.focus()
  }

  crossReferences.forEach((ref) => {
    ref.addEventListener("mouseover", populatePreviewPane)
    // ref.addEventListener("focus", populatePreviewPane)
  })
}
export function hoverOnCommentaryCrossReferences(user: string, repo: string) {
  if (!document.querySelector("[data-resourcetype*='commentary']")) return
  console.log("checking for commmentary popups")
  let commentaryPopups = document.querySelectorAll("a[href*='popup']")
  commentaryPopups.forEach((link) => link.addEventListener("click", manageLink))
  commentaryPopups.forEach((link) =>
    link.addEventListener("mouseover", manageLink)
  )

  async function manageLink(e: Event) {
    e?.preventDefault()
    let target = e.target as HTMLAnchorElement
    let href = target.href
    let fileParts = href.split("popup://")
    let file = fileParts[1]
    let text: string | undefined
    try {
      text = await getCommentarySectionHtml({ file, user, repo })
      if (!text) return
    } catch (error) {
      return
    }
    // set new text
    setFootnoteText(text)
    // positionion logic:
    positionPreviewPane({
      target,
      previewPaneSelector: "#previewPane",
      previewPaneSetter: setShowFootnote,
      setPos
    })
    setLastFocused(document.activeElement as HTMLElement)
    previewCloseButton.focus()

    // To hook up links inside of the preview pane:
    let previewPane = document.querySelector("#previewPane")
    if (!previewPane) return
    let commentaryPopups = previewPane?.querySelectorAll("a[href*='popup']")
    // if (!commentaryPopups.length) return
    commentaryPopups.forEach((link) => {
      link.addEventListener("click", manageLink)
    })
  }
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
