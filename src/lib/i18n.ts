import * as translations from "../translations/index"
export interface i18nDictType {
  readonly [index: string]: {
    readonly [index: string]: string
  }
}

const i18nDict = { ...translations } as i18nDictType
console.log(translations)
let metaInfo = Object.keys(i18nDict).map((key) => {
  return {
    code: key,
    name: i18nDict[key].thisLanguage
  }
})
const i18nDictMeta = metaInfo
export type i18nDictKeysType = string
export type i18nDictSubKeysType = string
export { i18nDict, i18nDictMeta }
