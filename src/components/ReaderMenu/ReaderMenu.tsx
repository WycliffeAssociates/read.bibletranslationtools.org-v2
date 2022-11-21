import { createSignal, Show, createMemo, batch, For } from "solid-js"
import type { Accessor } from "solid-js"
import { SvgDownload, SvgArrow, SvgSearch, SvgBook } from "@components"
import { useI18n } from "@solid-primitives/i18n"
import { get, set } from "idb-keyval"
import type { JSX, ParentComponent, ParentProps, Component } from "solid-js"
import type { bibleEntryObj } from "../../types/types"
// This create a tight coupling btw menu and parent, since the child is just accepting whatever comes its way,  But if the parent function signatures change, TS should complain there, and this will need refactoring regardless.
import type { storeType } from "../ReaderWrapper/ReaderWrapper"
interface MenuProps {
  storeInterface: storeType
}
const ReaderMenu: Component<MenuProps> = (props) => {
  const [t, { locale }] = useI18n()
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
    // validate
    let chapter: string | number = value ? Number(value) : Number(target?.value)

    if (
      !chapter ||
      chapter < 0 ||
      chapter > Number(props.storeInterface.maxChapter())
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

  const restoreNumber = debounce((evt: InputEvent) => {
    const target = evt.target as HTMLInputElement
    if (!target) return
    target.value = String(props.storeInterface.getStoreVal("currentChapter"))
  }, 400)

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
  function isActiveBookAndChap(idx: Function) {
    return (
      props.storeInterface.getStoreVal<string>("currentChapter") == idx() + 1 &&
      props.storeInterface.getStoreVal("currentBook") ==
        props.storeInterface.getStoreVal("menuBook")
    )
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

  function setLanguageFromCustomEvent(langCode: string) {
    locale(langCode)
  }

  return (
    <div
      class="print:hidden"
      on:changelanguage={(
        e: CustomEvent<{
          language: string
        }>
      ) => {
        setLanguageFromCustomEvent(e.detail.language)
      }}
      id="menu"
    >
      <div class=" mx-auto flex w-full flex-wrap items-center px-4 py-2 ">
        {/* "publication" */}
        <div class="w-full text-center font-bold uppercase sm:w-1/6">
          {props.storeInterface.getStoreVal("languageName")}:{" "}
          {props.storeInterface.currentBookObj()?.label}
        </div>

        {/* menu button / info */}
        <div class="relative flex w-full items-center justify-between  gap-3 sm:w-5/6">
          <div class="my-2 flex w-4/5 justify-between overflow-hidden  rounded-lg bg-neutral-200 outline outline-gray-300">
            <button
              class="flex w-full flex-grow items-center rounded-md pl-2"
              onClick={(e) => togglePanel()}
            >
              <SvgBook className="fill-dark-900 mr-2 inline-block fill-current" />
              <span class="text-xl capitalize">
                {props.storeInterface.currentBookObj()?.label}
              </span>
            </button>

            {/* {props.storeInterface.getStoreVal("currentChapter")} */}
            <input
              class="menuNumberInput w-[4ch] bg-gray-50 py-1 text-center"
              value={props.storeInterface.getStoreVal("currentChapter")}
              onBlur={(e) => restoreNumber(e)}
              type="number"
              min={0}
              onInput={(e) => jumpToNewChapIdx(e)}
            />
          </div>
          <Show when={menuIsOpen()}>
            {/*//! TABLET AND UP */}
            <div class="sm:shadow-dark-300 z-20 hidden max-h-[71vh]  w-full  overflow-scroll   bg-white sm:absolute sm:top-full sm:block sm:rounded-xl sm:border sm:shadow-xl">
              <div class="hidden sm:flex">
                {/* Books */}
                <div class="border-netural-200 w-2/5 border-r">
                  <div class="w-full">
                    <h2 class="ml-4 mt-2 text-2xl capitalize">{t("books")}</h2>
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
                            class="w-full rounded-full border border-neutral-300 py-2 px-2 capitalize"
                            placeholder={t("searchBooks")}
                            value={searchQuery()}
                          />
                        </label>
                        <ul class="max-h-[50vh] min-h-[100px] overflow-scroll">
                          <For each={props.storeInterface.menuBookNames()}>
                            {(book) => (
                              <li class="w-full">
                                <button
                                  classList={{
                                    " w-full text-xl py-2 text-left border-y border-gray-100 pl-4 hover:bg-accent/10 focus:bg-accent/10":
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
                    <h2 class="ml-2 mt-2 text-2xl capitalize">
                      {t("chapters")}
                    </h2>
                    <div class="mt-2 w-full border-t border-neutral-200 pt-2">
                      <div class="p-2">
                        <ul class="grid     max-h-[55vh] grid-cols-6 justify-start  gap-2 overflow-scroll  ">
                          <For each={props.storeInterface.possibleChapters()}>
                            {(book, idx) => (
                              <li class="w-full text-center text-xl">
                                <button
                                  classList={{
                                    "w-full p-3 hover:bg-accent/10": true,
                                    "text-blue-400": isActiveBookAndChap(idx)
                                  }}
                                  onClick={(e) => {
                                    jumpToNewChapIdx(e, idx() + 1)
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
          <div class="w-1/5">
            <div class="border-bg-neutral-200 relative ml-auto w-max rounded-md border px-6 py-2">
              <button
                class=" "
                onClick={() => {
                  setSettingsAreOpen(!settingsAreOpen())
                }}
              >
                <SvgDownload className="" />
              </button>
              <Show when={settingsAreOpen()}>
                <div class="shadow-dark-700 absolute right-0 z-10 w-60 bg-neutral-100 p-4 text-right shadow-xl">
                  {/* todo: Settings  */}
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
            class="r-0  bottom-0 left-0 top-0 right-0   z-10 w-screen overflow-y-scroll bg-white sm:hidden "
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
                    class="w-full rounded-full border border-neutral-300 py-2 px-2 capitalize "
                    placeholder={t("searchBooks")}
                    value={searchQuery()}
                  />
                </label>
                <ul class="h-[55vh] overflow-y-scroll pb-36">
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
                <ul class="grid  h-[54vh] grid-cols-6 place-content-start gap-2 overflow-y-scroll pb-36 ">
                  <For each={props.storeInterface.possibleChapters()}>
                    {(book, idx) => (
                      <li class="w-full text-center text-xl">
                        <button
                          classList={{
                            "w-full p-3 hover:bg-accent/10": true,
                            "text-blue-400": isActiveBookAndChap(idx)
                          }}
                          onClick={(e) => {
                            jumpToNewChapIdx(e, idx() + 1)
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
  )
}
export default ReaderMenu
