import { i18nDictMeta } from "@lib/i18n"
import { Index } from "solid-js"

interface LanguageChoicesI {
  onClick: (args: any) => any
}

export default function LanguageChoices(props: LanguageChoicesI) {
  return (
    <div
      class="absolute left-0 top-full z-20  w-full bg-darkAccent py-2 pr-2 text-right md:right-[-1rem] md:left-auto md:mt-5 md:w-52 "
      data-js="languagePickerPane"
    >
      <ul class="flex flex-col pr-2 text-right">
        <Index each={i18nDictMeta}>
          {(lang, idx) => {
            return (
              <li class={`${idx > 0 ? "mt-1" : ""}`}>
                <button
                  onClick={(e) => {
                    props.onClick(lang().code)
                  }}
                  class="changeLangBtn capitalize hover:text-secondary focus:text-secondary"
                  data-lang={lang().code}
                >
                  <img
                    class="mr-2 inline-block w-4 "
                    src={`/flags/${lang().code}.svg`}
                    alt=""
                  />
                  {lang().name}
                </button>
              </li>
            )
          }}
        </Index>
      </ul>
    </div>
  )
}
