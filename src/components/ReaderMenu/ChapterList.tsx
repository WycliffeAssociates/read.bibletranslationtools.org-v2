import { For, Show } from "solid-js";
import type { storeType } from "@components/ReaderWrapper/ReaderWrapper";
import type { Translator } from "@solid-primitives/i18n";

interface ChapterProps {
  storeInterface: storeType;
  isActiveBookAndChap: (str: string) => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jumpToNewChapIdx: (...args: any) => void;
  isMobile: boolean;
  t: Translator<Record<string, string>>;
}

export function ChapterList(props: ChapterProps) {
  return (
    <>
      <Show when={props.isMobile}>
        <div class="w-full">
          <div class="w-full">
            <h2 class="mt-2 text-2xl capitalize ltr:ml-2 rtl:mr-2 ">
              {props.t("chapters")}
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
                            "w-full p-3 hover:bg-gray-100 focus:outline-2 focus:outline-accent":
                              true,
                            "text-accent": props.isActiveBookAndChap(book.label)
                          }}
                          // onClick={(e) => {
                          //   jumpToNewChapIdx(e, idx() + 1)
                          // }}
                          onClick={(e) => {
                            props.jumpToNewChapIdx(e, book.label);
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
          <ul class="grid  h-[80vh] grid-cols-6 place-content-start gap-2 overflow-y-scroll pb-36 ">
            <For each={props.storeInterface.possibleChapters()}>
              {(book) => (
                <li class="w-full text-center text-xl">
                  <button
                    classList={{
                      "w-full p-3 hover:bg-gray-100 focus:outline-2 focus:outline-accent":
                        true,
                      "text-accent": props.isActiveBookAndChap(book.label)
                    }}
                    onClick={(e) => {
                      props.jumpToNewChapIdx(e, book.label);
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
  );
}
