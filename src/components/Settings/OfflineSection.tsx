import type {
  storeType,
  updateStoreTextParams
} from "@components/ReaderWrapper/ReaderWrapper";
import type {
  ISavedInServiceWorkerStatus,
  bibleEntryObj,
  repoIndexObj
} from "@customTypes/types";
import { checkForOrDownloadWholeRepo } from "@lib/api";
import { CACHENAMES } from "@lib/contants";
import {
  deleteAllResourceFromSw,
  deleteSingleBookFromSw,
  extractRepoIndexFromSavedWhole,
  getWholeBook
} from "@lib/utils-ui";
import { gzipSync, strToU8 } from "fflate";
import pLimit, { type LimitFunction } from "p-limit";
import { type Resource, Show, createSignal } from "solid-js";
import Toggle from "./Toggle";
import SectionHeader from "./SectionHeader";
import { Button, Progress } from "@kobalte/core";
import { IconX, SvgDownload } from "@components/Icons/Icons";
import type { Translator } from "@solid-primitives/i18n";

interface IOfflineSection {
  savedInServiceWorker: Resource<ISavedInServiceWorkerStatus>;
  repoIndex: repoIndexObj;
  user: string;
  repo: string;
  storeInterface: storeType;
  refetchSwResponses: (
    info?: unknown
  ) =>
    | ISavedInServiceWorkerStatus
    | Promise<ISavedInServiceWorkerStatus | undefined>
    | null
    | undefined;
  t: Translator<Record<string, string>>;
}
export function OfflineSection(props: IOfflineSection) {
  const [saveProgress, setSaveProgress] = createSignal({
    isSaving: false,
    amountStr: "0",
    amountNum: 0,
    isFinished: false,
    didAddResources: false
  });
  const [successText, setSuccessText] = createSignal("");

  function handleProgress(
    limit: LimitFunction,
    promises: Promise<unknown>[],
    scope: "WHOLE" | "BOOK",
    didAddResources: boolean
  ) {
    let start: DOMHighResTimeStamp;

    function doRafProgress(timestamp: DOMHighResTimeStamp) {
      if (start === undefined) {
        start = timestamp;
      }
      const elapsed = timestamp - start;

      const allPromiseLength = promises.length;
      const formatter = new Intl.NumberFormat(navigator.language);

      const numPercent = Math.ceil(
        ((allPromiseLength - limit.pendingCount) / allPromiseLength) * 100
      );
      const stringPercent = formatter.format(numPercent);
      // technically we are saving here, but we want to delay setting the isSaving bool some (200ms here).  Small projects on good internet save instanteously, so it's a little weird to flash the bar.
      setSaveProgress({
        isSaving: elapsed > 200 ? true : false,
        amountStr: stringPercent,
        amountNum: numPercent,
        isFinished: false,
        didAddResources
      });
      if (numPercent < Number(formatter.format(100))) {
        window.requestAnimationFrame(doRafProgress);
      } else {
        setTimeout(() => {
          setSaveProgress({
            isSaving: false,
            amountStr: "0",
            amountNum: 0,
            isFinished: true,
            didAddResources
          });
        }, 2000);
      }
    }
    const label = props.storeInterface.currentBookObj()?.label || "";
    scope === "BOOK"
      ? setSuccessText(label)
      : setSuccessText(`${props.user}/${props.repo}`);
    window.requestAnimationFrame(doRafProgress);
  }

  async function toggleSingleBook(isToggledOn: boolean) {
    const currentBook = props.storeInterface.currentBookObj();
    const currentChapter = props.storeInterface.getStoreVal(
      "currentChapter"
    ) as string;
    const bookSlug = currentBook?.slug || "";
    const bookChapters = currentBook?.chapters.map((chap) => chap.label) || [];
    let promises: Promise<unknown>[] | undefined;
    const limit = pLimit(20);
    if (isToggledOn) {
      promises = await saveSingleBookToSwCache({
        currentBook,
        user: props.user,
        repo: props.repo,
        savedInServiceWorker: props.savedInServiceWorker,
        repoIndex: props.repoIndex,
        currentChapter,
        mutateStoreText: props.storeInterface.mutateStoreText,
        promiseLimit: limit
      });
    } else {
      promises = await deleteSingleBookFromSw({
        bookSlug: bookSlug,
        bookChapters,
        repo: props.repo,
        user: props.user,
        promiseLimit: limit
      });
    }
    if (promises) {
      await Promise.allSettled(promises);
    }
    props.refetchSwResponses();
  }
  async function toggleWholeResource(isToggledOn: boolean) {
    const currentBook = props.storeInterface.currentBookObj();
    const currentChapter = props.storeInterface.getStoreVal(
      "currentChapter"
    ) as string;
    const bookSlug = currentBook?.slug || "";
    let promises: Promise<unknown>[] | undefined;
    const limit = pLimit(20);
    if (isToggledOn) {
      promises = await saveEntireResourceOffline({
        currentBook,
        user: props.user,
        repo: props.repo,
        savedInServiceWorker: props.savedInServiceWorker,
        repoIndex: props.repoIndex,
        currentChapter,
        mutateStoreText: props.storeInterface.mutateStore,
        promiseLimit: limit
      });
    } else {
      promises = await deleteAllResourceFromSw({
        bookSlug: bookSlug,
        repo: props.repo,
        user: props.user,
        repoIndex: props.repoIndex,
        promiseLimit: limit
      });
    }
    if (promises) {
      handleProgress(limit, promises, "WHOLE", isToggledOn);
      await Promise.allSettled(promises);
    }

    props.refetchSwResponses();
  }
  return (
    <div data-title="offlineSection" class="">
      <SectionHeader component="h2" text={"Offline Reading"} />
      <div class="flex items-center justify-between">
        <div class="w-4/5">
          <p class="text-slate-500">{props.t("saveForOfflineReading")}</p>
        </div>
        <Toggle
          onChangeFxn={toggleSingleBook}
          pressed={!!props.savedInServiceWorker()?.currentBooksIsDownloaded}
        />
      </div>
      <div class="flex items-center justify-between">
        <div class="w-4/5">
          <p class="text-slate-500">{props.t("saveWhole")}</p>
        </div>
        <Toggle
          onChangeFxn={toggleWholeResource}
          pressed={!!props.savedInServiceWorker()?.wholeIsComplete}
        />
      </div>
      <Show when={saveProgress().isSaving}>
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
              {props.t(
                saveProgress().didAddResources
                  ? "savingPercent"
                  : "removingPercent",
                { percent: saveProgress().amountStr }
              )}
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
      <Show when={saveProgress().isFinished}>
        <div
          data-title="successMessage"
          class="mt-5 flex items-center justify-between bg-accent/10 px-4 py-3"
        >
          <div class="w-10/12">
            <p class="font-bold text-accent">{props.t("success")}</p>

            <p class="">
              {props.t(
                saveProgress().didAddResources
                  ? "successSaving"
                  : "successRemoving",
                {
                  bookname: successText()
                }
              )}
            </p>
          </div>
          <Button.Root
            class="w-6"
            onClick={() => {
              setSaveProgress({
                isSaving: false,
                amountStr: "0",
                amountNum: 0,
                isFinished: false,
                didAddResources: false
              });
            }}
          >
            <IconX />
          </Button.Root>
        </div>
      </Show>
      <Show when={props.savedInServiceWorker()?.wholeIsOutOfDate}>
        <div data-title="successMessage" class="mt-5 bg-accent/10 px-4 py-3">
          <div class="w-10/12">
            <p class="font-bold text-accent">{props.t("updateAvailable")}</p>

            <p class="">{props.t("wholeSavedAndOutOfDate")}</p>
          </div>
          <Button.Root
            class="mt-3 flex w-auto items-center gap-3 rounded-lg border-gray-200 bg-white px-4 py-3"
            onClick={() => {
              toggleWholeResource(true);
            }}
          >
            <span>{props.t("updateResource")}</span>
            <span>
              <SvgDownload />
            </span>
          </Button.Root>
        </div>
      </Show>
    </div>
  );
}

interface ISaveOfflineCommon {
  user: string;
  repo: string;
  currentBook: bibleEntryObj | undefined;
  savedInServiceWorker: Resource<ISavedInServiceWorkerStatus>;
  repoIndex: repoIndexObj;
  currentChapter: string;
}
interface IsaveSingleBookToSwCache extends ISaveOfflineCommon {
  mutateStoreText({ book, chapter, val }: updateStoreTextParams): void;
  promiseLimit: LimitFunction;
}
async function saveSingleBookToSwCache({
  currentBook,
  currentChapter,
  savedInServiceWorker,
  user,
  repo,
  repoIndex,
  mutateStoreText,
  promiseLimit
}: IsaveSingleBookToSwCache) {
  const bookSlug = currentBook && currentBook.slug;
  const promises: Array<Promise<unknown>> = [];

  if (!bookSlug) return;
  try {
    const data = await getWholeBook({
      user,
      repo,
      bookSlug,
      savedResponse: savedInServiceWorker()?.wholeResponse,
      storeBook: currentBook
    });
    if (!data)
      throw new Error("There was a problem saving this resource offline");

    // IF SOMEONE HAS PREVIOUSLY SAVED THE WHOLE RESOURCE, WE want to update just that book in the whole offline ready response. IF not, we want to create a origin/pathname/complete resource (even if it is just one book, such as a btt writer project), which can be added to incrementally if desired.
    // open caches once and operate in loop.
    // ROW WHOLE RESOURCE IS FOR JSON
    const rowWholeResourcesCache = await caches.open(CACHENAMES.complete);
    // LRPAGES IS FOR HTML ONLY
    const lrApiCache = await caches.open(CACHENAMES.lrApi);
    const lrPagesCache = await caches.open(CACHENAMES.lrPagesCache);
    const wholeResourceMatch = savedInServiceWorker()?.wholeResponse?.clone();
    let indexToPostWith;
    if (wholeResourceMatch) {
      const originalRepoIndex =
        await extractRepoIndexFromSavedWhole(wholeResourceMatch);
      if (!originalRepoIndex || !originalRepoIndex.bible)
        throw new Error("problem fetching repoIndex from service worker");
      const bib = originalRepoIndex.bible;
      if (!bib) return;
      const correspondingBook = bib?.findIndex(
        (book) => book.slug == data.slug
      );
      if (correspondingBook < 0) return;
      bib[correspondingBook] = data;
      indexToPostWith = originalRepoIndex;
    } else {
      const indexClone = structuredClone(repoIndex);
      const bib = indexClone.bible;
      if (!bib) return;
      const correspondingBook = bib?.findIndex(
        (book) => book.slug == data.slug
      );
      if (correspondingBook < 0) return;
      bib[correspondingBook] = data;
      indexToPostWith = indexClone;
    }

    const booksWithAllContent = indexToPostWith.bible
      ?.filter((book) => {
        return book.chapters.every((chap) => !!chap.content);
      })
      .map((book) => {
        return {
          slug: book.slug,
          lastRendered: book.lastRendered,
          size: book.chapters.reduce((acc, cur) => (acc += cur.byteCount), 0)
        };
      });
    const bookWithAllContentSize =
      (booksWithAllContent &&
        booksWithAllContent.reduce((acc, current) => {
          acc += current.size;
          return acc;
        }, 0)) ||
      0;
    const allContentIsPopulated =
      booksWithAllContent &&
      booksWithAllContent.length === indexToPostWith.bible?.length;
    const wholeResUrl = new URL(`${window.location.origin}/${user}/${repo}`);

    const ssrPostPayload = JSON.stringify(indexToPostWith);
    // compress to minimize transfer to try to avoid CF timeouts
    const gzippedPayload = gzipSync(strToU8(ssrPostPayload));

    promises.push(
      promiseLimit(() => {
        return rowWholeResourcesCache.put(
          wholeResUrl,
          new Response(gzippedPayload, {
            status: 200,
            statusText: "OK",
            headers: {
              "Content-Type": "text/html",
              "X-Last-Generated": new Date().toISOString(),
              "X-Is-Complete": allContentIsPopulated ? "1" : "0",
              "X-Complete-Books": JSON.stringify(booksWithAllContent),
              "Content-Length": String(bookWithAllContentSize)
            }
          })
        );
      })
    );

    // HTML version to cache
    const htmlSsrUrl = getHtmlSsrUrl({
      bookSlug,
      chapter: currentChapter,
      repo,
      user
    });

    const htmlSsrUrlRes = await fetch(htmlSsrUrl, {
      method: "POST",
      body: gzippedPayload,
      headers: {
        "Content-Type": "text/html"
      }
    });
    // will overwrite any existing /complete, but should be fine since it augments existing downloaded books or downloaded whole
    if (htmlSsrUrlRes.ok) {
      promises.push(
        promiseLimit(() => {
          lrPagesCache.put(
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
          );
        })
      );
    }

    data.chapters.forEach((chapter) => {
      const content = chapter.content;
      if (!content) return;

      // add to memory
      mutateStoreText({
        book: bookSlug,
        chapter: chapter.label,
        val: content
      });

      // add to api
      const { apiReq, apiRes } = getApiUrlAndResponse({
        bookSlug,
        chapter: currentChapter,
        content,
        lastRendered: repoIndex.lastRendered,
        repo,
        user
      });
      promises.push(
        promiseLimit(() => {
          return lrApiCache.put(apiReq, apiRes);
        })
      );
    });
    return promises;
  } catch (error) {
    console.error(error);
  }
}

interface IgetHtmlSsrUrl {
  repo: string;
  user: string;
  bookSlug: string;
  chapter: string;
}
function getHtmlSsrUrl({ user, repo, bookSlug, chapter }: IgetHtmlSsrUrl) {
  return new URL(
    `${window.location.origin}/${user}/${repo}?book=${bookSlug}&chapter=${chapter}`
  );
}
interface IGetApiUrlAndResponse {
  user: string;
  repo: string;
  bookSlug: string;
  chapter: string;
  content: string;
  lastRendered: string;
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
  );
  const contentLength = String(
    new TextEncoder().encode(String(content)).length
  );
  const apiRes = new Response(content, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/html",
      "X-Last-Generated": lastRendered,
      "Content-Length": contentLength
    }
  });
  return {
    apiReq,
    apiRes
  };
}

interface ISaveEntireResourceOffline extends ISaveOfflineCommon {
  mutateStoreText(key: "text", val: bibleEntryObj[] | null): void;
  promiseLimit: LimitFunction;
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
  const promises: Array<Promise<unknown>> = [];
  try {
    const downloadIndex = await checkForOrDownloadWholeRepo({
      user: user,
      repo: repo,
      method: "GET"
    });
    if (
      !downloadIndex ||
      typeof downloadIndex != "object" ||
      !downloadIndex.content.length
    )
      throw new Error("failed to fetch download index");

    // response is same shape as working memory, so add to working memory and eliminate need for any other api calls
    mutateStoreText("text", downloadIndex.content);

    //  clone the current index bc it has some metadata on it, and we are ultimately going to save a complete version of it once merging in the download index.
    const indexClone = structuredClone(repoIndex);
    indexClone.bible = downloadIndex.content;
    const ssrPostPayload = JSON.stringify(indexClone);

    // compress to minimize transfer to try to avoid CF timeouts
    const gzippedPayload = gzipSync(strToU8(ssrPostPayload));
    const rowWholeResourcesCache = await caches.open(CACHENAMES.complete);
    const lrApiCache = await caches.open(CACHENAMES.lrApi);
    const lrPagesCache = await caches.open(CACHENAMES.lrPagesCache);

    // SAVE THE WHOLE DOWNLOAD INDEX
    const swUrl = new URL(`${window.location.origin}/${user}/${repo}`);
    const allBookSlugAndRendered = indexClone.bible.map((book) => {
      return {
        slug: book.slug,
        lastRendered: book.lastRendered
      };
    });

    promises.push(
      promiseLimit(() =>
        rowWholeResourcesCache.put(
          swUrl,
          new Response(gzippedPayload, {
            status: 200,
            statusText: "OK",
            headers: {
              "Content-Type": "text/html",
              "Content-Length": String(repoIndex.wholeResourceByteCount),
              "X-Last-Generated": new Date().toISOString(),
              "X-Is-Complete": "1",
              "X-Complete-Books": JSON.stringify(allBookSlugAndRendered)
            }
          })
        )
      )
    );

    // GET A SSR'D REQ/RESPONSE THAT WILL SERVE FOR ALL HTML PAGES OF THIS RESOURCE
    const slug = currentBook?.slug ?? "";
    const htmlSsrUrl = getHtmlSsrUrl({
      bookSlug: slug,
      chapter: currentChapter,
      repo,
      user
    });

    const smallIndex = JSON.stringify(repoIndex);
    // using the small index here bc in prod I hit the CF limit for execution time several times with big resources (e.g. compressing 20mb json payload).  Since we already are saving the html as a json structure in the cache, we will just load in when the app mounts from the browser in an onMount.  The other reason is that we incrementally delete / update the object in the cache, but have to wholesale replace a cached html response, so, despite the extra bit of onMount loading, it lets the json in the cache be the updateable source of truth and not the html response from the site.
    const smallPayload = gzipSync(strToU8(smallIndex));

    const smallerHtmlSsrUrlRes = await fetch(htmlSsrUrl, {
      method: "POST",
      body: smallPayload,
      headers: {
        "Content-Type": "text/html",
        "Accept-Encoding": "gzip"
      }
    });
    const blob = await smallerHtmlSsrUrlRes.blob();
    const size = blob.size;

    promises.push(
      promiseLimit(() =>
        lrPagesCache.put(
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
      )
    );

    // We will save each html page below, but we are saving one SSR reponse under a URL that the user shouldn't naturally arrive at (e.g. /complete). When processing a document request in the SW script, it will check to see if there is a match for /origin/user/repo/complete, and serve this (offline ready) response here.
    downloadIndex.content.forEach((book) => {
      // eslint-disable-next-line solid/reactivity
      book.chapters.forEach(async (chapter) => {
        //@ HANDLE STORING CF/AJAX REQS IN SW
        const content = chapter.content;
        if (!content) return;

        const { apiReq, apiRes } = getApiUrlAndResponse({
          bookSlug: book.slug,
          chapter: chapter.label,
          content,
          lastRendered: repoIndex.lastRendered,
          repo,
          user
        });
        promises.push(
          promiseLimit(() => {
            return lrApiCache.put(apiReq, apiRes);
          })
        );
      });
    });

    return promises;
  } catch (error) {
    console.error(error);
  }
}
