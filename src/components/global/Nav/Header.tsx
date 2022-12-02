import type { i18nDictKeysType, i18nDictSubKeysType } from "@lib/i18n"
import { useI18n } from "@solid-primitives/i18n"
import { MobileMenuOpen, HamburgerSvg } from "./MenuButtons"
import { LoadingSpinner } from "@components"
import { Index, createSignal, Show, lazy, Suspense } from "solid-js"
import { I18nProvider, addDict } from "./I18nContext"
const LanguageChoices = lazy(() => import("./LanguageChoices"))

interface HeaderProps {
  menuItems: string[]
  logo: string
  logoWebP: string
  preferredLocale: i18nDictKeysType
  linkBase: string
  initialDict: any
  // children: JSX.Element
}

export function UnwrappedHeader(props: HeaderProps) {
  // full signature
  const [t, { add, locale, dict }] = useI18n()
  const [flagShowing, setFlagShowing] = createSignal(props.preferredLocale)

  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false)
  const [languagePickerOpen, setLanguagePickerOpen] = createSignal(false)

  async function changeLanguage(lang: string): Promise<void> {
    let newDict, newDictCode
    let addToOtherDict = false
    if (lang !== props.preferredLocale) {
      let dictCodeAndVal = await addDict(lang)
      newDict = dictCodeAndVal.newDict
      newDictCode = dictCodeAndVal.newDictCode
      add(newDictCode, newDict)
      addToOtherDict = true
    }

    locale(lang)
    setFlagShowing(lang)

    // NOTE: in a different scenario, the reader pane and this menu would be wrapped in same context, but note that Astro's island architecture does not permit the use of traditional React/Solid context.  Each of these components is wrapped in their own context with the same dictonary, and this custom event call the corresponding locale function there.
    // notify Reader Pane localization event listener
    const changeLanguageEvent = new CustomEvent("changelanguage", {
      detail: {
        language: lang,
        newDict: newDict,
        newDictCode,
        addToOtherDict
      }
    })
    let menu = document.querySelector("#menu")
    menu && menu.dispatchEvent(changeLanguageEvent)

    setLanguagePickerOpen(false)
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
        <picture>
          <source srcset={props.logoWebP} type="image/webp" />
          <source srcset={props.logo} type="image/jpeg" />
          <img
            src={props.logo}
            alt="WA Logo"
            class="w-32"
            width="618"
            height="186"
          />
        </picture>

        <button
          onClick={(e) => manageMobileMenu()}
          class="inline-flex items-center rounded-md border border-solid border-gray-100 px-6 py-2 capitalize rtl:flex-row-reverse md:hidden"
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
          } absolute top-full  left-0 right-0  z-30 w-full flex-col bg-darkAccent pt-5 md:static md:flex md:w-auto md:flex-row`}
        >
          <ul class="flex flex-col ltr:pl-4 rtl:pr-4 md:flex-row">
            <Index each={props.menuItems}>
              {(item) => {
                let val = item() as i18nDictSubKeysType
                return (
                  <li class="my-2 capitalize hover:text-secondary focus:text-secondary md:mx-4 md:my-0">
                    <a href={`${props.linkBase}/${val}`}>{t(String(val))}</a>
                  </li>
                )
              }}
            </Index>
          </ul>

          {/* LANGUAGE PICKER PART OF MENU BUT ADJACENT TO THE NAV PARTS */}
          <div class="relative my-2 pl-4 md:my-0 md:ml-4 md:pl-0">
            <button
              onClick={(e) => manageLanguagePickerToggle()}
              data-js="languagePicker"
              class={`languagePicker relative inline-flex place-content-center rtl:flex-row-reverse  ${
                languagePickerOpen() ? "open" : ""
              }`}
              data-i18nkey={"thisLanguage"}
              data-localizable={true}
            >
              <img
                class="mr-2 w-4"
                src={`/flags/${flagShowing()}.svg`}
                alt=""
              />
              {t("thisLanguage", undefined, "English")}
            </button>
            {/* OFFERED LANGUAGES */}
            <Show when={languagePickerOpen()}>
              <Suspense
                fallback={
                  <div class="absolute left-0 top-full z-20  grid w-full place-content-center bg-darkAccent  py-2 pr-2 text-center md:left-auto md:mt-5 md:w-52 rtl:md:-right-full ">
                    <LoadingSpinner />
                  </div>
                }
              >
                <LanguageChoices onClick={changeLanguage} />
              </Suspense>
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
