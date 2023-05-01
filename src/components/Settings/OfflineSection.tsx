import type {
  storeType,
  updateStoreTextParams
} from "@components/ReaderWrapper/ReaderWrapper"
import type {
  ISavedInServiceWorkerStatus,
  bibleEntryObj,
  repoIndexObj
} from "@customTypes/types"
import { checkForOrDownloadWholeRepo } from "@lib/api"
import { CACHENAMES } from "@lib/contants"
import { FUNCTIONS_ROUTES } from "@lib/routes"
import {
  deleteAllResourceFromSw,
  deleteSingleBookFromSw,
  extractRepoIndexFromSavedWhole
} from "@lib/utils-ui"
import { gzipSync, strToU8 } from "fflate"
import pLimit, { LimitFunction } from "p-limit"
import { Resource, Show, createSignal } from "solid-js"
import Toggle from "./Toggle"
import SectionHeader from "./SectionHeader"
import { useI18n } from "@solid-primitives/i18n"
import { Progress } from "@kobalte/core"

interface IOfflineSection {
  savedInServiceWorker: Resource<ISavedInServiceWorkerStatus>
  repoIndex: repoIndexObj
  user: string
  repo: string
  storeInterface: storeType
  refetchSwResponses: (
    info?: unknown
  ) =>
    | ISavedInServiceWorkerStatus
    | Promise<ISavedInServiceWorkerStatus | undefined>
    | null
    | undefined
}
export function OfflineSection(props: IOfflineSection) {
  const [t] = useI18n()
  const [saveProgress, setSaveProgress] = createSignal({
    isSaving: false,
    amountStr: "0",
    amountNum: 0
  })
  async function toggleSingleBook(isToggledOn: boolean) {
    const currentBook = props.storeInterface.currentBookObj()
    const currentChapter = props.storeInterface.getStoreVal(
      "currentChapter"
    ) as string
    const bookSlug = currentBook?.slug || ""
    const bookChapters = currentBook?.chapters.map((chap) => chap.label) || []
    if (isToggledOn) {
      await saveSingleBookToSwCache({
        currentBook,
        user: props.user,
        repo: props.repo,
        savedInServiceWorker: props.savedInServiceWorker,
        repoIndex: props.repoIndex,
        currentChapter,
        mutateStoreText: props.storeInterface.mutateStoreText
      })
    } else {
      await deleteSingleBookFromSw({
        bookSlug: bookSlug,
        bookChapters,
        repo: props.repo,
        user: props.user
      })
    }

    props.refetchSwResponses()
  }
  async function toggleWholeResource(isToggledOn: boolean) {
    debugger
    const currentBook = props.storeInterface.currentBookObj()
    const currentChapter = props.storeInterface.getStoreVal(
      "currentChapter"
    ) as string
    const bookSlug = currentBook?.slug || ""
    let promises: Promise<unknown>[] | undefined
    if (isToggledOn) {
      const limit = pLimit(20)

      promises = await saveEntireResourceOffline({
        currentBook,
        user: props.user,
        repo: props.repo,
        savedInServiceWorker: props.savedInServiceWorker,
        repoIndex: props.repoIndex,
        currentChapter,
        mutateStoreText: props.storeInterface.mutateStore,
        promiseLimit: limit
      })
      if (promises) {
        debugger
        const allPromiseLength = promises.length
        const formatter = new Intl.NumberFormat(navigator.language)
        function stepLimit() {
          const numPercent = Math.ceil(
            ((allPromiseLength - limit.pendingCount) / allPromiseLength) * 100
          )
          const stringPercent = formatter.format(numPercent)
          setSaveProgress({
            isSaving: true,
            amountStr: stringPercent,
            amountNum: numPercent
          })
          if (numPercent < Number(formatter.format(100))) {
            window.requestAnimationFrame(stepLimit)
          }
        }
        window.requestAnimationFrame(stepLimit)
        await Promise.allSettled(promises)
      }
    } else {
      await deleteAllResourceFromSw({
        bookSlug: bookSlug,
        repo: props.repo,
        user: props.user,
        repoIndex: props.repoIndex
      })
    }
    debugger
    props.refetchSwResponses()
  }
  return (
    <div data-title="offlineSection" class="">
      <SectionHeader component="h2" text={"Offline Reading"} />
      <div class="flex items-center justify-between">
        <div class="w-4/5">
          <p class="text-slate-500">
            {t(
              "saveForOfflineReading",
              {},
              "Read the current book without internet access."
            )}
          </p>
        </div>
        <Toggle
          onChangeFxn={toggleSingleBook}
          pressed={!!props.savedInServiceWorker()?.currentBooksIsDownloaded}
        />
      </div>
      <Show when={props.repoIndex.bible && props.repoIndex.bible?.length > 1}>
        <div class="flex items-center justify-between">
          <div class="w-4/5">
            <p class="text-slate-500">
              {t("saveWhole", {}, "Save whole resource for reading offline")}
            </p>
          </div>
          <Toggle
            onChangeFxn={toggleWholeResource}
            pressed={!!props.savedInServiceWorker()?.wholeIsComplete}
          />
        </div>
        <Progress.Root
          value={saveProgress().amountNum}
          class="flex w-full flex-col gap-2 "
          data-title="progress"
        >
          <div
            class="space-between flex"
            data-title="progress__label-container"
          >
            <Progress.Label class="" data-title="progress__label">
              {t("savingPercent", { percent: saveProgress().amountStr })}
            </Progress.Label>
          </div>
          <Progress.Track
            class="block  h-2 rounded-full bg-accent/10"
            data-title="progress__track"
          >
            <Progress.Fill
              class="h-full w-[--kb-progress-fill-width] rounded-full bg-accent transition duration-150 ease-linear"
              data-title="progress__fill"
            />
          </Progress.Track>
        </Progress.Root>
      </Show>
    </div>
  )
}

interface ISaveOfflineCommon {
  user: string
  repo: string
  currentBook: bibleEntryObj | undefined
  savedInServiceWorker: Resource<ISavedInServiceWorkerStatus>
  repoIndex: repoIndexObj
  currentChapter: string
}
interface IsaveSingleBookToSwCache extends ISaveOfflineCommon {
  mutateStoreText({ book, chapter, val }: updateStoreTextParams): void
}
async function saveSingleBookToSwCache({
  currentBook,
  currentChapter,
  savedInServiceWorker,
  user,
  repo,
  repoIndex,
  mutateStoreText
}: IsaveSingleBookToSwCache) {
  const bookSlug = currentBook && currentBook.slug
  if (!bookSlug) return
  try {
    const data = await getWholeBook({
      user,
      repo,
      bookSlug,
      savedResponse: savedInServiceWorker()?.wholeResponse
    })
    if (!data)
      throw new Error("There was a problem saving this resource offline")

    // todo: reInit the saving offline stuff
    // props.setSavingOffline("STARTED")

    // IF SOMEONE HAS PREVIOUSLY SAVED THE WHOLE RESOURCE, WE want to update just that book in the whole offline ready response. IF not, we want to create a origin/pathname/complete resource (even if it is just one book, such as a btt writer project), which can be added to incrementally if desired.
    // open caches once and operate in loop.
    // ROW WHOLE RESOURCE IS FOR JSON
    const rowWholeResourcesCache = await caches.open(CACHENAMES.complete)
    const lrApiCache = await caches.open(CACHENAMES.lrApi)
    // LRPAGES IS FOR HTML ONLY
    const lrPagesCache = await caches.open(CACHENAMES.lrPagesCache)
    //
    const wholeResourceMatch = savedInServiceWorker()?.wholeResponse?.clone()
    let indexToPostWith
    if (wholeResourceMatch) {
      const originalRepoIndex = await extractRepoIndexFromSavedWhole(
        wholeResourceMatch
      )
      if (!originalRepoIndex || !originalRepoIndex.bible)
        throw new Error("problem fetching repoIndex from service worker")
      const bib = originalRepoIndex.bible
      if (!bib) return
      const correspondingBook = bib?.findIndex((book) => book.slug == data.slug)
      if (correspondingBook < 0) return
      bib[correspondingBook] = data
      indexToPostWith = originalRepoIndex
    } else {
      const indexClone = structuredClone(repoIndex)
      const bib = indexClone.bible
      if (!bib) return
      const correspondingBook = bib?.findIndex((book) => book.slug == data.slug)
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
          lastRendered: book.lastRendered,
          size: book.chapters.reduce((acc, cur) => (acc += cur.byteCount), 0)
        }
      })
    const bookWithAllContentSize =
      (booksWithAllContent &&
        booksWithAllContent.reduce((acc, current) => {
          acc += current.size
          return acc
        }, 0)) ||
      0
    const allContentIsPopulated =
      booksWithAllContent &&
      booksWithAllContent.length === indexToPostWith.bible?.length
    const wholeResUrl = new URL(`${window.location.origin}/${user}/${repo}`)

    // todo: I actually want to just send a minimum to avoid cf timeouts / keep source of truth for downloaded data solely in the browser cache
    const ssrPostPayload = JSON.stringify(indexToPostWith)
    // compress to minimize transfer to try to avoid CF timeouts
    const gzippedPayload = gzipSync(strToU8(ssrPostPayload))

    await rowWholeResourcesCache.put(
      wholeResUrl,
      new Response(gzippedPayload, {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "text/html",
          "X-Last-Generated": repoIndex.lastRendered,
          "X-Is-Complete": allContentIsPopulated ? "1" : "0",
          "X-Complete-Books": JSON.stringify(booksWithAllContent),
          "Content-Length": String(bookWithAllContentSize)
        }
      })
    )

    // HTML version to cache
    const htmlSsrUrl = getHtmlSsrUrl({
      bookSlug,
      chapter: currentChapter,
      repo,
      user
    })

    const htmlSsrUrlRes = await fetch(htmlSsrUrl, {
      method: "POST",
      body: gzippedPayload,
      headers: {
        "Content-Type": "text/html"
      }
    })
    // will overwrite any existing /complete, but should be fine since it augments existing downloaded books or downloaded whole
    if (htmlSsrUrlRes.ok) {
      await lrPagesCache.put(
        `${window.location.origin}/${user}/${repo}/complete`,
        new Response(htmlSsrUrlRes.body, {
          status: 200,
          statusText: "OK",
          headers: {
            "Content-Type": "text/html",
            "X-Last-Generated": repoIndex.lastRendered,
            "Content-Length": String(bookWithAllContentSize)
          }
        })
      )
    }

    data.chapters.forEach((chapter) => {
      const content = chapter.content
      if (!content) return

      // add to memory
      mutateStoreText({
        book: bookSlug,
        chapter: chapter.label,
        val: content
      })

      // add to api
      const { apiReq, apiRes } = getApiUrlAndResponse({
        bookSlug,
        chapter: currentChapter,
        content,
        lastRendered: repoIndex.lastRendered,
        repo,
        user
      })
      lrApiCache.put(apiReq, apiRes)
    })
    // props.setSavingOffline("FINISHED")
  } catch (error) {
    console.error(error)
    // props.setSavingOffline("ERROR")
  } finally {
    // setTimeout(() => {
    //   props.setSavingOffline("IDLE")
    // }, 6000)
  }
}

interface IgetWholeBook {
  user: string
  repo: string
  savedResponse: Response | undefined | null
  bookSlug: string
}
async function getWholeBook({
  user,
  repo,
  savedResponse,
  bookSlug
}: IgetWholeBook) {
  if (!savedResponse) return
  async function fetchTheBook(bookSlug: string) {
    try {
      if (!bookSlug) return
      const wholeBookUrl = FUNCTIONS_ROUTES.getWholeBookJson({
        user: user,
        repo: repo,
        book: bookSlug
      })
      const wholeBookRes = await fetch(wholeBookUrl)
      const data: bibleEntryObj = await wholeBookRes.json()
      return data
    } catch (error) {
      console.error(error)
    }
  }
  try {
    const originalRepoIndex = await extractRepoIndexFromSavedWhole(
      savedResponse
    )
    if (originalRepoIndex) {
      const matchingBook = originalRepoIndex?.bible?.find(
        (book) => book.slug == bookSlug
      )
      const matchingBookIsPopulated =
        matchingBook && matchingBook.chapters.every((chap) => !!chap.content)
      if (matchingBookIsPopulated) {
        return matchingBook
      } else {
        if (!bookSlug) return
        const data = await fetchTheBook(bookSlug)
        return data
      }
    } else {
      if (!bookSlug) return
      const data = await fetchTheBook(bookSlug)
      return data
    }
  } catch (error) {
    console.error(error)
  }
}

interface IgetHtmlSsrUrl {
  repo: string
  user: string
  bookSlug: string
  chapter: string
}
function getHtmlSsrUrl({ user, repo, bookSlug, chapter }: IgetHtmlSsrUrl) {
  return new URL(
    `${window.location.origin}/${user}/${repo}?book=${bookSlug}&chapter=${chapter}`
  )
}
interface IGetApiUrlAndResponse {
  user: string
  repo: string
  bookSlug: string
  chapter: string
  content: string
  lastRendered: string
}
function getApiUrlAndResponse({
  user,
  repo,
  bookSlug,
  chapter,
  content,
  lastRendered
}: IGetApiUrlAndResponse) {
  const apiReq = new URL(
    `${window.location.origin}/api/getHtmlForChap?user=${user}&repo=${repo}&book=${bookSlug}&chapter=${chapter}`
  )
  const contentLength = String(new TextEncoder().encode(String(content)).length)
  const apiRes = new Response(content, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/html",
      "X-Last-Generated": lastRendered,
      "Content-Length": contentLength
    }
  })
  return {
    apiReq,
    apiRes
  }
}

interface ISaveEntireResourceOffline extends ISaveOfflineCommon {
  mutateStoreText(key: "text", val: bibleEntryObj[] | null): void
  promiseLimit: LimitFunction
}
async function saveEntireResourceOffline({
  currentBook,
  currentChapter,
  user,
  repo,
  repoIndex,
  mutateStoreText,
  promiseLimit
}: ISaveEntireResourceOffline) {
  // todo: renable this setter of progress
  // props.setSavingWholeOffline("STARTED")

  try {
    const downloadIndex = await checkForOrDownloadWholeRepo({
      user: user,
      repo: repo,
      method: "GET"
    })
    if (
      !downloadIndex ||
      typeof downloadIndex != "object" ||
      !downloadIndex.content.length
    )
      throw new Error("failed to fetch download index")

    // response is same shape as working memory, so add to working memory and eliminate need for any other api calls
    mutateStoreText("text", downloadIndex.content)

    //  clone the current index bc it has some metadata on it, and we are ultimately going to save a complete version of it once merging in the download index.
    const indexClone = structuredClone(repoIndex)
    indexClone.bible = downloadIndex.content
    const ssrPostPayload = JSON.stringify(indexClone)

    // compress to minimize transfer to try to avoid CF timeouts
    const gzippedPayload = gzipSync(strToU8(ssrPostPayload))
    // eslint-disable-next-line solid/reactivity
    const rowWholeResourcesCache = await caches.open(CACHENAMES.complete)
    const lrApiCache = await caches.open(CACHENAMES.lrApi)
    const lrPagesCache = await caches.open(CACHENAMES.lrPagesCache)

    // SAVE THE WHOLE DOWNLOAD INDEX
    const swUrl = new URL(`${window.location.origin}/${user}/${repo}`)
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
          "Content-Length": String(repoIndex.wholeResourceByteCount),
          "X-Last-Generated": repoIndex.lastRendered,
          "X-Is-Complete": "1",
          "X-Complete-Books": JSON.stringify(allBookSlugAndRendered)
        }
      })
    )
    // GET A SSR'D REQ/RESPONSE THAT WILL SERVE FOR ALL HTML PAGES OF THIS RESOURCE
    const htmlSsrUrl = getHtmlSsrUrl({
      bookSlug: currentBook?.slug!,
      chapter: currentChapter,
      repo,
      user
    })

    const smallIndex = JSON.stringify(repoIndex)
    // compress to minimize transfer to try to avoid CF timeouts. Also, we want the cache itself, not the response to be the source of truth for what's offline.  We can modify an object in the cache, but can't modify the response
    const smallPayload = gzipSync(strToU8(smallIndex))

    const smallerHtmlSsrUrlRes = await fetch(htmlSsrUrl, {
      method: "POST",
      body: smallPayload,
      headers: {
        "Content-Type": "text/html",
        "Accept-Encoding": "gzip"
      }
    })
    const blob = await smallerHtmlSsrUrlRes.blob()
    const size = blob.size
    await lrPagesCache.put(
      `${window.location.origin}/${user}/${repo}/complete`,
      new Response(blob, {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "text/html",
          "X-Last-Generated": repoIndex.lastRendered,
          "Content-Length": String(size)
        }
      })
    )

    // We will save each html page below, but we are saving one SSR reponse under a URL that the user shouldn't naturally arrive at (e.g. /complete). When processing a document request, it will check to see if there is a match for /origin/user/repo/complete, and serve this (offline ready) response here.

    const promises: Array<Promise<unknown>> = []
    // on large enough resources, occasionally ran into memory error when saving 1000+ calls, so this is to throttle the writing to sw a bit to avoid memory overflows.
    downloadIndex.content.forEach((book) => {
      // eslint-disable-next-line solid/reactivity
      book.chapters.forEach(async (chapter) => {
        //@ HANDLE STORING CF/AJAX REQS IN SW
        const content = chapter.content
        if (!content) return

        const { apiReq, apiRes } = getApiUrlAndResponse({
          bookSlug: currentBook?.slug!,
          chapter: currentChapter,
          content,
          lastRendered: repoIndex.lastRendered,
          repo,
          user
        })
        promises.push(promiseLimit(() => lrApiCache.put(apiReq, apiRes)))
      })
    })

    /* todo ===============  connect to progress bar   =============   */
    const allPromiseLength = promises.length
    const formatter = new Intl.NumberFormat(navigator.language)
    // eslint-disable-next-line solid/reactivity

    // const saveInterval = window.setInterval(() => {
    //   const numPercent = Math.ceil(
    //     ((allPromiseLength - limit.pendingCount) / allPromiseLength) * 100
    //   )
    //   const stringPercent = formatter.format(numPercent)

    //   setWholeAmountToSave({
    //     str: stringPercent,
    //     num: numPercent
    //   })
    //   props.setSavingWholeOffline("STARTED")
    //   if (numPercent >= Number(formatter.format(100)))
    //     clearInterval(saveInterval)
    // }, 1000)

    /* todo ===============  connect to progress bar   =============   */
    return promises
    await Promise.all(promises)
    // props.setSavingWholeOffline("FINISHED")
  } catch (error) {
    console.error(error)
    // props.setSavingWholeOffline("ERROR")
  } finally {
    // setTimeout(() => {
    //   props.setSavingWholeOffline("IDLE")
    // }, 6000)
  }
}
