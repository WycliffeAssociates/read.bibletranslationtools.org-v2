import { BibleBookCategories } from "@lib/contants"
import { useI18n } from "@solid-primitives/i18n"
import { For, Show } from "solid-js"
interface propsInterface {
  switchBooks: Function
  isActiveBook: Function
  bibleMenuBooksByCategory: {
    OT: Array<any>
    NT: Array<any>
  }
}
export function BookList(props: propsInterface) {
  const [t, { add, locale }] = useI18n()

  return (
    <Show
      when={
        props.bibleMenuBooksByCategory.OT.length ||
        props.bibleMenuBooksByCategory.NT.length
      }
    >
      <div class="max-h-[50vh] min-h-[100px] overflow-y-auto pb-32">
        {/* OT */}
        <Show when={props.bibleMenuBooksByCategory.OT.length}>
          <span class="block px-4 pt-3 pb-1 text-xs uppercase italic">
            {t("oldTestament", undefined, "Old Testament")}
          </span>
          <ul class="" aria-label="">
            <For each={props.bibleMenuBooksByCategory.OT}>
              {(book, idx) => (
                <li class="w-full">
                  <button
                    classList={{
                      " w-full text-xl py-2 ltr:text-left rtl:text-right border-y border-gray-100 ltr:pl-4 rtl:pr-4 hover:bg-accent/10 focus:bg-accent/10 focus:font-bold":
                        true,
                      "font-bold text-accent": props.isActiveBook(book.slug)
                    }}
                    onClick={(e) => props.switchBooks(book.slug)}
                  >
                    {book.label}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
        {/* NT */}
        <Show when={props.bibleMenuBooksByCategory.NT.length}>
          <span class="block px-4 pt-3 pb-1 text-xs uppercase italic">
            {t("newTestament", undefined, "New Testament")}
          </span>
          <ul>
            <For each={props.bibleMenuBooksByCategory.NT}>
              {(book, idx) => (
                <li class="w-full">
                  <button
                    classList={{
                      " w-full text-xl py-2 ltr:text-left rtl:text-right border-y border-gray-100 ltr:pl-4 rtl:pr-4 hover:bg-accent/10 focus:bg-accent/10 focus:font-bold":
                        true,
                      "font-bold text-accent": props.isActiveBook(book.slug)
                    }}
                    onClick={(e) => props.switchBooks(book.slug)}
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
