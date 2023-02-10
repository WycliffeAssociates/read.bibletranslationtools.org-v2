import { BibleBookCategories } from "@lib/contants"
import { useI18n } from "@solid-primitives/i18n"
import { For, Show } from "solid-js"
interface propsInterface {
  onClick: Function
  isActiveBook: Function
  bibleMenuBooksByCategory: {
    OT: Array<any>
    NT: Array<any>
  }
  isMobile: Boolean
}
export function BookList(props: propsInterface) {
  const [t, { add, locale }] = useI18n()
  let outterClassNames = props.isMobile
    ? "h-[95vh] overflow-y-auto pb-96"
    : "max-h-[50vh] min-h-[100px] overflow-y-auto pb-32"
  return (
    <Show
      when={
        props.bibleMenuBooksByCategory.OT.length ||
        props.bibleMenuBooksByCategory.NT.length
      }
    >
      <div class={outterClassNames}>
        {/* OT */}
        <Show when={props.bibleMenuBooksByCategory.OT.length}>
          <span class="block px-4 pt-5 pb-1 text-xs uppercase italic text-gray-800">
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
                    onClick={(e) => props.onClick(book.slug)}
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
          <span class="block px-4 pt-5 pb-1 text-xs uppercase italic text-gray-800">
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
                    onClick={(e) => props.onClick(book.slug)}
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
