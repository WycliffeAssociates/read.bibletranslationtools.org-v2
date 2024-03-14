import { onCleanup, type Setter } from "solid-js";
import { CACHENAMES } from "@lib/contants";
import { gunzipSync, gzipSync, strFromU8, strToU8 } from "fflate";
import type { bibleEntryObj, repoIndexObj } from "@customTypes/types";
import type { LimitFunction } from "p-limit";
import { FUNCTIONS_ROUTES } from "@lib/routes";
import { checkForOrDownloadWholeRepo } from "@lib/api";

/* @===============  UI UTILS   =============   */

export function getHtmlWithinSpan(
  node: Element,
  predicate: (element: Element) => boolean
): string {
  const truthyFunction = predicate;
  const htmlBucket: Array<Element> = [];

  function recursivelyGatherDomUntil(
    node: Element,
    predicate: (element: Element) => boolean
  ) {
    if (predicate(node)) {
      return htmlBucket;
    } else {
      htmlBucket.push(node);
      const nextNode = node.nextElementSibling as Element;
      if (!nextNode) return htmlBucket;
      const newPredicate = () => truthyFunction(nextNode);
      recursivelyGatherDomUntil(nextNode, newPredicate);
    }
  }
  recursivelyGatherDomUntil(node, predicate);
  const outerHtml = htmlBucket.map((el) => el.outerHTML).join("");
  return outerHtml;
}

/* @===============  CUSTOM SOLID DIRECTIVES  =============   */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clickOutside(el: Element, accessor: () => any) {
  const onClick = (e: Event) =>
    !el.contains(e.target as Node) && accessor()?.();
  document.body.addEventListener("click", onClick);
  onCleanup(() => document.body.removeEventListener("click", onClick));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function escapeOut(el: Element, accessor: () => any) {
  const onKeypress = (e: KeyboardEvent) => {
    e.key === "Escape" && accessor()?.();
  };
  document.body.addEventListener("keyup", onKeypress);
  onCleanup(() => document.body.removeEventListener("keyup", onKeypress));
}

interface positionPreviewPaneParams {
  target: HTMLElement;
  previewPaneSelector: string;
  previewPaneSetter: Setter<boolean>;
  setPos: Setter<{
    x: string;
    y: string;
  }>;
}
export function positionPreviewPane({
  target,
  previewPaneSelector,
  previewPaneSetter,
  setPos
}: positionPreviewPaneParams) {
  const rect = target.getBoundingClientRect();
  previewPaneSetter(true);
  const previewPane = document.querySelector(previewPaneSelector); //stick in DOM to measure it's vh client height. This runs quickly enough that you won't get some flashing before we position it;
  if (!previewPane) return previewPaneSetter(false);
  const windowMidPoint = window.innerWidth / 2;
  const posX =
    rect.x > windowMidPoint ? rect.x - 50 + "px" : rect.x + 50 + "px";
  const posY =
    rect.y > window.innerHeight / 2
      ? rect.y - previewPane.clientHeight
      : rect.y + 30;
  setPos({
    x: posX,
    y: posY + "px"
  });
}
export function debounce(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (...params: any[]) => void,
  wait: number
) {
  let timeoutId: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}
interface IdeleteSingleBookFromSw {
  bookSlug: string;
  user: string;
  repo: string;
  bookChapters: string[];
}
export async function deleteAllResourceFromSw({
  user,
  repo,
  repoIndex,
  promiseLimit
}: {
  user: string;
  repo: string;
  repoIndex: repoIndexObj;
  bookSlug: string;
  promiseLimit: LimitFunction;
}) {
  const promises: Promise<unknown>[] = [];

  const rowWholeResourcesCache = await caches.open(CACHENAMES.complete);
  const pagesCaches = await caches.open(CACHENAMES.lrPagesCache);
  const apiCache = await caches.open(CACHENAMES.lrApi);

  promises.push(
    promiseLimit(() =>
      rowWholeResourcesCache.delete(`${window.location.origin}/${user}/${repo}`)
    )
  );
  promises.push(
    promiseLimit(() =>
      pagesCaches.delete(`${window.location.origin}/${user}/${repo}/complete`)
    )
  );

  const allDeleteableApiRoutes =
    repoIndex.bible
      ?.map((book) => {
        return book.chapters.map((chap) => {
          return `/api/getHtmlForChap?user=${user}&repo=${repo}&book=${book.slug}&chapter=${chap.label}`;
        });
      })
      .flat() || [];

  for (const route of allDeleteableApiRoutes) {
    promises.push(
      promiseLimit(() => {
        return apiCache.delete(route);
      })
    );
  }
  return promises;
}
export async function deleteSingleBookFromSw({
  bookSlug,
  user,
  repo,
  bookChapters,
  promiseLimit
}: IdeleteSingleBookFromSw & {
  promiseLimit: LimitFunction;
}) {
  const promises: Promise<unknown>[] = [];

  const rowWholeResourcesCache = await caches.open(CACHENAMES.complete);
  const apiCache = await caches.open(CACHENAMES.lrApi);
  const wholeResource = await rowWholeResourcesCache.match(
    `${window.location.origin}/${user}/${repo}`
  );
  if (!wholeResource) return undefined;
  const arrBuff = await wholeResource.arrayBuffer();
  const u8Array = new Uint8Array(arrBuff);
  const decodedU8 = gunzipSync(u8Array);
  const decodedRepoIndex = JSON.parse(strFromU8(decodedU8)) as repoIndexObj;

  const specificedBook = decodedRepoIndex.bible?.find((storeBib) => {
    return storeBib.slug.toLowerCase() == String(bookSlug).toLowerCase();
  });
  if (!specificedBook) return undefined;
  specificedBook.chapters.forEach((chap) => {
    chap.content = "";
  });
  const addlPromise = await writeRepoIndexToSw(decodedRepoIndex, user, repo);
  promises.push(promiseLimit(addlPromise));

  for await (const chap of bookChapters) {
    promises.push(
      promiseLimit(() => {
        return apiCache.delete(
          `/api/getHtmlForChap?user=${user}&repo=${repo}&book=${bookSlug}&chapter=${chap}`
        );
      })
    );
  }
  return promises;
}

export async function writeRepoIndexToSw(
  repoIndex: repoIndexObj,
  user: string,
  repo: string
) {
  const rowWholeResourcesCache = await caches.open(CACHENAMES.complete);
  const gzippedPayload = gzipSync(strToU8(JSON.stringify(repoIndex)));

  const booksWithAllContent = repoIndex.bible
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
    booksWithAllContent.length === repoIndex.bible?.length;

  const wholeResUrl = new URL(`${window.location.origin}/${user}/${repo}`);
  const returnedPromise = () =>
    rowWholeResourcesCache.put(
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
    );
  return returnedPromise;
}

export async function extractRepoIndexFromSavedWhole(
  savedResponse: Response | undefined
) {
  if (!savedResponse) return;
  // clone the response bc in the case that someone clicks save whole and then save book and the print book, or whatever, they may want to access the response multiple times, and you can only read the body once.
  const wholeResourceMatch = savedResponse.clone();
  if (!wholeResourceMatch) return;
  const arrBuff = await wholeResourceMatch.arrayBuffer();
  const u8Array = new Uint8Array(arrBuff);
  const decodedU8 = gunzipSync(u8Array);
  const originalRepoIndex = JSON.parse(strFromU8(decodedU8)) as repoIndexObj;
  return originalRepoIndex;
}
interface IgetWholeBook {
  user: string;
  repo: string;
  savedResponse: Response | undefined | null;
  bookSlug: string;
  storeBook: bibleEntryObj | undefined;
}
export async function getWholeBook({
  user,
  repo,
  savedResponse,
  bookSlug,
  storeBook
}: IgetWholeBook) {
  async function fetchTheBook(bookSlug: string) {
    try {
      const wholeBookUrl = FUNCTIONS_ROUTES.getWholeBookJson({
        user: user,
        repo: repo,
        book: bookSlug
      });
      const wholeBookRes = await fetch(wholeBookUrl);
      const data: bibleEntryObj = await wholeBookRes.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  }
  try {
    // Check Memory
    if (storeBook) {
      const chapsArr = storeBook.chapters
        .filter((chap) => !!chap.content)
        .map((chap) => chap.content);
      const isComplete = storeBook.chapters.length == chapsArr.length;
      if (isComplete) {
        return storeBook;
      }
    }
    // Check SW
    let originalRepoIndex;
    if (savedResponse) {
      originalRepoIndex = await extractRepoIndexFromSavedWhole(savedResponse);
    }
    if (originalRepoIndex) {
      const matchingBook = originalRepoIndex?.bible?.find(
        (book) => book.slug == bookSlug
      );
      const matchingBookIsPopulated =
        matchingBook && matchingBook.chapters.every((chap) => !!chap.content);
      if (matchingBookIsPopulated) {
        return matchingBook;
      } else {
        if (!bookSlug) return;
        const data = await fetchTheBook(bookSlug);
        return data;
      }
    } else {
      if (!bookSlug) return;
      const data = await fetchTheBook(bookSlug);
      return data;
    }
  } catch (error) {
    console.error(error);
  }
}
interface IgetWholeResource {
  user: string;
  repo: string;
  bibArr: bibleEntryObj[];
}
export async function getWholeResource({
  user,
  repo,
  bibArr
}: IgetWholeResource) {
  try {
    // Check Memory
    if (bibArr) {
      const isComplete = bibArr.every((book) =>
        book.chapters.every((chap) => !!chap.content)
      );
      if (isComplete) {
        return bibArr;
      } else {
        // Fetch it;
        const downloadIndex = await checkForOrDownloadWholeRepo({
          user: user,
          repo: repo,
          method: "GET"
        });
        if (
          !downloadIndex ||
          typeof downloadIndex != "object" ||
          !downloadIndex.content.length
        ) {
          return;
        }
        return downloadIndex.content;
      }
    }
  } catch (error) {
    console.error(error);
  }
}
export function getPortalSpot() {
  return document.getElementById("menuPortalMount") as HTMLDivElement;
}
