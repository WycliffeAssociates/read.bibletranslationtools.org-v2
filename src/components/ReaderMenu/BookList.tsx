import type { IBibleMenuBooksByCategory } from "@customTypes/types"
import { useI18n } from "@solid-primitives/i18n"
import { For, Show } from "solid-js"

interface propsInterface {
  onClick: (book: string) => void
  isActiveBook: (book: string) => boolean
  bibleMenuBooksByCategory: () => IBibleMenuBooksByCategory | undefined
  isMobile: boolean
}
export function BookList(props: propsInterface) {
  const [t] = useI18n()
  const outterClassNames = () => {
    return props.isMobile
      ? "h-[95vh] overflow-y-auto pb-96"
      : "max-h-[70vh] min-h-[100px] overflow-y-auto pb-32"
  }
  return (
    <Show
      when={
        props.bibleMenuBooksByCategory()?.OT.length ||
        props.bibleMenuBooksByCategory()?.NT.length
      }
    >
      <div class={outterClassNames()}>
        {/* OT */}
        <Show when={props.bibleMenuBooksByCategory()?.OT.length}>
          <span class="block px-4 pb-1 pt-5 text-base uppercase italic text-gray-800">
            {t("oldTestament", undefined, "Old Testament")}
          </span>
          <ul class="" aria-label="">
            <For each={props.bibleMenuBooksByCategory()?.OT}>
              {(book) => (
                <li class="w-full">
                  <button
                    classList={{
                      " w-full text-xl py-2 ltr:text-left rtl:text-right border-y border-gray-100 ltr:pl-4 rtl:pr-4 hover:bg-gray-100 focus:outline-2 focus:outline-accent focus:font-bold":
                        true,
                      "font-bold text-accent": props.isActiveBook(book.slug)
                    }}
                    onClick={() => props.onClick(book.slug)}
                  >
                    {book.label}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
        {/* NT */}
        <Show when={props.bibleMenuBooksByCategory()?.NT.length}>
          <span class="block px-4 pb-1 pt-5 text-base uppercase italic text-gray-800">
            {t("newTestament", undefined, "New Testament")}
          </span>
          <ul>
            <For each={props.bibleMenuBooksByCategory()?.NT}>
              {(book) => (
                <li class="w-full">
                  <button
                    classList={{
                      " w-full text-xl py-2 ltr:text-left rtl:text-right border-y border-gray-100 ltr:pl-4 rtl:pr-4 hover:bg-gray-100 focus:outline-2 focus:outline-accent focus:font-bold":
                        true,
                      "font-bold text-accent": props.isActiveBook(book.slug)
                    }}
                    onClick={() => props.onClick(book.slug)}
                  >
                    {book.label}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </Show>
  )
}
