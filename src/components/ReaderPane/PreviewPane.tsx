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
const [mousedIn, setMousedIn] = createSignal(false)
const [showFootnote, setShowFootnote] = createSignal(false)
const [footnoteText, setFootnoteText] = createSignal("")
const [currentScrollTop, setCurrentScrollTop] = createSignal(0)
const [lastFocused, setLastFocused] =
  createSignal() as Signal<HTMLElement | null>
const previewPaneDebounceWait = 375
let previewCloseButton: HTMLButtonElement //ref

function closeModal() {
  setShowFootnote(false)
  lastFocused()?.focus()
  setMousedIn(false)
  setCurrentScrollTop(0)
}
function focusWithinClose(ev: FocusEvent) {
  const currentTarget = ev.currentTarget as Node
  const relatedTaret = ev.relatedTarget as Node
  if (!currentTarget) return
  if (!relatedTaret) return

  if (!currentTarget?.contains(relatedTaret)) {
    closeModal()
  }
}
function reactToScrollingWhenNoteIsOpen(amount: number) {
  if (!showFootnote()) {
    return
  }
  const diffFromStart = Math.abs(amount - currentScrollTop())
  if (diffFromStart > 100) {
    closeModal()
  }
}

export function PreviewPane() {
  // these are hacks to keep typescript from stripping away "unused imports"
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clickout = clickOutside
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const escape = escapeOut
  return (
    <Show when={showFootnote()}>
      <div
        on:notifiedOfScrollTop={(
          e: CustomEvent<{
            amount: number
          }>
        ) => {
          reactToScrollingWhenNoteIsOpen(e.detail.amount)
        }}
        use:clickOutside={() => closeModal()}
        use:escapeOut={() => closeModal()}
        onFocusOut={focusWithinClose}
        style={{ left: pos().x, top: pos().y }}
        id="previewPane"
        class="theText absolute z-[100] mx-auto max-h-[50vh]  w-1/2 overflow-y-auto border border-accent bg-white p-2 shadow  shadow-neutral-500 md:w-1/3"
      >
        <div class="relative h-full w-full">
          <button
            data-testid="closePreviewPane"
            ref={previewCloseButton}
            class="absolute right-0 top-0 text-red-300 hover:text-red-700"
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
  const crossReferences = document.querySelectorAll("a[data-crossref='true']")

  function managePreviewPane(e: Event) {
    setMousedIn(true)
    setTimeout(() => {
      const scrollPane = document.querySelector('[data-js="scrollToTop"]')
      if (scrollPane) {
        setCurrentScrollTop(scrollPane.scrollTop)
      }
      populatePreviewPane()
    }, previewPaneDebounceWait)

    async function populatePreviewPane() {
      if (!mousedIn()) {
        return
      }
      const target = e.target as HTMLAnchorElement
      const hashWithoutHashTag = target.dataset.hash
      const book = target.dataset.book
      const chapter = target.dataset.chapter
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
      const corresponding = newDom.querySelector(`[id="${hashWithoutHashTag}"]`)
      if (!corresponding) return
      function truthyFunction(node: Element) {
        return (
          !!node.id &&
          node.id !== hashWithoutHashTag &&
          node.id.includes("tn-chunk")
        )
      }
      const html = getHtmlWithinSpan(corresponding, truthyFunction)
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
  }

  crossReferences.forEach((ref) => {
    ref.addEventListener("mouseover", managePreviewPane)
    ref.addEventListener("mouseout", () => {
      setMousedIn(false)
    })
  })
}
export function hoverOnCommentaryCrossReferences(user: string, repo: string) {
  if (!document.querySelector("[data-resourcetype*='commentary']")) return

  const commentaryPopups = document.querySelectorAll("a[href*='popup']")
  commentaryPopups.forEach((link) => {
    link.addEventListener("click", manageLink)
    link.addEventListener("mouseenter", manageLink)
    link.addEventListener("mouseout", () => {
      setMousedIn(false)
    })
  })
  async function activateLink(e: Event) {
    if (e.type == "mouseenter" && !mousedIn()) return
    e?.preventDefault()
    const target = e.target as HTMLAnchorElement
    const href = target.href
    const fileParts = href.split("popup://")
    const file = fileParts[1]
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
    const previewPane = document.querySelector("#previewPane")
    if (!previewPane) return
    const commentaryPopups = previewPane?.querySelectorAll("a[href*='popup']")
    commentaryPopups.forEach((link) => {
      link.addEventListener("click", manageLink)
    })
  }
  async function manageLink(e: Event) {
    if (e.type == "mouseenter") {
      setMousedIn(true)
      setTimeout(() => {
        activateLink(e)
      }, previewPaneDebounceWait)
    }
  }
}
export function hoverOnFootnotes() {
  const footnotes: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
    'a[href*="footnote-target"]'
  )
  function manageNote(ev: MouseEvent | FocusEvent) {
    if (ev.type == "mouseenter") {
      setMousedIn(true)
      setTimeout(() => {
        doHoverNote()
      }, previewPaneDebounceWait)
    }
    function doHoverNote() {
      if (!mousedIn()) return
      const target = ev.target as HTMLAnchorElement
      const rect = target.getBoundingClientRect()
      const last = target.href.split("-").pop()
      setShowFootnote(true)
      setShowFootnote(true)
      const previewPane = document.querySelector("#previewPane") //stick in DOM to measure it's vh client height. This runs quickly enough that you won't get some flashing before we position it;

      if (!previewPane) return
      const windowMidPoint = window.innerWidth / 2
      const posX =
        rect.x > windowMidPoint ? rect.x - 50 + "px" : rect.x + 50 + "px"
      const posY =
        rect.y > window.innerHeight / 2
          ? rect.y - previewPane.clientHeight
          : rect.y + 30
      setPos({
        x: posX,
        y: posY + "px"
      })
      const correspondingA = document.querySelector(
        `a[href*="footnote-caller-${last}"]`
      )
      if (!correspondingA) return
      const parent = correspondingA.parentElement?.parentElement
      const footnoteText = parent ? parent.innerText : ""
      setFootnoteText(footnoteText)
    }
  }

  footnotes.forEach((note) => {
    note.addEventListener("mouseenter", manageNote)
    note.addEventListener("mouseout", () => {
      setMousedIn(false)
    })
    note.addEventListener("focusout", () => setMousedIn(false))
  })
}
