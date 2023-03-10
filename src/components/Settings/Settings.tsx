import { get, set } from "idb-keyval"
import { createSignal, onMount, Show, For, Setter } from "solid-js"
import { useI18n } from "@solid-primitives/i18n"
import type { storeType } from "../ReaderWrapper/ReaderWrapper"
import type { repoIndexObj } from "@customTypes/types"
import { FUNCTIONS_ROUTES } from "@lib/routes"
import { downloadIndexI } from "@customTypes/types"
import { checkForOrDownloadWholeRepo } from "@lib/api"

interface settingsProps {
  setPrintWholeBook: Setter<boolean>
  downloadSourceUsfmArr: repoIndexObj["downloadLinks"]
  user: string
  repo: string
  storeInterface: storeType
  hasDownloadIndex: boolean
}

export default function Settings(props: settingsProps) {
  const [t] = useI18n()
  const [preparingPrint, setPreparingPrint] = createSignal(false)
  const [savingOffline, setSavingOffline] = createSignal(false)

  // Cache Strategy:
  // Prefer Network (prefer always checking for new content first)
  // Prefer Cache (possibly faster if you've ever visted the page before)
  // Only Saved ();
  const runTimeDefault = "networkFirst"
  const cacheStrategyKey = "cacheStrategy"
  // note: these key/values correspond to translation.json files; Don't change them w/o changing those.   A union string type could be used, but wanted an actual object for runtime behavior.
  const cacheStrategies = {
    networkFirst: "cacheNetworkFirst",
    cacheFirst: "cacheFirst",
    cacheOnly: "cacheOnly"
  } as const
  let options = Object.entries(cacheStrategies)

  // February 24, 2023 - current unusued bc custom service worker strategy was causing some loading issues on really slow connections.Went back to an out the box one for in sw.js
  const [cacheStrategy, setCacheStrategy] = createSignal()
  onMount(async () => {
    const currentCacheStrategy = await get(cacheStrategyKey)
    currentCacheStrategy
      ? setCacheStrategy(currentCacheStrategy)
      : setCacheStrategy(runTimeDefault)
  })
  async function changeRunTimeCacheStrategy(
    strategy: keyof typeof cacheStrategies
  ) {
    if (!cacheStrategies[strategy]) return
    await set(cacheStrategyKey, strategy)

    setCacheStrategy(strategy)
  }

  async function saveEveryHtmlPageToCache(includeSavingApiCalls = false) {
    // debugger
    setSavingOffline(true)
    let urlBase = window.location.origin
    const chapters = props.storeInterface.currentBookObj()?.chapters
    const bookSlug = props.storeInterface.currentBookObj()?.slug
    if (!chapters || !chapters.length) return
    // todo: this query parameter scheme will only work for bible type schema
    let htmlPagesToSaveInCache = chapters.map((chap) => {
      return `${urlBase}/${props.user}/${props.repo}?book=${bookSlug}&chapter=${chap.label}`
    })
    // listens for a custom even to dispatch saving of these URLs from anywhere;
    const commonWrapper = document.querySelector("#commonWrapper")
    if (commonWrapper) {
      const htmlPromises = htmlPagesToSaveInCache.map((url) => {
        return caches.open("lr-pages").then((cache) => cache.add(url))
      })
      let promises: Promise<void | string>[] = htmlPromises
      if (includeSavingApiCalls) {
        // pass true and make sure all calls get made to network so that the SW saves them, if it didn't already.
        const apiPromises = await makeApiCallsAndSaveToWorkingMemory(true)
        promises = [...apiPromises, ...htmlPromises]
        // debugger
      }
      Promise.all(promises).then((values) => {
        setSavingOffline(false)
      })
    }
  }
  async function makeApiCallsAndSaveToWorkingMemory(fetchingForSw = false) {
    let currentBookObj = props.storeInterface.currentBookObj()
    let promises: Array<Promise<string>> = []
    currentBookObj?.chapters.forEach((bibleChapObj) => {
      const promisedFetch = new Promise<string>(async (res, rej) => {
        if (!fetchingForSw) {
          if (bibleChapObj.text) return res(bibleChapObj.text) //already fetched
        }
        let text = await props.storeInterface.fetchHtml({
          book: String(currentBookObj?.slug),
          chapter: bibleChapObj.label,
          skipAbort: true
        })
        if (text) {
          // ? batch mutate when done fetching or as we go?
          props.storeInterface.mutateStoreText({
            book: String(currentBookObj?.slug),
            chapter: String(bibleChapObj.label),
            val: String(text)
          })
          if (text) res(text)
        } else rej("error")
      })
      promises.push(promisedFetch)
    })
    return promises
  }

  async function printWholeBook() {
    setPreparingPrint(true)
    // get current book
    const promises = await makeApiCallsAndSaveToWorkingMemory()
    Promise.all(promises).then((values) => {
      saveEveryHtmlPageToCache(false)
      props.setPrintWholeBook(true)
      setPreparingPrint(false)
      // never  a need to refactor await this. WE are just queining up a background saving. The api responses should automatically be save and put in bg.
      window.print()
      // window.print pauses execution of js in window while print dialog is open: If closed/canceled, then this will resume
      props.setPrintWholeBook(false)
    })
    // fetch request for every chapter in current book
  }
  async function saveEntireBookToSw() {
    // fetch the download.json file
    const downloadIndex = await checkForOrDownloadWholeRepo({
      user: props.user,
      repo: props.repo,
      method: "GET"
    })
    if (
      !downloadIndex ||
      typeof downloadIndex != "object" ||
      !downloadIndex.content.length
    )
      return

    // response is same shape, so just add to working memory
    let current = props.storeInterface.getStoreVal("text")
    console.log({ current })
    props.storeInterface.mutateStore("text", downloadIndex.content)

    const htmlPage = document.querySelector("html")
    const htmlClone = document.cloneNode(true) as Element
    const textContainer = htmlClone.querySelector("#theText")
    // save each to current memory in file
    downloadIndex.content.forEach((book, bookIdx) => {
      book.chapters.forEach((chapter, chapterIdx) => {
        debugger
        // /api/getHtmlForChap?user=AnaIglesias&repo=gl_1jn_text_reg&book=1jn&chapter=2
        const apiUrl = `${window.location.origin}/api/getHtmlForChap?user=${props.user}&repo=${props.repo}&book=${book.slug}&chapter=${chapter.label}`
        if (typeof chapter.content != "string") return
        const content = chapter.content
        const apiResponse = new Response(content, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html"
          }
        })
        caches.open("live-reader-api").then((cache) => {
          cache.put(new URL(apiUrl), apiResponse)
        })

        // HTML request
        // WycliffeAssociates/en_ulb
        const htmlUrl = new URL(
          `${window.location.origin}/${props.user}/${props.repo}&book=${book.slug}&chapter=${chapter.label}`
        )
        if (!textContainer) return
        textContainer.innerHTML = chapter.content
        const responseHtml = htmlClone.outerHTML
        const htmlResponse = new Response(responseHtml, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html"
          }
        })
        caches.open("lr-pages").then((cache) => {
          cache.put(new URL(htmlUrl), htmlResponse)
        })
      })
    })
    // put corresponding request in appropriate both HTML (lr-pages) and lr-api forms.  Lr-pages equals the current page, but we swap out the main text container.
  }

  // function getUsfmSource(event) {
  //   event.preventDefault()
  // }
  return (
    <>
      {/* This controls the loading behavior of Service Worker, for custom Strategy during runtime.  It needs some work as of Thursday February 09, 2023 03:50PM, so using the Race strategy that workbox gives and example of */}
      {/* <div>
        <details>
          <summary class="sentenceCase">{t("loadingBehavior")}</summary>
          <ul class="text-sm">
            <For each={options}>
              {(strategy) => {
                const key = strategy[0] as keyof typeof cacheStrategies
                const name = strategy[1]
                return (
                  <li>
                    <button
                      onClick={(e) => changeRunTimeCacheStrategy(key)}
                      class="my-2 ml-auto flex items-center text-right hover:text-accent focus:text-accent"
                    >
                      {t(name)}
                      <span
                        class={`${
                          cacheStrategy() == key
                            ? "border-accent bg-accent/70 text-accent"
                            : "border-gray-400"
                        } inline-block rounded-full border p-2 ltr:ml-2  rtl:mr-2`}
                      />
                    </button>
                  </li>
                )
              }}
            </For>
          </ul>
        </details>
      </div> */}
      <ul>
        <li class="my-2">
          <button
            class="sentenceCase hover:text-accent focus:text-accent"
            onClick={() => saveEveryHtmlPageToCache(true)}
            disabled={savingOffline()}
          >
            <Show when={savingOffline()}>
              <svg
                class="mr-3 inline-block h-5 w-5 animate-spin text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </Show>
            {!savingOffline()
              ? `${t("saveForOfflineReading", {}, "Save for reading offline")}`
              : `${t("saving", undefined, "Saving")}...`}
          </button>
        </li>
        <li class="my-2">
          <button
            class="sentenceCase hover:text-accent focus:text-accent"
            onClick={printWholeBook}
            disabled={preparingPrint()}
          >
            <Show when={preparingPrint()}>
              <svg
                class="mr-3 inline-block h-5 w-5 animate-spin text-accent"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </Show>
            {!preparingPrint()
              ? `${t("downloadPrintAll")}`
              : `${t("loading")}...`}
          </button>
        </li>
        <li class="my-2">
          {/* author/repo */}
          <a
            class="sentenceCase inline-block hover:text-accent focus:text-accent"
            href={`https://content.bibletranslationtools.org/${props.user}/${props.repo}/archive/master.zip`}
          >
            {t("downloadSource")}
          </a>
        </li>
        <Show when={props.downloadSourceUsfmArr.length}>
          <li class="my-2">
            <form
              action={FUNCTIONS_ROUTES.downloadUsfmSrc({
                user: props.user,
                repo: props.repo,
                book: props.storeInterface.currentBookObj()?.slug
              })}
              method="post"
            >
              <button class="sentenceCase inline-block hover:text-accent focus:text-accent">
                {t("downloadUsfmSource", undefined, "Download source USFM")}
              </button>
            </form>
          </li>
        </Show>
        <Show when={props.hasDownloadIndex}>
          <li class="my-2">
            <button
              class="sentenceCase inline-block hover:text-accent focus:text-accent"
              onClick={saveEntireBookToSw}
            >
              Save entire book
              {/* {t("downloadUsfmSource", undefined, "Save Entire Book")} */}
            </button>
          </li>
        </Show>
      </ul>
    </>
  )
}
