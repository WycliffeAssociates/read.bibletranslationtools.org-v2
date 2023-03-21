import { createSignal, createMemo, createEffect, on, Show } from "solid-js"
import type { twProps } from "@src/customTypes/types"
import { getTwSchemaHtml } from "@lib/api"
import {
  getHtmlWithinSpan,
  clickOutside,
  escapeOut,
  positionPreviewPane
} from "@lib/utils-ui"
import { BeyondSmallNav, MobileTwNav } from "./TwNav"
// these are hacks to keep typescript from stripping away "unused imports" the actual names are unimportant; These are solid custom directives;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const clickout = clickOutside
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const escape = escapeOut

export default function TranslationWords(props: twProps) {
  const [searchTerm, setSearchTerm] = createSignal("")
  const [sectionsHTML, setSectionsHTML] = createSignal({
    [props.initialPage]: props.initialHtml ? props.initialHtml : undefined
  })
  const [activeSection, setActiveSection] = createSignal(props.initialPage)
  const [pos, setPos] = createSignal({
    x: "0px",
    y: "0px"
  })
  const [showPreviewPane, setShowPreviewPane] = createSignal(false)
  const [previewPaneHtml, setpreviewPaneHtml] = createSignal("")

  const allWords = () => {
    const wordsList: Array<{
      slug: string
      label: string
      section: string
    }> = []
    props.repoIndex.words?.forEach((word) => {
      word.words.forEach((single) => {
        wordsList.push({
          section: word.slug,
          slug: single.slug,
          label: single.label
        })
        return
      })
    })
    wordsList.sort((first, second) => {
      const firstLabel = first.label.toUpperCase()
      const secondLabel = second.label.toUpperCase()
      return firstLabel > secondLabel ? 1 : firstLabel < secondLabel ? -1 : 0
    })
    return wordsList
  }

  const filteredWords = createMemo(() => {
    return allWords().filter(
      (word) =>
        word.slug.toLowerCase().includes(searchTerm().toLowerCase().trim()) ||
        word.label.toLowerCase().includes(searchTerm().toLowerCase().trim())
    )
  })
  function searchWords(event: Event) {
    const target = event.target as HTMLInputElement
    setSearchTerm(target.value)
  }
  async function fetchSectionAndNav(
    event: Event,
    section: string,
    hash: string
  ) {
    if (sectionsHTML()[section] && activeSection() == section) {
      return //same 'page' hash scroll;
    }
    event.preventDefault()
    //  loaded page, not active one:
    if (sectionsHTML()[section]) {
      setActiveSection(section)
      document.getElementById(hash)?.scrollIntoView()
    }
    // not loaded page

    const text = await fetchSection(section)

    if (text) {
      const current = sectionsHTML()
      const newVal = {
        ...current,
        [section]: text
      }
      setSectionsHTML(newVal)
    }
    setActiveSection(section)
    document.getElementById(hash)?.scrollIntoView()
  }
  async function fetchSection(section: string) {
    try {
      const newHTML = await getTwSchemaHtml({
        navSection: section,
        user: props.user,
        repo: props.repo
      })
      if (!newHTML) {
        throw new Error("no html returned")
      } else {
        return newHTML
      }
    } catch (error) {
      console.error(error)
      return
    }
  }

  function hoverOnCrossReferences() {
    const crossReferences = document.querySelectorAll(
      "a[data-crossref='true']"
    ) as NodeListOf<HTMLElement>

    const memoryDom = document.createElement("html")
    crossReferences.forEach((ref) => {
      const section = String(ref.dataset?.section)
      const hash = String(ref.dataset?.hash)
      ref.addEventListener("click", (ev) => {
        setShowPreviewPane(false)
        fetchSectionAndNav(ev, section, hash)
      })
      ref.addEventListener("mouseover", async (event) => {
        // GENERATE A DOM FROM AN
        const existingHtml = sectionsHTML()[section]
        if (existingHtml) {
          memoryDom.innerHTML = existingHtml
        } else {
          const newSectionText = await fetchSection(section)
          if (!newSectionText) return
          // we had to fetch, so go ahead and stick in memory
          const current = sectionsHTML()
          const newVal = {
            ...current,
            [section]: newSectionText
          }
          setSectionsHTML(newVal)
          memoryDom.innerHTML = newSectionText
        }

        // Get and Set html
        const firstElWithHashId = memoryDom.querySelector(`#${hash}`)

        const firstSib =
          firstElWithHashId && firstElWithHashId.nextElementSibling
        if (!firstSib) return
        function truthyFunction(htmlNode: Element) {
          return (
            !!htmlNode.id &&
            !!htmlNode.previousElementSibling &&
            htmlNode.previousElementSibling.tagName === "HR"
          )
        }
        const previewPaneHtml = getHtmlWithinSpan(firstSib, truthyFunction)
        setpreviewPaneHtml(previewPaneHtml)

        // show and position:
        const target = event.target as HTMLAnchorElement
        positionPreviewPane({
          target,
          previewPaneSelector: "#previewPane",
          previewPaneSetter: setShowPreviewPane,
          setPos
        })
        // reset memory dom
        memoryDom.innerHTML = ""
      })
    })
  }

  createEffect(
    on([sectionsHTML], () => {
      hoverOnCrossReferences()
    })
  )

  return (
    <>
      <Show when={showPreviewPane()}>
        <div
          use:clickOutside={() => setShowPreviewPane(false)}
          use:escapeOut={() => setShowPreviewPane(false)}
          id="previewPane"
          class="theText absolute z-30 mx-auto max-h-[50vh]  w-1/2 overflow-y-scroll border border-accent bg-white p-2 shadow  shadow-neutral-500 lg:w-2/5 "
          style={{ left: pos().x, top: pos().y }}
        >
          <div class="relative h-full w-full">
            <button
              // ref={previewCloseButton}
              class="absolute top-0 right-0 text-red-300 hover:text-red-700"
              onClick={() => setShowPreviewPane(false)}
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
          <div class="p-6" innerHTML={previewPaneHtml()} />
        </div>
      </Show>
      <div class="theTextWrapper h-full px-2  print:h-min print:overflow-y-visible sm:pl-4 sm:pr-0">
        <div class="relative h-full overflow-y-scroll   sm:flex ">
          <div
            class="theText tw-theText h-full w-full scroll-pt-16 overflow-y-scroll pt-16  sm:w-4/5 sm:scroll-pt-0  sm:pt-0"
            innerHTML={sectionsHTML()[activeSection()]}
          />
          <div class=" sm:hidden">
            <MobileTwNav
              filteredWords={filteredWords}
              fetchSectionAndNav={fetchSectionAndNav}
              searchWords={searchWords}
            />
          </div>
          <div class="customScrollBar sticky top-0 right-0 ml-auto  hidden h-full w-1/5 overflow-y-auto print:hidden sm:block">
            <BeyondSmallNav
              filteredWords={filteredWords}
              fetchSectionAndNav={fetchSectionAndNav}
              searchWords={searchWords}
            />
          </div>
        </div>
      </div>
    </>
  )
}
