import { i18nDictKeysType, i18nDictMeta } from "@lib/i18n"
import type { repoIndexObj } from "../types/types"

/**
 * @param request an Astro request. The accepts language header will be referenced against existing locales
 * @returns The first locale in header for which a translation exists, or the default
 */
export function getPreferredLangFromHeader(request: Request): i18nDictKeysType {
  const defaultLocale = "en"
  if (!request) return defaultLocale
  let langs = request.headers.get("Accept-Language")
  if (!langs) return defaultLocale
  let langsArr = langs.split(",").map((lang) => {
    let arr = lang.split(";")
    return arr[0]
  })
  let preferredLocale = defaultLocale //default
  for (let i = 0; i < langsArr.length; i++) {
    //   let val = item() as i18nDictSubKeysType
    const langKey = langsArr[i] as i18nDictKeysType
    let matchedLocale = i18nDictMeta.find((locale) => locale.code === langKey)
    if (matchedLocale) {
      preferredLocale = langKey
      break
    } else continue
  }
  return preferredLocale as i18nDictKeysType
}

interface bookChapterRequest {
  book: string | null
  chapter: string | null
  repoIndex: repoIndexObj
}

export function getBookAndChapterFromUrl({
  book,
  chapter,
  repoIndex
}: bookChapterRequest): {
  book: string
  chapter: string
} {
  let matchingBook = repoIndex.bible.find(
    (repoBook) => repoBook.slug == book || repoBook.label == book
  )
  let matchingChapter =
    matchingBook &&
    matchingBook.chapters.find((chapterObj) => chapterObj.label == chapter)
  if (!book || !matchingBook) {
    book = null
    chapter = null
  } else if (chapter && !matchingChapter) {
    // there is a book, and chap provided but this verfies that it is a a valid book/chap ;  Only set chap to null cause we can still use the book
    chapter = null
  }
  let firstBookToRender = matchingBook || repoIndex.bible[0] //use first Key;
  let firstChapterToShow = matchingChapter || firstBookToRender.chapters[0]

  return { book: firstBookToRender.slug, chapter: firstChapterToShow.label }
}

interface reshapeBibleIndexI {
  repoIndex: repoIndexObj
  book: string
  chapter: string
  initialHtml: string
}

export function seedAndMutateInitialDataRepoIndex({
  repoIndex,
  book,
  chapter,
  initialHtml
}: reshapeBibleIndexI): void {
  repoIndex.bible.forEach((repoBook) => {
    repoBook.chapters.forEach((repoChapter) => {
      repoChapter.text = null
      if (repoBook.slug == book && repoChapter.label == chapter) {
        repoChapter.text = initialHtml
      }
    })
  })
}
