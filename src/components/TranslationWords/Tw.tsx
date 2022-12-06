import { createSignal, createMemo, createEffect, on, Show } from "solid-js"
import type { nonBibleSchemaPropsType } from "@src/customTypes/types"
import { getNonBibleSchemaHtml } from "@lib/api"
import {
  getHtmlWithinSpan,
  clickOutside,
  escapeOut,
  positionPreviewPane
} from "@lib/utils-ui"
import { BeyondSmallNav, MobileTwNav } from "./TwNav"
// these are hacks to keep typescript from stripping away "unused imports" the actual names are unimportant; These are solid custom directives;
const clickout = clickOutside
const escape = escapeOut

export default function TranslationWords(props: nonBibleSchemaPropsType) {
  let [searchTerm, setSearchTerm] = createSignal("")
  let [sectionsHTML, setSectionsHTML] = createSignal({
    [props.navSection]: props.initialHtml
  })
  let [activeSection, setActiveSection] = createSignal(props.navSection)
  const [pos, setPos] = createSignal({
    x: "0px",
    y: "0px"
  })
  const [showPreviewPane, setShowPreviewPane] = createSignal(false)
  const [previewPaneHtml, setpreviewPaneHtml] = createSignal("")

  let allWords: Array<{
    slug: string
    label: string
    section: string
  }> = []
  props.repoIndex.words.forEach((word) => {
    word.words.forEach((single) => {
      allWords.push({
        section: word.slug,
        slug: single.slug,
        label: single.label
      })
      return
    })
  })
  allWords.sort((first, second) => {
    let firstLabel = first.label.toUpperCase()
    let secondLabel = second.label.toUpperCase()
    return firstLabel > secondLabel ? 1 : firstLabel < secondLabel ? -1 : 0
  })
  const filteredWords = createMemo(() => {
    return allWords.filter(
      (word) =>
        word.slug.includes(searchTerm().trim()) ||
        word.label.includes(searchTerm().trim())
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
      console.log("same 'page' hash scroll;")
      return //same 'page' hash scroll;
    }
    event.preventDefault()
    //  loaded page, not active one:
    if (sectionsHTML()[section]) {
      console.log("loaded page, not active one:")
      setActiveSection(section)
      document.getElementById(hash)?.scrollIntoView()
    }
    // not loaded page
    console.log("not loaded page")
    let text = await fetchSection(section, hash)
    if (text) {
      setSectionsHTML((prev) => {
        return {
          ...prev,
          [section]: text
        }
      })
    }
    setActiveSection(section)
    document.getElementById(hash)?.scrollIntoView()
  }
  async function fetchSection(section: string, hash: string) {
    try {
      let newHTML = await getNonBibleSchemaHtml({
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
    }
  }

  function hoverOnCrossReferences() {
    let crossReferences = document.querySelectorAll(
      "a[data-crossref='true']"
    ) as NodeListOf<HTMLElement>

    let memoryDom = document.createElement("html")
    console.log("RUNNGIN CROSS REF HOOKUP")
    crossReferences.forEach((ref) => {
      let section = String(ref.dataset?.section)
      let hash = String(ref.dataset?.hash)
      ref.addEventListener("click", (ev) => {
        setShowPreviewPane(false)
        fetchSectionAndNav(ev, section, hash)
      })
      ref.addEventListener("mouseover", async (event) => {
        // GENERATE A DOM FROM AN
        let existingHtml = sectionsHTML()[section]
        if (existingHtml) {
          memoryDom.innerHTML = existingHtml
        } else {
          let newSectionText = await fetchSection(section, hash)
          if (!newSectionText) return
          // we had to fetch, so go ahead and stick in memory
          setSectionsHTML((prev) => {
            return {
              ...prev,
              [section]: newSectionText
            }
          })
          memoryDom.innerHTML = newSectionText
        }

        // Get and Set html
        let firstElWithHashId = memoryDom.querySelector(`#${hash}`)
        let firstSib = firstElWithHashId && firstElWithHashId.nextElementSibling
        if (!firstSib) return
        function truthyFunction(htmlNode: Element) {
          return (
            !!htmlNode.id &&
            !!htmlNode.previousElementSibling &&
            htmlNode.previousElementSibling.tagName === "HR"
          )
        }
        let previewPaneHtml = getHtmlWithinSpan(firstSib, truthyFunction)
        setpreviewPaneHtml(previewPaneHtml)

        // show and position:
        let target = event.target as HTMLAnchorElement
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
          class="theText absolute z-30 mx-auto max-h-[50vh]  w-1/3 overflow-y-scroll border border-accent bg-white p-2  shadow shadow-neutral-500"
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
      <div class="theTextWrapper h-full  px-2 sm:px-8">
        <div class="relative h-full overflow-y-scroll   sm:flex ">
          <div
            class="theText tw-theText h-full w-full overflow-y-scroll sm:w-4/5"
            innerHTML={sectionsHTML()[activeSection()]}
          />
          <div class="sm:hidden">
            <MobileTwNav
              filteredWords={filteredWords}
              fetchSectionAndNav={fetchSectionAndNav}
              searchWords={searchWords}
            />
          </div>
          <div class="hidden: sticky top-0 right-0 ml-auto  h-full w-1/5 overflow-y-auto sm:block">
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
