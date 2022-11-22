import * as translations from "../translations/index"
import metaInfo from "../translations/metaInfo"
export interface i18nDictType {
  readonly [index: string]: {
    readonly [index: string]: string
  }
}

const i18nDict = { ...translations } as const
const i18nDictMeta = metaInfo
export type i18nDictKeysType = keyof typeof i18nDict
export type i18nDictSubKeysType = keyof typeof i18nDict[i18nDictKeysType]
export { i18nDict, i18nDictMeta }
