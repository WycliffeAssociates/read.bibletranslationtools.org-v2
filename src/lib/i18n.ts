export interface i18nDictType {
  readonly [index: string]: {
    readonly [index: string]: string
  }
}

const i18nDict = {
  en: {
    books: "books",
    chapters: "chapters",
    searchBooks: "search books",
    processes: "processes",
    resources: "resources",
    translations: "translations",
    tools: "tools",
    support: "support",
    english: "English",
    spanish: "Spanish",
    thisLanguage: "English",
    menu: "menu",
    close: "close",
    print: "print",
    download: "download",
    homeTitle: "Free Bible Translation Tools for the Global Chuch"
  },
  es: {
    books: "libros",
    chapters: "capitulos",
    searchBooks: "busque libros",
    processes: "procesos",
    resources: "recursos",
    translations: "traducciones",
    tools: "herramientas",
    support: "apoyo",
    english: "English",
    spanish: "Español",
    thisLanguage: "Español",
    close: "cierre",
    print: "imprimar",
    download: "descargar",
    homeTitle:
      "Herramientas gratis de la Traducción de la Bible para la Iglesia Global"
  }
} as const
const i18nDictMeta = [
  {
    code: "en",
    name: "English"
  },
  {
    code: "es",
    name: "Español"
  }
]
export type i18nDictKeysType = keyof typeof i18nDict
export type i18nDictSubKeysType = keyof typeof i18nDict[i18nDictKeysType]
export { i18nDict, i18nDictMeta }
