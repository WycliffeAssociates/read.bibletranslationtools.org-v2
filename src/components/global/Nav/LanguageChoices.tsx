import { i18nDictMeta } from "@lib/i18n"
import { Index } from "solid-js"

interface LanguageChoicesI {
  onClick: (args: any) => any
}

export default function LanguageChoices(props: LanguageChoicesI) {
  return (
    <div
      class="absolute left-0 top-full z-20  w-full bg-darkAccent py-2 pr-2 text-right  md:right-[-1rem] md:left-auto md:mt-5 md:w-52 rtl:md:-right-full"
      data-js="languagePickerPane"
    >
      <ul class="flex flex-col  text-left rtl:text-right">
        <Index each={i18nDictMeta}>
          {(lang, idx) => {
            return (
              <li class={`${idx > 0 ? "mt-1" : ""}`}>
                <button
                  onClick={(e) => {
                    props.onClick(lang().code)
                  }}
                  class="changeLangBtn capitalize hover:text-secondary focus:text-secondary ltr:pl-6 rtl:pr-6"
                  data-lang={lang().code}
                >
                  <img
                    class="inline-block w-4 ltr:mr-2 rtl:ml-2 "
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
