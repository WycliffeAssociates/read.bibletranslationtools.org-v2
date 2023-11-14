// https://github.com/solidjs/solid/issues/804
declare module "solid-js" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface CustomEvents {
      changelanguage: CustomEvent<{
        language: string
        newDict: Record<string, string>
        newDictCode: string
        addToOtherDict: boolean
      }>
      setLastPageVisited: CustomEvent<{
        url: string
      }>
      addCurrentPageToSw: CustomEvent<{
        url: string
        cacheName: string | undefined
      }>
      notifiedOfScrollTop: CustomEvent<{
        amount: number
      }>
    }
    interface Directives {
      clickOutside(el: HTMLElement, accessor: () => unknown): void
      escapeOut(el: HTMLElement, accessor: () => unknown): void
    }
  }
}
declare global {
  interface Window { 
/* eslint-disable @typescript-eslint/no-explicit-any */
    LogRocket:any
  }
}


export type i18nDict = Record<string, string>

export interface bibleChapObj {
  [index: string]: string | number | null
  number: string
  label: string
  content: null | string
  byteCount: number
}
export interface bibleEntryObj {
  slug: string
  label: string
  chapters: bibleChapObj[]
  lastRendered: string
}

export interface wordsEntryObj {
  slug: string
  label: string
  words: Array<{
    slug: string
    label: string
  }>
}
export interface tmSingle {
  File: string
  Slug: string
  Label: string
  Children: Array<tmSingle>
}
export interface tmEntry {
  File: string
  Slug: string
  Label: string
  Children: Array<tmSingle>
}
export interface IDownloadIndex {
  content: bibleEntryObj[]
  ByteCount: number
}
export interface repoIndexObj {
  languageName: string
  languageCode: string
  resourceType: "bible" | "tn" | "tq" | "tm" | "tw" | "commentary"
  resourceTitle: string | null
  textDirection: string
  bible: Array<bibleEntryObj> | null /* covers TN and TQ */
  words: Array<wordsEntryObj> | null /* TW */
  navigation: Array<tmEntry> | null /* TM */
  repoUrl: string
  lastRendered: string
  downloadLinks:
    | {
        link: string
        title: string
      }[]
    | []
  wholeResourceByteCount: number
  appMeta: {
    [key: string]: JSONValue
  }
}

export interface bibleSchemaPropsType {
  book: string
  chapter: string
}
export interface nonBibleSchemaPropsType {
  initialPage: string
  user: string
  repo: string
}
export interface TMRepoProps {
  initialPage: string
}

export interface commonRepoProps {
  initialHtml: string | null
  pageTitle: string
  repoIndex: repoIndexObj
}
export interface tmProps extends commonRepoProps {
  initialPage: string
  templateType: "TM"
}
export interface twProps extends commonRepoProps {
  initialPage: string
  user: string
  repo: string
  templateType: "TW"
}
export interface bibleSchemaProps extends commonRepoProps {
  book: string
  chapter: string
  templateType: "BIBLE"
}
type bookType = {
  label: string
  slug: string
}
export interface IBibleMenuBooksByCategory {
  OT: bookType[]
  NT: bookType[]
}
export interface IcfEnv {
  PIPELINE_API_URL_BASE: string
}
export interface ISavedInServiceWorkerStatus {
  wholeResponse: null | Response | undefined
  wholeIsComplete: null | boolean
  wholeIsOutOfDate: null | boolean
  currentBooksIsDownloaded: null | boolean
  currentBookIsOutOfDate: null | boolean
}
export type ILoadingTextEnums = "IDLE" | "FINISHED" | "STARTED" | "ERROR"
type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>
