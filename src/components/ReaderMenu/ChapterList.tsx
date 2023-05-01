import { For, Show } from "solid-js"
import { useI18n } from "@solid-primitives/i18n"
import type { storeType } from "@components/ReaderWrapper/ReaderWrapper"

interface ChapterProps {
  storeInterface: storeType
  isActiveBookAndChap: (str: string) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jumpToNewChapIdx: (...args: any) => void
  isMobile: boolean
}

export function ChapterList(props: ChapterProps) {
  const [t] = useI18n()
  return (
    <>
      <Show when={props.isMobile}>
        <div class="w-full">
          <div class="w-full">
            <h2 class="mt-2 text-2xl capitalize ltr:ml-2 rtl:mr-2 ">
              {t("chapters")}
            </h2>
            <div class="mt-2 w-full border-t border-neutral-200 pt-2">
              <div class="p-2">
                <ul class="grid max-h-[75vh] grid-cols-6 justify-start  gap-2 overflow-y-auto  pb-36">
                  <For each={props.storeInterface.possibleChapters()}>
                    {(book) => (
                      <li
                        class="w-full text-center text-xl"
                        data-testid="menuChapter"
                      >
                        <button
                          data-testid="pickChapter"
                          classList={{
                            "w-full p-3 hover:bg-accent/10": true,
                            "text-blue-400": props.isActiveBookAndChap(
                              book.label
                            )
                          }}
                          // onClick={(e) => {
                          //   jumpToNewChapIdx(e, idx() + 1)
                          // }}
                          onClick={(e) => {
                            props.jumpToNewChapIdx(e, book.label)
                          }}
                        >
                          {book.label.replace(/^(0+)/, "")}
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Show>
      <Show when={!props.isMobile}>
        <div class="flex-grow p-2">
          {/* todo: click on the menu are closing it, and the fixed body seems to not be what I want eitehr.  Why are the clicks on menu items closing the thing?  If you scroll down as well, you can't see the dialog with pos a instead of fixed, so need fixed.  */}
          {/* todo: fully remove */}
          {/* https://stackoverflow.com/questions/70989904/fixed-element-positioning-relative-to-its-parent
           */}
          {/* Or just go back to how it was and change the design without making it a modal. Preferably a dropdown really */}
          {/* Or try this actually instead maybe?
          https://kobalte.dev/docs/core/components/dropdown-menu
          */}
          {/* <p class="py-2 pl-2 text-2xl ">
            {props.storeInterface.getMenuBook()?.label}
          </p> */}
          <ul class="grid  h-[80vh] grid-cols-6 place-content-start gap-2 overflow-y-scroll pb-36 ">
            <For each={props.storeInterface.possibleChapters()}>
              {(book) => (
                <li class="w-full text-center text-xl">
                  <button
                    classList={{
                      "w-full p-3 hover:bg-accent/10": true,
                      "text-blue-400": props.isActiveBookAndChap(book.label)
                    }}
                    onClick={(e) => {
                      props.jumpToNewChapIdx(e, book.label)
                    }}
                  >
                    {book.label.replace(/^(0+)/, "")}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </>
  )
}
