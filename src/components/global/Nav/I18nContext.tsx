import type { i18nDictKeysType } from "@lib/i18n"
import { createI18nContext, I18nContext, useI18n } from "@solid-primitives/i18n"
import type { JSX } from "solid-js"
import { createSignal, createEffect } from "solid-js"

interface I18nProviderProps {
  preferredLocale: i18nDictKeysType
  children: JSX.Element
  initialDict: any
}

export const I18nProvider = (props: I18nProviderProps) => {
  const value = createI18nContext(props.initialDict, props.preferredLocale)

  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  )
}

export async function addDict(langCode: i18nDictKeysType) {
  const newLang = await import(`../../../translations/${langCode}.json`)
  const newDict = newLang.default
  return { newDictCode: newLang.code, newDict }
}
