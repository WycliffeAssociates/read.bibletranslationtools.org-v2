import type { i18nDictKeysType } from "@lib/i18n";
import { createSignal, createMemo, Show, onMount, batch } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { FUNCTIONS_ROUTES } from "@lib/routes";
import { LoadingSpinner } from "@components/Icons/Icons";
import { ReaderMenu } from "@components/ReaderMenu/ReaderMenu";
import { ReaderPane } from "@components/ReaderPane/ReaderPane";
import { strFromU8, gunzipSync } from "fflate";

import type {
  bibleChapObj,
  bibleEntryObj,
  repoIndexObj
} from "@customTypes/types";
import type { Accessor } from "solid-js";
import { debounce } from "@lib/utils-ui";
import { CACHENAMES } from "@lib/contants";

// parameter types at bottom of file due to verbosity.

export function ReaderWrapper(props: ReaderWrapperProps) {
  //======= Reader App state =============
  // ideally, context is a more native fit than this prop passing for something that is only rendering children, but not possible with Astro and the way islands are implmented.  Just a tradeoff.

  // there is only the parent astro template passing ssr props. They aren't going to update, so we don't have to worry about the early return or the reactivity of props here.

  // eslint-disable-next-line solid/reactivity, solid/components-return-once
  const bibText = props.repoData.bible; //ts can typecheck when assigned to a local variable.

  const defaultStore = () => {
    return {
      currentBook: props.firstBookKey,
      currentChapter: props.firstChapterToShow,
      menuBook: props.firstBookKey,
      searchableBooks: bibText?.map((book) => {
        return {
          label: book.label,
          slug: book.slug
        };
      }),
      text: bibText,
      languageName: props.repoData.languageName,
      languageCode: props.repoData.languageCode,
      resourceType: props.repoData.resourceType,
      textDirection: props.repoData.textDirection,
      repoUrl: props.repoData.repoUrl,
      downloadLinks: props.repoData.downloadLinks,
      printHtml: ""
    };
  };
  // eslint-disable-next-line solid/reactivity
  const [readerStore, setReaderStore] = createStore(defaultStore());
  const [printWholeBook, setPrintWholeBook] = createSignal(false);

  // eslint-disable-next-line solid/reactivity
  const [doRender, setDoRender] = createSignal(!props.wasPostRequest);

  // Wrappers and predefined functions for reading and mutating store;
  // # Limit to the non object keys: E.g. string or string[]
  // https://javascript.plainenglish.io/typescript-essentials-conditionally-filter-types-488705bfbf56
  type FilterConditionally<Source, Condition> = Pick<
    Source,
    {
      [K in keyof Source]: Source[K] extends Condition ? K : never;
    }[keyof Source]
  >;
  type mutateSimple = FilterConditionally<
    typeof readerStore,
    | string[]
    | string
    | {
        label: string;
        slug: string;
      }[]
    | bibleEntryObj[]
    | null
    | undefined
  >;

  function mutateStore<T extends keyof mutateSimple>(
    key: T,
    val: (typeof readerStore)[T]
  ): void {
    setReaderStore(
      produce((currentStore) => {
        currentStore[key] = val;
      })
    );
  }

  function mutateStoreText({ book, chapter, val }: updateStoreTextParams) {
    setReaderStore(
      produce((currentStore) => {
        if (!currentStore.text) return;
        const currentBook = currentStore.text.findIndex(
          (storeBib) => storeBib.slug == book
        );
        const currentChap = currentStore.text[currentBook].chapters.findIndex(
          (storeChap) => storeChap.label == chapter
        );
        currentStore.text[currentBook].chapters[currentChap].content = val;
      })
    );
  }

  function getStoreVal<T>(key: keyof typeof readerStore) {
    return readerStore[key] as T;
  }

  const allBibArr = createMemo(() => {
    return readerStore.text;
  });
  const getMenuBook = createMemo(() => {
    if (!readerStore.text) return;
    const menuBook = readerStore.text.find((storeBib) => {
      return storeBib.slug == readerStore.menuBook;
    });

    return menuBook;
  });
  const isOneBook = () => {
    if (!readerStore.text) return;
    return readerStore.text.length == 1;
  };
  const currentBookObj = createMemo(() => {
    if (!readerStore.text) return;
    const currentBook = readerStore.text.find((storeBib) => {
      return storeBib.slug == readerStore.currentBook;
    });
    return currentBook;
  });

  const currentChapObj = createMemo(() => {
    const currentBook = currentBookObj();
    const currentChap = currentBook?.chapters.find(
      (chap) => readerStore.currentChapter == chap.label
    );
    return currentChap;
  });
  const navLinks = createMemo(() => {
    const currentBook = currentBookObj();
    if (!currentBook) return;

    const currentChapIdx = currentBook?.chapters.findIndex(
      (chap) => readerStore.currentChapter == chap.label
    );

    const isFirstChapter = currentChapIdx && currentChapIdx === 0;
    const isLastChapter =
      currentChapIdx && currentChapIdx == currentBook?.chapters.length - 1;

    const prevChapObj = isFirstChapter
      ? null
      : currentBook.chapters[currentChapIdx - 1];
    const nextChapObj = isLastChapter
      ? null
      : currentBook.chapters[currentChapIdx + 1];
    const navParam = {
      prev: prevChapObj?.label,
      next: nextChapObj?.label
    };
    return navParam;
  });

  function getChapObjFromGivenBook(bookSlug: string, chap: number | string) {
    if (!readerStore.text) return;
    const book = readerStore.text.find((storeBib) => {
      return storeBib.slug == bookSlug;
    });
    const chapter = book?.chapters.find((bookChap) => bookChap.label == chap);
    return chapter;
  }
  const wholeBookHtml = createMemo(() => {
    const currentBook = currentBookObj();
    const html = currentBook?.chapters.map((chap) => chap.content).join("");
    return html || undefined;
  });
  const wholeResourceHtml = createMemo(() => {
    const html = readerStore.text
      ?.map((book) => book.chapters.map((chap) => chap.content))
      .flat()
      .filter((content) => !!content)
      .join("");
    return html;
  });
  const HTML = createMemo(() => {
    const currentChap = currentChapObj();

    return (currentChap && currentChap.content) || undefined;
  });
  const maxChapter = createMemo(() => {
    if (!readerStore.text) return;
    const bookObj = readerStore.text.find((storeBook) => {
      return storeBook.slug == readerStore.menuBook;
    });

    const last = bookObj && bookObj.chapters.length;
    return last;
  });
  const menuBookNames = createMemo(() => {
    const val = readerStore.text?.map((book) => {
      return {
        label: book.label,
        slug: book.slug
      };
    });
    return val;
  });
  const possibleChapters = createMemo(() => {
    if (!readerStore.text) return;
    const bookObj = readerStore.text.find((storeBook) => {
      return storeBook.slug == readerStore.menuBook;
    });
    const chapters = bookObj && bookObj.chapters;
    return chapters;
  });

  // @ fetching html
  let controller; //reuse btw invocations
  let signal;
  const [isFetching, setIsFetching] = createSignal(false);
  async function fetchHtml({
    book = readerStore.currentBook,
    chapter,
    skipAbort = false
  }: fetchHtmlParms): Promise<string | false | void> {
    controller = new AbortController();
    signal = controller.signal;

    if (isFetching() && !skipAbort) {
      return controller.abort();
    }
    setIsFetching(true);
    const nextUrl = FUNCTIONS_ROUTES.getRepoHtml({
      user: props.user,
      repo: props.repositoryName,
      book: book,
      chapter: chapter
    });
    try {
      const response = await fetch(nextUrl, {
        signal: signal
      });
      const text = await response.text();
      return text;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsFetching(false);
    }
  }

  const storeInterface: storeType = {
    mutateStore,
    mutateStoreText,
    getStoreVal,
    allBibArr,
    isOneBook,
    currentBookObj,
    currentChapObj,
    getChapObjFromGivenBook,
    HTML,
    wholeBookHtml,
    maxChapter,
    menuBookNames,
    possibleChapters,
    fetchHtml,
    getMenuBook,
    navLinks,
    wholeResourceHtml
  };

  // These functions sends a custom event of wrapper scroll position so that hover panes/tooltips disappear if you start scrolling away from them
  function reportScrollPosition(event: Event) {
    const target = event.target as HTMLElement;
    const amount = target.scrollTop;
    const notifyPreviewPaneOfScrollEvent = new CustomEvent(
      "notifiedOfScrollTop",
      {
        detail: {
          amount: amount
        }
      }
    );

    const previewPane = document.querySelector("#previewPane");
    previewPane && previewPane.dispatchEvent(notifyPreviewPaneOfScrollEvent);
  }
  const notifyPreviewPaneOfScroll = debounce(reportScrollPosition, 20);

  // If this page was the result response of being saved offline, we'll need to adjust the navigation for the query parameters here.  There may be the conditional need to load data from the service worker too if the post request failed when passing a large body.
  onMount(async () => {
    if (props.wasPostRequest) {
      const queryParams = new URLSearchParams(window.location.search);
      const book = queryParams.get("book");
      const chapter = queryParams.get("chapter");

      const rowWholeResourcesCache = await caches.open(CACHENAMES.complete);
      const wholeResource = await rowWholeResourcesCache.match(
        `${window.location.origin}/${props.user}/${props.repositoryName}`
      );
      if (!wholeResource) return;
      const arrBuff = await wholeResource.arrayBuffer();
      const u8Array = new Uint8Array(arrBuff);
      const decodedU8 = gunzipSync(u8Array);
      const decodedRepoIndex = JSON.parse(strFromU8(decodedU8)) as repoIndexObj;

      const completeText = decodedRepoIndex.bible;

      let storeQueryParamBook = completeText?.find((storeBib) => {
        return storeBib.slug.toLowerCase() == String(book).toLowerCase();
      });
      if (!storeQueryParamBook || !chapter || !book) return setDoRender(true);
      let storeQueryParamChapter =
        storeQueryParamBook &&
        storeQueryParamBook.chapters.find((chap) => chap.label == chapter);

      if (!storeQueryParamChapter?.content) {
        // fallback to first available contents
        storeQueryParamBook = completeText?.find((storeBib) => {
          return storeBib.chapters.find((chap) => !!chap.content);
        });
        storeQueryParamChapter = storeQueryParamBook?.chapters.find(
          (chap) => !!chap.content
        );
      }
      batch(() => {
        mutateStore("text", completeText);
        if (storeQueryParamBook) {
          mutateStore("currentBook", storeQueryParamBook.slug);
        }
        if (storeQueryParamChapter) {
          mutateStore("currentChapter", storeQueryParamChapter.label);
        }
      });
      setDoRender(true);
      // setIsFetchingSwData(false)
    } else {
      setDoRender(true);
    }
  });

  return (
    <Show
      when={doRender()}
      fallback={<LoadingSpinner classNames="w-12 mx-auto my-8 text-accent" />}
    >
      <div
        onScroll={notifyPreviewPaneOfScroll}
        id="readerWrapper"
        data-js="scrollToTop"
        class=" mx-auto grid max-h-full w-full overflow-hidden bg-[--clrBackground] bg-gray-100  md:justify-center print:!block print:overflow-visible"
      >
        <div class="sticky top-0 z-40 w-full">
          <ReaderMenu
            repoIndex={props.repoData}
            storeInterface={storeInterface}
            setPrintWholeBook={setPrintWholeBook}
            user={props.user}
            repositoryName={props.repositoryName}
            hasDownloadIndex={props.hasDownloadIndex}
            initialDict={props.initialDict}
          />
        </div>
        <ReaderPane
          storeInterface={storeInterface}
          user={props.user}
          repositoryName={props.repositoryName}
          firstBookKey={props.firstBookKey}
          firstChapterToShow={props.firstChapterToShow}
          printWholeBook={printWholeBook}
        />
      </div>
      <div class="relative mx-auto  max-w-[105ch]" id="menuPortalMount" />
    </Show>
  );
}

export type repoShape = {
  [index: string]: {
    [index: string]: string;
  };
};

export type updateStoreTextParams = {
  book: string;
  chapter: string;
  val: string;
};
export type fetchHtmlParms = {
  book: string;
  chapter: string;
  skipAbort?: boolean;
};

export interface ReaderWrapperProps {
  user: string;
  repositoryName: string;
  preferredLocale: i18nDictKeysType;
  firstBookKey: string;
  firstChapterToShow: string;
  repoData: repoIndexObj;
  hasDownloadIndex: boolean;
  wasPostRequest: boolean;
  initialDict: Record<string, string>;
  // isReqToGenerateOnClient: boolean
  // resLevel: string | null
}
export interface storeType {
  mutateStore<
    T extends
      | "text"
      | "currentChapter"
      | "currentBook"
      | "menuBook"
      | "searchableBooks"
      | "languageName"
      | "languageCode"
      | "resourceType"
      | "textDirection"
      | "repoUrl"
      | "printHtml"
  >(
    key: T,
    val: {
      currentBook: string;
      currentChapter: string;
      menuBook: string;
      searchableBooks:
        | {
            label: string;
            slug: string;
          }[]
        | undefined;
      text: bibleEntryObj[] | null;
      languageName: string;
      languageCode: string;
      resourceType: "bible" | "tn" | "tq" | "commentary" | "tw" | "tm";
      textDirection: string;
      repoUrl: string;
      printHtml: string;
      downloadLinks:
        | []
        | {
            link: string;
            title: string;
          }[];
    }[T]
  ): void;
  mutateStoreText: ({ book, chapter, val }: updateStoreTextParams) => void;
  getStoreVal: <T>(
    key:
      | "searchableBooks"
      | "text"
      | "currentBook"
      | "currentChapter"
      | "menuBook"
      | "searchableBooks"
      | "languageName"
      | "languageCode"
      | "resourceType"
      | "textDirection"
      | "repoUrl"
      | "downloadLinks"
      | "printHtml"
  ) => T;

  allBibArr: () => bibleEntryObj[] | null;
  isOneBook: () => boolean | undefined;
  currentBookObj: Accessor<bibleEntryObj | undefined>;
  currentChapObj: Accessor<bibleChapObj | undefined>;
  getChapObjFromGivenBook(
    bookSlug: string,
    chap: number | string
  ): bibleChapObj | undefined;
  HTML: Accessor<string | undefined>;
  maxChapter: Accessor<number | undefined>;
  menuBookNames: Accessor<
    | {
        label: string;
        slug: string;
      }[]
    | undefined
  >;
  getMenuBook: Accessor<bibleEntryObj | undefined>;
  possibleChapters: Accessor<bibleChapObj[] | undefined>;
  fetchHtml: ({
    book,
    chapter
  }: fetchHtmlParms) => Promise<string | false | void>;
  wholeBookHtml: Accessor<string | undefined>;
  navLinks: Accessor<
    | {
        prev: string | undefined;
        next: string | undefined;
      }
    | undefined
  >;
  wholeResourceHtml: Accessor<string | undefined>;
}
