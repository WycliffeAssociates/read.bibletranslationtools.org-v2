import { langMeta } from "../translations/index"
export interface i18nDictType {
  readonly [index: string]: {
    readonly [index: string]: string
  }
}

const i18nDictMeta = langMeta
export type i18nDictKeysType = string
export type i18nDictSubKeysType = string
export { i18nDictMeta }
