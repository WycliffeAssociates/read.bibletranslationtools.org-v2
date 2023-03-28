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
        <div class="w-3/5">
          <div class="w-full">
            <h2 class="mt-2 text-2xl capitalize ltr:ml-2 rtl:mr-2 ">
              {t("chapters")}
            </h2>
            <div class="mt-2 w-full border-t border-neutral-200 pt-2">
              <div class="p-2">
                <ul class="grid max-h-[55vh] grid-cols-6 justify-start  gap-2 overflow-y-auto  pb-24">
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
        <div class="p-2">
          <p class="py-2 pl-2 text-2xl ">
            {props.storeInterface.getMenuBook()?.label}
          </p>
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
