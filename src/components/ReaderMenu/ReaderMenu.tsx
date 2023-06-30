import { createSignal, Show, batch, Setter, createResource } from "solid-js"
import { SvgSettings, SvgBook, SvgArrow } from "@components"
import { BookList } from "./BookList"
import { ChapterList } from "./ChapterList"
import { clickOutside, escapeOut, debounce, getPortalSpot } from "@lib/utils-ui"
import { Dialog } from "@kobalte/core"

// https://github.com/solidjs/solid/discussions/845
// these are hacks (name doesn't matter) to keep typescript from stripping away "unused imports", but these are used as custom solid directives below:
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const clickout = clickOutside
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const escape = escapeOut

import { useI18n } from "@solid-primitives/i18n"
import type { Component } from "solid-js"
import type {
  bibleEntryObj,
  IBibleMenuBooksByCategory,
  repoIndexObj
} from "@customTypes/types"
import type { storeType } from "@components/ReaderWrapper/ReaderWrapper"
import { BibleBookCategories } from "@lib/contants"
import { CACHENAMES } from "../../lib/contants"
import { getRepoIndex } from "@lib/api"
import { IconMagnifyingGlass } from "@components/Icons/Icons"
import Settings from "../Settings/Settings"
import SectionHeader from "../Settings/SectionHeader"

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
  const [hasFetchedRepoIndexAfresh, setHasFetchedRepoIndexAfresh] =
    createSignal(false)
  // eslint-disable-next-line solid/reactivity
  const [savedInServiceWorker, { refetch }] = createResource(
    () => props.storeInterface.currentBookObj(),
    checkIfCurrentBookOrResIsSaved
  )

  // While maybe the most solid-like, creating state from new props is still an acceptable pattern in solid.
  const [mobileTabOpen, setMobileTabOpen] = createSignal(
    // eslint-disable-next-line solid/reactivity
    props.storeInterface.isOneBook() ? "chapter" : "book"
  )
  const [settingsAreOpen, setSettingsAreOpen] = createSignal(false)
  const [searchQuery, setSearchQuery] = createSignal("")

  const filteredMenuBookByCategory = () => {
    const bibleMenuBooksByCategory: IBibleMenuBooksByCategory = {
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
    let repoIndex: repoIndexObj | null = null
    if (wholeMatch) {
      const lastGenHeader =
        wholeMatch.headers?.get("X-Last-Generated") ||
        props.repoIndex.lastRendered
      wholeIsOutOfDate = lastGenHeader
        ? lastGenHeader < props.repoIndex.lastRendered
        : null

      if (navigator.onLine && !hasFetchedRepoIndexAfresh()) {
        // when we have internet, see if there is a newer version of the whole or the book by getting the latest repoIndex from blob storage and checking its timestamps against the saved service worker timestamp.
        try {
          repoIndex = await getRepoIndex({
            user: props.user,
            repo: props.repositoryName
          })
          // frepoIndex?.lastRendered higher (e.g. "2023-04-06T16:47:31.7484775Z" > "2023-04-05T20:44:06.3942103Z") than currentBook from sw response.
          wholeIsOutOfDate = repoIndex?.lastRendered
            ? repoIndex?.lastRendered > lastGenHeader
            : null
          setHasFetchedRepoIndexAfresh(true)
        } catch (error) {
          console.error(error)
        }
      }
      const currentBookIsDownloadedJson =
        wholeMatch.headers?.get("X-Complete-Books") || ""
      if (currentBookIsDownloadedJson) {
        const completeBooks = JSON.parse(currentBookIsDownloadedJson)
        const currentBookFromHeader =
          Array.isArray(completeBooks) &&
          completeBooks.find((book) => book.slug == currentBook.slug)
        //
        if (currentBookFromHeader) {
          currentBooksIsDownloaded = true
          // saved Res is Younger than currentBook loaded
          currentBookIsOutOfDate =
            currentBookFromHeader.lastRendered < currentBook.lastRendered
          if (repoIndex) {
            const freshlyFetchedBook = repoIndex.bible?.find(
              (book) => book.slug == currentBook.slug
            )
            // freshly fetched is older than currentBook from sw response.
            currentBookIsOutOfDate = freshlyFetchedBook
              ? freshlyFetchedBook.lastRendered > currentBook.lastRendered
              : null
          }
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

    const menuBookObj = props.storeInterface.getChapObjFromGivenBook(
      menuBook,
      chapter
    )

    let text: string | false | void
    if (menuBookObj?.content) {
      // return storeInterface.mutateStore("currentChapter", String(chapter))
      text = menuBookObj.content
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
    const newState = !settingsAreOpen()
    setSettingsAreOpen(newState)
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

  function topAmount() {
    if (import.meta.env.SSR) {
      return "5rem"
    } else {
      const nav = document.querySelector("nav") as HTMLElement
      const compstyle = window.getComputedStyle(nav)
      const height = compstyle.getPropertyValue("height")
      return height
    }
  }

  return (
    <div class="mx-auto  bg-white">
      <div
        // use:clickOutside={() => setMenuIsOpen(false)}
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
          class="mx-auto flex w-full flex-wrap items-center bg-[--clrBackground]"
        >
          <div class="relative mx-auto flex w-full max-w-[75ch] items-center  justify-between gap-3  bg-white p-3 text-varBase print:hidden sm:px-8 ">
            <div class="flex w-full justify-between overflow-hidden  rounded-lg bg-white outline outline-1 outline-gray-300 focus-within:outline-2 focus-within:outline-accent">
              <button
                class="flex h-12 w-full flex-grow items-center justify-between rounded-md  hover:bg-gray-100 ltr:pl-4 rtl:pr-4"
                onClick={() => togglePanel()}
              >
                <span class="flex items-center">
                  <SvgBook classNames="fill-dark-900 inline-block  fill-current ltr:mr-2 rtl:ml-2" />
                  <span class="text-xl capitalize">
                    {props.storeInterface.currentBookObj()?.label}
                  </span>
                </span>

                <span
                  class="menuNumberInput w-[5ch] border-l border-gray-200  py-2 text-center "
                  data-testid="chapterNavigation"
                >
                  {props.storeInterface.getStoreVal("currentChapter")}
                </span>
              </button>
            </div>
            {/* <Show when={menuIsOpen()}> */}
            {/*//! TABLET AND UP */}
            <Dialog.Root
              open={menuIsOpen()}
              // open={true}
              onOpenChange={(val) => {
                setMenuIsOpen(val)
              }}
            >
              <Dialog.Portal mount={getPortalSpot()}>
                <Dialog.Overlay
                  class="fixed inset-0 z-40 hidden bg-black/[.1] data-[expanded]:block"
                  data-title="dialog__overlay"
                />
                <div
                  id="readerMenuPositioner"
                  style={{
                    top: topAmount()
                  }}
                  class="fixed left-1/2  z-50 w-full max-w-[calc(75ch+2rem)] -translate-x-1/2 transform text-varBase"
                  data-title="dialog__positioner"
                >
                  <Dialog.Content class="" data-title="dialog__content">
                    {/* ===============  shared   =============   */}
                    <div class="bg-white ">
                      <div class="border-netural-200 flex content-center border-b p-4">
                        <Dialog.CloseButton
                          class=""
                          data-title="dialog__close-button"
                        >
                          <p class="flex gap-4">
                            <span class="w-5">
                              <SvgArrow />
                            </span>
                            {/* todo: make dynamic to current resource */}
                            <span class="text-lg">English ULB</span>
                          </p>
                        </Dialog.CloseButton>
                      </div>
                      {/* ===============  tablet up menu   =============   */}
                      <div
                        data-title="tabletAndLarger"
                        class="sm:shadow-dark-300 z-20 hidden h-full w-full overflow-y-hidden sm:block"
                      >
                        <div class="hidden sm:flex">
                          {/* Books */}
                          <div class="border-netural-200 w-2/5 border-r">
                            <div class="w-full">
                              <div class="mt-2  pt-2">
                                <div class="">
                                  <label for="" class="relative block p-4">
                                    <input
                                      onInput={(e: InputEvent) => {
                                        const target =
                                          e.target as HTMLInputElement
                                        setSearchQuery(target.value)
                                        searchBooks()
                                      }}
                                      type="text"
                                      class="w-full rounded-full border border-neutral-300 px-12 py-2 capitalize"
                                      placeholder={t("searchBooks")}
                                      value={searchQuery()}
                                    />
                                    <span class="absolute top-1/2 inline-block w-6 transform ltr:left-8 ltr:-translate-y-1/2 rtl:right-8  rtl:translate-y-1/2">
                                      <IconMagnifyingGlass />
                                    </span>
                                  </label>
                                  <BookList
                                    // eslint-disable-next-line solid/reactivity
                                    onClick={(book: string) =>
                                      switchBooks(book)
                                    }
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
                      {/* ===============  mobile menu   =============   */}
                      <div
                        id="mobileMenu"
                        class=" z-10 h-full   w-full  overflow-y-scroll bg-white sm:hidden "
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
                            <label for="" class="relative block p-4">
                              <input
                                onInput={(e: InputEvent) => {
                                  const target = e.target as HTMLInputElement
                                  setSearchQuery(target.value)
                                  searchBooks()
                                }}
                                type="text"
                                class="w-full rounded-full border border-neutral-300 px-12 py-2 capitalize"
                                placeholder={t("searchBooks")}
                                value={searchQuery()}
                              />
                              <span class="absolute top-1/2 inline-block w-6 transform ltr:left-8 ltr:-translate-y-1/2 rtl:right-8  rtl:translate-y-1/2">
                                <IconMagnifyingGlass />
                              </span>
                            </label>
                            <BookList
                              // eslint-disable-next-line solid/reactivity
                              onClick={(bookSlug: string) => {
                                switchBooks(bookSlug)
                                setMobileTabOpen("chapter")
                              }}
                              isActiveBook={isActiveBook}
                              bibleMenuBooksByCategory={
                                filteredMenuBookByCategory
                              }
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
                    </div>
                  </Dialog.Content>
                </div>
              </Dialog.Portal>
            </Dialog.Root>

            {/* //!END table and up menu */}
            {/* </Show> */}
            <div class="w-1/5 print:hidden">
              <div class=" relative w-max rounded-md ltr:ml-auto rtl:mr-auto ">
                <button
                  class="rounded   px-5  py-2 text-slate-700  hover:bg-gray-100 focus:outline-2 focus:outline-accent"
                  aria-label={t("openSettings", {}, "open settings")}
                  onClick={manageOpenSettings}
                >
                  <SvgSettings classNames="" />
                </button>
                <Show when={savedInServiceWorker() && settingsAreOpen()}>
                  <Settings
                    settingsAreOpen={settingsAreOpen}
                    setSettingsOpen={setSettingsAreOpen}
                    topAmount={topAmount}
                    repoIndex={props.repoIndex}
                    storeInterface={props.storeInterface}
                    savedInServiceWorker={savedInServiceWorker}
                    user={props.user}
                    repo={props.repositoryName}
                    refetchSwResponses={refetch}
                    setPrintWholeBook={props.setPrintWholeBook}
                    downloadSourceUsfmArr={props.storeInterface.getStoreVal(
                      "downloadLinks"
                    )}
                  />
                </Show>
                {/* </div> */}
                {/* </Show> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ReaderMenu
