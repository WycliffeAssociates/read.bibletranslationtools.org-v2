import {
  createSignal,
  onMount,
  Show,
  createEffect,
  on,
  batch,
  Accessor
} from "solid-js"
import { SvgDownload, SvgArrow, SvgSearch, SvgBook } from "@components"
import NavButtonLinks from "./NavButtons"
import { FUNCTIONS_ROUTES } from "@lib/routes"
import { get, set } from "idb-keyval"
import type { storeType } from "../ReaderWrapper/ReaderWrapper"
import type { i18nDictKeysType } from "@lib/i18n"

interface ReaderPaneProps {
  storeInterface: storeType
  user: string
  repositoryName: string
  firstBookKey: string
  firstChapterToShow: string
  printWholeBook: Accessor<boolean>
}

export default function ReaderPane(props: ReaderPaneProps) {
  // todo: will use if implmeenting a fetch on demand or fetch later optoins
  const [newerData, setNewerData] = createSignal({
    hasNewerData: false,
    response: null
  })
  // for footnote
  const [pos, setPos] = createSignal({
    x: "0px",
    y: "0px"
  })
  const [showFootnote, setShowFootnote] = createSignal(false)
  const [footnoteText, setFootnoteText] = createSignal("")
  let textRef: HTMLDivElement | undefined

  function setLastPageVisited() {
    return set("lastPageVisited", location.href)
  }
  function hoverOnFootnotes() {
    let footnotes: NodeListOf<HTMLAnchorElement> = document.querySelectorAll(
      'a[href*="footnote-target"]'
    )

    function manageNote(ev: MouseEvent | FocusEvent) {
      let target = ev.target as HTMLAnchorElement
      let rect = target.getBoundingClientRect()
      let last = target.href.split("-").pop()
      setShowFootnote(true)
      setPos({
        x: rect.x + 30 + "px",
        y: rect.y - 80 + "px"
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
      note.addEventListener("focus", manageNote)

      note.addEventListener("mouseout", () => {
        setShowFootnote(false)
      })
      note.addEventListener("focusout", () => {
        setShowFootnote(false)
      })
    })
  }

  createEffect(
    on(
      () => props.storeInterface.getStoreVal("currentChapter"),
      () => {
        preFetchAdjacent()
        hoverOnFootnotes()
      }
    )
  )

  async function preFetchAdjacent() {
    const currentChap =
      props.storeInterface.getStoreVal<string>("currentChapter")
    const currentBook = props.storeInterface.getStoreVal<string>("currentBook")
    const nextCh = Number(currentChap) + 1
    const prevCh = Number(currentChap) - 1
    await fetchReaderHtml({ chapNum: nextCh })
    await fetchReaderHtml({ chapNum: prevCh })
    let currentBookObj = props.storeInterface.currentBookObj()
    let historyBook = currentBookObj?.label || currentBook
    pushHistory(historyBook, currentChap)
  }

  function pushHistory(currentBook: string, currentChap: string) {
    if ("URLSearchParams" in window) {
      let searchParams = new URLSearchParams(window.location.search)
      searchParams.set("book", currentBook)
      searchParams.set("chapter", currentChap)
      let newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString()
      history.pushState(null, "", newRelativePathQuery)
    }
    setLastPageVisited()
  }

  type fetchReaderParams = {
    event?: Event
    navigate?: boolean
    dir?: "BACK" | "FORWARD"
    chapNum?: number
  }
  async function fetchReaderHtml({
    event,
    navigate,
    dir,
    chapNum
  }: fetchReaderParams) {
    event && event.preventDefault()
    const currentBook = props.storeInterface.getStoreVal<string>("currentBook")
    const currentChap =
      props.storeInterface.getStoreVal<string>("currentChapter")

    if (chapNum && chapNum <= 0 && !dir) return
    let nextCh: number | string
    // Decide next chapter, whether given or sequential;
    if (Number(chapNum)) {
      nextCh = Number(chapNum)
    } else if (dir === "BACK") {
      nextCh = Number(currentChap) - 1
    } else {
      nextCh = Number(currentChap) + 1
    }
    // validate chap is gettable;
    if (nextCh > Number(props.storeInterface.maxChapter()) || nextCh <= 0) {
      return
    }
    // Check for existing in memory;
    nextCh = String(nextCh) //all store keys are strings; Nums only for math
    let currentBookObj = props.storeInterface.currentBookObj()
    // handles index offset:
    let existingChap = currentBookObj
      ? props.storeInterface.getChapObjFromGivenBook(
          currentBookObj.slug,
          nextCh
        )
      : null
    let existingText = existingChap?.text //html if put there;
    if (!existingChap) return
    if (existingText && navigate) {
      if (textRef) textRef.scrollTop = 0

      return props.storeInterface.mutateStore("currentChapter", nextCh)
    } else if (existingText) {
      return
    }

    // no existing text -- fetch next html;
    const params = {
      book: currentBook,
      chapter: nextCh
    }

    let text = await props.storeInterface.fetchHtml(params)
    if (!text) return

    // Batch some state updates to notified memos at end of stateful updates
    batch(() => {
      props.storeInterface.mutateStoreText({
        book: currentBook,
        chapter: String(existingChap?.label),
        val: String(text)
      })
      if (navigate) {
        props.storeInterface.mutateStore("currentChapter", String(nextCh))

        if (textRef) textRef.scrollTop = 0
      }
    })

    return
  }
  return (
    <>
      {/* HTML CONTENT */}
      <Show when={!props.printWholeBook()}>
        <Show when={showFootnote()}>
          <div
            class="absolute z-30 mx-auto w-1/3  border border-accent bg-white p-8 shadow shadow-neutral-500"
            style={{ left: pos().x, top: pos().y }}
            innerHTML={footnoteText()}
          ></div>
        </Show>
        <div class="mx-auto h-full max-w-[1400px] px-4">
          <div class="relative flex h-full content-center items-center justify-center gap-2 ">
            <Show
              when={props.storeInterface.getStoreVal("currentChapter") != 1}
              fallback={<NavButtonLinks fallback={true} />}
            >
              <NavButtonLinks
                dir={"BACK"}
                user={props.user}
                repo={props.repositoryName}
                book={props.firstBookKey}
                chapter={Number(props.firstChapterToShow) - 1}
                onClick={(event: Event) =>
                  fetchReaderHtml({ event, navigate: true, dir: "BACK" })
                }
                icon={
                  <SvgArrow className="color-inherit mx-auto fill-current " />
                }
              />
            </Show>
            {/* top buttons */}
            <div
              ref={textRef}
              class="theText mx-auto h-full max-w-[85ch]  overflow-y-scroll bg-inherit pr-1 pt-2 pb-24 text-lg leading-relaxed print:h-min print:break-inside-avoid print:overflow-y-visible  print:pb-4 sm:px-8 md:w-[75ch] "
              innerHTML={props.storeInterface.HTML()}
            />

            {/* lower stuff */}
            <Show
              when={
                props.storeInterface.getStoreVal("currentChapter") !=
                props.storeInterface.maxChapter()
              }
              fallback={<NavButtonLinks fallback={true} />}
            >
              <NavButtonLinks
                dir={"FORWARD"}
                user={props.user}
                repo={props.repositoryName}
                book={props.firstBookKey}
                chapter={Number(props.firstChapterToShow) + 1}
                onClick={(event: Event) => {
                  fetchReaderHtml({ event, navigate: true, dir: "FORWARD" })
                }}
                icon={
                  <SvgArrow className="color-inherit mx-auto rotate-180  fill-current stroke-current" />
                }
              />
            </Show>
          </div>
        </div>
        {/* lower stuff */}
      </Show>

      {/* whole book gets own pane*/}
      <Show when={props.printWholeBook()}>
        <div
          id="wholeBook"
          innerHTML={props.storeInterface.wholeBookHtml()}
          class=" mx-auto  max-w-[85ch]  bg-inherit text-lg leading-relaxed print:pb-4 sm:px-8 md:w-[75ch]"
        />
      </Show>
    </>
  )
}
