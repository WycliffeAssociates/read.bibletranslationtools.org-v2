import { createSignal, onMount, Show, createEffect, on, batch } from "solid-js"
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
}

export default function ReaderPane(props: ReaderPaneProps) {
  // todo: will use if implmeenting a fetch on demand or fetch later optoins
  const [newerData, setNewerData] = createSignal({
    hasNewerData: false,
    response: null
  })
  let textRef: HTMLDivElement | undefined

  createEffect(
    on(
      () => props.storeInterface.getStoreVal("currentChapter"),
      preFetchAdjacent
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
    pushHistory(currentBook, currentChap)
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
    <div class="h-full px-4">
      <div class="relative flex h-full content-center items-center justify-center gap-2 sm:pt-4">
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
            icon={<SvgArrow className="color-inherit mx-auto fill-current " />}
          />
        </Show>

        <div id="portalLocation"></div>
        {/* HTML CONTENT */}
        <div
          ref={textRef}
          class="theText mx-auto h-full  max-w-[85ch] overflow-y-scroll bg-inherit pt-2 pb-24 text-lg leading-relaxed print:overflow-y-visible sm:px-8 md:w-[75ch] "
          innerHTML={props.storeInterface.HTML()}
        />
        {/* HTML CONTENT */}
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
  )
}
