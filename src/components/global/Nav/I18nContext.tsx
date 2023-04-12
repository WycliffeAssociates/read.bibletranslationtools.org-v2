import type { i18nDictWithLangCode } from "@customTypes/types"
import type { i18nDictKeysType } from "@lib/i18n"
import { createI18nContext, I18nContext } from "@solid-primitives/i18n"
import type { JSX } from "solid-js"

interface I18nProviderProps {
  preferredLocale: i18nDictKeysType
  children: JSX.Element
  initialDict: i18nDictWithLangCode
}

export const I18nProvider = (props: I18nProviderProps) => {
  // fine pattern to derive state as such in solid
  // eslint-disable-next-line solid/reactivity
  const value = createI18nContext(props.initialDict, props.preferredLocale)

  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  )
}

export async function addDict(langCode: i18nDictKeysType) {
  const newLang = await import(`../../../translations/${langCode}.js`)
  const newDict = newLang.default
  return { newDictCode: newDict.code, newDict }
}
