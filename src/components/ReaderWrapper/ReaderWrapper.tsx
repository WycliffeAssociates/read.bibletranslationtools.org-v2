import type { i18nDictKeysType } from "@lib/i18n"
import { createI18nContext, I18nContext } from "@solid-primitives/i18n"
import { createSignal, createMemo } from "solid-js"
import type { JSX } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { FUNCTIONS_ROUTES } from "@lib/routes"
import { ReaderMenu, ReaderPane } from "@components"

import type {
  bibleChapObj,
  bibleEntryObj,
  repoIndexObj
} from "@src/customTypes/types"
import type { Accessor } from "solid-js"

// types are a little verbose up here: See them at the bottom:

export default function ReaderWrapper(props: ReaderWrapperProps) {
  //======= Reader App state =============
  // ideally, context is a more native fit than this prop passing for something that is only rendering children, but not possible with Astro and the way islands are implmented.  Just a tradeoff.
  if (!props.repoData.bible?.length) return null //can't do anything without bible, and to satisfy TS narrowing

  let defaultStore = {
    currentBook: props.firstBookKey,
    currentChapter: props.firstChapterToShow,
    menuBook: props.firstBookKey,
    searchedBooks: props.repoData.bible.map((book) => {
      return {
        label: book.label,
        slug: book.slug
      }
    }),
    text: props.repoData.bible,
    languageName: props.repoData.languageName,
    languageCode: props.repoData.languageCode,
    resourceType: props.repoData.resourceType,
    textDirection: props.repoData.textDirection,
    repoUrl: props.repoData.repoUrl
  }

  const [readerStore, setReaderStore] = createStore(defaultStore)
  const [printWholeBook, setPrintWholeBook] = createSignal(false)

  // Wrappers and predefined functions for reading and mutating store;
  // # Limit to the non object keys: E.g. string or string[]
  // https://javascript.plainenglish.io/typescript-essentials-conditionally-filter-types-488705bfbf56
  type FilterConditionally<Source, Condition> = Pick<
    Source,
    {
      [K in keyof Source]: Source[K] extends Condition ? K : never
    }[keyof Source]
  >
  type mutateSimple = FilterConditionally<
    typeof readerStore,
    | string[]
    | string
    | {
        label: string
        slug: string
      }[]
  >

  function mutateStore<T extends keyof mutateSimple>(
    key: T,
    val: (typeof readerStore)[T]
  ): void {
    setReaderStore(
      produce((currentStore) => {
        currentStore[key] = val
      })
    )
  }

  function mutateStoreText({ book, chapter, val }: updateStoreTextParams) {
    setReaderStore(
      produce((currentStore) => {
        let currentBook = currentStore.text.findIndex(
          (storeBib) => storeBib.slug == book
        )
        let currentChap = currentStore.text[currentBook].chapters.findIndex(
          (storeChap) => storeChap.label == chapter
        )
        currentStore.text[currentBook].chapters[currentChap].text = val
      })
    )
  }
  function getStoreVal<T>(key: keyof typeof readerStore) {
    return readerStore[key] as T
  }

  const allBibArr = createMemo(() => {
    return readerStore.text
  })
  const getMenuBook = createMemo(() => {
    let menuBook = readerStore.text.find((storeBib) => {
      return storeBib.slug == readerStore.menuBook
    })

    return menuBook
  })
  const isOneBook = () => {
    return readerStore.text.length == 1
  }
  const currentBookObj = createMemo(() => {
    // return readerStore.text[readerStore.currentBook]
    let currentBook = readerStore.text.find((storeBib) => {
      return storeBib.slug == readerStore.currentBook
    })
    return currentBook
  })

  const currentChapObj = createMemo(() => {
    const currentBook = currentBookObj()
    let currentChap = currentBook?.chapters.find(
      (chap) => readerStore.currentChapter == chap.label
    )
    return currentChap
  })
  const navLinks = createMemo(() => {
    const currentBook = currentBookObj()
    if (!currentBook) return

    const currentChapIdx = currentBook?.chapters.findIndex(
      (chap) => readerStore.currentChapter == chap.label
    )

    const isFirstChapter = currentChapIdx && currentChapIdx === 0
    const isLastChapter =
      currentChapIdx && currentChapIdx == currentBook?.chapters.length - 1

    let prevChapObj = isFirstChapter
      ? null
      : currentBook.chapters[currentChapIdx - 1]
    let nextChapObj = isLastChapter
      ? null
      : currentBook.chapters[currentChapIdx + 1]
    let navParam = {
      prev: prevChapObj?.label,
      next: nextChapObj?.label
    }
    return navParam
  })

  function getChapObjFromGivenBook(bookSlug: string, chap: number | string) {
    let book = readerStore.text.find((storeBib) => {
      return storeBib.slug == bookSlug
    })
    let chapter = book?.chapters.find((bookChap) => bookChap.label == chap)
    return chapter
  }
  const wholeBookHtml = createMemo(() => {
    let currentBook = currentBookObj()
    let html = currentBook?.chapters.map((chap) => chap.text).join("")
    return html || undefined
  })
  const HTML = createMemo(() => {
    let currentChap = currentChapObj()
    // const retVal = currentBook[readerStore.currentChapter]
    return (currentChap && currentChap.text) || undefined
  })
  const maxChapter = createMemo(() => {
    const bookObj = readerStore.text.find((storeBook) => {
      return storeBook.slug == readerStore.menuBook
    })
    // const bookObj = readerStore.text[readerStore.menuBook]
    // const vals = Object.keys(bookObj).map((val) => Number(val))
    // return Math.max(...vals)
    let last = bookObj && bookObj.chapters.length
    return last
  })
  const menuBookNames = createMemo(() => {
    return readerStore.searchedBooks
  })
  const possibleChapters = createMemo(() => {
    // const chapters = Object.keys(readerStore.text[readerStore.menuBook])
    const bookObj = readerStore.text.find((storeBook) => {
      return storeBook.slug == readerStore.menuBook
    })
    const chapters = bookObj && bookObj.chapters
    return chapters
  })

  // @ fetching html
  let controller //reuse btw invocations
  let signal
  const [isFetching, setIsFetching] = createSignal(false)
  async function fetchHtml({
    book = readerStore.currentBook,
    chapter,
    skipAbort = false
  }: fetchHtmlParms): Promise<string | false | void> {
    controller = new AbortController()
    signal = controller.signal

    if (isFetching() && !skipAbort) {
      return controller.abort()
    }
    setIsFetching(true)
    let nextUrl = FUNCTIONS_ROUTES.getRepoHtml({
      user: props.user,
      repo: props.repositoryName,
      book: book,
      chapter: chapter
    })
    try {
      let response = await fetch(nextUrl, {
        signal: signal
      })
      let text = await response.text()
      return text
    } catch (error) {
      console.error(error)
      return false
    } finally {
      setIsFetching(false)
      // return;
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
    navLinks
  }

  return (
    <>
      <I18nProvider
        locale={props.preferredLocale}
        initialDict={props.initialDict}
      >
        <div class=" mx-auto grid max-h-full grid-rows-[90px,_calc(100vh-190px)] print:block md:grid-rows-[70px,_calc(100vh-170px)] md:justify-center">
          <div class=" w-screen border-b border-b-neutral-200">
            <ReaderMenu
              storeInterface={storeInterface}
              setPrintWholeBook={setPrintWholeBook}
              user={props.user}
              repositoryName={props.repositoryName}
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
      </I18nProvider>
    </>
  )
}

interface i18Props {
  locale: i18nDictKeysType
  children: JSX.Element
  initialDict: any
}
function I18nProvider(props: i18Props) {
  const value = createI18nContext(props.initialDict, props.locale)

  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  )
}

export type repoShape = {
  [index: string]: {
    [index: string]: string
  }
}

export type updateStoreTextParams = {
  book: string
  chapter: string
  val: string
}
export type fetchHtmlParms = {
  book: string
  chapter: string
  skipAbort?: boolean
}

export interface ReaderWrapperProps {
  user: string
  repositoryName: string
  preferredLocale: i18nDictKeysType
  firstBookKey: string
  firstChapterToShow: string
  repoData: repoIndexObj
  initialDict: any /* todo change all initial dict types */
}
export interface storeType {
  mutateStore<
    T extends
      | "currentBook"
      | "currentChapter"
      | "menuBook"
      | "searchedBooks"
      | "languageName"
      | "languageCode"
      | "resourceType"
      | "textDirection"
      | "repoUrl"
  >(
    key: T,

    val: {
      currentBook: string
      currentChapter: string
      menuBook: string
      searchedBooks: {
        label: string
        slug: string
      }[]
      languageName: string
      languageCode: string
      resourceType: string
      textDirection: string
      repoUrl: string
    }[T]
  ): void
  mutateStoreText: ({ book, chapter, val }: updateStoreTextParams) => void
  getStoreVal: <T>(
    key:
      | "currentBook"
      | "currentChapter"
      | "menuBook"
      | "searchedBooks"
      | "text"
      | "languageName"
      | "languageCode"
      | "resourceType"
      | "textDirection"
      | "repoUrl"
  ) => T

  allBibArr: Accessor<bibleEntryObj[]>
  isOneBook: () => boolean
  currentBookObj: Accessor<bibleEntryObj | undefined>
  currentChapObj: Accessor<bibleChapObj | undefined>
  getChapObjFromGivenBook(
    bookSlug: string,
    chap: number | string
  ): bibleChapObj | undefined
  HTML: Accessor<string | undefined>
  maxChapter: Accessor<number | undefined>
  menuBookNames: Accessor<
    {
      label: string
      slug: string
    }[]
  >
  getMenuBook: Accessor<bibleEntryObj | undefined>
  possibleChapters: Accessor<bibleChapObj[] | undefined>
  fetchHtml: ({
    book,
    chapter
  }: fetchHtmlParms) => Promise<string | false | void>
  wholeBookHtml: Accessor<string | undefined>
  navLinks: Accessor<
    | {
        prev: string | undefined
        next: string | undefined
      }
    | undefined
  >
}
