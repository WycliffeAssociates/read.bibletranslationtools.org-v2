import { i18nDict, i18nDictKeysType } from "@lib/i18n"
import { createI18nContext, I18nContext } from "@solid-primitives/i18n"
import { createSignal, onMount, Show, createMemo, Accessor } from "solid-js"
import type { JSX } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { FUNCTIONS_ROUTES } from "@lib/routes"
import { ReaderMenu, ReaderPane } from "@components"
import type { StoreNode, Store, SetStoreFunction } from "solid-js/store"

// types are a little verbose up here: See them as the bottom:

export default function ReaderWrapper(props: ReaderWrapperProps) {
  //======= Reader App state =============
  // ideally, context is a more native fit than this prop passing for something that is only rendering children, but not possible with Astro and the way islands are implmented.  Just a tradeoff.

  let defaultStore = {
    currentBook: props.firstBookKey,
    currentChapter: props.firstChapterToShow,
    menuBook: props.firstBookKey,
    searchedBooks: Object.keys(props.repoData),
    text: props.repoData
  }

  const [readerStore, setReaderStore] = createStore(defaultStore)

  // Wrappers and predefined functions for reading and mutating store;
  // # Limit to the non object keys: E.g. string or string[]
  // https://javascript.plainenglish.io/typescript-essentials-conditionally-filter-types-488705bfbf56
  type FilterConditionally<Source, Condition> = Pick<
    Source,
    {
      [K in keyof Source]: Source[K] extends Condition ? K : never
    }[keyof Source]
  >
  type mutateSimple = FilterConditionally<typeof readerStore, string[] | string>

  function mutateStore<T extends keyof mutateSimple>(
    key: T,
    val: typeof readerStore[T]
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
        currentStore.text[book][chapter] = val
      })
    )
  }
  function getStoreVal<T>(key: keyof typeof readerStore) {
    return readerStore[key] as T
  }
  const allBookObj = createMemo(() => {
    return readerStore.text
  })
  const isOneBook = () => {
    return Object.keys(readerStore.text).length === 1
  }
  const currentBookObj = createMemo(() => {
    return readerStore.text[readerStore.currentBook]
  })
  const HTML = createMemo(() => {
    const currentBook = currentBookObj()
    const retVal = currentBook[readerStore.currentChapter]
    return retVal
  })
  const maxChapter = createMemo(() => {
    const bookObj = readerStore.text[readerStore.menuBook]
    const vals = Object.keys(bookObj).map((val) => Number(val))
    return Math.max(...vals)
  })
  const menuBookNames = createMemo(() => {
    return readerStore.searchedBooks
  })
  const possibleChapters = createMemo(() => {
    const chapters = Object.keys(readerStore.text[readerStore.menuBook])
    return chapters
  })

  let controller //reuse btw invocations
  let signal
  const [isFetching, setIsFetching] = createSignal(false)
  async function fetchHtml({
    book = readerStore.currentBook,
    chapter
  }: fetchHtmlParms): Promise<string | false | void> {
    controller = new AbortController()
    signal = controller.signal

    if (isFetching()) {
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
    allBookObj,
    isOneBook,
    currentBookObj,
    HTML,
    maxChapter,
    menuBookNames,
    possibleChapters,
    fetchHtml
  }

  return (
    <>
      <I18nProvider locale={props.preferredLocale}>
        <div class="mx-auto grid max-h-full max-w-[1400px] grid-rows-[minmax(50px,_9%),_90%]">
          <ReaderMenu storeInterface={storeInterface} />
          <ReaderPane
            storeInterface={storeInterface}
            user={props.user}
            repositoryName={props.repositoryName}
            firstBookKey={props.firstBookKey}
            firstChapterToShow={props.firstChapterToShow}
          />
        </div>
      </I18nProvider>
    </>
  )
}

interface i18Props {
  locale: i18nDictKeysType
  children: JSX.Element
}
function I18nProvider(props: i18Props) {
  const value = createI18nContext(i18nDict, props.locale)
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
}

export interface ReaderWrapperProps {
  user: string
  repositoryName: string
  preferredLocale: i18nDictKeysType
  firstBookKey: string
  firstChapterToShow: string
  repoData: repoShape
}
export interface storeType {
  mutateStore<
    T extends "currentBook" | "currentChapter" | "menuBook" | "searchedBooks"
  >(
    key: T,
    val: {
      currentBook: string
      currentChapter: string
      menuBook: string
      searchedBooks: string[]
      text: repoShape
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
  ) => T
  allBookObj: Accessor<repoShape>
  isOneBook: () => boolean
  currentBookObj: Accessor<{
    [index: string]: string
  }>
  HTML: Accessor<string>
  maxChapter: Accessor<number>
  menuBookNames: Accessor<string[]>
  possibleChapters: Accessor<string[]>
  fetchHtml: ({
    book,
    chapter
  }: fetchHtmlParms) => Promise<string | false | void>
}
