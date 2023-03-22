import { createSignal, Show, Setter, Accessor, Resource } from "solid-js"
import { useI18n } from "@solid-primitives/i18n"
import type { storeType } from "../ReaderWrapper/ReaderWrapper"
import type { bibleEntryObj, repoIndexObj } from "@customTypes/types"
import { FUNCTIONS_ROUTES } from "@lib/routes"
import { checkForOrDownloadWholeRepo } from "@lib/api"

import { CACHENAMES } from "@lib/contants"
import pLimit from "p-limit"
import { LoadingSpinner } from "@components"
import { gzipSync, strToU8 } from "fflate"

interface settingsProps {
  setPrintWholeBook: Setter<boolean>
  downloadSourceUsfmArr: repoIndexObj["downloadLinks"]
  user: string
  repo: string
  storeInterface: storeType
  hasDownloadIndex: boolean
  savedInServiceWorker: Resource<
    | {
        wholeResponse: null
        wholeIsComplete: null
        wholeIsOutOfDate: null
        currentBooksIsDownloaded: null
        currentBookIsOutOfDate: null
      }
    | {
        wholeResponse: Response | undefined
        wholeIsComplete: boolean | null
        wholeIsOutOfDate: boolean | null
        currentBooksIsDownloaded: boolean | null
        currentBookIsOutOfDate: boolean | null
      }
  >
  repoIndex: repoIndexObj
  savingOffline: Accessor<"IDLE" | "FINISHED" | "STARTED" | "ERROR">
  setSavingOffline: Setter<"IDLE" | "FINISHED" | "STARTED" | "ERROR">
  savingWholeOffline: Accessor<"IDLE" | "FINISHED" | "STARTED" | "ERROR">
  setSavingWholeOffline: Setter<"IDLE" | "FINISHED" | "STARTED" | "ERROR">
}

export default function Settings(props: settingsProps) {
  const [t] = useI18n()

  const [preparingPrint, setPreparingPrint] = createSignal(false)
  const [wholeAmountToSave, setWholeAmountToSave] = createSignal({
    str: "0",
    num: 0
  })

  async function saveEveryHtmlPageToCache() {
    const currentBook = props.storeInterface.currentBookObj()
    const bookSlug = currentBook && currentBook.slug
    if (!bookSlug) return
    try {
      const data = await getWholeBook()
      if (!data)
        throw new Error("There was a problem saving this resource offline")

      props.setSavingOffline("STARTED")
      // IF SOMEONE HAS PREVIOUSLY SAVED THE WHOLE RESOURCE, WE want to update just that book in the whole offline ready response. IF not, we want to create a origin/pathname/complete resource (even if it is just one book, such as a btt writer project), which can be added to incrementally if desired.
      // open caches once and operate in loop.
      const rowWholeResourcesCache = await caches.open(CACHENAMES.complete)
      const lrApiCache = await caches.open(CACHENAMES.lrApi)
      const lrPagesCache = await caches.open(CACHENAMES.lrPagesCache)
      //
      const wholeResourceMatch = props.savedInServiceWorker()?.wholeResponse
      let indexToPostWith
      if (wholeResourceMatch) {
        const originalRepoIndex =
          (await wholeResourceMatch.json()) as repoIndexObj
        const bib = originalRepoIndex.bible
        if (!bib) return
        const correspondingBook = bib?.findIndex(
          (book) => book.slug == data.slug
        )
        if (correspondingBook < 0) return
        bib[correspondingBook] = data
        indexToPostWith = originalRepoIndex
      } else {
        const indexClone = structuredClone(props.repoIndex)
        const bib = indexClone.bible
        if (!bib) return
        const correspondingBook = bib?.findIndex(
          (book) => book.slug == data.slug
        )
        if (correspondingBook < 0) return
        bib[correspondingBook] = data
        indexToPostWith = indexClone
      }

      const booksWithAllContent = indexToPostWith.bible
        ?.filter((book) => {
          return book.chapters.every((chap) => !!chap.content)
        })
        .map((book) => {
          return {
            slug: book.slug,
            lastRendered: book.lastRendered
          }
        })
      const allContentIsPopulated =
        booksWithAllContent &&
        booksWithAllContent.length === indexToPostWith.bible?.length
      const wholeResUrl = new URL(
        `${window.location.origin}/${props.user}/${props.repo}`
      )

      const ssrPostPayload = JSON.stringify(indexToPostWith)
      // compress to minimize transfer to try to avoid CF timeouts
      const gzippedPayload = gzipSync(strToU8(ssrPostPayload), {
        level: 7
      })

      await rowWholeResourcesCache.put(
        wholeResUrl,
        new Response(ssrPostPayload, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html",
            "X-Last-Generated": props.repoIndex.lastRendered,
            "X-Is-Complete": allContentIsPopulated ? "1" : "0",
            "X-Complete-Books": JSON.stringify(booksWithAllContent)
          }
        })
      )

      // HTML version to cache
      const htmlSsrUrl = getHtmlSsrUrl(
        bookSlug,
        props.storeInterface.getStoreVal("currentChapter")
      )

      console.time("fetch from astro")
      const htmlSsrUrlRes = await fetch(htmlSsrUrl, {
        method: "POST",
        body: gzippedPayload,
        headers: {
          "Content-Type": "text/html"
        }
      })
      console.timeEnd("fetch from astro")

      // will overwrite any existing /complete, but should be fine since it augments existing downloaded books or downloaded whole
      if (htmlSsrUrlRes.ok) {
        await lrPagesCache.put(
          `${window.location.origin}/${props.user}/${props.repo}/complete`,
          new Response(htmlSsrUrlRes.body, {
            status: 200,
            statusText: "OK",
            headers: {
              "Content-Type": "text/html",
              "X-Last-Generated": props.repoIndex.lastRendered
            }
          })
        )
      }

      data.chapters.forEach((chapter) => {
        const content = chapter.content
        if (!content) return

        // add to memory
        props.storeInterface.mutateStoreText({
          book: bookSlug,
          chapter: chapter.label,
          val: content
        })

        // add to api
        const { apiReq, apiRes } = getApiUrlAndResponse(
          bookSlug,
          chapter.label,
          content
        )
        lrApiCache.put(apiReq, apiRes)

        // // add html to cache. Response will include js to fetch compressed chapter above onMount instead of through blob/storage/cf api
        // if (htmlSsrUrlRes.ok) {
        //   const htmlUrl = getHtmlSsrUrl(bookSlug, chapter.label)
        //   const htmlResClone = htmlSsrUrlRes.clone()
        //   lrPagesCache.put(htmlUrl, htmlResClone)
        // }
      })
      props.setSavingOffline("FINISHED")
    } catch (error) {
      console.error(error)
      props.setSavingOffline("ERROR")
    } finally {
      setTimeout(() => {
        props.setSavingOffline("IDLE")
      }, 6000)
    }
  }
  async function getWholeBook() {
    try {
      const bookSlug = props.storeInterface.currentBookObj()?.slug
      if (!bookSlug) return
      const wholeBookUrl = FUNCTIONS_ROUTES.getWholeBookJson({
        user: props.user,
        repo: props.repo,
        book: bookSlug
      })
      const wholeBookRes = await fetch(wholeBookUrl)
      const data: bibleEntryObj = await wholeBookRes.json()
      return data
    } catch (error) {
      console.error(error)
    }
  }

  function getHtmlSsrUrl(bookSlug: string, chapter: string) {
    return new URL(
      `${window.location.origin}/${props.user}/${props.repo}?book=${bookSlug}&chapter=${chapter}`
    )
  }
  function getApiUrlAndResponse(
    bookSlug: string,
    chapter: string,
    content: BodyInit
  ) {
    const apiReq = new URL(
      `${window.location.origin}/api/getHtmlForChap?user=${props.user}&repo=${props.repo}&book=${bookSlug}&chapter=${chapter}`
    )
    const contentLength = String(
      new TextEncoder().encode(String(content)).length
    )
    const apiRes = new Response(content, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "text/html",
        "X-Last-Generated": props.repoIndex.lastRendered,
        "Content-Length": contentLength
      }
    })
    return {
      apiReq,
      apiRes
    }
  }
  async function printWholeBook() {
    setPreparingPrint(true)
    await saveEveryHtmlPageToCache()
    props.setPrintWholeBook(true)
    setPreparingPrint(false)

    window.print()
    // window.print pauses execution of js in window while print dialog is open: If closed/canceled, then this will resume
    props.setPrintWholeBook(false)
  }
  async function saveEntireResourceOffline() {
    props.setSavingWholeOffline("STARTED")

    try {
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
        throw new Error("failed to fetch download index")

      // response is same shape as working memory, so add to working memory and eliminate need for any other api calls
      props.storeInterface.mutateStore("text", downloadIndex.content)

      // compress the current index. WE are going to pass it in body of post req so response doesn't have to fetch it.
      const indexClone = structuredClone(props.repoIndex)
      indexClone.bible = downloadIndex.content
      // const ssrPostPayload = compressDataAndGetEncodedIndex(indexClone)

      const ssrPostPayload = JSON.stringify(indexClone)
      // compress to minimize transfer to try to avoid CF timeouts
      const gzippedPayload = gzipSync(strToU8(ssrPostPayload))
      // eslint-disable-next-line solid/reactivity
      const rowWholeResourcesCache = await caches.open(CACHENAMES.complete)
      const lrApiCache = await caches.open(CACHENAMES.lrApi)
      const lrPagesCache = await caches.open(CACHENAMES.lrPagesCache)

      // SAVE THE WHOLE DOWNLOAD INDEX
      const swUrl = new URL(
        `${window.location.origin}/${props.user}/${props.repo}`
      )
      const allBookSlugAndRendered = indexClone.bible.map((book) => {
        return {
          slug: book.slug,
          lastRendered: book.lastRendered
        }
      })
      await rowWholeResourcesCache.put(
        swUrl,
        new Response(gzippedPayload, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html",
            "Content-Length": String(props.repoIndex.wholeResourceByteCount),
            "X-Last-Generated": props.repoIndex.lastRendered,
            "X-Is-Complete": "1",
            "X-Complete-Books": JSON.stringify(allBookSlugAndRendered)
          }
        })
      )
      // GET A SSR'D REQ/RESPONSE THAT WILL SERVE FOR ALL HTML PAGES OF THIS RESOURCE
      const htmlSsrUrl = getHtmlSsrUrl(
        props.storeInterface.getStoreVal("currentBook"),
        props.storeInterface.getStoreVal("currentChapter")
      )
      fetch(htmlSsrUrl, {
        method: "POST",
        body: gzippedPayload,
        headers: {
          "Content-Type": "text/html",
          "Accept-Encoding": "gzip"
        }
      }).then(async (htmlSsrUrlRes) => {
        const num = 3
        if (htmlSsrUrlRes.ok && num > 4) {
          const blob = await htmlSsrUrlRes.blob()
          const size = blob.size

          await lrPagesCache.put(
            `${window.location.origin}/${props.user}/${props.repo}/complete`,
            new Response(blob, {
              status: 200,
              statusText: "OK",
              headers: {
                "Content-Type": "text/html",
                "X-Last-Generated": props.repoIndex.lastRendered,
                "Content-Length": String(size)
              }
            })
          )
        } else {
          const smallIndex = JSON.stringify(props.repoIndex)
          // compress to minimize transfer to try to avoid CF timeouts
          const gzippedPayload = gzipSync(strToU8(smallIndex))

          const smallerHtmlSsrUrlRes = await fetch(htmlSsrUrl, {
            method: "POST",
            body: gzippedPayload,
            headers: {
              "Content-Type": "text/html",
              "Accept-Encoding": "gzip"
            }
          })
          const blob = await smallerHtmlSsrUrlRes.blob()
          const size = blob.size
          await lrPagesCache.put(
            `${window.location.origin}/${props.user}/${props.repo}/complete`,
            new Response(blob, {
              status: 200,
              statusText: "OK",
              headers: {
                "Content-Type": "text/html",
                "X-Last-Generated": props.repoIndex.lastRendered,
                "Content-Length": String(size)
              }
            })
          )
        }
      })
      // We will save each html page below, but we are saving one SSR reponse under a URL that the user shouldn't naturally arrive at (e.g. /complete). When processing a document request, it will check to see if there is a match for /origin/user/repo/complete, and serve this (offline ready) response here.

      const promises: Array<Promise<unknown>> = []
      // on large enough resources, occasionally ran into memory error when saving 1000+ calls, so this is to throttle the writing to sw a bit to avoid memory overflows.
      const limit = pLimit(20)
      downloadIndex.content.forEach((book) => {
        // eslint-disable-next-line solid/reactivity
        book.chapters.forEach(async (chapter) => {
          //@ HANDLE STORING CF/AJAX REQS IN SW
          const content = chapter.content
          if (!content) return
          const { apiReq, apiRes } = getApiUrlAndResponse(
            book.slug,
            chapter.label,
            content
          )
          promises.push(limit(() => lrApiCache.put(apiReq, apiRes)))
        })
      })

      const allPromiseLength = promises.length
      const formatter = new Intl.NumberFormat(navigator.language)
      // eslint-disable-next-line solid/reactivity
      const saveInterval = window.setInterval(() => {
        const numPercent = Math.ceil(
          ((allPromiseLength - limit.pendingCount) / allPromiseLength) * 100
        )
        const stringPercent = formatter.format(numPercent)

        setWholeAmountToSave({
          str: stringPercent,
          num: numPercent
        })
        props.setSavingWholeOffline("STARTED")
        if (numPercent >= Number(formatter.format(100)))
          clearInterval(saveInterval)
      }, 1000)
      await Promise.all(promises)
      props.setSavingWholeOffline("FINISHED")
    } catch (error) {
      console.error(error)
      props.setSavingWholeOffline("ERROR")
    } finally {
      setTimeout(() => {
        props.setSavingWholeOffline("IDLE")
      }, 6000)
    }
  }

  function bookIsSavedOfflineText() {
    const isLoading = props.savedInServiceWorker.loading
    if (isLoading) {
      return t("loading", {}, "loading...")
    } else if (props.savingOffline() == "ERROR") {
      return `${t(
        "errorSaving",
        undefined,
        "There was an error saving this resource offline"
      )}`
    } else if (props.savingOffline() == "STARTED") {
      return `${t("saving", undefined, "Saving")}...`
    } else if (props.savingOffline() == "FINISHED") {
      return `${t(
        "successSaving",
        undefined,
        "Saved successfully.  Feel free to copy the url for later access."
      )}...`
    } else if (props.savedInServiceWorker()?.currentBooksIsDownloaded) {
      if (props.savedInServiceWorker()?.currentBookIsOutOfDate) {
        return t(
          "bookSavedAndOutOfDate",
          {},
          "There is an update available for this book saved offline"
        )
      } else {
        return t("bookAlreadySaved", {}, "Book is already saved offline.")
      }
    } else {
      return `${t(
        "saveForOfflineReading",
        {},
        "Save this book for reading offline"
      )}`
    }
  }
  function wholeResourceIsSavedOfflineText() {
    const isLoading = props.savedInServiceWorker.loading
    if (isLoading) {
      return t("loading", {}, "loading...")
    } else if (props.savingWholeOffline() == "ERROR") {
      return `${t(
        "errorSaving",
        undefined,
        "There was an error saving this resource offline"
      )}`
    } else if (
      props.savingWholeOffline() == "STARTED" &&
      wholeAmountToSave().num < 100
    ) {
      return `${t(
        "savingPercent",
        { percent: wholeAmountToSave().str },
        `Saving ${wholeAmountToSave().num}%`
      )}`
    } else if (props.savingWholeOffline() == "FINISHED") {
      return `${t(
        "successSaving",
        undefined,
        "Saved successfully.  Feel free to copy the url for later access."
      )}...`
    } else if (props.savedInServiceWorker()?.wholeIsComplete) {
      if (props.savedInServiceWorker()?.wholeIsOutOfDate) {
        return t(
          "wholeSavedAndOutOfDate",
          {},
          "There is an update available for this resource saved offline."
        )
      } else {
        return t("wholeAlreadySaved", {}, "Book is already saved offline.")
      }
    } else {
      return `${t("saveWhole", {}, "Save whole resource for reading offline")}`
    }
  }
  const buttonClasses =
    "text-right sentenceCase hover:text-accent focus:text-accent "
  return (
    <>
      <ul>
        <li class="my-2">
          <button
            class={buttonClasses}
            onClick={() => saveEveryHtmlPageToCache()}
            disabled={
              props.savingOffline() == "FINISHED" ||
              props.savingOffline() == "STARTED"
            }
          >
            <Show when={props.savingOffline() == "STARTED"}>
              <LoadingSpinner classNames="mr-3 inline-block h-5 w-5 animate-spin text-accent" />
            </Show>
            {bookIsSavedOfflineText()}
          </button>
        </li>
        <li class="my-2">
          <button
            class={buttonClasses}
            onClick={printWholeBook}
            disabled={preparingPrint()}
          >
            <Show when={preparingPrint()}>
              <LoadingSpinner classNames="mr-3 inline-block h-5 w-5 animate-spin text-accent" />
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
        <Show when={props.downloadSourceUsfmArr?.length}>
          <li class="my-2">
            <form
              action={FUNCTIONS_ROUTES.downloadUsfmSrc({
                user: props.user,
                repo: props.repo,
                book: props.storeInterface.currentBookObj()?.slug
              })}
              method="post"
            >
              <button class={buttonClasses}>
                {t("downloadUsfmSource", undefined, "Download source USFM")}
              </button>
            </form>
          </li>
        </Show>
        <Show when={props.hasDownloadIndex}>
          <li class="my-2">
            <button
              class={`${buttonClasses} ${
                (props.savingWholeOffline() == "FINISHED" ||
                  props.savingWholeOffline() == "STARTED") &&
                "cursor-not-allowed text-gray-600 hover:text-gray-600"
              }`}
              onClick={saveEntireResourceOffline}
              disabled={
                props.savingWholeOffline() == "FINISHED" ||
                props.savingWholeOffline() == "STARTED"
              }
            >
              {wholeResourceIsSavedOfflineText()}
            </button>
          </li>
        </Show>
      </ul>
    </>
  )
}
