import {
  createSignal,
  onMount,
  Show,
  createEffect,
  on,
  batch,
  Accessor
  // onCleanup
} from "solid-js"
import { SvgArrow } from "@components"
import NavButtonLinks from "./NavButtons"
import { set } from "idb-keyval"
import type { storeType } from "../ReaderWrapper/ReaderWrapper"
import {
  PreviewPane,
  hoverOnCrossReferences,
  hoverOnFootnotes,
  hoverOnCommentaryCrossReferences
} from "./PreviewPane"

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
  let textRef: HTMLDivElement | undefined
  // for footnote

  // todo: extract to shared ui Utils and run on the layout level:
  function setLastPageVisited() {
    return set("lastPageVisited", location.href)
  }

  createEffect(
    on(
      () => props.storeInterface.getStoreVal("currentChapter"),
      () => {
        preFetchAdjacent()
        hoverOnFootnotes()
        hoverOnCrossReferences()
        hoverOnCommentaryCrossReferences(props.user, props.repositoryName)
        pushHistory(
          props.storeInterface.getStoreVal("currentBook"),
          props.storeInterface.getStoreVal("currentChapter")
        )
      }
    )
  )
  onMount(() => {
    window.addEventListener("popstate", (e) => {
      // todo: add popstate logic  to other templates or at layout level?
      let params = new URLSearchParams(location.search)
      let chapter = params.get("chapter")
      if (chapter) {
        fetchReaderHtml({
          navigate: true,
          chapNum: chapter
        })
      }
    })
  })
  // onCleanup(() => {

  // })

  async function preFetchAdjacent() {
    const currentChap =
      props.storeInterface.getStoreVal<string>("currentChapter")

    const nextCh = Number(currentChap) + 1
    const prevCh = Number(currentChap) - 1
    await fetchReaderHtml({ chapNum: nextCh })
    await fetchReaderHtml({ chapNum: prevCh })
  }

  function pushHistory(currentBook: string, currentChap: string) {
    if ("URLSearchParams" in window) {
      let searchParams = new URLSearchParams(window.location.search)
      searchParams.set("book", currentBook)
      searchParams.set("chapter", currentChap)
      let newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString()
      document.title = `${props.repositoryName}-${currentBook}-${currentChap}`
      history.pushState(null, "", newRelativePathQuery)
    }
    setLastPageVisited()
  }

  type fetchReaderParams = {
    event?: Event
    navigate?: boolean
    dir?: "BACK" | "FORWARD"
    chapNum?: number | string
  }
  async function fetchReaderHtml({
    event,
    navigate,
    dir,
    chapNum
  }: fetchReaderParams) {
    event && event.preventDefault()
    const currentBook = props.storeInterface.getStoreVal<string>("currentBook")

    if (chapNum && chapNum <= 0 && !dir) return
    let nextCh: number | string | undefined
    // Decide next chapter, whether given or sequential;
    if (chapNum) {
      nextCh = chapNum
    } else if (dir === "BACK") {
      nextCh = props.storeInterface.navLinks()?.prev
    } else {
      nextCh = props.storeInterface.navLinks()?.next
    }
    // return if navLinks didn't return a valid nextCh
    if (!nextCh) {
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
        <PreviewPane />
        <div class="mx-auto h-full w-full max-w-[1400px] px-4">
          <div class="relative flex h-full content-center items-center justify-center gap-2 ">
            <Show
              when={props.storeInterface.navLinks()?.prev}
              fallback={<NavButtonLinks fallback={true} />}
            >
              <NavButtonLinks
                dir={"BACK"}
                user={props.user}
                repo={props.repositoryName}
                book={props.firstBookKey}
                // chapter={ Number(props.firstChapterToShow) - 1}
                chapter={props.storeInterface.navLinks()?.prev}
                onClick={(event: Event) => {
                  fetchReaderHtml({ event, navigate: true, dir: "BACK" })
                }}
                icon={
                  <SvgArrow className="color-inherit mx-auto fill-current ltr:rotate-0 rtl:rotate-180" />
                }
              />
            </Show>
            {/* top buttons */}
            <div
              ref={textRef}
              class="theText mx-auto h-full max-w-[85ch]  overflow-y-scroll bg-inherit pr-1 pt-2 pb-24 text-lg leading-relaxed print:h-min  print:overflow-y-visible  print:pb-4 sm:px-8 md:max-w-[75ch] "
              innerHTML={props.storeInterface.HTML()}
            />

            {/* lower stuff */}
            <Show
              when={props.storeInterface.navLinks()?.next}
              fallback={<NavButtonLinks fallback={true} />}
            >
              <NavButtonLinks
                dir={"FORWARD"}
                user={props.user}
                repo={props.repositoryName}
                book={props.firstBookKey}
                chapter={props.storeInterface.navLinks()?.next}
                onClick={(event: Event) => {
                  fetchReaderHtml({ event, navigate: true, dir: "FORWARD" })
                }}
                icon={
                  <SvgArrow className="color-inherit mx-auto fill-current stroke-current ltr:rotate-180 rtl:rotate-0" />
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
          class=" theText  mx-auto  max-w-[85ch] bg-inherit text-lg leading-relaxed print:pb-4 sm:px-8 md:max-w-[75ch]"
        />
      </Show>
    </>
  )
}
