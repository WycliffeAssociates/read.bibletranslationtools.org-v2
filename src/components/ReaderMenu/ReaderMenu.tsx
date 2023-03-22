import {
  createSignal,
  Show,
  batch,
  Setter,
  lazy,
  Suspense,
  createResource
} from "solid-js"
import { SvgSettings, SvgBook, LoadingSpinner } from "@components"
import { BookList } from "./BookList"
import { ChapterList } from "./ChapterList"
import { clickOutside, escapeOut, debounce } from "@lib/utils-ui"

// https://github.com/solidjs/solid/discussions/845
// these are hacks (name doesn't matter) to keep typescript from stripping away "unused imports", but these are used as custom solid directives below:

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const clickout = clickOutside
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const escape = escapeOut

const Settings = lazy(async () => {
  return import("../Settings/Settings")
})

import { useI18n } from "@solid-primitives/i18n"
import type { Component } from "solid-js"
import type { bibleEntryObj, repoIndexObj } from "@customTypes/types"
import type { storeType } from "@components/ReaderWrapper/ReaderWrapper"
import { BibleBookCategories } from "@lib/contants"
import { CACHENAMES } from "../../lib/contants"

interface MenuProps {
  storeInterface: storeType
  setPrintWholeBook: Setter<boolean>
  user: string
  repositoryName: string
  hasDownloadIndex: boolean
  repoIndex: repoIndexObj
}
const ReaderMenu: Component<MenuProps> = (props) => {
  // ====MENU STATE
  const [t, { add, locale }] = useI18n()
  const [menuIsOpen, setMenuIsOpen] = createSignal(false)
  const [temporarilyHideMenu, setTemporarilyHideMenu] = createSignal(false)
  // eslint-disable-next-line solid/reactivity
  const [savedInServiceWorker] = createResource(
    () => props.storeInterface.currentBookObj(),
    checkIfCurrentBookOrResIsSaved
  )
  const [savingOffline, setSavingOffline] = createSignal<
    "IDLE" | "FINISHED" | "STARTED" | "ERROR"
  >("IDLE")
  const [savingWholeOffline, setSavingWholeOffline] = createSignal<
    "IDLE" | "FINISHED" | "STARTED" | "ERROR"
  >("IDLE")

  // While maybe the most solid-like, creating state from new props is still an acceptable pattern in solid.
  const [mobileTabOpen, setMobileTabOpen] = createSignal(
    // eslint-disable-next-line solid/reactivity
    props.storeInterface.isOneBook() ? "chapter" : "book"
  )
  const [settingsAreOpen, setSettingsAreOpen] = createSignal(false)
  const [searchQuery, setSearchQuery] = createSignal("")

  const filteredMenuBookByCategory = () => {
    type bookType = {
      label: string
      slug: string
    }
    const bibleMenuBooksByCategory: {
      OT: bookType[]
      NT: bookType[]
    } = {
      OT: [],
      NT: []
    }
    const booksToSearch = searchQuery()
      ? props.storeInterface.getStoreVal("searchableBooks")
      : props.storeInterface.menuBookNames()

    if (!booksToSearch || !Array.isArray(booksToSearch)) return
    booksToSearch.forEach((book) => {
      BibleBookCategories.OT.includes(book.slug.toUpperCase())
        ? bibleMenuBooksByCategory.OT.push(book)
        : bibleMenuBooksByCategory.NT.push(book)
    })
    return bibleMenuBooksByCategory
  }

  async function checkIfCurrentBookOrResIsSaved() {
    const currentBook = props.storeInterface.currentBookObj()
    if (!currentBook)
      return {
        wholeResponse: null,
        wholeIsComplete: null,
        wholeIsOutOfDate: null,
        currentBooksIsDownloaded: null,
        currentBookIsOutOfDate: null
      }
    const completeResourceCache = await caches.open(CACHENAMES.complete)
    // const bookMatch = await completeResourceCache.match(
    //   `${window.location.origin}/${props.user}/${props.repositoryName}/${currentBook.slug}`
    // )
    const wholeMatch = await completeResourceCache.match(
      `${window.location.origin}/${props.user}/${props.repositoryName}`
    )
    let wholeIsOutOfDate = null
    let wholeIsComplete = null
    let currentBooksIsDownloaded = null
    let currentBookIsOutOfDate = null

    if (wholeMatch) {
      const lastGenHeader = wholeMatch.headers?.get("X-Last-Generated")
      wholeIsOutOfDate = lastGenHeader
        ? lastGenHeader < props.repoIndex.lastRendered
        : null

      const currentBookIsDownloadedJson =
        wholeMatch.headers?.get("X-Complete-Books") || ""
      if (currentBookIsDownloadedJson) {
        const completeBooks = JSON.parse(currentBookIsDownloadedJson)
        const currentBookFromHeader =
          Array.isArray(completeBooks) &&
          completeBooks.find((book) => book.slug == currentBook.slug)
        if (currentBookFromHeader) {
          currentBooksIsDownloaded = true
          currentBookIsOutOfDate =
            currentBookFromHeader.lastRendered < currentBook.lastRendered
        }
      }

      wholeIsComplete = wholeMatch.headers?.get("X-Is-Complete") == "1"
    }
    return {
      wholeResponse: wholeMatch,
      wholeIsComplete,
      wholeIsOutOfDate,
      currentBooksIsDownloaded,
      currentBookIsOutOfDate
    }
  }

  // ====MENU FXNS
  // eslint disabled.  Not the most solid like maybe, but I didn't turn on this eslint rule until after deploy of this project, and was learning solid.  This is stable however.  The values of the reactive dependencies are being used in JSX. This is a derived function really, but the rules wants to be sure that we are aware that its deps aren't auto-tracked here.
  // eslint-disable-next-line solid/reactivity
  const jumpToNewChapIdx = debounce(async (evt: InputEvent, value: string) => {
    const storeInterface = props.storeInterface
    const target = evt.target as HTMLInputElement
    const menuBook = storeInterface.getStoreVal("menuBook") as string
    const chapter: string = value ? value : target.value
    // validate
    // let chapter: string | number = value ? Number(value) : Number(target?.value)

    if (
      !chapter ||
      (Number(chapter) &&
        Number(chapter) > Number(props.storeInterface.maxChapter()))
    ) {
      return
    }

    const currentBookObj = props.storeInterface.currentBookObj()
    // handles index offset:
    const existingChap = currentBookObj
      ? props.storeInterface.getChapObjFromGivenBook(
          currentBookObj.slug,
          chapter
        )
      : null

    let text: string | false | void
    if (existingChap?.content) {
      // return storeInterface.mutateStore("currentChapter", String(chapter))
      text = existingChap.content
    } else {
      text = await storeInterface.fetchHtml({
        book: menuBook,
        chapter: String(chapter)
      })
    }
    // Early bail, no text given
    if (!text) return
    batch(() => {
      storeInterface.mutateStoreText({
        book: menuBook,
        chapter: String(chapter),
        val: String(text)
      })
      storeInterface.mutateStore("currentBook", menuBook)
      storeInterface.mutateStore("currentChapter", String(chapter))
      scrollToTop()
    })
    togglePanel(false)
  }, 300)

  function scrollToTop() {
    const scrollPane = document.querySelector('[data-js="scrollToTop"]')
    if (scrollPane) {
      scrollPane.scrollTop = 0
    }
  }

  const togglePanel = (bool?: boolean) => {
    const val = bool === false ? bool : !menuIsOpen()
    if (val == true && settingsAreOpen() && window.innerWidth < 640) {
      setSettingsAreOpen(false)
    }
    const menuBook = props.storeInterface.getStoreVal("menuBook") as string
    const currentBook = props.storeInterface.getStoreVal(
      "currentBook"
    ) as string
    batch(() => {
      // IF someone opens the menu, clicks a book but not chapter, and then changes mind and closes menu, some oddness could happen.  Keeping them in sync here;
      if (menuBook != currentBook) {
        props.storeInterface.mutateStore("menuBook", currentBook)
      }
      setMenuIsOpen(val)
    })
  }
  function manageOpenSettings() {
    if (savingOffline() == "STARTED" || savingWholeOffline() == "STARTED") {
      return setTemporarilyHideMenu(!temporarilyHideMenu())
    }
    const newState = !settingsAreOpen()
    setSettingsAreOpen(newState)
    if (menuIsOpen() && newState == true && window.innerWidth < 640) {
      setMenuIsOpen(false)
    }
    setTemporarilyHideMenu(false)
    props.setPrintWholeBook(false)
  }
  function switchBooks(book: string) {
    props.storeInterface.mutateStore("menuBook", book)
  }
  function isActiveBookAndChap(label: string) {
    const menuBook = props.storeInterface.getMenuBook()
    const currentBook = props.storeInterface.currentBookObj()
    const currentChap = props.storeInterface.currentChapObj()
    return currentChap?.label == label && menuBook?.label == currentBook?.label
  }
  function isActiveBook(book: string) {
    return props.storeInterface.getStoreVal("currentBook") == book
  }

  // eslint-disable-next-line solid/reactivity
  const searchBooks = debounce((): void => {
    const allBooks = props.storeInterface.getStoreVal<bibleEntryObj[]>("text")
    const search = searchQuery().toLowerCase()
    !search && props.storeInterface.mutateStore("searchableBooks", allBooks)
    const filtered = allBooks.filter(
      (book) =>
        book.label.toLowerCase().includes(search) ||
        book.slug.toLowerCase().includes(search)
    )
    props.storeInterface.mutateStore("searchableBooks", filtered)
  }, 400)

  function setLanguageFromCustomEvent(
    langCode: string,
    newDict: Record<string, string>,
    newDictCode: string,
    addToOtherDict: boolean
  ) {
    if (addToOtherDict) {
      add(newDictCode, newDict)
    }
    locale(langCode)
  }

  return (
    <div class="mx-auto max-w-[1400px]">
      <div
        use:clickOutside={() => setMenuIsOpen(false)}
        class="mx-auto w-full"
        on:changelanguage={(
          e: CustomEvent<{
            language: string
            newDict: Record<string, string>
            newDictCode: string
            addToOtherDict: boolean
          }>
        ) => {
          setLanguageFromCustomEvent(
            e.detail.language,
            e.detail.newDict,
            e.detail.newDictCode,
            e.detail.addToOtherDict
          )
        }}
        id="menu"
      >
        <div
          use:escapeOut={() => setMenuIsOpen(false)}
          class=" mx-auto flex w-full flex-wrap items-center px-4 py-2 "
        >
          <div class="relative flex w-full items-center justify-between gap-3  print:hidden sm:w-5/6 ltr:sm:ml-auto rtl:sm:mr-auto">
            <div class="my-2 flex w-4/5 justify-between overflow-hidden  rounded-lg bg-neutral-200 outline outline-1 outline-gray-300 hover:outline-accent">
              <button
                class="flex w-full flex-grow items-center justify-between rounded-md ltr:pl-4 rtl:pr-4"
                onClick={() => togglePanel()}
              >
                <span class="flex items-center">
                  <SvgBook classNames="fill-dark-900 inline-block  fill-current ltr:mr-2 rtl:ml-2" />
                  <span class="text-xl capitalize">
                    {props.storeInterface.currentBookObj()?.label}
                  </span>
                </span>
                <span
                  class="menuNumberInput w-[5ch] bg-gray-50 py-2 text-center"
                  data-testid="chapterNavigation"
                >
                  {props.storeInterface.getStoreVal("currentChapter")}
                </span>
              </button>
            </div>
            <Show when={menuIsOpen()}>
              {/*//! TABLET AND UP */}
              <div class="sm:shadow-dark-300 z-20 hidden max-h-[71vh]  w-4/5  overflow-y-hidden   bg-white sm:absolute sm:top-full sm:block sm:rounded-xl sm:border sm:shadow-xl">
                <div class="hidden sm:flex">
                  {/* Books */}
                  <div class="border-netural-200 w-2/5 border-r">
                    <div class="w-full">
                      <h2 class="mt-2 text-2xl capitalize ltr:ml-4 rtl:mr-4">
                        {t("books")}
                      </h2>
                      <div class="mt-2 border-t border-neutral-200 pt-2">
                        <div class="">
                          <label for="" class="block p-4">
                            <input
                              onInput={(e: InputEvent) => {
                                const target = e.target as HTMLInputElement
                                setSearchQuery(target.value)
                                searchBooks()
                              }}
                              type="text"
                              class="w-full rounded-full border border-neutral-300 py-2 px-4 capitalize"
                              placeholder={t("searchBooks")}
                              value={searchQuery()}
                            />
                          </label>
                          <BookList
                            // eslint-disable-next-line solid/reactivity
                            onClick={(book: string) => switchBooks(book)}
                            isActiveBook={isActiveBook}
                            bibleMenuBooksByCategory={
                              filteredMenuBookByCategory
                            }
                            isMobile={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChapterList
                    storeInterface={props.storeInterface}
                    isActiveBookAndChap={isActiveBookAndChap}
                    jumpToNewChapIdx={jumpToNewChapIdx}
                    isMobile={false}
                  />
                </div>
              </div>
              {/* //!END table and up menu */}
            </Show>
            <div class="w-1/5 print:hidden">
              <div class=" relative w-max rounded-md ltr:ml-auto rtl:mr-auto ">
                <button
                  class="rounded   py-2  px-5 outline outline-1 outline-gray-300 hover:outline-accent"
                  aria-label={t("openSettings", {}, "open settings")}
                  onClick={manageOpenSettings}
                >
                  <SvgSettings classNames="" />
                </button>
                <Show when={settingsAreOpen()}>
                  <div
                    class={`shadow-dark-700 absolute z-20 w-72 bg-neutral-100 p-4 text-right shadow-xl ltr:right-0 rtl:left-0 md:w-96 ${
                      temporarilyHideMenu() && "hidden"
                    }`}
                  >
                    <Suspense
                      fallback={
                        <LoadingSpinner classNames="w-12 mx-auto text-accent" />
                      }
                    >
                      <Settings
                        repoIndex={props.repoIndex}
                        savedInServiceWorker={savedInServiceWorker}
                        storeInterface={props.storeInterface}
                        setPrintWholeBook={props.setPrintWholeBook}
                        user={props.user}
                        repo={props.repositoryName}
                        hasDownloadIndex={props.hasDownloadIndex}
                        downloadSourceUsfmArr={props.storeInterface.getStoreVal(
                          "downloadLinks"
                        )}
                        savingOffline={savingOffline}
                        setSavingOffline={setSavingOffline}
                        savingWholeOffline={savingWholeOffline}
                        setSavingWholeOffline={setSavingWholeOffline}
                      />
                    </Suspense>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
        <div class="relative z-40">
          <Show when={menuIsOpen()}>
            <div
              id="mobileMenu"
              class="r-0  bottom-0 left-0 top-0 right-0   z-10 w-full overflow-y-scroll bg-white sm:hidden "
            >
              <ul class="flex justify-between ">
                <li class="w-full text-center">
                  <button
                    class={`${
                      mobileTabOpen() == "book"
                        ? "w-full border-b-2 border-b-accent font-bold text-accent"
                        : "underline"
                    }  py-3 text-xl capitalize`}
                    onClick={() => {
                      setMobileTabOpen("book")
                    }}
                  >
                    {t("books")}
                  </button>
                </li>
                <li class="w-full text-center">
                  <button
                    class={`${
                      mobileTabOpen() == "chapter"
                        ? "w-full border-b-2 border-b-accent font-bold text-accent"
                        : "underline"
                    } py-3 text-xl capitalize`}
                    onClick={() => {
                      setMobileTabOpen("chapter")
                    }}
                  >
                    {t("chapters")}
                  </button>
                </li>
              </ul>
              {/* MOBILE BOOKS */}
              <Show when={mobileTabOpen() == "book"}>
                <div data-name="searchInput">
                  <label for="" class="block p-4">
                    <input
                      onInput={(e: InputEvent) => {
                        const target = e.target as HTMLInputElement
                        setSearchQuery(target.value)
                        searchBooks()
                      }}
                      type="text"
                      class="w-full rounded-full border border-neutral-300 py-2 px-4 capitalize "
                      placeholder={t("searchBooks")}
                      value={searchQuery()}
                    />
                  </label>
                  <BookList
                    // eslint-disable-next-line solid/reactivity
                    onClick={(bookSlug: string) => {
                      switchBooks(bookSlug)
                      setMobileTabOpen("chapter")
                    }}
                    isActiveBook={isActiveBook}
                    bibleMenuBooksByCategory={filteredMenuBookByCategory}
                    isMobile={true}
                  />
                </div>
              </Show>
              {/* MOBILE CHAPTERS */}
              <Show when={mobileTabOpen() == "chapter"}>
                <ChapterList
                  isActiveBookAndChap={isActiveBookAndChap}
                  isMobile={true}
                  jumpToNewChapIdx={jumpToNewChapIdx}
                  storeInterface={props.storeInterface}
                />
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
export default ReaderMenu
