// https://github.com/solidjs/solid/issues/804
declare module "solid-js" {
  namespace JSX {
    interface CustomEvents {
      changelanguage: CustomEvent<{
        language: string
        newDict: any
        newDictCode: string
        addToOtherDict: boolean
      }>
    }
    interface Directives {
      clickOutside(el: HTMLElement, accessor: any): void
      escapeOut(el: HTMLElement, accessor: any): void
    }
  }
}

// declare modu;

export interface bibleChapObj {
  [index: string]: string | number | null
  number: string
  label: string
  text: null | string
}
export interface bibleEntryObj {
  [index: string]: any
  slug: string
  label: string
  chapters: bibleChapObj[]
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
export interface repoIndexObj {
  languageName: string
  languageCode: string
  resourceType: "bible" | "tn" | "tq" | "tm" | "tw"
  resourceTitle: string | null
  textDirection: string
  bible: Array<bibleEntryObj> | null /* covers TN and TQ */
  words: Array<wordsEntryObj> | null /* TW */
  navigation: Array<tmEntry> | null /* TM */
  repoUrl: string
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
  initialHtml: string
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

// todo: each repo as this extends: just define them in the if/else blocks: Take some time and actually thing about what makes the most sense for these types pleasesl
