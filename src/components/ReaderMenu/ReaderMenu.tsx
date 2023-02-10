import {
  createSignal,
  Show,
  batch,
  For,
  Setter,
  lazy,
  Suspense
} from "solid-js"
import { SvgSettings, SvgBook, LoadingSpinner } from "@components"
import { clickOutside, escapeOut } from "@lib/utils-ui"

// https://github.com/solidjs/solid/discussions/845
// these are hacks (name doesn't matter) to keep typescript from stripping away "unused imports", but these are used directives below:
// @ts-ignore
const clickout = clickOutside
// @ts-ignore
const escape = escapeOut

// const Settings = lazy(() => {
//   import("../Settings/Settings")
// })
const Settings = lazy(async () => {
  return import("../Settings/Settings")
})

import { useI18n } from "@solid-primitives/i18n"
import type { Component } from "solid-js"
import type { bibleEntryObj } from "../../customTypes/types"
import type { storeType } from "../ReaderWrapper/ReaderWrapper"
interface MenuProps {
  storeInterface: storeType
  setPrintWholeBook: Setter<boolean>
  user: string
  repositoryName: string
}
const ReaderMenu: Component<MenuProps> = (props) => {
  const [t, { add, locale }] = useI18n()
  const [menuIsOpen, setMenuIsOpen] = createSignal(false)
  const [mobileTabOpen, setMobileTabOpen] = createSignal(
    props.storeInterface.isOneBook() ? "chapter" : "book"
  )
  const [settingsAreOpen, setSettingsAreOpen] = createSignal(false)
  const [searchQuery, setSearchQuery] = createSignal("")

  const debounce = (callback: Function, wait: number) => {
    let timeoutId: number | null = null
    return (...args: any) => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args)
      }, wait)
    }
  }

  const jumpToNewChapIdx = debounce(async (evt: InputEvent, value: string) => {
    const storeInterface = props.storeInterface
    const target = evt.target as HTMLInputElement
    const menuBook = storeInterface.getStoreVal("menuBook") as string
    let chapter: string = value ? value : target.value
    // validate
    // let chapter: string | number = value ? Number(value) : Number(target?.value)

    if (
      !chapter ||
      (Number(chapter) &&
        Number(chapter) > Number(props.storeInterface.maxChapter()))
    ) {
      return
    }

    let currentBookObj = props.storeInterface.currentBookObj()
    // handles index offset:
    let existingChap = currentBookObj
      ? props.storeInterface.getChapObjFromGivenBook(
          currentBookObj.slug,
          chapter
        )
      : null

    // go to in memory text
    if (existingChap?.text) {
      storeInterface.mutateStore("currentChapter", String(chapter))
    }

    // fetch new and nav
    let text = await storeInterface.fetchHtml({
      book: menuBook,
      chapter: String(chapter)
    })
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
    })
    togglePanel(false)
  }, 300)

  // const restoreNumber = debounce((evt: InputEvent) => {
  //   const target = evt.target as HTMLInputElement
  //   if (!target) return
  //   target.value = String(props.storeInterface.getStoreVal("currentChapter"))
  // }, 400)

  const togglePanel = (bool?: boolean) => {
    let val = bool === false ? bool : !menuIsOpen()
    let menuBook = props.storeInterface.getStoreVal("menuBook") as string
    let currentBook = props.storeInterface.getStoreVal("currentBook") as string
    batch(() => {
      // IF someone opens the menu, clicks a book but not chapter, and then changes mind and closes menu, some oddness could happen.  Keeping them in sync here;
      if (menuBook != currentBook) {
        props.storeInterface.mutateStore("menuBook", currentBook)
      }
      setMenuIsOpen(val)
    })
  }
  function switchBooks(book: string) {
    props.storeInterface.mutateStore("menuBook", book)
  }
  function isActiveBookAndChap(label: string) {
    let menuBook = props.storeInterface.getMenuBook()
    let currentBook = props.storeInterface.currentBookObj()
    let currentChap = props.storeInterface.currentChapObj()
    return currentChap?.label == label && menuBook?.label == currentBook?.label
  }
  function isActiveBook(book: string) {
    return props.storeInterface.getStoreVal("currentBook") == book
  }

  const searchBooks = debounce((): void => {
    let allBooks = props.storeInterface.getStoreVal<bibleEntryObj[]>("text")
    let search = searchQuery().toLowerCase()
    !search && props.storeInterface.mutateStore("searchedBooks", allBooks)
    let filtered = allBooks.filter(
      (book) =>
        book.label.toLowerCase().includes(search) ||
        book.slug.toLowerCase().includes(search)
    )
    props.storeInterface.mutateStore("searchedBooks", filtered)
  }, 400)

  function setLanguageFromCustomEvent(
    langCode: string,
    newDict: any,
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
            newDict: any
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
                onClick={(e) => togglePanel()}
              >
                <span class="flex items-center">
                  <SvgBook className="fill-dark-900 inline-block  fill-current ltr:mr-2 rtl:ml-2" />
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
                          <ul class="max-h-[50vh] min-h-[100px] overflow-y-auto pb-32">
                            <For each={props.storeInterface.menuBookNames()}>
                              {(book) => (
                                <li class="w-full">
                                  <button
                                    classList={{
                                      " w-full text-xl py-2 ltr:text-left rtl:text-right border-y border-gray-100 ltr:pl-4 rtl:pr-4 hover:bg-accent/10 focus:bg-accent/10 focus:font-bold":
                                        true,
                                      "font-bold text-accent": isActiveBook(
                                        book.slug
                                      )
                                    }}
                                    onClick={(e) => switchBooks(book.slug)}
                                  >
                                    {book.label}
                                  </button>
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* chapters */}

                  <div class="w-3/5">
                    <div class="w-full">
                      <h2 class="mt-2 text-2xl capitalize ltr:ml-2 rtl:mr-2 ">
                        {t("chapters")}
                      </h2>
                      <div class="mt-2 w-full border-t border-neutral-200 pt-2">
                        <div class="p-2">
                          <ul class="grid max-h-[55vh] grid-cols-6 justify-start  gap-2 overflow-y-auto  pb-24">
                            <For each={props.storeInterface.possibleChapters()}>
                              {(book, idx) => (
                                <li
                                  class="w-full text-center text-xl"
                                  data-testid="menuChapter"
                                >
                                  <button
                                    data-testid="pickChapter"
                                    classList={{
                                      "w-full p-3 hover:bg-accent/10": true,
                                      "text-blue-400": isActiveBookAndChap(
                                        book.label
                                      )
                                    }}
                                    // onClick={(e) => {
                                    //   jumpToNewChapIdx(e, idx() + 1)
                                    // }}
                                    onClick={(e) => {
                                      jumpToNewChapIdx(e, book.label)
                                    }}
                                  >
                                    {book.label}
                                  </button>
                                </li>
                              )}
                            </For>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* //!END table and up menu */}
            </Show>
            <div class="w-1/5 print:hidden">
              <div class=" relative w-max rounded-md ltr:ml-auto rtl:mr-auto ">
                <button
                  class="rounded   py-2  px-5 outline outline-1 outline-gray-300 hover:outline-accent"
                  // todo: internationalize label
                  aria-label="Open Settings"
                  onClick={() => {
                    setSettingsAreOpen(!settingsAreOpen())
                    props.setPrintWholeBook(false)
                  }}
                >
                  <SvgSettings className="" />
                </button>
                <Show when={settingsAreOpen()}>
                  <div class="shadow-dark-700 absolute z-20 w-72 bg-neutral-100 p-4 text-right shadow-xl ltr:right-0 rtl:left-0">
                    <Suspense fallback={<LoadingSpinner />}>
                      <Settings
                        fetchHtml={props.storeInterface.fetchHtml}
                        mutateStoreText={props.storeInterface.mutateStoreText}
                        currentBookObj={props.storeInterface.currentBookObj}
                        setPrintWholeBook={props.setPrintWholeBook}
                        user={props.user}
                        repo={props.repositoryName}
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
                <div>
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
                  <ul class="h-[95vh] overflow-y-auto pb-96">
                    <For each={props.storeInterface.menuBookNames()}>
                      {(book) => (
                        <li class="w-full">
                          <button
                            classList={{
                              " w-full text-xl py-2 text-left border-y border-gray-100 pl-4 hover:bg-accent/10 focus:bg-accent/10":
                                true,
                              "font-bold text-accent": isActiveBook(book.slug)
                            }}
                            onClick={(e) => {
                              switchBooks(book.slug)
                              setMobileTabOpen("chapter")
                            }}
                          >
                            {book.label}
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
              {/* MOBILE CHAPTERS */}
              <Show when={mobileTabOpen() == "chapter"}>
                <div class="p-2">
                  <p class="py-2 pl-2 text-2xl ">
                    {props.storeInterface.getMenuBook()?.label}
                  </p>
                  <ul class="grid  h-[80vh] grid-cols-6 place-content-start gap-2 overflow-y-scroll pb-36 ">
                    <For each={props.storeInterface.possibleChapters()}>
                      {(book, idx) => (
                        <li class="w-full text-center text-xl">
                          <button
                            classList={{
                              "w-full p-3 hover:bg-accent/10": true,
                              "text-blue-400": isActiveBookAndChap(book.label)
                            }}
                            onClick={(e) => {
                              jumpToNewChapIdx(e, book.label)
                            }}
                          >
                            {book.label}
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
export default ReaderMenu
