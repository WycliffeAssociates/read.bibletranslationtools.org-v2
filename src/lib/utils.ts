import { i18nDict, i18nDictKeysType } from "@lib/i18n"
import type { repoIndexObj } from "../types/types"

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
    if (i18nDict[langKey]) {
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
  // todo: api signature from reuben will like change how to get this key
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
// todo change this repoIndex type when finalize
export function seedAndMutateInitialDataRepoIndex({
  repoIndex,
  book,
  chapter,
  initialHtml
}: reshapeBibleIndexI): any {
  repoIndex.bible.forEach((repoBook) => {
    repoBook.chapters.forEach((repoChapter) => {
      repoChapter.text = null
      if (repoBook.slug == book && repoChapter.label == chapter) {
        repoChapter.text = initialHtml
      }
    })
  })
}

export function res404(reason: string) {
  return new Response(null, {
    status: 404,
    statusText: reason
  })
}
