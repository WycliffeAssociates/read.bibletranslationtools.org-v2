import { i18nDict, i18nDictKeysType } from "@lib/i18n"
import { createI18nContext, I18nContext } from "@solid-primitives/i18n"
import type { JSX } from "solid-js"

interface I18nProviderProps {
  preferredLocale: i18nDictKeysType
  children: JSX.Element
}

export const I18nProvider = (props: I18nProviderProps) => {
  const value = createI18nContext(i18nDict, props.preferredLocale)
  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  )
}
