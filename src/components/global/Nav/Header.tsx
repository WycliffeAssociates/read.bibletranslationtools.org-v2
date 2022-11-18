import {
  i18nDictMeta,
  i18nDict,
  i18nDictKeysType,
  i18nDictSubKeysType
} from "@lib/i18n"
import { useI18n } from "@solid-primitives/i18n"
import { MobileMenuOpen, HamburgerSvg } from "./MenuButtons"
import { Index, createSignal, Show } from "solid-js"
import { I18nProvider } from "./I18nContext"

interface HeaderProps {
  menuItems: string[]
  logo: string
  preferredLocale: i18nDictKeysType
  linkBase: string
  // children: JSX.Element
}

export function UnwrappedHeader(props: HeaderProps) {
  // full signature
  const [t, { add, locale, dict }] = useI18n()

  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false)
  const [languagePickerOpen, setLanguagePickerOpen] = createSignal(false)

  function changeLanguage(lang: string): void {
    locale(lang)

    // notify Reader Pane localization event listener
    const changeLanguageEvent = new CustomEvent("changelanguage", {
      detail: {
        language: lang
      }
    })
    let menu = document.querySelector("#menu")
    menu && menu.dispatchEvent(changeLanguageEvent)

    setLanguagePickerOpen(false)

    // todo: maybe this isn't the best way to internationalize, but you can't use context in an Astro file due to the way that that Astro treats each component as an island.  So this get's wrapped in its own context to use the i18n library.  The reader pane will also be wrapped in its own with the same dictionary and its own context.  So we can just fire a custom event over to the reader pane to call its locale function to keep them in sync;
  }
  function manageMobileMenu() {
    setMobileMenuOpen(!mobileMenuOpen())
  }
  function manageLanguagePickerToggle() {
    setLanguagePickerOpen(!languagePickerOpen())
  }

  function menuText() {
    return !mobileMenuOpen() ? "menu" : "close"
  }

  return (
    <nav class="w-full bg-darkAccent pt-9 pb-5 font-sans print:hidden">
      <div class="relative mx-auto flex max-w-[1400px] items-center justify-between px-4 text-white">
        <img src={props.logo} alt="WA Logo" />
        <button
          onClick={(e) => manageMobileMenu()}
          class="inline-flex  items-center rounded-md border border-solid border-gray-100 px-6 py-2 capitalize md:hidden"
        >
          <Show when={!mobileMenuOpen()}>
            <HamburgerSvg classNames="inline-block mr-2 w-6 h-6" />
          </Show>
          <Show when={mobileMenuOpen()}>
            <MobileMenuOpen classNames="inline-block mr-2 w-6 h-6" />
          </Show>
          {t(menuText(), undefined, menuText())}
        </button>

        <div
          data-js="mobileMenu"
          class={`${
            mobileMenuOpen() ? "block" : "hidden"
          } absolute right-4 top-full left-0 z-30  w-full flex-col bg-darkAccent pt-5 md:static md:flex md:w-auto md:flex-row`}
        >
          <ul class="flex flex-col pl-4 md:flex-row">
            <Index each={props.menuItems}>
              {(item) => {
                let val = item() as i18nDictSubKeysType
                return (
                  <li class="my-2 capitalize hover:text-secondary focus:text-secondary md:mx-4 md:my-0">
                    <a href={`${props.linkBase}/${val}`}>{t(val)}</a>
                  </li>
                )
              }}
            </Index>
          </ul>

          {/* LANGUAGE PICKER PART OF MENU BUT ADJACENT TO THE NAV PARTS */}
          <div class="relative my-2 pl-4 md:my-0 md:pl-0">
            <button
              onClick={(e) => manageLanguagePickerToggle()}
              data-js="languagePicker"
              class={`languagePicker relative grid place-content-center ${
                languagePickerOpen() ? "open" : ""
              }`}
              data-i18nkey={"thisLanguage"}
              data-localizable={true}
            >
              {t("thisLanguage", undefined, "English")}
            </button>
            {/* OFFERED LANGUAGES */}
            <Show when={languagePickerOpen()}>
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
                              changeLanguage(lang().code)
                            }}
                            class="changeLangBtn capitalize hover:text-secondary focus:text-secondary"
                            data-lang={lang().code}
                          >
                            {lang().name}
                          </button>
                        </li>
                      )
                    }}
                  </Index>
                </ul>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  )
}
export function Header(props: HeaderProps) {
  return (
    <I18nProvider {...props}>
      <UnwrappedHeader {...props} />
    </I18nProvider>
  )
}
