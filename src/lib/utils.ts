import { i18nDictKeysType, i18nDictMeta } from "@lib/i18n"
// import { onCleanup } from "solid-js"
import type { repoIndexObj } from "@customTypes/types"

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
  if (!repoIndex.bible?.length) {
    // return a falsy value of same ts shape
    return {
      book: "",
      chapter: ""
    }
  }
  let matchingBook = repoIndex.bible?.find(
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

  return {
    book: firstBookToRender.slug || "",
    chapter: firstChapterToShow.label || ""
  }
}

interface nonBibSchemaI {
  navParam: string | null
  repoIndex: repoIndexObj
}

export function getTwQueryParamOrDefault({
  navParam,
  repoIndex
}: nonBibSchemaI): string | void {
  if (!repoIndex.words?.length) return
  let defaultNavParam = repoIndex.words[0].slug
  if (!repoIndex || !navParam) return defaultNavParam
  let match = repoIndex.words.find((wordObj) => wordObj.slug === navParam)
  if (match) {
    return match.slug
  } else {
    return defaultNavParam
  }
}
export function getTmQueryParamOrDefault({
  navParam,
  repoIndex
}: nonBibSchemaI): string | void {
  if (!repoIndex.navigation?.length) return
  let defaultNavParam = repoIndex.navigation[0].File?.replace(".html", "")
  let matchingObj = repoIndex.navigation.find((topLevelNavObj) => {
    return topLevelNavObj.File.replace(".html", "") == navParam
  })
  return matchingObj && matchingObj.File
    ? matchingObj.File.replace(".html", "")
    : defaultNavParam
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
  if (!repoIndex.bible) return
  repoIndex.bible.forEach((repoBook) => {
    repoBook.chapters.forEach((repoChapter) => {
      repoChapter.text = null
      if (repoBook.slug == book && repoChapter.label == chapter) {
        repoChapter.text = initialHtml
      }
    })
  })
}
